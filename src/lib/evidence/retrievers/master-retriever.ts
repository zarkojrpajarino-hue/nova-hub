/**
 * Master Evidence Retriever
 *
 * Orchestrates source retrieval across all tiers:
 * - Tier 1: User Documents (PDFs, CSVs, XLSX)
 * - Tier 2: Official APIs (SEC, Census, World Bank)
 * - Tier 3: Business Data (Crunchbase - TODO)
 * - Tier 4: News (TODO)
 *
 * Respects user's source policy and filters/ranks accordingly
 *
 * CRITICAL PRINCIPLES:
 * 1. Never return fake sources
 * 2. Prioritize tiers in order (1 > 2 > 3 > 4)
 * 3. Filter by age, domain, reliability
 * 4. Check source independence
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  RealSource,
  SourcePolicy,
  SearchResults,
} from '../types';
import { searchUserDocuments } from './user-documents';
import { searchOfficialSources } from './official-sources';
import { getUniqueDomains } from '../types';

// =====================================================
// MAIN RETRIEVER
// =====================================================

/**
 * Search for evidence sources across all enabled tiers
 *
 * @param query - Search query
 * @param policy - User's source policy for this project
 * @param context - Additional context (user ID, project ID, country)
 * @returns Search results with sources found
 */
export async function searchEvidenceSources(
  query: string,
  policy: SourcePolicy,
  context: {
    userId: string;
    projectId: string;
    country?: string;
    userEmail?: string;
  }
): Promise<SearchResults> {
  const startTime = Date.now();
  const allSources: RealSource[] = [];

  // Tier 1: User Documents (highest priority)
  if (policy.tier_1_enabled) {
    console.log('[Evidence] Searching Tier 1: User Documents...');
    const tier1Sources = await searchUserDocuments(
      query,
      context.userId,
      context.projectId,
      10
    );
    allSources.push(...tier1Sources);
  }

  // Tier 2: Official APIs
  if (policy.tier_2_enabled) {
    console.log('[Evidence] Searching Tier 2: Official Sources...');
    const tier2Sources = await searchOfficialSources(
      query,
      context.country || 'US',
      context.userEmail
    );
    allSources.push(...tier2Sources);
  }

  // Tier 3: Business Data (TODO)
  if (policy.tier_3_enabled) {
    console.log('[Evidence] Tier 3: Business Data (not implemented yet)');
    // TODO: Implement Crunchbase, PitchBook searches
  }

  // Tier 4: News (TODO)
  if (policy.tier_4_enabled) {
    console.log('[Evidence] Tier 4: News (not implemented yet)');
    // TODO: Implement news API searches
  }

  // Apply filters
  const filteredSources = applySourceFilters(allSources, policy);

  // Rank sources
  const rankedSources = rankSources(filteredSources, query);

  const searchDuration = Date.now() - startTime;

  // Calculate tier counts
  const tier1Count = rankedSources.filter((s) => s.type === 'user_document').length;
  const tier2Count = rankedSources.filter((s) => s.type === 'official_api').length;
  const tier3Count = rankedSources.filter((s) => s.type === 'business_data').length;
  const tier4Count = rankedSources.filter((s) => s.type === 'news').length;

  // Calculate quality metrics
  const avgReliability =
    rankedSources.length > 0
      ? rankedSources.reduce((sum, s) => sum + s.reliability_score, 0) /
        rankedSources.length
      : 0;

  return {
    query,
    sources_found: rankedSources,
    search_duration_ms: searchDuration,

    tier_1_count: tier1Count,
    tier_2_count: tier2Count,
    tier_3_count: tier3Count,
    tier_4_count: tier4Count,

    avg_reliability_score: Math.round(avgReliability),
    independent_domains: getUniqueDomains(rankedSources),
  };
}


// =====================================================
// FILTERING
// =====================================================

/**
 * Apply user's source policy filters
 */
function applySourceFilters(
  sources: RealSource[],
  policy: SourcePolicy
): RealSource[] {
  return sources.filter((source) => {
    // Filter by reliability score
    if (source.reliability_score < policy.min_reliability_score) {
      return false;
    }

    // Filter by HTTPS requirement
    if (policy.require_https && !source.url.startsWith('https://')) {
      return false;
    }

    // Filter by blocked domains
    if (policy.blocked_domains.length > 0) {
      if (policy.blocked_domains.includes(source.domain)) {
        return false;
      }
    }

    // Filter by allowed domains (if specified)
    if (policy.allowed_domains.length > 0) {
      if (!policy.allowed_domains.includes(source.domain)) {
        return false;
      }
    }

    // Filter by source age
    if (policy.max_source_age_days && source.published_date) {
      const sourceDate = new Date(source.published_date);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.max_source_age_days);

      if (sourceDate < cutoffDate) {
        return false;
      }
    }

    return true;
  });
}


