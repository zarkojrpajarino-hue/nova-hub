/**
 * Predefined Claims per AI Function
 *
 * CRITICAL: Claims are NOT invented by the AI model
 * Each function has predefined claims that must be filled with evidence
 *
 * Evidence requirements vary by function:
 * - Financial Projections: STRICT mode (evidence contract enforced)
 * - Business Model Canvas: BALANCED mode (tries to find evidence)
 * - Sales Playbook: BALANCED mode
 */

import type { ClaimDefinition, EvidenceContract, EvidenceMode } from '../types';

// =====================================================
// FUNCTION CLAIM REGISTRY
// =====================================================

export const FUNCTION_CLAIMS: Record<string, ClaimDefinition[]> = {
  // -----------------------------------------------
  // FINANCIAL PROJECTIONS (STRICT MODE)
  // -----------------------------------------------
  'financial-projections': [
    {
      id: 'market_size',
      claim_text: 'Total addressable market (TAM) size for target segment',
      field_path: 'market_analysis.tam',
      value_type: 'currency',
      requires_evidence: true,
      sources_min: 3, // Need 3 independent sources
      max_age_days: 180, // Data must be < 6 months old
      requires_independence: true,
    },
    {
      id: 'market_growth_rate',
      claim_text: 'Annual market growth rate (CAGR) for target segment',
      field_path: 'market_analysis.growth_rate',
      value_type: 'percentage',
      requires_evidence: true,
      sources_min: 3,
      max_age_days: 180,
      requires_independence: true,
    },
    {
      id: 'customer_acquisition_cost',
      claim_text: 'Industry average customer acquisition cost (CAC) for similar businesses',
      field_path: 'unit_economics.cac_benchmark',
      value_type: 'currency',
      requires_evidence: true,
      sources_min: 2,
      max_age_days: 365,
      requires_independence: true,
    },
    {
      id: 'customer_lifetime_value',
      claim_text: 'Industry average customer lifetime value (LTV) for similar businesses',
      field_path: 'unit_economics.ltv_benchmark',
      value_type: 'currency',
      requires_evidence: true,
      sources_min: 2,
      max_age_days: 365,
      requires_independence: true,
    },
    {
      id: 'pricing_benchmark',
      claim_text: 'Competitive pricing for similar products/services in target market',
      field_path: 'revenue_model.pricing_benchmark',
      value_type: 'currency',
      requires_evidence: true,
      sources_min: 2,
      max_age_days: 180,
      requires_independence: false, // Same competitors OK
    },
  ],

  // -----------------------------------------------
  // BUSINESS MODEL CANVAS (BALANCED MODE)
  // -----------------------------------------------
  'business-model-canvas': [
    {
      id: 'customer_segments_size',
      claim_text: 'Size of primary customer segment',
      field_path: 'customer_segments.market_size',
      value_type: 'number',
      requires_evidence: true,
      sources_min: 2,
      max_age_days: 365,
    },
    {
      id: 'value_proposition_validation',
      claim_text: 'Market validation for proposed value proposition',
      field_path: 'value_propositions.validation',
      value_type: 'string',
      requires_evidence: false, // Can be hypothesis in balanced mode
    },
    {
      id: 'revenue_streams_examples',
      claim_text: 'Revenue model examples from similar businesses',
      field_path: 'revenue_streams.examples',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 2,
    },
    {
      id: 'key_partners_landscape',
      claim_text: 'Typical partnerships in this industry',
      field_path: 'key_partners.landscape',
      value_type: 'string',
      requires_evidence: false,
    },
    {
      id: 'cost_structure_benchmarks',
      claim_text: 'Cost structure benchmarks for similar businesses',
      field_path: 'cost_structure.benchmarks',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 1,
      max_age_days: 365,
    },
  ],

  // -----------------------------------------------
  // SALES PLAYBOOK (BALANCED MODE)
  // -----------------------------------------------
  'sales-playbook': [
    {
      id: 'ideal_customer_profile',
      claim_text: 'Characteristics of ideal customer profile (ICP) in target market',
      field_path: 'icp.characteristics',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 2,
      max_age_days: 365,
    },
    {
      id: 'sales_cycle_length',
      claim_text: 'Average sales cycle length for similar products',
      field_path: 'sales_process.cycle_length',
      value_type: 'number',
      requires_evidence: true,
      sources_min: 1,
      max_age_days: 365,
    },
    {
      id: 'objection_handling',
      claim_text: 'Common objections in sales process for similar products',
      field_path: 'objections.common',
      value_type: 'string',
      requires_evidence: false,
    },
    {
      id: 'competitive_battlecards',
      claim_text: 'Competitive positioning for main competitors',
      field_path: 'competitors.positioning',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 1,
      max_age_days: 180,
    },
    {
      id: 'pricing_objections',
      claim_text: 'Pricing positioning relative to competitors',
      field_path: 'pricing.positioning',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 2,
      max_age_days: 180,
    },
  ],

  // -----------------------------------------------
  // COMPETITOR ANALYSIS (BALANCED MODE)
  // -----------------------------------------------
  'competitor-analysis': [
    {
      id: 'competitor_funding',
      claim_text: 'Funding history and valuation of main competitors',
      field_path: 'competitors.funding',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 1,
      max_age_days: 365,
    },
    {
      id: 'competitor_features',
      claim_text: 'Feature comparison with main competitors',
      field_path: 'competitors.features',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 1,
    },
    {
      id: 'market_share',
      claim_text: 'Market share distribution among competitors',
      field_path: 'market.share_distribution',
      value_type: 'percentage',
      requires_evidence: true,
      sources_min: 2,
      max_age_days: 365,
      requires_independence: true,
    },
  ],

  // -----------------------------------------------
  // MARKET RESEARCH (BALANCED MODE)
  // -----------------------------------------------
  'market-research': [
    {
      id: 'market_trends',
      claim_text: 'Current market trends affecting target segment',
      field_path: 'trends.current',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 2,
      max_age_days: 180,
    },
    {
      id: 'regulatory_environment',
      claim_text: 'Regulatory requirements affecting target market',
      field_path: 'regulations.requirements',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 1,
      max_age_days: 180,
    },
    {
      id: 'customer_pain_points',
      claim_text: 'Validated customer pain points in target segment',
      field_path: 'customers.pain_points',
      value_type: 'string',
      requires_evidence: true,
      sources_min: 2,
    },
  ],
};


