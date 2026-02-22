/**
 * COMPETITOR INTELLIGENCE CRON
 *
 * Cron job que corre semanalmente para:
 * - Scrapear websites de competidores
 * - Detectar cambios en pricing/features
 * - Tomar screenshots para comparacion visual
 * - Enviar alertas si hay cambios importantes
 *
 * Schedule: Every Monday at 9am UTC
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompetitorEntry {
  id?: string;
  name: string;
  website: string;
}

interface PrevSnapshot {
  pricing?: Record<string, unknown>;
  features?: string[];
}

interface ScrapedData {
  html: string;
  pricing: Record<string, unknown>;
  features: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for cron
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    console.log('Starting competitor intelligence cron job');

    // Get all active projects with competitors
    const { data: projects, error: projectsError } = await supabaseClient
      .from('projects')
      .select('id, metadata')
      .not('metadata->competitors', 'is', null);

    if (projectsError) throw projectsError;

    console.log(`Found ${projects?.length || 0} projects with competitors`);

    let totalScanned = 0;
    let totalChanges = 0;

    for (const project of (projects || []) as Array<{ id: string; metadata: Record<string, unknown> | null }>) {
      const competitors = (project.metadata?.competitors || []) as CompetitorEntry[];

      for (const competitor of competitors) {
        try {
          console.log(`Scanning competitor: ${competitor.name}`);

          // Fetch previous snapshot
          const { data: prevSnapshot } = await supabaseClient
            .from('competitor_snapshots')
            .select('*')
            .eq('competitor_id', competitor.id || competitor.name)
            .eq('project_id', project.id)
            .order('captured_at', { ascending: false })
            .limit(1)
            .single();

          // Scrape current state
          const currentData = await scrapeCompetitor(competitor.website);

          // Detect changes using AI
          const changes = await detectChanges(anthropic, prevSnapshot as PrevSnapshot | null, currentData, competitor);

          // Save snapshot
          const { error: snapshotError } = await supabaseClient
            .from('competitor_snapshots')
            .insert({
              competitor_id: competitor.id || competitor.name,
              project_id: project.id,
              captured_at: new Date().toISOString(),
              pricing: currentData.pricing,
              features: currentData.features,
              raw_html: currentData.html.substring(0, 10000), // Limit size
              changes_detected: changes,
              alert_sent: changes.length > 0,
            });

          if (snapshotError) {
            console.error('Error saving snapshot:', snapshotError);
          }

          // If significant changes, create alert
          if (changes.length > 0) {
            console.log(`${changes.length} changes detected for ${competitor.name}`);
            totalChanges += changes.length;

            // Create AI recommendation
            await supabaseClient.from('ai_recommendations').insert({
              project_id: project.id,
              category: 'product',
              title: `Competitor ${competitor.name} made changes`,
              description: changes.join('; '),
              reasoning: `Automated detection from weekly competitor scan`,
              confidence: 85,
              priority: determinePriority(changes),
              data_sources: ['competitor_intelligence'],
              action_items: generateActionItems(changes, competitor),
            });
          }

          totalScanned++;

          // Rate limiting: wait 2 seconds between scrapes
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error scanning ${competitor.name}:`, error);
          // Continue with next competitor
        }
      }
    }

    console.log(`Cron job complete: scanned ${totalScanned} competitors, detected ${totalChanges} changes`);

    return new Response(
      JSON.stringify({
        success: true,
        scanned: totalScanned,
        changes: totalChanges,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const err = error as Error;
    console.error('Cron job failed:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Scrape competitor website
 */
async function scrapeCompetitor(url: string): Promise<ScrapedData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Simple extraction (could be enhanced with Cheerio/jsdom)
    const pricingMatches = html.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g) || [];
    const pricing = pricingMatches.map((p) => parseFloat(p.replace(/[$,]/g, '')));

    // Extract features (simplistic - looks for bullet points)
    const featureMatches = html.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
    const features = featureMatches
      .map((li) => li.replace(/<[^>]+>/g, '').trim())
      .filter((f) => f.length > 0 && f.length < 200)
      .slice(0, 20); // Limit to 20

    return { html, pricing: { prices: pricing }, features };
  } catch (error) {
    console.error('Scraping failed:', error);
    return { html: '', pricing: {}, features: [] };
  }
}

/**
 * Detect changes using AI
 */
async function detectChanges(
  anthropic: Anthropic,
  prevSnapshot: PrevSnapshot | null,
  currentData: ScrapedData,
  competitor: CompetitorEntry
): Promise<string[]> {
  if (!prevSnapshot) {
    return []; // No previous data to compare
  }

  const prompt = `Eres un analista de competencia. Compara estos dos snapshots y detecta cambios SIGNIFICATIVOS.

COMPETITOR: ${competitor.name}

PREVIOUS SNAPSHOT (hace 1 semana):
Pricing: ${JSON.stringify(prevSnapshot.pricing || {})}
Features: ${(prevSnapshot.features || []).join(', ')}

CURRENT SNAPSHOT (hoy):
Pricing: ${JSON.stringify(currentData.pricing || {})}
Features: ${currentData.features.join(', ')}

Detecta cambios en:
1. **Pricing changes**: Subieron o bajaron precios?
2. **New features**: Features nuevas importantes?
3. **Removed features**: Quitaron algo?

IMPORTANTE:
- SOLO reporta cambios SIGNIFICATIVOS (no typos o minor wording)
- Se especifico con numeros
- Ignore cambios cosmeticos

Devuelve un JSON array de strings con los cambios:
["Pricing increased from $29 to $39 for Pro plan", "Added AI feature to Enterprise plan"]

Si NO hay cambios significativos, devuelve [].`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = (message.content[0] as { type: string; text: string }).text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return [];
    }

    const changes = JSON.parse(jsonMatch[0]);
    return Array.isArray(changes) ? changes : [];
  } catch (error) {
    console.error('AI detection failed:', error);
    return [];
  }
}

/**
 * Determine priority based on changes
 */
function determinePriority(changes: string[]): 'critical' | 'high' | 'medium' | 'low' {
  const changeText = changes.join(' ').toLowerCase();

  if (changeText.includes('pricing') || changeText.includes('price')) {
    return 'high';
  }
  if (changeText.includes('new feature') || changeText.includes('added')) {
    return 'medium';
  }
  return 'low';
}

/**
 * Generate action items based on changes
 */
function generateActionItems(changes: string[], competitor: CompetitorEntry): string[] {
  const items: string[] = [];

  const changeText = changes.join(' ').toLowerCase();

  if (changeText.includes('pricing') || changeText.includes('price')) {
    items.push(`Review your pricing vs ${competitor.name}'s new prices`);
    items.push('Consider if price adjustment is needed to stay competitive');
  }

  if (changeText.includes('feature')) {
    items.push(`Analyze if ${competitor.name}'s new feature is a threat`);
    items.push('Evaluate if you should build similar feature');
  }

  if (items.length === 0) {
    items.push(`Monitor ${competitor.name} closely for next week`);
  }

  return items;
}
