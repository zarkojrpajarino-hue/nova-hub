/**
 * APPROVE GENERATION PREVIEW
 *
 * Applies approved AI-generated content to the database:
 * - User selects which branding option (1, 2, or 3)
 * - Function saves to: brand_guidelines, products, buyer_personas, value_propositions, competitors, validation_experiments
 * - Deploys website to Vercel
 * - Updates generation_preview status to 'approved'
 *
 * Flow:
 * 1. Get generation_preview by ID
 * 2. Extract selected option (user chose option 1, 2, or 3 for branding)
 * 3. Save all data to appropriate tables
 * 4. Generate and deploy website
 * 5. Mark preview as approved
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const {
      preview_id,
      selected_branding_option, // 1, 2, or 3
      user_edits, // Optional: if user edited anything
      deploy_website = true,
    } = await req.json();

    if (!preview_id || !selected_branding_option) {
      throw new Error('preview_id and selected_branding_option are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get generation preview
    const { data: preview, error: previewError } = await supabaseClient
      .from('generation_previews')
      .select('*')
      .eq('id', preview_id)
      .single();

    if (previewError || !preview) {
      throw new Error('Preview not found');
    }

    const generatedData = preview.generated_options[0];
    const selectedBranding = generatedData.branding[selected_branding_option - 1];

    if (!selectedBranding) {
      throw new Error(`Invalid branding option: ${selected_branding_option}`);
    }

    const projectId = preview.project_id;
    const appliedTo: Record<string, unknown> = {};

    console.log('Applying generated business for project:', projectId);

    // 2. Save branding to brand_guidelines
    const { data: brandGuideline } = await supabaseClient
      .from('brand_guidelines')
      .insert({
        project_id: projectId,
        logo_url: selectedBranding.logo_url,
        primary_color: selectedBranding.primary_color,
        secondary_color: selectedBranding.secondary_color,
        accent_colors: selectedBranding.accent_colors,
        typography: selectedBranding.typography,
        tone_attributes: selectedBranding.tone_attributes || [],
      })
      .select()
      .single();

    appliedTo.brand_guidelines = brandGuideline?.id;

    // 3. Save products
    const productIds = [];
    for (const product of generatedData.products) {
      const { data: savedProduct } = await supabaseClient
        .from('products')
        .insert({
          project_id: projectId,
          product_name: product.product_name,
          product_description: product.product_description,
          tagline: product.tagline,
          price: product.price,
          pricing_model: product.pricing_model,
          currency: product.currency || 'EUR',
          features: product.features || [],
          deliverables: product.deliverables,
          target_customer: product.target_customer,
          value_proposition: product.value_proposition,
          generated_by_ai: true,
          ai_rationale: product.rationale,
          is_active: true,
        })
        .select()
        .single();

      if (savedProduct) {
        productIds.push(savedProduct.id);
      }
    }
    appliedTo.products = productIds;

    // 4. Save buyer persona
    const persona = generatedData.buyer_persona;
    const { data: savedPersona } = await supabaseClient
      .from('buyer_personas')
      .insert({
        project_id: projectId,
        persona_name: persona.persona_name,
        age_range: persona.age_range,
        role: persona.role,
        industry: persona.industry,
        pain_points: persona.pain_points || [],
        budget_min: persona.budget_min,
        budget_max: persona.budget_max,
        budget_frequency: persona.budget_frequency,
        decision_process: persona.decision_process,
        common_objections: persona.common_objections || [],
        preferred_channels: persona.preferred_channels || [],
        buying_triggers: persona.buying_triggers,
        is_primary: true,
      })
      .select()
      .single();

    appliedTo.buyer_persona = savedPersona?.id;

    // 5. Save value proposition
    const valueProp = generatedData.value_proposition;
    const { data: savedValueProp } = await supabaseClient
      .from('value_propositions')
      .insert({
        project_id: projectId,
        headline: valueProp.headline,
        subheadline: valueProp.subheadline,
        unique_selling_points: valueProp.unique_selling_points || [],
        benefits: valueProp.benefits || [],
        roi_examples: valueProp.roi_examples || [],
        success_stories: valueProp.success_stories || [],
        is_active: true,
      })
      .select()
      .single();

    appliedTo.value_proposition = savedValueProp?.id;

    // 6. Save competitors
    const competitorIds = [];
    for (const competitor of generatedData.competitors || []) {
      const { data: savedCompetitor } = await supabaseClient
        .from('competitors')
        .insert({
          project_id: projectId,
          competitor_name: competitor.competitor_name,
          website: competitor.website,
          features: competitor.features,
          pricing: competitor.pricing,
          target_market: competitor.target_market,
          strengths: competitor.strengths,
          weaknesses: competitor.weaknesses,
          our_advantage: competitor.our_advantage,
          battle_card: competitor.battle_card,
        })
        .select()
        .single();

      if (savedCompetitor) {
        competitorIds.push(savedCompetitor.id);
      }
    }
    appliedTo.competitors = competitorIds;

    // 7. Save validation experiments
    const experimentIds = [];
    for (const experiment of generatedData.validation_experiments || []) {
      const { data: savedExperiment } = await supabaseClient
        .from('validation_experiments')
        .insert({
          project_id: projectId,
          experiment_name: experiment.experiment_name,
          experiment_type: experiment.experiment_type,
          hypothesis: experiment.hypothesis,
          success_criteria: experiment.success_criteria,
          budget_allocated: experiment.budget_allocated || 0,
          time_allocated_hours: experiment.time_allocated_hours,
          status: 'planned',
        })
        .select()
        .single();

      if (savedExperiment) {
        experimentIds.push(savedExperiment.id);
      }
    }
    appliedTo.validation_experiments = experimentIds;

    // 8. Generate website HTML
    const websiteHtml = generateWebsiteHTML(generatedData, selectedBranding);

    // 9. Save to company_assets
    const { data: companyAssets } = await supabaseClient
      .from('company_assets')
      .upsert({
        project_id: projectId,
        logo_url: selectedBranding.logo_url,
        brand_colors: {
          primary: selectedBranding.primary_color,
          secondary: selectedBranding.secondary_color,
          accent: selectedBranding.accent_colors,
        },
        typography: selectedBranding.typography,
        logo_generated_by_ai: true,
        website_generated_by_ai: true,
        website_html: websiteHtml,
      })
      .select()
      .single();

    appliedTo.company_assets = companyAssets?.id;

    // 10. Deploy to Vercel (if enabled)
    let deploymentUrl = null;
    if (deploy_website) {
      try {
        // Call deploy-to-vercel function
        const deployResponse = await supabaseClient.functions.invoke('deploy-to-vercel', {
          body: {
            project_id: projectId,
            html_content: websiteHtml,
            project_name: generatedData.value_proposition.headline.toLowerCase().replace(/\s+/g, '-'),
          },
        });

        if (deployResponse.data) {
          deploymentUrl = deployResponse.data.url;

          // Update company_assets with deployment URL
          await supabaseClient
            .from('company_assets')
            .update({
              website_deployed_url: deploymentUrl,
              vercel_deployment_id: deployResponse.data.deployment_id,
            })
            .eq('project_id', projectId);
        }
      } catch (error) {
        console.error('Deployment error:', error);
        // Continue even if deployment fails
      }
    }

    // 11. Update generation_preview status
    await supabaseClient
      .from('generation_previews')
      .update({
        status: 'approved',
        selected_option: selected_branding_option,
        user_edits: user_edits || null,
        applied_at: new Date().toISOString(),
        applied_to_tables: appliedTo,
      })
      .eq('id', preview_id);

    // 12. Update project stage
    await supabaseClient
      .from('projects')
      .update({
        user_stage: 'validando',
        methodology: 'lean_startup',
      })
      .eq('id', projectId);

    return new Response(
      JSON.stringify({
        success: true,
        message: '🎉 Negocio completo aplicado y listo para lanzar',
        applied: appliedTo,
        deployment_url: deploymentUrl,
        next_steps: [
          'Revisa tu website deployed',
          'Comienza validation experiments',
          'Contacta a tus primeros clientes',
        ],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error approving preview:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// HTML GENERATION
// ============================================================================

function generateWebsiteHTML(data: Record<string, unknown>, branding: Record<string, unknown>): string {
  const website = data.website_structure;
  const valueProp = data.value_proposition;
  const products = data.products;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${valueProp.headline}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: '${branding.typography.body_font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3 {
      font-family: '${branding.typography.heading_font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.2;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    header {
      background: ${branding.primary_color};
      color: white;
      padding: 20px 0;
    }
    .hero {
      background: linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color});
      color: white;
      padding: 100px 0;
      text-align: center;
    }
    .hero h1 {
      font-size: 3rem;
      margin-bottom: 20px;
    }
    .hero p {
      font-size: 1.5rem;
      margin-bottom: 30px;
    }
    .cta-button {
      display: inline-block;
      background: white;
      color: ${branding.primary_color};
      padding: 15px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: scale(1.05);
    }
    section {
      padding: 80px 0;
    }
    .section-title {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 50px;
      color: ${branding.primary_color};
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-top: 40px;
    }
    .product-card {
      border: 2px solid ${branding.primary_color};
      border-radius: 10px;
      padding: 30px;
      text-align: center;
    }
    .product-card h3 {
      color: ${branding.primary_color};
      margin-bottom: 10px;
    }
    .price {
      font-size: 2rem;
      font-weight: bold;
      color: ${branding.secondary_color};
      margin: 20px 0;
    }
    footer {
      background: #333;
      color: white;
      text-align: center;
      padding: 40px 0;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>${valueProp.headline}</h1>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <h1>${website.pages.home.headline}</h1>
      <p>${website.pages.home.subheadline}</p>
      <a href="#contact" class="cta-button">${website.pages.home.hero_cta}</a>
    </div>
  </section>

  ${website.pages.home.sections
    .map(
      (section: Record<string, unknown>) => `
  <section>
    <div class="container">
      <h2 class="section-title">${section.headline}</h2>
      <p style="text-align: center; font-size: 1.2rem; max-width: 800px; margin: 0 auto;">
        ${section.copy || ''}
      </p>
    </div>
  </section>
  `
    )
    .join('')}

  <section style="background: #f9f9f9;">
    <div class="container">
      <h2 class="section-title">Nuestros Servicios</h2>
      <div class="products-grid">
        ${products
          .slice(0, 3)
          .map(
            (product: Record<string, unknown>) => `
        <div class="product-card">
          <h3>${product.product_name}</h3>
          <p>${product.tagline}</p>
          <div class="price">€${product.price}/${product.pricing_model === 'monthly' ? 'mes' : 'vez'}</div>
          <p>${product.product_description}</p>
        </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>

  <section id="contact">
    <div class="container" style="text-align: center;">
      <h2 class="section-title">¿Listo para empezar?</h2>
      <p style="font-size: 1.2rem; margin-bottom: 30px;">
        Contáctanos hoy y transforma tu negocio
      </p>
      <a href="mailto:contacto@example.com" class="cta-button">Contáctanos</a>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>&copy; 2026 ${valueProp.headline}. Todos los derechos reservados.</p>
    </div>
  </footer>
</body>
</html>`;
}
