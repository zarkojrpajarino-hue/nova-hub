/**
 * useFinancialIntelligence — F30
 *
 * Hooks for MRR Forecast, Cash Flow Stress Test, and Financial Risk Alerts.
 * Each calls its corresponding RPC and returns typed data.
 * insufficient_data status is handled by UI (shows UnlockProgress).
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

// ── MRR Forecast (FI30.1) ───────────────────────────────────────────────────

interface MRRHistoricalPoint {
  month: string
  mrr: number
}

interface MRRForecastPoint {
  month: string
  predicted: number
  low: number
  high: number
}

export interface MRRForecastData {
  status: 'ok' | 'insufficient_data'
  historical?: MRRHistoricalPoint[]
  forecast?: MRRForecastPoint[]
  trend?: 'growing' | 'flat' | 'declining'
  confidence?: number
  source_confidence?: number
  months_available?: number
  months_required?: number
  has_integration?: boolean
}

async function fetchMRRForecast(projectId: string, monthsAhead: number = 6): Promise<MRRForecastData> {
  const { data, error } = await supabase.rpc('compute_mrr_forecast', {
    p_project_id: projectId,
    p_months_ahead: monthsAhead,
  } as any)
  if (error) throw error
  return data as unknown as MRRForecastData
}

export function useMRRForecast(projectId: string | undefined, monthsAhead: number = 6) {
  return useQuery({
    queryKey: ['mrr_forecast', projectId, monthsAhead],
    enabled: !!projectId,
    staleTime: 10 * 60_000,
    queryFn: () => fetchMRRForecast(projectId!, monthsAhead),
  })
}

// ── Cash Flow Stress Test (FI30.3) ──────────────────────────────────────────

export interface StressScenario {
  name: 'base' | 'growth' | 'crisis'
  runway_months: number
  cash_zero_date: string
  severity: 'safe' | 'warning' | 'critical'
}

export interface StressTestData {
  status: 'ok' | 'insufficient_data'
  scenarios?: StressScenario[]
  inputs?: {
    mrr: number
    burn_rate: number
    cash_on_hand: number
    top_client_pct: number
  }
  source_confidence?: number
  has_integration?: boolean
  reason?: string
}

async function fetchStressTest(projectId: string): Promise<StressTestData> {
  const { data, error } = await supabase.rpc('run_cash_flow_stress_test', {
    p_project_id: projectId,
  } as any)
  if (error) throw error
  return data as unknown as StressTestData
}

export function useStressTest(projectId: string | undefined) {
  return useQuery({
    queryKey: ['stress_test', projectId],
    enabled: !!projectId,
    staleTime: 10 * 60_000,
    queryFn: () => fetchStressTest(projectId!),
  })
}

// ── Financial Risks (FI30.5) ────────────────────────────────────────────────

export interface FinancialRisk {
  type: string
  severity: 'warning' | 'critical'
  evidence: string
  action: string
}

export interface FinancialRisksData {
  status: 'ok' | 'no_risks'
  risks: FinancialRisk[]
  checked_at?: string
}

async function fetchFinancialRisks(projectId: string): Promise<FinancialRisksData> {
  const { data, error } = await supabase.rpc('detect_financial_risks', {
    p_project_id: projectId,
  } as any)
  if (error) throw error
  return data as unknown as FinancialRisksData
}

export function useFinancialRisks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['financial_risks', projectId],
    enabled: !!projectId,
    staleTime: 5 * 60_000,
    queryFn: () => fetchFinancialRisks(projectId!),
  })
}
