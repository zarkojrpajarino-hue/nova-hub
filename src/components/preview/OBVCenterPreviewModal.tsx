/**
 * OBVCenterPreviewModal — Orchestrator (V5.5.1)
 *
 * Refactored from 1397 LOC monolith. Now imports:
 * - Demo data from src/data/obvCenterDemoData.ts
 * - State logic from useOBVPreviewState hook
 * - List rendering from OBVPreviewList sub-component
 * - Detail view from OBVPreviewDetail sub-component
 */

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  DollarSign,
  Zap,
} from 'lucide-react';

import { getDemoOBVs } from '@/data/obvCenterDemoData';
import { useOBVPreviewState } from '@/hooks/useOBVPreviewState';
import { OBVPreviewList, getStatusColor, getStatusIcon, getImpactColor } from './OBVPreviewList';
import { OBVPreviewDetail } from './OBVPreviewDetail';

interface OBVCenterPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OBVCenterPreviewModal({ open, onOpenChange }: OBVCenterPreviewModalProps) {
  const { t } = useTranslation();
  const demoOBVs = useMemo(() => getDemoOBVs(t), [t]);
  const state = useOBVPreviewState(demoOBVs);

  const renderSlide = () => {
    switch (state.currentSlide) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 px-12">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-6 rounded-2xl">
              <Target className="h-20 w-20 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{t('preview.centroObvs')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl">{t('preview.hubCentralDeObjetivos')}</p>
            <div className="grid grid-cols-4 gap-6 mt-8 w-full max-w-3xl">
              <StatBox color="green" value={state.stats.total} label={t('preview.obvsTotales')} />
              <StatBox color="blue" value={state.stats.inProgress} label={t('preview.enProgreso')} />
              <StatBox color="purple" value={`${state.stats.completionRate}%`} label={t('preview.completionRate')} />
              <StatBox color="orange" value={`$${(state.stats.totalRevenue / 1000000).toFixed(1)}M`} label={t('preview.revenueImpact')} />
            </div>
            <p className="text-sm text-gray-500 mt-8">{t('preview.gestionaObjetivosMideImpacto')}</p>
          </div>
        );

      case 1:
        return (
          <div className="overflow-auto p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Target className="h-6 w-6 text-purple-600" />{t('preview.vistaGeneralGridDe')}</h2>
              <p className="text-gray-600">{state.filteredOBVs.length} OBVs activas en la organización</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <MiniStat color="green" icon={<CheckCircle2 className="h-8 w-8 text-green-600" />} label={t('preview.completadas')} value={state.stats.completed} />
              <MiniStat color="blue" icon={<Clock className="h-8 w-8 text-blue-600" />} label={t('preview.enProgreso')} value={state.stats.inProgress} />
              <MiniStat color="gray" icon={<AlertCircle className="h-8 w-8 text-gray-600" />} label={t('preview.pendientes')} value={state.stats.pending} />
              <MiniStat color="red" icon={<AlertCircle className="h-8 w-8 text-red-600" />} label={t('preview.enRiesgo')} value={state.stats.atRisk} />
            </div>
            <OBVPreviewList
              obvs={state.filteredOBVs}
              hoveredOBV={state.hoveredOBV}
              onHover={state.setHoveredOBV}
              onSelect={(obv) => { state.setSelectedOBV(obv); state.setCurrentSlide(3); }}
              maxItems={8}
              layout="grid"
            />
          </div>
        );

