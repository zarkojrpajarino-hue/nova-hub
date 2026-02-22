/**
 * Evidence Validator
 *
 * Validates evidence quality and enforces evidence contracts in strict mode
 *
 * CRITICAL: Never passes with fake/mock sources
 */

import type {
  ClaimWithEvidence,
  EvidenceContract,
  EvidenceStatus,
  EvidenceConflict,
  RealSource,
  StrictModeExitOptions,
} from '../types';
import {
  calculateCoverage,
  getEvidenceStatus,
  areSourcesIndependent,
  getUniqueDomains,
} from '../types';

// =====================================================
// EVIDENCE CONTRACT VALIDATION (Strict Mode)
// =====================================================

/**
 * Validate evidence against contract requirements
 *
 * @param claims - Claims with evidence
 * @param sources - All sources found
 * @param contract - Evidence contract to enforce
 * @returns Validation result
 */
export function validateEvidenceContract(
  claims: ClaimWithEvidence[],
  sources: RealSource[],
  contract: EvidenceContract
): {
  passes: boolean;
  coverage: number;
  reason?: string;
  exitOptions?: StrictModeExitOptions;
} {
  // 1. Check total sources
  if (sources.length < contract.min_total_sources) {
    return {
      passes: false,
      coverage: calculateCoverage(claims),
      reason: `Insufficient sources: found ${sources.length}, required ${contract.min_total_sources}`,
      exitOptions: createExitOptions(
        'insufficient_sources',
        claims,
        sources,
        contract
      ),
    };
  }

  // 2. Check Tier 1 or 2 requirement
  if (contract.require_tier_1_or_2) {
    const hasTier1Or2 = sources.some(
      (s) => s.type === 'user_document' || s.type === 'official_api'
    );

    if (!hasTier1Or2) {
      return {
        passes: false,
        coverage: calculateCoverage(claims),
        reason: 'No Tier 1 (user documents) or Tier 2 (official APIs) sources found',
        exitOptions: createExitOptions(
          'no_tier_1_or_2',
          claims,
          sources,
          contract
        ),
      };
    }
  }

  // 3. Check claim-level requirements
  for (const claimDef of contract.claims) {
    const claim = claims.find((c) => c.claim_id === claimDef.id);

    if (!claim) {
      return {
        passes: false,
        coverage: calculateCoverage(claims),
        reason: `Missing required claim: ${claimDef.claim_text}`,
      };
    }

    // Check minimum sources per claim
    if (claimDef.sources_min && claim.citations.length < claimDef.sources_min) {
      return {
        passes: false,
        coverage: calculateCoverage(claims),
        reason: `Claim "${claimDef.claim_text}" has ${claim.citations.length} sources, requires ${claimDef.sources_min}`,
        exitOptions: createExitOptions(
          'insufficient_sources',
          claims,
          sources,
          contract
        ),
      };
    }

    // Check source independence if required
    if (claimDef.requires_independence) {
      const claimSources = sources.filter((s) =>
        claim.citations.some((c) => c.source_id === s.id)
      );

      if (!areSourcesIndependent(claimSources)) {
        return {
          passes: false,
          coverage: calculateCoverage(claims),
          reason: `Claim "${claimDef.claim_text}" requires independent sources from different domains`,
        };
      }
    }

    // Check source age if required
    if (claimDef.max_age_days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - claimDef.max_age_days);

      for (const citation of claim.citations) {
        if (citation.date_published) {
          const pubDate = new Date(citation.date_published);
          if (pubDate < cutoffDate) {
            return {
              passes: false,
              coverage: calculateCoverage(claims),
              reason: `Claim "${claimDef.claim_text}" has sources older than ${claimDef.max_age_days} days`,
            };
          }
        }
      }
    }
  }

  // 4. Check coverage percentage (if partial evidence not allowed)
  const coverage = calculateCoverage(claims);

  if (!contract.allow_partial_evidence && coverage < 100) {
    return {
      passes: false,
      coverage,
      reason: `Partial evidence not allowed in strict mode. Coverage: ${coverage}%`,
      exitOptions: createExitOptions(
        'insufficient_sources',
        claims,
        sources,
        contract
      ),
    };
  }

  // All checks passed
  return {
    passes: true,
    coverage,
  };
}


// =====================================================
// EXIT OPTIONS CREATION
// =====================================================

/**
 * Create exit options for strict mode failures
 */