// =====================================================
// RANKING
// =====================================================

/**
 * Rank sources by quality and relevance
 *
 * Ranking formula:
 * score = (tier_weight * 40) + (reliability * 0.4) + (authority * 0.2)
 *
 * Tier weights: Tier 1 = 100, Tier 2 = 80, Tier 3 = 60, Tier 4 = 40
 */
function rankSources(sources: RealSource[], _query: string): RealSource[] {
  const rankedSources = sources.map((source) => {
    // Tier weight
    let tierWeight = 40;
    switch (source.type) {
      case 'user_document':
        tierWeight = 100;
        break;
      case 'official_api':
        tierWeight = 80;
        break;
      case 'business_data':
        tierWeight = 60;
        break;
      case 'news':
        tierWeight = 40;
        break;
    }

    // Calculate final score
    const score =
      tierWeight * 0.4 +
      source.reliability_score * 0.4 +
      (source.authority_score || 50) * 0.2;

    return {
      source,
      score,
    };
  });

  // Sort by score descending
  rankedSources.sort((a, b) => b.score - a.score);

  return rankedSources.map((r) => r.source);
}


// =====================================================
// POLICY MANAGEMENT
// =====================================================

/**
 * Get source policy for a project (creates default if doesn't exist)
 */
export async function getProjectSourcePolicy(
  projectId: string
): Promise<SourcePolicy | null> {
  try {
    const { data, error } = await supabase.rpc('get_project_source_policy', {
      p_project_id: projectId,
    });

    if (error) {
      console.error('Error getting source policy:', error);
      return null;
    }

    return data as SourcePolicy;
  } catch (error) {
    console.error('Unexpected error getting source policy:', error);
    return null;
  }
}


/**
 * Update source policy for a project
 */
export async function updateProjectSourcePolicy(
  projectId: string,
  updates: Partial<SourcePolicy>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_source_policies')
      .update(updates)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error updating source policy:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating source policy:', error);
    return false;
  }
}


/**
 * Get default source policy (used when creating new projects)
 */
export function getDefaultSourcePolicy(userId: string, projectId: string): SourcePolicy {
  return {
    project_id: projectId,
    user_id: userId,

    // Default to balanced mode
    evidence_mode: 'balanced',

    // Enable Tier 1, 2, 3 by default (not Tier 4 news)
    tier_1_enabled: true,
    tier_2_enabled: true,
    tier_3_enabled: true,
    tier_4_enabled: false,

    // No domain restrictions by default
    blocked_domains: [],
    allowed_domains: [],

    // Default limits
    max_source_age_days: undefined, // No age limit
    min_reliability_score: 40,
    require_https: true,
  };
}


// =====================================================
// SOURCE INDEPENDENCE VALIDATION
// =====================================================

/**
 * Check if sources are truly independent
 *
 * Same domain = NOT independent
 * Same parent organization = NOT independent
 */
export function validateSourceIndependence(sources: RealSource[]): {
  isIndependent: boolean;
  uniqueDomains: string[];
  duplicateDomains: string[];
} {
  const domainCounts = new Map<string, number>();
  const orgCounts = new Map<string, number>();

  for (const source of sources) {
    // Count domains
    const domainCount = domainCounts.get(source.domain) || 0;
    domainCounts.set(source.domain, domainCount + 1);

    // Count parent organizations
    if (source.parent_organization) {
      const orgCount = orgCounts.get(source.parent_organization) || 0;
      orgCounts.set(source.parent_organization, orgCount + 1);
    }
  }

  // Find duplicates
  const duplicateDomains: string[] = [];
  for (const [domain, count] of domainCounts.entries()) {
    if (count > 1) {
      duplicateDomains.push(domain);
    }
  }

  const duplicateOrgs: string[] = [];
  for (const [org, count] of orgCounts.entries()) {
    if (count > 1) {
      duplicateOrgs.push(org);
    }
  }

  const isIndependent = duplicateDomains.length === 0 && duplicateOrgs.length === 0;

  return {
    isIndependent,
    uniqueDomains: Array.from(domainCounts.keys()),
    duplicateDomains,
  };
}


// =====================================================
// EXPORT ALL
// =====================================================

export {
  searchUserDocuments,
  searchOfficialSources,
};