      case 2:
        return (
          <div className="overflow-auto p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Filter className="h-6 w-6 text-purple-600" />{t('preview.filtrosAvanzados')}</h2>
              <p className="text-gray-600">{t('preview.filtraYEncuentraObvs')}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200 mb-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={t('preview.buscarObvsPorTítulo')}
                  value={state.searchQuery}
                  onChange={(e) => state.setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FilterSelect label={t('preview.estado')} value={state.filters.status} onChange={(v) => state.setFilters({ ...state.filters, status: v })}
                  options={[{ value: 'all', label: t('preview.todosLosEstados') }, { value: 'completed', label: t('preview.completadas') }, { value: 'in-progress', label: t('preview.enProgreso') }, { value: 'pending', label: t('preview.pendientes') }, { value: 'at-risk', label: t('preview.enRiesgo') }]} />
                <FilterSelect label={t('preview.impacto')} value={state.filters.impact} onChange={(v) => state.setFilters({ ...state.filters, impact: v })}
                  options={[{ value: 'all', label: t('preview.todosLosImpactos') }, { value: 'high', label: t('preview.alto') }, { value: 'medium', label: t('preview.medio') }, { value: 'low', label: t('preview.bajo') }]} />
                <FilterSelect label={t('preview.owner')} value={state.filters.owner} onChange={(v) => state.setFilters({ ...state.filters, owner: v })}
                  options={[{ value: 'all', label: t('preview.todosLosOwners') }, ...Array.from(new Set(demoOBVs.map((o) => o.owner))).map((o) => ({ value: o, label: o }))]} />
                <FilterSelect label={t('preview.proyecto')} value={state.filters.project} onChange={(v) => state.setFilters({ ...state.filters, project: v })}
                  options={[{ value: 'all', label: t('preview.todosLosProyectos') }, ...Array.from(new Set(demoOBVs.map((o) => o.project))).map((p) => ({ value: p, label: p }))]} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-purple-700 font-medium">{state.filteredOBVs.length} resultados encontrados</div>
                <Button variant="outline" size="sm" onClick={() => { state.setFilters({ status: 'all', owner: 'all', project: 'all', impact: 'all' }); state.setSearchQuery(''); }}>{t('preview.limpiarFiltros')}</Button>
              </div>
            </div>
            <OBVPreviewList obvs={state.filteredOBVs} hoveredOBV={null} onHover={() => {}} onSelect={(obv) => { state.setSelectedOBV(obv); state.setCurrentSlide(3); }} maxItems={6} layout="list" />
          </div>
        );

      case 3:
        return <OBVPreviewDetail obv={state.selectedOBV || demoOBVs[0]} onBack={() => state.setCurrentSlide(1)} />;

      case 4:
        return <TimelineSlide obvs={demoOBVs} stats={state.stats} onSelect={(obv) => { state.setSelectedOBV(obv); state.setCurrentSlide(3); }} t={t} />;

      case 5:
        return <AnalyticsSlide obvs={demoOBVs} stats={state.stats} t={t} />;

      case 6:
        return <CreateOBVSlide newOBV={state.newOBV} setNewOBV={state.setNewOBV} obvs={demoOBVs} t={t} />;

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>{t('preview.centroObvsPreview')}</DialogTitle>
          <DialogDescription>{t('preview.interactivePreviewOfThe')}</DialogDescription>
        </VisuallyHidden>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden max-h-[calc(90vh-180px)]">{renderSlide()}</div>
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={state.prevSlide} disabled={state.currentSlide === 0} className="gap-2">
                <ChevronLeft className="h-4 w-4" />{t('preview.anterior')}
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: state.totalSlides }).map((_, idx) => (
                  <button key={idx} onClick={() => state.setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all ${idx === state.currentSlide ? 'w-8 bg-gradient-to-r from-purple-600 to-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'}`} />
                ))}
              </div>
              <Button variant="outline" onClick={state.currentSlide === state.totalSlides - 1 ? () => onOpenChange(false) : state.nextSlide} className="gap-2">
                {state.currentSlide === state.totalSlides - 1 ? 'Finalizar' : t('preview.siguiente')}
                {state.currentSlide === state.totalSlides - 1 ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Small helper components ──────────────────────────────────────────────────

function StatBox({ color, value, label }: { color: string; value: string | number; label: string }) {
  return (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-6 rounded-xl border border-${color}-200`}>
      <div className={`text-3xl font-bold text-${color}-700`}>{value}</div>
      <div className={`text-sm text-${color}-600 mt-1`}>{label}</div>
    </div>
  );
}

