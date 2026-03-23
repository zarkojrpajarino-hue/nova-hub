/**
 * AI Logger Helper
 *
 * Utility para loguear todas las llamadas IA a la tabla ai_generations_log
 * Permite medir performance, costos, y calidad de outputs
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface LogAICallParams {
  supabaseClient: SupabaseClient;
  projectId: string | undefined;
  userId?: string;
  functionName: string;
  inputData: unknown;
  outputData?: unknown;
  success: boolean;
  errorMessage?: string;
  executionTimeMs: number;
  tokensUsed?: number;
  modelUsed?: string;
}

/**
 * Estima el costo aproximado basado en el modelo y tokens
 */
function estimateCost(modelUsed: string, tokensUsed?: number): number {
  if (!tokensUsed) return 0;

  // Precios aproximados por token (promedio input/output)
  // Input/Output per 1M tokens:
  //   claude-sonnet-4-6:         $3 / $15  -> avg ~$9/1M
  //   claude-haiku-4-5:          $0.25 / $1.25 -> avg ~$0.75/1M
  //   claude-3-5-sonnet-20241022: $3 / $15  -> avg ~$9/1M
  //   claude-3-opus:             $15 / $75  -> avg ~$45/1M
  const prices: Record<string, number> = {
    'claude-sonnet-4-6': 0.000009,           // $9 per 1M tokens (avg input/output)
    'claude-haiku-4-5': 0.00000075,          // $0.75 per 1M tokens (avg input/output)
    'claude-3-5-sonnet-20241022': 0.000009,  // $9 per 1M tokens (avg input/output)
    'claude-3-opus': 0.000045,               // $45 per 1M tokens (avg input/output)
    'gpt-4': 0.00006,                        // $60 per 1M tokens
    'gpt-3.5-turbo': 0.000002,               // $2 per 1M tokens
  };

  const pricePerToken = prices[modelUsed] || 0.000009; // Default to Sonnet pricing
  return tokensUsed * pricePerToken;
}

/**
 * Loguea una llamada IA a la base de datos
 */
export async function logAICall(params: LogAICallParams): Promise<void> {
  const {
    supabaseClient,
    projectId,
    userId,
    functionName,
    inputData,
    outputData,
    success,
    errorMessage,
    executionTimeMs,
    tokensUsed,
    modelUsed = 'claude-3-5-sonnet-20241022',
  } = params;

  try {
    const costUsd = estimateCost(modelUsed, tokensUsed);

    const { error } = await supabaseClient.from('ai_generations_log').insert({
      project_id: projectId || null,
      user_id: userId || null,
      function_name: functionName,
      input_data: inputData,
      output_data: outputData || null,
      success,
      error_message: errorMessage || null,
      execution_time_ms: executionTimeMs,
      tokens_used: tokensUsed || null,
      model_used: modelUsed,
      cost_usd: costUsd,
    });

    if (error) {
      console.error('Failed to log AI call:', error);
      // No lanzar error - el logging no debe romper la función principal
    }
  } catch (error) {
    console.error('Error in logAICall:', error);
    // Swallow error - logging is not critical
  }
}

/**
 * AI CACHING STATUS
 *
 * Functions that already cache results (via ai_analysis_cache table):
 *   - analyze-project-v4: Caches full analysis for 24h per project+context combo
 *
 * Functions that SHOULD implement caching (high cost, repetitive inputs):
 *   - generate-business-ideas: Cache per project (ideas don't change hourly)
 *   - generate-complete-business: Cache per project+idea combo
 *   - generate-buyer-persona-v2: Cache per project (persona is stable)
 *   - generate-financial-projections: Cache per project (recalc daily at most)
 *   - generate-brand-kit-v2: Cache per project (branding is stable)
 *   - generate-sales-playbook-v2: Cache per project
 *
 * Pattern to follow: see analyze-project-v4/index.ts for the ai_analysis_cache
 * upsert pattern with TTL-based invalidation.
 */

/**
 * Wrapper para medir tiempo de ejecución y loguear automáticamente
 */
export async function withAILogging<T>(
  supabaseClient: SupabaseClient,
  functionName: string,
  inputData: unknown,
  projectId: string | undefined,
  userId: string | undefined,
  fn: () => Promise<{ result: T; tokensUsed?: number; modelUsed?: string }>
): Promise<T> {
  const startTime = Date.now();

  try {
    const { result, tokensUsed, modelUsed } = await fn();
    const executionTimeMs = Date.now() - startTime;

    // Log exitoso
    await logAICall({
      supabaseClient,
      projectId,
      userId,
      functionName,
      inputData,
      outputData: result,
      success: true,
      executionTimeMs,
      tokensUsed,
      modelUsed,
    });

    return result;
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;

    // Log con error
    await logAICall({
      supabaseClient,
      projectId,
      userId,
      functionName,
      inputData,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs,
    });

    throw error; // Re-throw para que la función principal maneje el error
  }
}
