/**
 * TIMEOUT HANDLING FOR EVIDENCE SYSTEM
 *
 * Implementación real de timeouts con AbortController.
 * NUNCA dejar que una API externa bloquee la respuesta final.
 */

export interface TimeoutConfig {
  /** Hard cap global (40s absoluto) */
  globalTimeoutMs: number;

  /** Soft caps por tier */
  tierTimeouts: {
    user_docs: number;
    official_apis: number;
    internal_data: number;
    web_news: number;
  };
}

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  globalTimeoutMs: 40000, // 40s hard cap

  tierTimeouts: {
    user_docs: 3000,      // 3s - búsqueda en docs propios
    official_apis: 8000,  // 8s - APIs externas pueden ser lentas
    internal_data: 2000,  // 2s - DB interno debe ser rápido
    web_news: 10000,      // 10s - web scraping puede tardar
  },
};

export interface TierRetrievalResult {
  tier: string;
  sources: any[];
  timeMs: number;
  timedOut: boolean;
  error?: string;
}

/**
 * Retrieval con timeout per-tier usando AbortController
 */
export async function retrieveWithTimeout(
  tier: string,
  retrievalFn: (signal: AbortSignal) => Promise<any[]>,
  timeoutMs: number
): Promise<TierRetrievalResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = performance.now();

  try {
    const sources = await retrievalFn(controller.signal);
    const timeMs = performance.now() - startTime;

    clearTimeout(timeoutId);

    return {
      tier,
      sources,
      timeMs,
      timedOut: false,
    };
  } catch (error: any) {
    const timeMs = performance.now() - startTime;
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      // Timeout occurred
      console.warn(`[Timeout] ${tier} exceeded ${timeoutMs}ms`);
      return {
        tier,
        sources: [],
        timeMs: timeoutMs,
        timedOut: true,
        error: 'Timeout',
      };
    }

    // Other error
    console.error(`[Error] ${tier} retrieval failed:`, error);
    return {
      tier,
      sources: [],
      timeMs,
      timedOut: false,
      error: error.message,
    };
  }
}

/**
 * Retrieval multi-tier con early exit
 *
 * - Si un tier timeout, continúa con el siguiente
 * - Hard cap global (40s)
 * - Logging explícito de qué tier falló
 */
export async function multiTierRetrieval(
  tiers: string[],
  retrievalFunctions: Record<string, (signal: AbortSignal) => Promise<any[]>>,
  config: TimeoutConfig = DEFAULT_TIMEOUT_CONFIG
): Promise<{
  allSources: any[];
  tierResults: TierRetrievalResult[];
  totalTimeMs: number;
  globalTimeout: boolean;
}> {
  const globalController = new AbortController();
  const globalTimeoutId = setTimeout(
    () => globalController.abort(),
    config.globalTimeoutMs
  );

  const startTime = performance.now();
  const tierResults: TierRetrievalResult[] = [];
  const allSources: any[] = [];

  try {
    for (const tier of tiers) {
      // Check global timeout
      if (globalController.signal.aborted) {
        console.warn('[Global Timeout] Stopping retrieval');
        break;
      }

      const retrievalFn = retrievalFunctions[tier];
      if (!retrievalFn) {
        console.warn(`[Missing] No retrieval function for tier: ${tier}`);
        continue;
      }

      const timeoutMs = config.tierTimeouts[tier as keyof typeof config.tierTimeouts] || 5000;

      // Retrieve with tier timeout
      const result = await retrieveWithTimeout(tier, retrievalFn, timeoutMs);
      tierResults.push(result);

      if (!result.timedOut && !result.error) {
        allSources.push(...result.sources);
      }

      // Log what happened
      if (result.timedOut) {
        console.warn(`[Timeout] ${tier} took ${result.timeMs}ms (limit: ${timeoutMs}ms)`);
      } else if (result.error) {
        console.error(`[Error] ${tier} failed: ${result.error}`);
      } else {
        console.log(`[Success] ${tier} found ${result.sources.length} sources in ${result.timeMs}ms`);
      }
    }

    const totalTimeMs = performance.now() - startTime;
    clearTimeout(globalTimeoutId);

    return {
      allSources,
      tierResults,
      totalTimeMs,
      globalTimeout: globalController.signal.aborted,
    };
  } catch (error: any) {
    const totalTimeMs = performance.now() - startTime;
    clearTimeout(globalTimeoutId);

    console.error('[Fatal Error] Multi-tier retrieval failed:', error);

    return {
      allSources,
      tierResults,
      totalTimeMs,
      globalTimeout: error.name === 'AbortError',
    };
  }
}

/**
 * Determinar evidence_status basado en resultados de retrieval
 */
export function determineEvidenceStatus(
  sourcesFound: number,
  minSourcesOverall: number,
  coveragePercentage: number,
  timedOut: boolean,
  error: boolean
): 'verified' | 'partial' | 'no_evidence' | 'error' {
  if (error && sourcesFound === 0) return 'error';
  if (timedOut && sourcesFound === 0) return 'no_evidence';
  if (sourcesFound === 0) return 'no_evidence';

  if (sourcesFound >= minSourcesOverall && coveragePercentage >= 50) {
    return 'verified';
  }

  if (sourcesFound > 0 && (sourcesFound < minSourcesOverall || coveragePercentage < 50)) {
    return 'partial';
  }

  return 'no_evidence';
}

/**
 * Ejemplo de uso en edge function
 */
export async function exampleUsageInEdgeFunction() {
  // Define retrieval functions por tier
  const retrievalFunctions = {
    user_docs: async (signal: AbortSignal) => {
      // Fetch from user uploaded docs
      const response = await fetch('/api/search-user-docs', {
        signal,
        method: 'POST',
        body: JSON.stringify({ query: 'revenue projections' }),
      });
      return response.json();
    },

    official_apis: async (signal: AbortSignal) => {
      // Fetch from external APIs (World Bank, etc)
      const response = await fetch('https://api.worldbank.org/v2/country/esp', {
        signal,
      });
      return response.json();
    },

    internal_data: async (signal: AbortSignal) => {
      // Query internal DB
      // (En Supabase, signal se pasa a fetch interno)
      return []; // Placeholder
    },

    web_news: async (signal: AbortSignal) => {
      // Web scraping (si aplica)
      return []; // Placeholder
    },
  };

  // Ejecutar multi-tier retrieval con timeouts
  const result = await multiTierRetrieval(
    ['user_docs', 'official_apis', 'internal_data'], // tierOrder from profile
    retrievalFunctions,
    DEFAULT_TIMEOUT_CONFIG
  );

  // Determinar evidence_status
  const evidenceStatus = determineEvidenceStatus(
    result.allSources.length,
    3, // minSourcesOverall from profile
    75, // coverage from generation
    result.globalTimeout || result.tierResults.some(t => t.timedOut),
    result.tierResults.some(t => t.error)
  );

  return {
    success: true, // Siempre true si generación funcionó
    evidence_status: evidenceStatus,
    sources_found: result.allSources.length,
    retrieval_time_ms: result.totalTimeMs,
    retrieval_by_tier: result.tierResults.map(t => ({
      tier: t.tier,
      time_ms: t.timeMs,
      sources_found: t.sources.length,
      timeout_occurred: t.timedOut,
    })),
    timeout_occurred: result.globalTimeout || result.tierResults.some(t => t.timedOut),
    timeout_tier: result.tierResults.find(t => t.timedOut)?.tier,
    data: {
      // ... generated output (SIEMPRE presente)
    },
  };
}