function MiniStat({ color, icon, label, value }: { color: string; icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-sm text-${color}-600`}>{label}</div>
          <div className={`text-2xl font-bold text-${color}-700`}>{value}</div>
        </div>
        {icon}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function TimelineSlide({ obvs, stats, onSelect, t }: { obvs: typeof import('@/data/obvCenterDemoData').getDemoOBVs extends (...a: never[]) => infer R ? R : never; stats: { inProgress: number; avgProgress: number }; onSelect: (obv: (typeof obvs)[0]) => void; t: ReturnType<typeof useTranslation>['t'] }) {
  const sorted = [...obvs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  return (
    <div className="overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Calendar className="h-6 w-6 text-purple-600" />{t('preview.timelineDeObvs')}</h2>
        <p className="text-gray-600">{t('preview.evoluciónTemporalDeObjetivos')}</p>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center"><div className="text-3xl font-bold text-purple-700">Q1 2025</div><div className="text-sm text-purple-600 mt-1">{t('preview.períodoActual')}</div></div>
          <div className="text-center"><div className="text-3xl font-bold text-blue-700">{stats.inProgress}</div><div className="text-sm text-blue-600 mt-1">{t('preview.obvsActivas')}</div></div>
          <div className="text-center"><div className="text-3xl font-bold text-green-700">{stats.avgProgress}%</div><div className="text-sm text-green-600 mt-1">{t('preview.progresoPromedio')}</div></div>
        </div>
      </div>
      <div className="space-y-3">
        {sorted.slice(0, 10).map((obv) => (
          <div key={obv.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer" onClick={() => onSelect(obv)}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">{obv.ownerAvatar}</div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{obv.title}</div>
                  <Badge className={getStatusColor(obv.status)}>{getStatusIcon(obv.status)}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{obv.startDate} - {obv.endDate}</div>
                  <div>{obv.project}</div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: `${obv.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsSlide({ obvs, stats, t }: { obvs: ReturnType<typeof getDemoOBVs>; stats: { completionRate: number; avgProgress: number; inProgress: number; atRisk: number; totalRevenue: number }; t: ReturnType<typeof useTranslation>['t'] }) {
  return (
    <div className="overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><BarChart3 className="h-6 w-6 text-purple-600" />{t('preview.analyticsDeObvs')}</h2>
        <p className="text-gray-600">{t('preview.métricasDeImpactoY')}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatBox color="green" value={`${stats.completionRate}%`} label={t('preview.completionRate')} />
        <StatBox color="purple" value={`${stats.avgProgress}%`} label={t('preview.progresoPromedio10')} />
        <StatBox color="blue" value={stats.inProgress} label={t('preview.obvsActivas11')} />
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-orange-600" />{t('preview.revenueImpact')}</h3>
          <Badge className="bg-orange-500 text-white">Q1 2025</Badge>
        </div>
        <div className="text-5xl font-bold text-orange-700 mb-2">${(stats.totalRevenue / 1000000).toFixed(2)}M</div>
        <div className="text-sm text-orange-600">{t('preview.impactoTotalEnRevenue')}</div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-purple-600" />{t('preview.topPerformers')}</h3>
          <div className="space-y-3">
            {[t('preview.sarahChen'), t('preview.marcusRodriguez'), t('preview.jenniferDavis'), t('preview.patriciaWilson')].map((name, idx) => {
              const obvCount = obvs.filter(o => o.owner === name).length;
              const completed = obvs.filter(o => o.owner === name && o.status === 'completed').length;
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{name.split(' ').map(n => n[0]).join('')}</div>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <div className="text-sm text-gray-600">{completed}/{obvCount} completadas</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-purple-600" />{t('preview.porProyecto')}</h3>
          <div className="space-y-3">
            {Array.from(new Set(obvs.map(o => o.project))).slice(0, 4).map((project, idx) => {
              const count = obvs.filter(o => o.project === project).length;
              const avg = Math.round(obvs.filter(o => o.project === project).reduce((s, o) => s + o.progress, 0) / count);
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{project}</span><span className="text-sm text-gray-600">{avg}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: `${avg}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateOBVSlide({ newOBV, setNewOBV, obvs, t }: { newOBV: { title: string; description: string; project: string; impact: string }; setNewOBV: (v: typeof newOBV) => void; obvs: ReturnType<typeof getDemoOBVs>; t: ReturnType<typeof useTranslation>['t'] }) {
  return (
    <div className="overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Plus className="h-6 w-6 text-purple-600" />Crear Nueva OBV</h2>
        <p className="text-gray-600">{t('preview.defineUnNuevoObjetivo')}</p>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-xl border border-purple-200">
        <div className="space-y-6">
          <div><Label htmlFor="title" className="text-sm font-medium mb-2 block">Titulo del OBV</Label>
            <Input id="title" placeholder={t('preview.ejAumentarTasaDe')} value={newOBV.title} onChange={(e) => setNewOBV({ ...newOBV, title: e.target.value })} className="bg-white" /></div>
          <div><Label htmlFor="description" className="text-sm font-medium mb-2 block">{t('preview.descripción')}</Label>
            <Textarea id="description" placeholder={t('preview.describeElObjetivoContexto')} value={newOBV.description} onChange={(e) => setNewOBV({ ...newOBV, description: e.target.value })} rows={4} className="bg-white" /></div>
          <div className="grid grid-cols-2 gap-4">
            <FilterSelect label={t('preview.proyecto')} value={newOBV.project} onChange={(v) => setNewOBV({ ...newOBV, project: v })}
              options={[{ value: '', label: t('preview.seleccionarProyecto') }, { value: t('preview.salesExcellence21'), label: t('preview.salesExcellence') }, { value: t('preview.customerSuccess22'), label: t('preview.customerSuccess') }, { value: t('preview.productInnovation23'), label: t('preview.productInnovation') }]} />
            <FilterSelect label={t('preview.impactoEsperado')} value={newOBV.impact} onChange={(v) => setNewOBV({ ...newOBV, impact: v })}
              options={[{ value: 'high', label: t('preview.alto') }, { value: 'medium', label: t('preview.medio') }, { value: 'low', label: t('preview.bajo') }]} />
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-600" />Key Results (Resultados Clave)</h4>
            <div className="space-y-2">
              <Input placeholder={t('preview.keyResult1')} className="text-sm" />
              <Input placeholder={t('preview.keyResult2')} className="text-sm" />
              <Input placeholder={t('preview.keyResult3')} className="text-sm" />
            </div>
            <Button variant="outline" size="sm" className="mt-2"><Plus className="h-4 w-4 mr-1" />{t('preview.agregarKeyResult')}</Button>
          </div>
          <div className="flex gap-3 pt-4">
            <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"><Plus className="h-4 w-4 mr-2" />Crear OBV</Button>
            <Button variant="outline" className="flex-1">{t('preview.cancelar')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
