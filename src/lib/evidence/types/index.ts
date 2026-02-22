/**
 * Phase 0.5: AI Evidence System - Type Definitions
 *
 * CRITICAL PRINCIPLES:
 * 1. Never return fake sources - be honest about evidence availability
 * 2. Separate reliability_score (external quality) from authority_score (project-specific trust)
 * 3. Track source independence to prevent same-lineage sources counting as multiple
 * 4. Quote levels matter: exact (PDFs/APIs) vs snippet (web) vs unavailable
 */

// =====================================================
// EVIDENCE STATUS & MODES
// =====================================================

/**
 * Evidence status (NOT "verified" - we're showing evidence, not guaranteeing truth)
 */
export type EvidenceStatus =
  | 'evidence_backed'    // Strong evidence from multiple independent sources
  | 'partial_evidence'   // Some evidence but gaps remain
  | 'no_evidence'        // No sources found (hypothesis mode)
  | 'conflicting';       // Evidence contradicts itself

/**
 * Evidence mode determines requirements and user expectations
 */
export type EvidenceMode =
  | 'strict'      // Requires evidence contract, blocks if not met
  | 'balanced'    // Tries to find evidence, proceeds with warnings
  | 'hypothesis'; // Fast, no evidence required, clearly marked

/**
 * Source tiers (priority order)
 */
export type SourceTier =
  | 'user_document'   // Tier 1: User's own uploads (PDFs, CSVs, XLSX)
  | 'official_api'    // Tier 2: Government/official APIs (SEC, Census, World Bank)
  | 'business_data'   // Tier 3: Business databases (Crunchbase, PitchBook)
  | 'news';           // Tier 4: News sources (needs multiple confirmation)

/**
 * Quote level determines citation quality
 */
export type QuoteLevel =
  | 'exact'         // Exact text extracted (PDFs, official docs)
  | 'snippet'       // Web scraping preview/snippet
  | 'unavailable';  // URL only (paywall, TOS restriction, etc.)

/**
 * Claim status per claim
 */
export type ClaimStatus =
  | 'supported'     // Strong evidence
  | 'weak'          // Weak or single source
  | 'unsupported';  // No evidence found

/**
 * Value types for claim validation
 */
export type ClaimValueType =
  | 'number'
  | 'currency'
  | 'percentage'
  | 'string'
  | 'enum'
  | 'date'
  | 'boolean';


// =====================================================
// SOURCE STRUCTURES
// =====================================================

/**
 * Citation location within a source
 */
export interface CitationLocation {
  type: 'url' | 'pdf' | 'document' | 'spreadsheet' | 'api_response';

  // For PDFs and documents
  page?: number;
  paragraph?: number;
  line?: number;

  // For spreadsheets
  sheet?: string;
  row?: number;
  column?: string;

  // Character position (for precise highlighting)
  start_char?: number;
  end_char?: number;
}

/**
 * Citation with exact source reference
 */
export interface Citation {
  source_id: string;
  source_name: string;
  source_type: SourceTier;
  url: string;

  // Quote extraction
  quote: string;
  quote_level: QuoteLevel;
  location: CitationLocation;

  // Metadata
  date_accessed: string;
  date_published?: string;

  // Scoring
  reliability_score: number; // External quality (0-100)
  relevance_score: number;   // How relevant to this claim (0-100)
}

/**
 * Real source from retrieval
 */
export interface RealSource {
  id: string;
  name: string;
  url: string;
  type: SourceTier;

  // Content
  title: string;
  summary: string;
  raw_content?: string; // Full text if available

  // Metadata
  domain: string;
  parent_organization?: string; // For lineage tracking
  country?: string;
  language?: string;

  // Freshness
  published_date?: string;
  last_updated?: string;

  // Scoring
  reliability_score: number;   // External quality assessment
  authority_score?: number;    // Project-specific trust (if set by user)

  // For user documents
  file_type?: 'pdf' | 'csv' | 'xlsx' | 'txt';
  pages_count?: number;
  upload_date?: string;
}

/**
 * Source lineage for independence checking
 */
export interface SourceLineage {
  domain: string;
  parent_organization?: string;
  country?: string;
}


// =====================================================
// CLAIMS & EVIDENCE
// =====================================================

/**
 * Predefined claim structure per function
 */
export interface ClaimDefinition {
  id: string;
  claim_text: string;
  field_path: string; // e.g., 'customer_segments.market_size'
  value_type: ClaimValueType;
  requires_evidence: boolean;
  sources_min?: number;        // Minimum independent sources required
  max_age_days?: number;       // Maximum age for sources
  requires_independence?: boolean; // Require sources from different domains
}

/**
 * Claim with evidence
 */
export interface ClaimWithEvidence {
  claim_id: string;
  claim_text: string;
  value: string;
  value_type: ClaimValueType;

  // Evidence
  citations: Citation[];
  status: ClaimStatus;

  // Coverage
  sources_found: number;
  sources_required: number;
  independent_domains: string[]; // List of unique domains
}

/**
 * Conflict between sources
 */
export interface EvidenceConflict {
  claim_id: string;
  conflicting_values: Array<{
    value: string;
    citations: Citation[];
  }>;
  resolution_type: 'range' | 'scenario' | 'unresolved';
  resolution?: string; // e.g., "$10M-$15M" or "depends on market segment"
}


// =====================================================
// POLICIES & CONTRACTS
// =====================================================

/**
 * User source policy (project-level preferences)
 */
