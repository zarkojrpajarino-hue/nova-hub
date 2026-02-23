/**
 * GENERATE PREDICTIONS - Edge Function
 *
 * Genera predicciones usando IA y análisis de datos históricos:
 * - Revenue forecast (proyección de ingresos)
 * - OKR completion probability (probabilidad de cumplir objetivos)
 * - Runway predictions (predicción de runway financiero)
 * - Growth projections (proyecciones de crecimiento)
 *
 * Input:
 * - user_id: UUID del usuario
 * - prediction_types: Array de tipos ['revenue', 'okr', 'runway', 'all']
 * - forecast_months: Número de meses a predecir (default: 3)
 *
 * Output:
 * - predictions: Array de predicciones generadas
 * - summary: Resumen ejecutivo
 * - recommendations: Recomendaciones basadas en predicciones
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuthWithUserId } from '../_shared/auth.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Prediction {
  type: string;
  date?: string;
  value: number;
  confidence: number;
  trend: string;
  metadata?: Record<string, unknown>;
  objective_id?: string;
  objective_name?: string;
  probability?: number;
  status?: string;
  current_progress?: number;
}

interface PredictionRecommendation {
  priority: string;
  title: string;
  description: string;
  category?: string;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
    // CORS
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    const body = await req.json() as Record<string, unknown>;
    const { user_id, prediction_types, forecast_months } = body as {
      user_id: string;
      prediction_types?: string[];
      forecast_months?: number;
    };

    if (!user_id) {
      throw new Error('user_id is required');
    }

    const types = prediction_types || ['all'];
    const months = forecast_months || 3;

    // Initialize Supabase client
        const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);

    const results: {
      predictions: Prediction[];
      summary: Record<string, unknown>;
      recommendations: Array<{ priority: string; title: string; description: string; category?: string }>;
    } = {
      predictions: [],
      summary: {},
      recommendations: [],
    };

    // 1. REVENUE PREDICTIONS
    if (types.includes('revenue') || types.includes('all')) {
      const revenuePredictions = await generateRevenuePredictions(
        supabaseClient,
        user_id,
        months
      );
      results.predictions.push(...revenuePredictions.predictions);
      results.summary.revenue = revenuePredictions.summary;
      results.recommendations.push(...revenuePredictions.recommendations);
    }

    // 2. OKR PROBABILITY
    if (types.includes('okr') || types.includes('all')) {
      const okrPredictions = await generateOKRPredictions(
        supabaseClient,
        user_id
      );
      results.predictions.push(...okrPredictions.predictions);
      results.summary.okr = okrPredictions.summary;
      results.recommendations.push(...okrPredictions.recommendations);
    }

    // 3. RUNWAY PREDICTIONS
    if (types.includes('runway') || types.includes('all')) {
      const runwayPredictions = await generateRunwayPredictions(
        supabaseClient,
        user_id,
        months
      );
      results.predictions.push(...runwayPredictions.predictions);
      results.summary.runway = runwayPredictions.summary;
      results.recommendations.push(...runwayPredictions.recommendations);
    }

    // 4. GROWTH PROJECTIONS
    if (types.includes('growth') || types.includes('all')) {
      const growthPredictions = await generateGrowthPredictions(
        supabaseClient,
        user_id,
        months
      );
      results.predictions.push(...growthPredictions.predictions);
      results.summary.growth = growthPredictions.summary;
      results.recommendations.push(...growthPredictions.recommendations);
    }

    return new Response(
      JSON.stringify({
        ...results,
        generated_at: new Date().toISOString(),
        forecast_period_months: months,
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error generating predictions:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});

async function generateRevenuePredictions(
  supabase: SupabaseClient,
  userId: string,
  months: number
) {
  // Obtener datos históricos de revenue
  const { data: historicalData } = await supabase
    .from('financial_metrics')
    .select('facturacion, month')
    .order('month', { ascending: true })
    .limit(12);

  if (!historicalData || historicalData.length === 0) {
    return {
      predictions: [],
      summary: { message: 'No hay datos históricos suficientes' },
      recommendations: [
        {
          priority: 'high',
          title: 'Agregar datos financieros',
          description: 'Necesitas al menos 3 meses de datos para predicciones precisas',
        },
      ],
    };
  }

  // Análisis simple de tendencia
  const revenues = historicalData.map((d: Record<string, unknown>) => (d.facturacion as number) || 0);

  // Calcular tasa de crecimiento
  const last3Months = revenues.slice(-3);
  const previous3Months = revenues.slice(-6, -3);
  const last3Avg = last3Months.reduce((a: number, b: number) => a + b, 0) / (last3Months.length || 1);
  const prev3Avg = previous3Months.reduce((a: number, b: number) => a + b, 0) / (previous3Months.length || 1);

  const growthRate = prev3Avg > 0 ? ((last3Avg - prev3Avg) / prev3Avg) * 100 : 0;

  // Generar predicciones para próximos meses
  const predictions: Prediction[] = [];
  let currentPrediction = last3Avg;

  for (let i = 1; i <= months; i++) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() + i);

    currentPrediction = currentPrediction * (1 + growthRate / 100);

    predictions.push({
      type: 'revenue',
      date: monthDate.toISOString().split('T')[0],
      value: Math.round(currentPrediction),
      confidence: Math.max(0.5, 0.9 - (i * 0.1)), // Confianza disminuye con el tiempo
      trend: growthRate > 5 ? 'growing' : growthRate < -5 ? 'declining' : 'stable',
      metadata: {
        growth_rate: growthRate.toFixed(2),
        based_on_months: historicalData.length,
      },
    });

    // Guardar en base de datos
    await supabase.from('revenue_forecasts').upsert({
      user_id: userId,
      forecast_date: monthDate.toISOString().split('T')[0],
      predicted_revenue: Math.round(currentPrediction),
      confidence_interval_low: Math.round(currentPrediction * 0.85),
      confidence_interval_high: Math.round(currentPrediction * 1.15),
      trend: growthRate > 5 ? 'growing' : growthRate < -5 ? 'declining' : 'stable',
      growth_rate_percentage: growthRate,
      factors: [
        { factor: 'Historical trend', weight: 0.7 },
        { factor: 'Recent performance', weight: 0.3 },
      ],
    });
  }

  const summary = {
    avg_predicted_revenue: Math.round(
      predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length
    ),
    trend: growthRate > 5 ? 'growing' : growthRate < -5 ? 'declining' : 'stable',
    growth_rate: growthRate.toFixed(2) + '%',
    confidence: 'medium',
  };

  const recommendations: PredictionRecommendation[] = [];

  if (growthRate < -10) {
    recommendations.push({
      priority: 'high',
      title: 'Revenue en declive',
      description: `Tu revenue está declinando ${Math.abs(growthRate).toFixed(1)}%. Considera revisar estrategia de pricing y adquisición.`,
      category: 'revenue',
    });
  } else if (growthRate > 20) {
    recommendations.push({
      priority: 'medium',
      title: 'Crecimiento acelerado',
      description: `Revenue creciendo ${growthRate.toFixed(1)}%. Asegúrate de tener capacidad operativa para sostenerlo.`,
      category: 'revenue',
    });
  }

  return { predictions, summary, recommendations };
}

async function generateOKRPredictions(supabase: SupabaseClient, userId: string) {
  // Obtener objetivos activos
  const { data: objectives } = await supabase
    .from('objectives')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (!objectives || objectives.length === 0) {
    return {
      predictions: [],
      summary: { message: 'No hay objetivos activos para analizar' },
      recommendations: [],
    };
  }

  const predictions: Prediction[] = [];
  const recommendations: PredictionRecommendation[] = [];
  let atRiskCount = 0;
  let onTrackCount = 0;

  for (const objective of objectives) {
    // Simular cálculo de probabilidad (en producción usaríamos ML)
    const progress = objective.metadata?.progress || 0;
    let probability = 0;
    let status = '';

    if (progress >= 75) {
      probability = 0.9;
      status = 'likely_to_succeed';
      onTrackCount++;
    } else if (progress >= 50) {
      probability = 0.7;
      status = 'on_track';
      onTrackCount++;
    } else if (progress >= 25) {
      probability = 0.45;
      status = 'at_risk';
      atRiskCount++;
    } else {
      probability = 0.2;
      status = 'likely_to_fail';
      atRiskCount++;
    }

    predictions.push({
      type: 'okr_probability',
      objective_id: objective.id,
      objective_name: objective.name,
      probability,
      status,
      current_progress: progress,
    });

    // Guardar en base de datos
    await supabase.from('okr_probability').upsert({
      objective_id: objective.id,
      user_id: userId,
      probability_score: probability,
      status_prediction: status,
      risk_factors: progress < 50 ? [{ factor: 'Low progress', severity: 'high' }] : [],
      recommendations:
        progress < 50
          ? [{ action: 'Increase focus', priority: 'high' }]
          : [],
    });

    // Generar recomendaciones
    if (status === 'at_risk' || status === 'likely_to_fail') {
      recommendations.push({
        priority: 'high',
        title: `OKR en riesgo: ${objective.name}`,
        description: `Solo ${progress}% de progreso. Probabilidad de éxito: ${(probability * 100).toFixed(0)}%`,
        category: 'okr',
      });
    }
  }

  const summary = {
    total_objectives: objectives.length,
    on_track: onTrackCount,
    at_risk: atRiskCount,
    avg_probability: (
      predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length
    ).toFixed(2),
  };

  return { predictions, summary, recommendations };
}

async function generateRunwayPredictions(
  supabase: SupabaseClient,
  userId: string,
  months: number
) {
  // Obtener datos financieros actuales
  const { data: financialHealth } = await supabase
    .from('financial_health_dashboard')
    .select('*')
    .single();

  if (!financialHealth) {
    return {
      predictions: [],
      summary: { message: 'No hay datos financieros' },
      recommendations: [],
    };
  }

  const currentRunway = financialHealth.runway_months || 999;
  const burnRate = financialHealth.avg_monthly_burn || 0;
  const totalCash = financialHealth.total_cash || 0;

  const predictions: Prediction[] = [];
  const recommendations: PredictionRecommendation[] = [];

  // Predecir runway para próximos meses
  for (let i = 1; i <= months; i++) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() + i);

    const projectedCash = Math.max(0, totalCash - burnRate * i);
    const projectedRunway = burnRate > 0 ? projectedCash / burnRate : 999;

    let alertLevel = 'healthy';
    if (projectedRunway < 3) {
      alertLevel = 'critical';
    } else if (projectedRunway < 6) {
      alertLevel = 'warning';
    }

    predictions.push({
      type: 'runway',
      date: monthDate.toISOString().split('T')[0],
      value: projectedRunway,
      confidence: 0.75,
      trend: projectedRunway < currentRunway ? 'declining' : 'stable',
      metadata: {
        projected_cash: projectedCash,
        burn_rate: burnRate,
        alert_level: alertLevel,
      },
    });

    // Guardar en base de datos
    await supabase.from('runway_predictions').insert({
      user_id: userId,
      prediction_date: monthDate.toISOString().split('T')[0],
      predicted_runway_months: projectedRunway,
      burn_rate_forecast: burnRate,
      cash_depletion_date:
        projectedRunway < 999
          ? new Date(Date.now() + projectedRunway * 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
          : null,
      alert_level: alertLevel,
      recommendations:
        alertLevel === 'critical'
          ? [{ action: 'Urgent: reduce costs or raise funding', priority: 'critical' }]
          : [],
    });
  }

  if (currentRunway < 6 && burnRate > 0) {
    recommendations.push({
      priority: 'critical',
      title: 'Runway crítico',
      description: `Solo ${currentRunway.toFixed(1)} meses de runway restantes. Tomar acción inmediata.`,
      category: 'financial',
    });
  }

  const summary = {
    current_runway_months: currentRunway,
    avg_predicted_runway: (
      predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length
    ).toFixed(1),
    burn_rate: burnRate,
    alert_level: predictions[predictions.length - 1]?.metadata.alert_level || 'healthy',
  };

  return { predictions, summary, recommendations };
}

async function generateGrowthPredictions(
  supabase: SupabaseClient,
  userId: string,
  months: number
) {
  // Obtener métricas de negocio
  const { data: metrics } = await supabase
    .from('financial_metrics')
    .select('*')
    .order('month', { ascending: false })
    .limit(6);

  if (!metrics || metrics.length < 3) {
    return {
      predictions: [],
      summary: { message: 'Datos insuficientes para proyectar crecimiento' },
      recommendations: [],
    };
  }

  // Calcular tasa de crecimiento promedio
  const revenues = metrics.map((m: Record<string, unknown>) => (m.facturacion as number) || 0);
  const growthRates: number[] = [];

  for (let i = 1; i < revenues.length; i++) {
    if (revenues[i] > 0) {
      growthRates.push(((revenues[i - 1] - revenues[i]) / revenues[i]) * 100);
    }
  }

  const avgGrowthRate =
    growthRates.reduce((a, b) => a + b, 0) / (growthRates.length || 1);

  const predictions: Prediction[] = [];
  const recommendations: PredictionRecommendation[] = [];

  for (let i = 1; i <= months; i++) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() + i);

    predictions.push({
      type: 'growth',
      date: monthDate.toISOString().split('T')[0],
      value: avgGrowthRate,
      confidence: 0.65,
      trend: avgGrowthRate > 0 ? 'positive' : 'negative',
      metadata: {
        growth_rate_percentage: avgGrowthRate.toFixed(2),
      },
    });
  }

  if (avgGrowthRate < 0) {
    recommendations.push({
      priority: 'high',
      title: 'Crecimiento negativo',
      description: `Crecimiento promedio: ${avgGrowthRate.toFixed(1)}%. Revisar estrategia de growth.`,
      category: 'growth',
    });
  }

  const summary = {
    avg_growth_rate: avgGrowthRate.toFixed(2) + '%',
    trend: avgGrowthRate > 5 ? 'strong_growth' : avgGrowthRate > 0 ? 'moderate_growth' : 'declining',
  };

  return { predictions, summary, recommendations };
}