// =====================================================
// EVIDENCE CONTRACTS (STRICT MODE)
// =====================================================

export const EVIDENCE_CONTRACTS: Record<string, EvidenceContract> = {
  'financial-projections': {
    function_name: 'financial-projections',
    mode: 'strict',

    claims: FUNCTION_CLAIMS['financial-projections'],

    min_total_sources: 5, // Need at least 5 different sources total
    require_tier_1_or_2: true, // MUST have user document OR official API

    allow_partial_evidence: false, // 100% coverage required
    block_on_failure: true, // Block generation if contract not met
  },
};


// =====================================================
// EVIDENCE MODE PER FUNCTION
// =====================================================

export const FUNCTION_EVIDENCE_MODES: Record<string, EvidenceMode> = {
  'financial-projections': 'strict', // Evidence contract enforced
  'business-model-canvas': 'balanced', // Tries to find evidence, proceeds with warnings
  'sales-playbook': 'balanced',
  'competitor-analysis': 'balanced',
  'market-research': 'balanced',
  'pitch-deck': 'hypothesis', // Fast generation for brainstorming
  'elevator-pitch': 'hypothesis',
};


// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get claims for a function
 */
export function getFunctionClaims(functionName: string): ClaimDefinition[] {
  return FUNCTION_CLAIMS[functionName] || [];
}

/**
 * Get evidence contract for a function (if in strict mode)
 */
export function getFunctionContract(functionName: string): EvidenceContract | undefined {
  return EVIDENCE_CONTRACTS[functionName];
}

/**
 * Get evidence mode for a function
 */
export function getFunctionEvidenceMode(functionName: string): EvidenceMode {
  return FUNCTION_EVIDENCE_MODES[functionName] || 'balanced';
}

/**
 * Check if function requires strict mode
 */
export function requiresStrictMode(functionName: string): boolean {
  return FUNCTION_EVIDENCE_MODES[functionName] === 'strict';
}

/**
 * Get minimum sources required for a function
 */
export function getMinimumSources(functionName: string): number {
  const contract = EVIDENCE_CONTRACTS[functionName];
  if (contract) {
    return contract.min_total_sources;
  }

  // For non-strict functions, calculate from claims
  const claims = FUNCTION_CLAIMS[functionName] || [];
  const maxSources = Math.max(
    ...claims.map((c) => c.sources_min || 0),
    1
  );

  return maxSources;
}