export interface SourcePolicy {
  project_id: string;
  user_id: string;

  // Mode
  evidence_mode: EvidenceMode;

  // Tier toggles
  tier_1_enabled: boolean; // User documents
  tier_2_enabled: boolean; // Official APIs
  tier_3_enabled: boolean; // Business data
  tier_4_enabled: boolean; // News

  // Domain controls
  blocked_domains: string[];
  allowed_domains: string[]; // Empty = all allowed (except blocked)

  // Limits
  max_source_age_days?: number;
  min_reliability_score: number;
  require_https: boolean;
}

/**
 * Evidence contract for strict mode functions
 */
export interface EvidenceContract {
  function_name: string;
  mode: 'strict';

  // Requirements
  claims: ClaimDefinition[];
  min_total_sources: number;
  require_tier_1_or_2: boolean; // Must have at least one user doc or official API

  // Validation
  allow_partial_evidence: boolean;
  block_on_failure: boolean;
}


// =====================================================
// GENERATION STRUCTURES
// =====================================================

/**
 * Pre-generation plan (shown to user BEFORE searching)
 */
export interface EvidencePlan {
  function_name: string;
  evidence_mode: EvidenceMode;

  // What we WILL search
  planned_tiers: SourceTier[];
  planned_queries: string[];

  // Expectations (honest - we don't know availability yet)
  estimated_search_time_seconds: number;
  availability_status: 'unknown_until_search';

  // Requirements
  evidence_contract?: EvidenceContract;

  // User options
  can_configure_sources: boolean;
  can_skip_search: boolean; // Only in hypothesis mode
}

/**
 * Search results (actual sources found)
 */
export interface SearchResults {
  query: string;
  sources_found: RealSource[];
  search_duration_ms: number;

  // Coverage
  tier_1_count: number;
  tier_2_count: number;
  tier_3_count: number;
  tier_4_count: number;

  // Quality
  avg_reliability_score: number;
  independent_domains: string[];
}

/**
 * AI generation output with evidence
 */
export interface AIOutputWithEvidence {
  // Generated content
  content: Record<string, unknown>; // The actual business model canvas, financial projections, etc.

  // Evidence backing
  claims: ClaimWithEvidence[];
  evidence_status: EvidenceStatus;
  coverage_percentage: number; // 0-100

  // Transparency
  sources_planned: number;
  sources_found: number;
  sources_used: RealSource[];

  // Limitations and conflicts
  limitations: string[];
  conflicts: EvidenceConflict[];

  // Metadata
  generation_id: string;
  function_name: string;
  evidence_mode: EvidenceMode;
  generated_at: string;

  // Performance
  search_duration_ms: number;
  generation_duration_ms: number;
}

/**
 * Evidence report (for post-generation display)
 */
export interface EvidenceReport {
  generation_id: string;

  // Comparison
  sources_planned: number;
  sources_found: number;

  // Coverage
  claims_total: number;
  claims_supported: number;
  claims_weak: number;
  claims_unsupported: number;
  coverage_percentage: number;

  // Evidence
  evidence_status: EvidenceStatus;
  sources: RealSource[];
  claims: ClaimWithEvidence[];
  conflicts: EvidenceConflict[];

  // User actions
  can_regenerate: boolean;
  can_search_more: boolean;
  can_accept_as_hypothesis: boolean;
}


// =====================================================
// STRICT MODE EXIT OPTIONS
// =====================================================

/**
 * Exit options when strict mode fails
 */
export interface StrictModeExitOptions {
  reason: 'insufficient_sources' | 'conflicting_evidence' | 'no_tier_1_or_2';

  current_coverage: number;
  required_coverage: number;

  sources_found: number;
  sources_required: number;

  // User choices
  options: Array<{
    action: 'search_more' | 'continue_as_hypothesis' | 'cancel';
    label: string;
    description: string;
    warning?: string;
  }>;
}


// =====================================================
// VALIDATION & HELPERS
// =====================================================

/**
 * Check if sources are independent
 */
export function areSourcesIndependent(sources: RealSource[]): boolean {
  const domains = new Set<string>();
  const organizations = new Set<string>();

  for (const source of sources) {
    // Same domain = not independent
    if (domains.has(source.domain)) {
      return false;
    }
    domains.add(source.domain);

    // Same parent org = not independent (e.g., WSJ and Barron's both owned by News Corp)
    if (source.parent_organization) {
      if (organizations.has(source.parent_organization)) {
        return false;
      }
      organizations.add(source.parent_organization);
    }
  }

  return true;
}

/**
 * Get unique domains from sources
 */
export function getUniqueDomains(sources: RealSource[]): string[] {
  return Array.from(new Set(sources.map(s => s.domain)));
}

/**
 * Calculate coverage percentage
 */
export function calculateCoverage(claims: ClaimWithEvidence[]): number {
  if (claims.length === 0) return 0;

  const supported = claims.filter(c => c.status === 'supported').length;
  return Math.round((supported / claims.length) * 100);
}

/**
 * Get evidence status from claims
 */
export function getEvidenceStatus(
  claims: ClaimWithEvidence[],
  conflicts: EvidenceConflict[]
): EvidenceStatus {
  if (conflicts.length > 0) return 'conflicting';

  const coverage = calculateCoverage(claims);

  if (coverage === 0) return 'no_evidence';
  if (coverage === 100) return 'evidence_backed';
  return 'partial_evidence';
}
