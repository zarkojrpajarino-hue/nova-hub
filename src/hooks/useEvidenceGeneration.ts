/**
 * Hook for AI generation with evidence system
 *
 * Orchestrates: Pre-modal → Search → Validate → Generate → Report
 *
 * OPTIMIZED: Usa Evidence Profiles para configuración inteligente por dominio
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  searchEvidenceSources,
  getProjectSourcePolicy,
} from '@/lib/evidence/retrievers/master-retriever';
import {
  validateEvidenceContract,
  detectEvidenceConflicts,
} from '@/lib/evidence/validators/evidence-validator';
import {
  getFunctionContract,
  getFunctionEvidenceMode,
  getFunctionClaims,
} from '@/lib/evidence/config/function-claims';
import {
  calculateCoverage,
  getEvidenceStatus,
} from '@/lib/evidence/types';
import type {
  EvidenceMode,
  RealSource,
  ClaimWithEvidence,
  EvidenceContract,
  StrictModeExitOptions,
  AIOutputWithEvidence,
  SearchResults,
} from '@/lib/evidence/types';
import type { GenerationConfig } from '@/components/evidence/PreGenerationModal';
import { getEvidenceProfile, type EvidenceProfileType } from '@/lib/evidence/profiles';

interface UseEvidenceGenerationProps {
  functionName: string;
  projectId: string;
  userId: string;
  evidenceProfile?: EvidenceProfileType;
}

export function useEvidenceGeneration({
  functionName,
  projectId,
  userId,
  evidenceProfile = 'generic',
}: UseEvidenceGenerationProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [strictModeBlocked, setStrictModeBlocked] = useState(false);
  const [exitOptions, setExitOptions] = useState<StrictModeExitOptions | null>(null);
  const [generationResult, setGenerationResult] = useState<AIOutputWithEvidence | null>(
    null
  );

  // Get evidence profile configuration
  const profile = getEvidenceProfile(evidenceProfile);

  // Get default evidence mode (from profile or function config)
  const defaultEvidenceMode = profile.strictnessDefault as EvidenceMode || getFunctionEvidenceMode(functionName);
  const evidenceContract = getFunctionContract(functionName);

  /**
   * Step 1: Search for evidence sources
   */
  async function searchEvidence(config: GenerationConfig): Promise<boolean> {
    setIsSearching(true);
    setStrictModeBlocked(false);
    setExitOptions(null);

    try {
      // Get or create source policy
      let policy = await getProjectSourcePolicy(projectId);

      if (!policy) {
        // Create default policy
        const { data, error } = await supabase
          .from('user_source_policies')
          .insert({
            project_id: projectId,
            user_id: userId,
            evidence_mode: config.evidenceMode,
            tier_1_enabled: config.tier1Enabled,
            tier_2_enabled: config.tier2Enabled,
            tier_3_enabled: config.tier3Enabled,
            tier_4_enabled: config.tier4Enabled,
            blocked_domains: config.blockedDomains,
            max_source_age_days: config.maxSourceAgeDays,
          })
          .select()
          .single();

        if (error) throw error;
        policy = data;
      }

      if (!policy) {
        throw new Error('Failed to get source policy');
      }

      // Search for sources
      const results = await searchEvidenceSources(
        `${functionName} for project`, // Simple query for MVP
        policy,
        {
          userId,
          projectId,
          country: 'US',
        }
      );

      setSearchResults(results);

      return true;
    } catch (_error) {
      toast.error('Failed to search for evidence');
      return false;
    } finally {
      setIsSearching(false);
    }
  }

  /**
   * Step 2: Validate evidence (for strict mode)
   */
  function validateEvidence(
    claims: ClaimWithEvidence[],
    sources: RealSource[],
    contract: EvidenceContract
  ): boolean {
    const validation = validateEvidenceContract(claims, sources, contract);

    if (!validation.passes) {
      setStrictModeBlocked(true);
      setExitOptions(validation.exitOptions || null);
      return false;
    }

    return true;
  }

  /**
   * Step 3: Generate with evidence
   */
  async function generateWithEvidence(
    config: GenerationConfig,
    additionalData?: Record<string, unknown>
  ): Promise<AIOutputWithEvidence | null> {
    setIsGenerating(true);

    try {
      // For hypothesis mode, skip evidence search
      if (config.evidenceMode === 'hypothesis') {
        return await generateHypothesis(additionalData);
      }

      // Search for evidence
      const searchSuccess = await searchEvidence(config);
      if (!searchSuccess || !searchResults) {
        throw new Error('Evidence search failed');
      }

      // Build claims (simplified for MVP - in production, extract from AI output)
      const claims: ClaimWithEvidence[] = getFunctionClaims(functionName).map(
        (claimDef) => ({
          claim_id: claimDef.id,
          claim_text: claimDef.claim_text,
          value: 'TODO: Extract from AI generation', // TODO
          value_type: claimDef.value_type,
          citations: [], // TODO: Map sources to claims
          status: 'unsupported' as const,
          sources_found: 0,
          sources_required: claimDef.sources_min || 1,
          independent_domains: [],
        })
      );

      // Validate strict mode contract
      if (config.evidenceMode === 'strict' && evidenceContract) {
        const isValid = validateEvidence(
          claims,
          searchResults.sources_found,
          evidenceContract
        );

        if (!isValid) {
          return null; // Blocked by strict mode
        }
      }

      // Detect conflicts
      const conflicts = detectEvidenceConflicts(claims);
      const coverage = calculateCoverage(claims);
      const evidenceStatus = getEvidenceStatus(claims, conflicts);

      // Call actual Edge Function with evidence context
      const startTime = Date.now();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/scrape-and-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          function_name: functionName,
          project_id: projectId,
          user_id: userId,
          evidence_context: {
            mode: config.evidenceMode,
            sources: searchResults.sources_found,
            strict_requirements: evidenceContract,
            claims_to_verify: claims,
          },
          additional_params: additionalData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Edge Function failed: ${response.statusText}`);
      }

      const edgeFunctionResult = await response.json();
      const generationTime = Date.now() - startTime;

      // Build final result with evidence
      const result: AIOutputWithEvidence = {
        content: edgeFunctionResult.content || edgeFunctionResult,
        claims: edgeFunctionResult.claims || claims,
        evidence_status: evidenceStatus,
        coverage_percentage: coverage,
        sources_planned: (config.tier1Enabled ? 1 : 0) + (config.tier2Enabled ? 1 : 0),
        sources_found: searchResults.sources_found.length,
        sources_used: searchResults.sources_found,
        limitations: edgeFunctionResult.limitations || [],
        conflicts,
        generation_id: crypto.randomUUID(),
        function_name: functionName,
        evidence_mode: config.evidenceMode,
        generated_at: new Date().toISOString(),
        search_duration_ms: searchResults.search_duration_ms,
        generation_duration_ms: generationTime,
      };

      // Log generation
      await logGeneration(result, config);

      setGenerationResult(result);
      return result;
    } catch (_error) {
      toast.error('Generation failed');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }

  /**
   * Generate in hypothesis mode (no evidence)
   */
  async function generateHypothesis(additionalData?: Record<string, unknown>): Promise<AIOutputWithEvidence> {
    // Call AI endpoint in hypothesis mode (no evidence required)
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/scrape-and-extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        function_name: functionName,
        project_id: projectId,
        user_id: userId,
        evidence_context: {
          mode: 'hypothesis',
          sources: [],
        },
        additional_params: additionalData,
      }),
    });

    const edgeFunctionResult = await response.json();

    const result: AIOutputWithEvidence = {
      content: edgeFunctionResult.content || edgeFunctionResult,
      claims: [],
      evidence_status: 'no_evidence',
      coverage_percentage: 0,
      sources_planned: 0,
      sources_found: 0,
      sources_used: [],
      limitations: ['Generated without evidence - hypothesis only'],
      conflicts: [],
      generation_id: crypto.randomUUID(),
      function_name: functionName,
      evidence_mode: 'hypothesis',
      generated_at: new Date().toISOString(),
      search_duration_ms: 0,
      generation_duration_ms: 0,
    };

    await logGeneration(result, {
      evidenceMode: 'hypothesis',
      tier1Enabled: false,
      tier2Enabled: false,
      tier3Enabled: false,
      tier4Enabled: false,
      blockedDomains: [],
    });

    setGenerationResult(result);
    return result;
  }

  /**
   * Log generation to database
   */
  async function logGeneration(
    result: AIOutputWithEvidence,
    config: GenerationConfig
  ): Promise<void> {
    try {
      await supabase.from('ai_generation_logs').insert({
        project_id: projectId,
        user_id: userId,
        function_name: functionName,
        evidence_mode: config.evidenceMode,
        planned_sources: searchResults?.sources_found.map((s) => s.id) || [],
        sources_found: result.sources_used,
        claims_made: result.claims,
        evidence_status: result.evidence_status,
        coverage_percentage: result.coverage_percentage,
        search_duration_ms: result.search_duration_ms,
        generation_duration_ms: result.generation_duration_ms,
        generated_content: result.content,
      });
    } catch (_error) {
    }
  }

  /**
   * Handle strict mode exit options
   */
  async function handleStrictModeExit(action: 'search_more' | 'continue_as_hypothesis' | 'cancel') {
    if (action === 'search_more') {
      // TODO: Implement expanded search
      toast.info('Searching for more sources...');
    } else if (action === 'continue_as_hypothesis') {
      setStrictModeBlocked(false);
      return await generateHypothesis();
    } else {
      setStrictModeBlocked(false);
      setExitOptions(null);
    }
  }

  return {
    defaultEvidenceMode,
    isSearching,
    isGenerating,
    searchResults,
    generationResult,
    strictModeBlocked,
    exitOptions,
    generateWithEvidence,
    handleStrictModeExit,
  };
}
