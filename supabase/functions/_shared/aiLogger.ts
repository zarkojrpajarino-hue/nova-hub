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

  // Precios aproximados (input + output promediado)
  const prices: Record<string, number> = {
    'claude-3-5-sonnet-20241022': 0.000015, // $15 per 1M tokens (promedio input/output)
    'claude-3-opus': 0.00006, // $60 per 1M tokens
    'gpt-4': 0.00006, // $60 per 1M tokens
    'gpt-3.5-turbo': 0.000002, // $2 per 1M tokens
  };

  const pricePerToken = prices[modelUsed] || 0.000015;
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
