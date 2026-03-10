import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EconomicProfileFormProps {
  projectId: string;
}

const MODEL_TYPE_OPTIONS = [
  { value: 'saas',        label: 'SaaS' },
  { value: 'service',     label: 'Servicios' },
  { value: 'physical',    label: 'Producto físico' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'agency',      label: 'Agencia' },
  { value: 'unknown',     label: 'Por definir' },
];

const PRICING_MODEL_OPTIONS = [
  { value: 'subscription', label: 'Suscripción' },
  { value: 'usage',        label: 'Por uso' },
  { value: 'one_off',      label: 'Pago único' },
  { value: 'hybrid',       label: 'Híbrido' },
  { value: 'unknown',      label: 'Por definir' },
];

const REVENUE_TYPE_OPTIONS = [
  { value: 'recurring',     label: 'Recurrente' },
  { value: 'transactional', label: 'Transaccional' },
  { value: 'mixed',         label: 'Mixto' },
];

function computeConfidence(form: {
  modelType: string;
  pricingModel: string;
  revenueType: string;
  cashOnHand: string;
  topClientPercent: string;
  avgTicket: string;
  cacEstimate: string;
  grossMargin: string;
  salesCycleDays: string;
}): { score: number; level: 'low' | 'medium' | 'high'; sources: Record<string, string> } {
  const sources: Record<string, string> = {
    model_type: 'declared',
    pricing_model: 'declared',
    revenue_type: 'declared',
  };
  let total = 3;

  const optionals: [string, string][] = [
    ['cash_on_hand', form.cashOnHand],
    ['top_client_revenue_percent', form.topClientPercent],
    ['avg_ticket', form.avgTicket],
    ['cac_estimate', form.cacEstimate],
    ['gross_margin_target', form.grossMargin],
    ['sales_cycle_days', form.salesCycleDays],
  ];

  for (const [key, val] of optionals) {
    if (val.trim() !== '') {
      sources[key] = 'declared';
      total++;
    }
  }

  const score = Math.round((total / 9) * 100);
  const level: 'low' | 'medium' | 'high' =
    score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';

  return { score, level, sources };
}

const LEVEL_COLORS = {
  low:    'text-red-600 border-red-600',
  medium: 'text-amber-600 border-amber-600',
  high:   'text-green-600 border-green-600',
};

export function EconomicProfileForm({ projectId }: EconomicProfileFormProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    modelType: '',
    pricingModel: 'unknown',
    revenueType: 'mixed',
    cashOnHand: '',
    topClientPercent: '',
    avgTicket: '',
    cacEstimate: '',
    grossMargin: '',
    salesCycleDays: '',
  });
  const [initialized, setInitialized] = useState(false);

  const { data: current, isLoading } = useQuery({
    queryKey: ['economic_profile', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_economic_profile')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (current && !initialized) {
      setForm({
        modelType: current.model_type ?? '',
        pricingModel: current.pricing_model ?? 'unknown',
        revenueType: current.revenue_type ?? 'mixed',
        cashOnHand: current.cash_on_hand !== null ? String(current.cash_on_hand) : '',
        topClientPercent: current.top_client_revenue_percent !== null ? String(current.top_client_revenue_percent) : '',
        avgTicket: current.avg_ticket !== null ? String(current.avg_ticket) : '',
        cacEstimate: current.cac_estimate !== null ? String(current.cac_estimate) : '',
        grossMargin: current.gross_margin_target !== null ? String(current.gross_margin_target) : '',
        salesCycleDays: current.sales_cycle_days !== null ? String(current.sales_cycle_days) : '',
      });
      setInitialized(true);
    }
  }, [current, initialized]);

  const confidence = computeConfidence(form);

  const handleSave = async () => {
    if (!form.modelType) {
      toast.error('El modelo de negocio es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      const parseNum = (v: string) => v.trim() !== '' ? parseFloat(v) : null;
      const parseInt_ = (v: string) => v.trim() !== '' ? parseInt(v, 10) : null;

      const { error } = await supabase
        .from('project_economic_profile')
        .upsert({
          project_id: projectId,
          model_type: form.modelType,
          pricing_model: form.pricingModel,
          revenue_type: form.revenueType,
          cash_on_hand: parseNum(form.cashOnHand),
          cash_on_hand_updated_at: form.cashOnHand.trim() !== '' ? new Date().toISOString() : null,
          top_client_revenue_percent: parseNum(form.topClientPercent),
          avg_ticket: parseNum(form.avgTicket),
          cac_estimate: parseNum(form.cacEstimate),
          gross_margin_target: parseNum(form.grossMargin),
          sales_cycle_days: parseInt_(form.salesCycleDays),
          field_sources: confidence.sources,
          confidence_score: confidence.score,
          confidence_level: confidence.level,
          last_updated_at: new Date().toISOString(),
        }, { onConflict: 'project_id' });

      if (error) throw error;

      toast.success('Perfil económico guardado');
      queryClient.invalidateQueries({ queryKey: ['economic_profile', projectId] });
    } catch {
      toast.error('Error al guardar el perfil económico');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">Perfil económico</CardTitle>
              <CardDescription>
                Modelo, pricing y métricas financieras. Alimenta RunwayFactor (R1.1) y ConcentraciónRevenue (R1.4).
              </CardDescription>
            </div>
            <Badge variant="outline" className={LEVEL_COLORS[confidence.level]}>
              Confianza: {confidence.score}% ({confidence.level})
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required fields */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Clasificación del modelo</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Modelo de negocio *</Label>
                <Select value={form.modelType} onValueChange={(v) => setForm({ ...form, modelType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Modelo de pricing *</Label>
                <Select value={form.pricingModel} onValueChange={(v) => setForm({ ...form, pricingModel: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_MODEL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de revenue *</Label>
                <Select value={form.revenueType} onValueChange={(v) => setForm({ ...form, revenueType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Risk engine inputs */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Inputs para motor de riesgo</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Cash en caja (USD)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">Dinero disponible hoy. Usado para calcular runway. NULL = RunwayFactor no se calcula.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={form.cashOnHand}
                  onChange={(e) => setForm({ ...form, cashOnHand: e.target.value })}
                  placeholder="Ej: 50000"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>% revenue del cliente principal</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">{"Concentración: ≤20% bajo riesgo, >80% riesgo crítico. NULL = no se calcula R1.4."}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.topClientPercent}
                  onChange={(e) => setForm({ ...form, topClientPercent: e.target.value })}
                  placeholder="Ej: 35"
                />
              </div>
            </div>
          </div>

          {/* Additional metrics */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Métricas adicionales (opcionales)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ticket promedio (USD)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.avgTicket}
                  onChange={(e) => setForm({ ...form, avgTicket: e.target.value })}
                  placeholder="Ej: 299"
                />
              </div>

              <div className="space-y-1.5">
                <Label>CAC estimado (USD)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.cacEstimate}
                  onChange={(e) => setForm({ ...form, cacEstimate: e.target.value })}
                  placeholder="Ej: 150"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Margen bruto objetivo (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.grossMargin}
                  onChange={(e) => setForm({ ...form, grossMargin: e.target.value })}
                  placeholder="Ej: 70"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ciclo de venta (días)</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.salesCycleDays}
                  onChange={(e) => setForm({ ...form, salesCycleDays: e.target.value })}
                  placeholder="Ej: 30"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving || !form.modelType} size="sm">
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar perfil
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
