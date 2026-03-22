/**
 * VALIDACIONES VIEW - Enterprise Edition
 *
 * Sistema de validación peer-to-peer para OBVs y KPIs.
 * Recibe experimentos de Proyectos y genera OBVs validadas.
 */

import { useState } from 'react';
import { CheckCircle, Shield, History, AlertCircle, Loader2, X } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OBVValidationList } from '@/components/nova/OBVValidationList';
import { KPIValidationList } from '@/components/kpi/KPIValidationList';
import { HowItWorks } from '@/components/ui/how-it-works';
import { HelpWidget } from '@/components/ui/section-help';
import { BlockedBanner } from '@/components/validation/BlockedBanner';
import { ValidacionesPreviewModal } from '@/components/preview/ValidacionesPreviewModal';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { useTranslation } from 'react-i18next';
interface ValidacionesViewProps {
  onNewOBV?: () => void;
}

export function ValidacionesView({ onNewOBV }: ValidacionesViewProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('obvs');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Contar validaciones pendientes de OBVs
  const { data: pendingOBVs = [] } = useQuery({
    queryKey: ['pending_obvs', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('obvs')
        .select(`
          id,
          titulo,
          tipo,
          status,
          obv_validaciones(validator_id)
        `)
        .eq('status', 'pending')
        .neq('owner_id', profile.id);

      if (error) throw error;

      // Filtrar solo las que NO han sido validadas por el usuario actual
      return data?.filter(obv => {
        const hasUserValidation = obv.obv_validaciones?.some(
          (v: { validator_id: string }) => v.validator_id === profile.id
        );
        return !hasUserValidation;
      }) || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 30000, // Refetch cada 30 segundos
  });

  // Contar validaciones pendientes de KPIs
  const { data: pendingKPIs = [] } = useQuery({
    queryKey: ['pending_kpis', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('kpis')
        .select(`
          id,
          titulo,
          type,
          status,
          kpi_validaciones(validator_id)
        `)
        .eq('status', 'pending')
        .neq('owner_id', profile.id);

      if (error) throw error;

      // Filtrar solo las que NO han sido validadas por el usuario actual
      return data?.filter(kpi => {
        const hasUserValidation = kpi.kpi_validaciones?.some(
          (v: { validator_id: string }) => v.validator_id === profile.id
        );
        return !hasUserValidation;
      }) || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 30000,
  });

  // Historial de validaciones realizadas por el usuario
  const { data: validationHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['validation_history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const [obvValidations, kpiValidations] = await Promise.all([
        // OBVs validadas
        supabase
          .from('obv_validaciones')
          .select(`
            id,
            approved,
            comentario,
            created_at,
            obv:obvs(titulo, tipo, owner:members(nombre))
          `)
          .eq('validator_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20),

        // KPIs validados
        supabase
          .from('kpi_validaciones')
          .select(`
            id,
            approved,
            comentario,
            created_at,
            kpi:kpis(titulo, type, owner:members(nombre))
          `)
          .eq('validator_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      // Combinar y ordenar por fecha
      const combined = [
        ...(obvValidations.data || []).map(v => ({
          ...v,
          item_type: 'OBV' as const,
          item: v.obv,
        })),
        ...(kpiValidations.data || []).map(v => ({
          ...v,
          item_type: 'KPI' as const,
          item: v.kpi,
        })),
      ].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return combined;
    },
    enabled: !!profile?.id,
  });

  const numPendingOBVs = pendingOBVs.length;
  const numPendingKPIs = pendingKPIs.length;
  const totalPending = numPendingOBVs + numPendingKPIs;

  return (
    <>
      <NovaHeader
        title={t('validaciones.validaciones')}
        subtitle={t('validaciones.validaTuIdeaCon')}
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8 space-y-6">
        {/* How it works */}
        <HowItWorks
          title={t('validaciones.cómoFunciona')}
          description={t('validaciones.validaTuStartupCon')}
          whatIsIt={t('validaciones.sistemaDeValidaciónPeertopeer')}
          dataInputs={[
            {
              from: t('validaciones.proyectos'),
              items: [
                'Experimentos de validación sugeridos por IA',
                'Hipótesis a testear (Ej: "Clientes pagarían $X")',
                t('validaciones.criteriosDeÉxitoPredefinidos'),
              ],
            },
          ]}
          dataOutputs={[
            {
              to: t('validaciones.centroObvs'),
              items: [
                t('validaciones.obvsValidadasYAprobadas'),
                'Objetivos concretos (Ej: "100 leads en 2 semanas")',
                t('validaciones.tareasEspecíficasParaEjecutar'),
              ],
            },
            {
              to: t('validaciones.kpis0'),
              items: [
                t('validaciones.métricasATrackear'),
                t('validaciones.criteriosDeÉxitofallo'),
                t('validaciones.dashboardDeProgreso'),
              ],
            },
            {
              to: t('validaciones.decisiones'),
              items: [
                t('validaciones.datosParaDecidirPivotar'),
                t('validaciones.aprendizajesValidados'),
                t('validaciones.próximosExperimentos'),
              ],
            },
          ]}
          nextStep={{
            action: t('validaciones.creaObvsBasadasEn'),
            destination: t('validaciones.veACentroObvs'),
          }}
          onViewPreview={() => setShowPreviewModal(true)}
        />

        {/* Blocked Banner */}
        <BlockedBanner />

        {/* Summary Card */}
        <div className="mb-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Shield size={28} className="text-purple-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{totalPending}</h3>
                <p className="text-sm text-muted-foreground">{t('validaciones.validacionesPendientes')}</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-500">{numPendingOBVs}</p>
                <p className="text-xs text-muted-foreground">{t('validaciones.obvs')}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-pink-500">{numPendingKPIs}</p>
                <p className="text-xs text-muted-foreground">{t('validaciones.kpis')}</p>
              </div>
            </div>
          </div>

          {totalPending > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle size={16} />
              <span>Tienes {totalPending} validaciones esperando tu revisión</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="obvs" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              OBVs
              {numPendingOBVs > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-purple-500 text-white">
                  {numPendingOBVs}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="kpis" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              KPIs
              {numPendingKPIs > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-pink-500 text-white">
                  {numPendingKPIs}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="historial" className="flex items-center gap-2">
              <History className="w-4 h-4" />{t('validaciones.historial')}</TabsTrigger>
          </TabsList>

          {/* Tab: OBVs Pendientes */}
          <TabsContent value="obvs" className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{t('validaciones.obvsPendientesDeValidar')}</h3>
              <p className="text-sm text-muted-foreground">{t('validaciones.revisaYValidaLas')}</p>
            </div>
            <OBVValidationList />
          </TabsContent>

          {/* Tab: KPIs Pendientes */}
          <TabsContent value="kpis" className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{t('validaciones.kpisPendientesDeValidar')}</h3>
              <p className="text-sm text-muted-foreground">{t('validaciones.revisaYValidaLos')}</p>
            </div>
            <KPIValidationList />
          </TabsContent>

          {/* Tab: Historial */}
          <TabsContent value="historial" className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{t('validaciones.historialDeValidaciones')}</h3>
              <p className="text-sm text-muted-foreground">{t('validaciones.últimas20ValidacionesQue')}</p>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : validationHistory.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">{t('validaciones.sinHistorial')}</h4>
                <p className="text-sm text-muted-foreground">{t('validaciones.aúnNoHasRealizado')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {validationHistory.map((validation) => (
                  <div
                    key={validation.id}
                    className="bg-card border border-border rounded-xl p-4 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
                            {validation.item_type}
                          </span>
                          {validation.approved ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <X className="w-4 h-4 text-destructive" />
                          )}
                          <span className={`text-sm font-medium ${
                            validation.approved ? 'text-success' : 'text-destructive'
                          }`}>
                            {validation.approved ? 'Aprobado': t('validaciones.rechazado')}
                          </span>
                        </div>

                        <h4 className="font-semibold mb-1">
                          {validation.item?.[0]?.titulo || t('validaciones.sinTítulo')}
                        </h4>

                        <p className="text-sm text-muted-foreground mb-2">
                          {validation.item_type === 'OBV'
                            ? `Tipo: ${validation.item?.[0]?.tipo}`
                            : `Tipo: ${validation.item?.[0]?.type}`
                          } • Creado por {validation.item?.[0]?.owner?.[0]?.nombre || t('validaciones.desconocido')}
                        </p>

                        {validation.comentario && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm italic">"{validation.comentario}"</p>
                          </div>
                        )}
                      </div>

                      <div className="text-right text-xs text-muted-foreground ml-4">
                        {new Date(validation.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <HelpWidget section="validaciones" />

      <ValidacionesPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </>
  );
}
