/**
 * 🤖 AI GENERATORS ORCHESTRATOR
 *
 * Central hub for all AI generation functions
 * Coordinates: Business Model Canvas, Buyer Personas, Sales Playbook
 */

import { generateBusinessModelCanvas, type BusinessModelCanvas } from './businessModelCanvas';
import { generateBuyerPersonas, type BuyerPersona } from './buyerPersonas';
import { generateSalesPlaybook, type SalesPlaybook } from './salesPlaybook';

export type { BusinessModelCanvas, BuyerPersona, SalesPlaybook };

export interface AIGenerationInput {
  // Required
  onboarding_type: 'generative' | 'idea' | 'existing';
  project_id: string;

  // Optional context
  business_description?: string;
  value_proposition?: string;
  target_market?: string;
  industry?: string;

  // From auto-fill
  extracted_data?: {
    your_startup?: any;
    founders?: any[];
    competitors?: any[];
    local_context?: any;
  };

  // From integrations (existing businesses)
  existing_metrics?: {
    mrr?: number;
    arr?: number;
    customers?: number;
    team_size?: number;
    churn_rate?: number;
  };

  // Pricing info
  pricing?: {
    model?: string;
    price_point?: string;
  };
}

export interface AIGeneratedArtifacts {
  business_model_canvas: BusinessModelCanvas;
  buyer_personas: BuyerPersona[];
  sales_playbook: SalesPlaybook;

  // Existing artifacts (from current onboarding)
  competitive_analysis?: any;
  financial_projections?: any;
  go_to_market_plan?: any;
  pmf_assessment?: any;

  // Metadata
  generation_id: string;
  generated_at: string;
  total_confidence_score: number;
}

/**
 * Generate ALL AI artifacts in parallel
 * Returns structured data for AI Preview Dashboard
 */
export async function generateAllArtifacts(
  input: AIGenerationInput
): Promise<AIGeneratedArtifacts> {
  console.log('🤖 Starting AI generation for:', input.project_id);

  const startTime = Date.now();

  // Generate all artifacts in parallel for speed
  const [businessModelCanvas, buyerPersonas, salesPlaybook] = await Promise.all([
    generateBusinessModelCanvas({
      onboarding_type: input.onboarding_type,
      business_description: input.business_description,
      industry: input.industry,
      extracted_data: input.extracted_data,
      existing_metrics: input.existing_metrics,
    }),
    generateBuyerPersonas({
      onboarding_type: input.onboarding_type,
      business_description: input.business_description,
      target_market: input.target_market,
      industry: input.industry,
      customer_data: input.existing_metrics ? {
        existing_customers: input.existing_metrics.customers,
      } : undefined,
    }),
    generateSalesPlaybook({
      onboarding_type: input.onboarding_type,
      business_description: input.business_description,
      value_proposition: input.value_proposition,
      target_market: input.target_market,
      industry: input.industry,
      pricing: input.pricing,
    }),
  ]);

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`✅ AI generation complete in ${duration}s`);

  // Calculate overall confidence
  const avgConfidence = Math.round(
    (businessModelCanvas.confidence_score +
      (buyerPersonas.reduce((sum, p) => sum + p.confidence_score, 0) / buyerPersonas.length) +
      salesPlaybook.confidence_score) / 3
  );

  return {
    business_model_canvas: businessModelCanvas,
    buyer_personas: buyerPersonas,
    sales_playbook: salesPlaybook,
    generation_id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    generated_at: new Date().toISOString(),
    total_confidence_score: avgConfidence,
  };
}

/**
 * Re-generate a single artifact
 * Useful when user wants to refine one artifact
 */
export async function regenerateArtifact(
  type: 'business_model_canvas' | 'buyer_personas' | 'sales_playbook',
  input: AIGenerationInput
): Promise<BusinessModelCanvas | BuyerPersona[] | SalesPlaybook> {
  switch (type) {
    case 'business_model_canvas':
      return generateBusinessModelCanvas({
        onboarding_type: input.onboarding_type,
        business_description: input.business_description,
        industry: input.industry,
        extracted_data: input.extracted_data,
        existing_metrics: input.existing_metrics,
      });

    case 'buyer_personas':
      return generateBuyerPersonas({
        onboarding_type: input.onboarding_type,
        business_description: input.business_description,
        target_market: input.target_market,
        industry: input.industry,
        customer_data: input.existing_metrics ? {
          existing_customers: input.existing_metrics.customers,
        } : undefined,
      });

    case 'sales_playbook':
      return generateSalesPlaybook({
        onboarding_type: input.onboarding_type,
        business_description: input.business_description,
        value_proposition: input.value_proposition,
        target_market: input.target_market,
        industry: input.industry,
        pricing: input.pricing,
      });
  }
}

// Export individual generators
export {
  generateBusinessModelCanvas,
  generateBuyerPersonas,
  generateSalesPlaybook,
};