function createExitOptions(
  reason: 'insufficient_sources' | 'conflicting_evidence' | 'no_tier_1_or_2',
  claims: ClaimWithEvidence[],
  sources: RealSource[],
  contract: EvidenceContract
): StrictModeExitOptions {
  const coverage = calculateCoverage(claims);

  return {
    reason,
    current_coverage: coverage,
    required_coverage: contract.allow_partial_evidence ? 70 : 100,
    sources_found: sources.length,
    sources_required: contract.min_total_sources,

    options: [
      {
        action: 'search_more',
        label: 'Search for more sources',
        description:
          'Expand search to more databases or adjust source filters to find additional evidence',
      },
      {
        action: 'continue_as_hypothesis',
        label: 'Continue as hypothesis',
        description:
          'Proceed with generation but clearly mark output as "hypothesis" with limited evidence',
        warning:
          'Output will be marked as unverified hypothesis. Not recommended for critical decisions.',
      },
      {
        action: 'cancel',
        label: 'Cancel generation',
        description: 'Cancel this AI generation and return to manual entry',
      },
    ],
  };
}


// =====================================================
// CONFLICT DETECTION
// =====================================================

/**
 * Detect conflicts in evidence for the same claim
 *
 * @param claims - Claims to check for conflicts
 * @returns List of detected conflicts
 */
export function detectEvidenceConflicts(
  claims: ClaimWithEvidence[]
): EvidenceConflict[] {
  const conflicts: EvidenceConflict[] = [];

  for (const claim of claims) {
    if (claim.citations.length < 2) continue; // Need at least 2 sources to have conflict

    // Extract unique values from citations
    const valueMap = new Map<string, typeof claim.citations>();

    for (const citation of claim.citations) {
      // For this claim, extract the value mentioned in the quote
      // This is simplified - in production, use NLP to extract values
      const value = extractValueFromQuote(citation.quote, claim.value_type);

      if (value) {
        const existing = valueMap.get(value) || [];
        valueMap.set(value, [...existing, citation]);
      }
    }

    // If we have multiple different values, there's a conflict
    if (valueMap.size > 1) {
      const conflictingValues = Array.from(valueMap.entries()).map(
        ([value, citations]) => ({
          value,
          citations,
        })
      );

      // Try to resolve conflict
      const resolution = resolveConflict(conflictingValues, claim.value_type);

      conflicts.push({
        claim_id: claim.claim_id,
        conflicting_values: conflictingValues,
        resolution_type: resolution.type,
        resolution: resolution.value,
      });
    }
  }

  return conflicts;
}


/**
 * Extract value from citation quote based on type
 */
function extractValueFromQuote(quote: string, valueType: string): string | null {
  // Simplified extraction - in production use proper NLP
  switch (valueType) {
    case 'currency':
      const currencyMatch = quote.match(/\$[\d,]+(?:\.\d{2})?[MBK]?/i);
      return currencyMatch ? currencyMatch[0] : null;

    case 'percentage':
      const percentMatch = quote.match(/\d+(?:\.\d+)?%/);
      return percentMatch ? percentMatch[0] : null;

    case 'number':
      const numberMatch = quote.match(/\d+(?:,\d{3})*(?:\.\d+)?/);
      return numberMatch ? numberMatch[0] : null;

    default:
      return null;
  }
}


/**
 * Attempt to resolve conflicts
 */
function resolveConflict(
  conflictingValues: Array<{ value: string; citations: any[] }>,
  valueType: string
): { type: 'range' | 'scenario' | 'unresolved'; value?: string } {
  // For numeric types, try to create a range
  if (valueType === 'currency' || valueType === 'number' || valueType === 'percentage') {
    const values = conflictingValues.map((cv) => parseNumericValue(cv.value));

    if (values.every((v) => v !== null)) {
      const min = Math.min(...(values as number[]));
      const max = Math.max(...(values as number[]));

      return {
        type: 'range',
        value: formatRange(min, max, valueType),
      };
    }
  }

  // Otherwise, unresolved
  return {
    type: 'unresolved',
  };
}


/**
 * Parse numeric value from string
 */
function parseNumericValue(value: string): number | null {
  // Remove currency symbols, commas, etc.
  const cleaned = value.replace(/[$,% ]/g, '');

  // Handle K, M, B suffixes
  let multiplier = 1;
  if (cleaned.endsWith('K')) multiplier = 1000;
  if (cleaned.endsWith('M')) multiplier = 1000000;
  if (cleaned.endsWith('B')) multiplier = 1000000000;

  const numStr = cleaned.replace(/[KMB]/g, '');
  const num = parseFloat(numStr);

  return isNaN(num) ? null : num * multiplier;
}


/**
 * Format range based on value type
 */
function formatRange(min: number, max: number, valueType: string): string {
  switch (valueType) {
    case 'currency':
      return `$${formatNumber(min)}-$${formatNumber(max)}`;
    case 'percentage':
      return `${min}%-${max}%`;
    default:
      return `${formatNumber(min)}-${formatNumber(max)}`;
  }
}


/**
 * Format number with K, M, B suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
