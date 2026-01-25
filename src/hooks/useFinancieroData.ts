import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemberStats, useObjectives } from '@/hooks/useNovaData';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { DEMO_MEMBERS, DEMO_FINANCIAL, DEMO_FINANCIAL_METRICS, DEMO_PENDING_PAYMENTS } from '@/data/demoData';

export function useFinancieroData() {
  const { isDemoMode } = useDemoMode();
  const { data: realMembers = [], isLoading: loadingMembers } = useMemberStats();
  const { data: objectives = [] } = useObjectives();

  const members = isDemoMode ? DEMO_MEMBERS : realMembers;
  
  const { data: realFinancialMetrics = [] } = useQuery({
    queryKey: ['financial_metrics_secure'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_financial_metrics_secure');
      if (error) throw error;
      return data || [];
    },
    enabled: !isDemoMode,
  });

  const financialMetrics = isDemoMode ? DEMO_FINANCIAL_METRICS : realFinancialMetrics;

  const { data: realPendingPayments = [] } = useQuery({
    queryKey: ['pending_payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_payments')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !isDemoMode,
  });

  const pendingPayments = isDemoMode ? DEMO_PENDING_PAYMENTS : realPendingPayments;

  const objectivesMap = useMemo(() => {
    const map: Record<string, number> = {
      facturacion: 15000,
      margen: 7500,
    };
    objectives.forEach(obj => {
      map[obj.name] = obj.target_value;
    });
    return map;
  }, [objectives]);

  const totalFacturacion = isDemoMode 
    ? DEMO_FINANCIAL.facturacion_total 
    : members.reduce((sum, m) => sum + (Number(m.facturacion) || 0), 0);
    
  const totalMargen = isDemoMode 
    ? DEMO_FINANCIAL.margen_total 
    : members.reduce((sum, m) => sum + (Number(m.margen) || 0), 0);
    
  const margenPromedio = totalFacturacion > 0 ? (totalMargen / totalFacturacion) * 100 : 0;
  
  const totalPending = isDemoMode 
    ? DEMO_FINANCIAL.pendiente_cobro 
    : pendingPayments.reduce((sum, p) => sum + (Number(p.pendiente) || 0), 0);
    
  const overdueCount = isDemoMode 
    ? DEMO_PENDING_PAYMENTS.filter(p => (p.dias_vencido || 0) > 0).length 
    : pendingPayments.filter(p => (p.dias_vencido || 0) > 0).length;
    
  const overduePayments = isDemoMode 
    ? DEMO_PENDING_PAYMENTS.filter(p => (p.dias_vencido || 0) > 0)
    : pendingPayments.filter(p => (p.dias_vencido || 0) > 0);
    
  const upcomingPayments = isDemoMode 
    ? DEMO_PENDING_PAYMENTS.filter(p => (p.dias_vencido || 0) <= 0 && p.estado_cobro !== 'cobrado')
    : pendingPayments.filter(p => (p.dias_vencido || 0) <= 0 && p.estado_cobro !== 'cobrado');

  const monthlyGrowth = useMemo(() => {
    if (isDemoMode) return DEMO_FINANCIAL.crecimiento_mensual;
    if (financialMetrics.length < 2) return 0;
    const sorted = [...financialMetrics].sort((a, b) => 
      new Date(b.month).getTime() - new Date(a.month).getTime()
    );
    const currentMonth = sorted[0]?.facturacion || 0;
    const previousMonth = sorted[1]?.facturacion || 0;
    if (previousMonth === 0) return 0;
    return ((currentMonth - previousMonth) / previousMonth) * 100;
  }, [financialMetrics, isDemoMode]);

  const sortedByFacturacion = useMemo(() => 
    [...members].sort((a, b) => 
      (Number(b.facturacion) || 0) - (Number(a.facturacion) || 0)
    ),
    [members]
  );

  const metaAnual = isDemoMode ? DEMO_FINANCIAL.objetivo_facturacion : objectivesMap.facturacion * 9;
  const progresoAnual = (totalFacturacion / metaAnual) * 100;

  return {
    isLoading: loadingMembers && !isDemoMode,
    members,
    sortedByFacturacion,
    financialMetrics,
    pendingPayments,
    overduePayments,
    upcomingPayments,
    objectivesMap,
    metrics: {
      totalFacturacion,
      totalMargen,
      margenPromedio,
      totalPending,
      overdueCount,
      monthlyGrowth,
      metaAnual,
      progresoAnual,
    },
  };
}
