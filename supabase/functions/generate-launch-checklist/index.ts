/**
 * GENERATE LAUNCH CHECKLIST
 *
 * Genera checklist completo de 50-100 items pre-launch
 * Categorias: Legal, Tech, Marketing, Design, Analytics, Finance
 * Con recursos, priorizacion, y dependencies
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';


interface LaunchChecklistRequest {
  projectId: string;
  businessType: 'saas' | 'ecommerce' | 'marketplace' | 'service' | 'app';
  geography: 'US' | 'EU' | 'LATAM' | 'global';
  hasWebsite?: boolean;
  hasLegalEntity?: boolean;
}

interface ChecklistItem {
  title: string;
  description: string;
  category: string;
  priority: string;
  estimated_time: string;
  resources: Array<{ title: string; url: string }>;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  const startTime = Date.now();

  try {
        const { serviceClient: supabaseClient } = await validateAuth(req);

    const body: LaunchChecklistRequest = await req.json();
    const { projectId, businessType, geography = 'US' } = body;

    if (!projectId || !businessType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log(`Generating launch checklist for ${businessType} in ${geography}`);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    // Generate checklist with AI
    const checklist = await generateChecklist(anthropic, body);

    // Calculate progress (all items start as "todo")
    const progress = 0;

    // Save to database
    const { data: savedChecklist, error: checklistError } = await supabaseClient
      .from('launch_checklists')
      .insert({
        project_id: projectId,
        items: checklist.items,
        progress,
        estimated_launch_date: calculateLaunchDate(checklist.items),
      })
      .select()
      .single();

    if (checklistError) {
      console.error('Error saving checklist:', checklistError);
    }

    const executionTimeMs = Date.now() - startTime;

    await logAICall({
      supabaseClient,
      projectId,
      userId: undefined,
      functionName: 'generate-launch-checklist',
      inputData: { businessType, geography },
      outputData: checklist,
      success: true,
      executionTimeMs,
      tokensUsed: checklist.tokensUsed,
      modelUsed: 'claude-3-5-sonnet-20241022',
    });

    console.log(`Launch checklist generated in ${executionTimeMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        checklist: savedChecklist || { items: checklist.items, progress },
        summary: {
          total_items: checklist.items.length,
          by_category: {
            legal: checklist.items.filter((i: ChecklistItem) => i.category === 'legal').length,
            tech: checklist.items.filter((i: ChecklistItem) => i.category === 'tech').length,
            marketing: checklist.items.filter((i: ChecklistItem) => i.category === 'marketing').length,
            design: checklist.items.filter((i: ChecklistItem) => i.category === 'design').length,
            analytics: checklist.items.filter((i: ChecklistItem) => i.category === 'analytics').length,
            finance: checklist.items.filter((i: ChecklistItem) => i.category === 'finance').length,
          },
          critical_items: checklist.items.filter((i: ChecklistItem) => i.priority === 'critical').length,
        },
      }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
const err = error as Error;
    console.error('Error generating launch checklist:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Failed to generate launch checklist',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});

async function generateChecklist(
  anthropic: Anthropic,
  params: LaunchChecklistRequest
): Promise<{ items: ChecklistItem[]; tokensUsed: number }> {
  const { businessType, geography, hasWebsite, hasLegalEntity } = params;

  const prompt = `Eres un experto en product launches. Genera un checklist COMPLETO de pre-launch para un ${businessType} lanzandose en ${geography}.

BUSINESS TYPE: ${businessType}
GEOGRAPHY: ${geography}
HAS WEBSITE: ${hasWebsite ? 'Yes' : 'No'}
HAS LEGAL ENTITY: ${hasLegalEntity ? 'Yes' : 'No'}

Genera 50-80 items divididos en categorias:

1. **LEGAL** (10-15 items):
   - Incorporation
   - Terms of Service / Privacy Policy
   - GDPR compliance (si EU)
   - Trademarks
   - etc.

2. **TECH** (15-20 items):
   - Domain + hosting
   - SSL certificate
   - Error tracking (Sentry)
   - Analytics
   - Performance monitoring
   - Backups
   - etc.

3. **MARKETING** (15-20 items):
   - Landing page
   - 5 blog posts
   - Social media accounts
   - Email sequences
   - Product Hunt prep
   - Press kit
   - etc.

4. **DESIGN** (8-10 items):
   - Logo
   - Brand colors
   - UI polish
   - Screenshots
   - Demo video
   - etc.

5. **ANALYTICS** (5-8 items):
   - Google Analytics
   - Mixpanel/Amplitude
   - Conversion tracking
   - etc.

6. **FINANCE** (5-8 items):
   - Bank account
   - Stripe/payment setup
   - Accounting software
   - etc.

Para cada item include:
- **title**: Clear, actionable
- **description**: What exactly to do
- **category**: legal/tech/marketing/design/analytics/finance
- **priority**: critical/high/medium/low
- **estimated_time**: "30 min", "2 hours", "1 day", etc.
- **resources**: Array of {title, url} with helpful links

PRIORIZACION:
- **critical**: Must have before launch (legal, basic tech)
- **high**: Important for good launch
- **medium**: Nice to have
- **low**: Can do post-launch

Devuelve SOLO un JSON array:
[
  {
    "title": "Incorporate company (LLC or C-Corp)",
    "description": "Choose entity type based on fundraising plans. C-Corp if raising VC, LLC if bootstrapping. Use Stripe Atlas ($500) or Clerky ($799).",
    "category": "legal",
    "priority": "critical",
    "estimated_time": "1-2 weeks",
    "resources": [
      {"title": "Stripe Atlas", "url": "https://stripe.com/atlas"},
      {"title": "Clerky", "url": "https://clerky.com"}
    ]
  }
]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = (message.content[0] as { type: string; text: string }).text;
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse checklist response');
  }

  const items: ChecklistItem[] = JSON.parse(jsonMatch[0]);

  return { items, tokensUsed };
}

function calculateLaunchDate(items: ChecklistItem[]): string {
  // Estimate total days based on critical + high items
  const criticalItems = items.filter((i) => i.priority === 'critical' || i.priority === 'high');

  // Assume 3-4 weeks for critical path
  const estimatedDays = 21 + criticalItems.length;

  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + estimatedDays);

  return launchDate.toISOString().split('T')[0];
}
