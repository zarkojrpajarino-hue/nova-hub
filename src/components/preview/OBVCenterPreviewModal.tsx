import React, { useState } from 'react';
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
  Eye,
  MessageSquare,
  Paperclip,
} from 'lucide-react';

interface OBVCenterPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type OBVStatus = 'completed' | 'in-progress' | 'pending' | 'at-risk';

interface OBV {
  id: string;
  title: string;
  description: string;
  owner: string;
  ownerAvatar: string;
  status: OBVStatus;
  progress: number;
  project: string;
  startDate: string;
  endDate: string;
  impact: 'high' | 'medium' | 'low';
  revenue: number;
  keyResults: string[];
  evidence: number;
  comments: number;
  team: string[];
}

const DEMO_OBVS: OBV[] = [
  {
    id: 'OBV-001',
    title: t('preview.aumentarTasaDeConversión'),
    description: t('preview.incrementarLaConversiónDe'),
    owner: t('preview.sarahChen'),
    ownerAvatar: 'SC',
    status: 'completed',
    progress: 100,
    project: t('preview.salesExcellence21'),
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    impact: 'high',
    revenue: 450000,
    keyResults: ['Conversión alcanzó 19.2%', 'ROI +34%', '127 nuevos clientes'],
    evidence: 8,
    comments: 24,
    team: ['SC', 'MR', 'JD'],
  },
  {
    id: 'OBV-002',
    title: t('preview.reducirTiempoDeOnboarding'),
    description: t('preview.disminuirElTiempoDe'),
    owner: t('preview.marcusRodriguez'),
    ownerAvatar: 'MR',
    status: 'in-progress',
    progress: 68,
    project: t('preview.customerSuccess22'),
    startDate: '2025-01-15',
    endDate: '2025-03-15',
    impact: 'high',
    revenue: 280000,
    keyResults: [t('preview.promedioActual31Días'), t('preview.nps12Puntos'), '89% satisfacción'],
    evidence: 5,
    comments: 18,
    team: ['MR', 'LK', 'TC'],
  },
  {
    id: 'OBV-003',
    title: t('preview.lanzarPlataformaDeAnalytics'),
    description: t('preview.desarrollarYLanzarMódulo'),
    owner: t('preview.jenniferDavis'),
    ownerAvatar: 'JD',
    status: 'in-progress',
    progress: 45,
    project: t('preview.productInnovation23'),
    startDate: '2025-01-10',
    endDate: '2025-04-30',
    impact: 'high',
    revenue: 820000,
    keyResults: ['MVP completado 70%', '15 beta testers activos', 'Feedback 4.6/5'],
    evidence: 12,
    comments: 47,
    team: ['JD', 'AK', 'BW', 'MH'],
  },
  {
    id: 'OBV-004',
    title: 'Expandir operaciones LATAM',
    description: t('preview.establecerPresenciaEn5'),
    owner: t('preview.lauraKim'),
    ownerAvatar: 'LK',
    status: 'in-progress',
    progress: 30,
    project: t('preview.internationalGrowth'),
    startDate: '2025-02-01',
    endDate: '2025-06-30',
    impact: 'high',
    revenue: 1200000,
    keyResults: ['3 oficinas abiertas', '12 contrataciones realizadas', 'Pipeline $2.4M'],
    evidence: 6,
    comments: 31,
    team: ['LK', 'RP', 'CM'],
  },
  {
    id: 'OBV-005',
    title: t('preview.optimizarCostosOperativos'),
    description: t('preview.reducirCostosOperativosEn'),
    owner: t('preview.thomasCooper'),
    ownerAvatar: 'TC',
    status: 'completed',
    progress: 100,
    project: t('preview.operations24'),
    startDate: '2024-11-01',
    endDate: '2025-01-31',
    impact: 'medium',
    revenue: 340000,
    keyResults: ['Reducción 17.3%', 'Ahorro $340K', 'Eficiencia +22%'],
    evidence: 9,
    comments: 15,
    team: ['TC', 'NK'],
  },
  {
    id: 'OBV-006',
    title: t('preview.implementarProgramaDeReferidos'),
    description: t('preview.crearProgramaDeReferidos'),
    owner: t('preview.amandaKing'),
    ownerAvatar: 'AK',
    status: 'in-progress',
    progress: 55,
    project: t('preview.marketingGrowth25'),
    startDate: '2025-01-20',
    endDate: '2025-03-31',
    impact: 'medium',
    revenue: 180000,
    keyResults: ['142 referidos activos', 'Conversión 24%', '34 nuevos clientes'],
    evidence: 4,
    comments: 21,
    team: ['AK', 'DL'],
  },
  {
    id: 'OBV-007',
    title: t('preview.mejorarEngagementDelProducto'),
    description: t('preview.aumentarDaumauRatioDe'),
    owner: t('preview.brianWalker'),
    ownerAvatar: 'BW',
    status: 'at-risk',
    progress: 25,
    project: t('preview.productInnovation23'),
    startDate: '2025-01-05',
    endDate: '2025-02-28',
    impact: 'high',
    revenue: 0,
    keyResults: ['DAU/MAU: 0.38', 'Churn -3%', '5 features lanzadas'],
    evidence: 3,
    comments: 29,
    team: ['BW', 'JD', 'SM'],
  },
  {
    id: 'OBV-008',
    title: 'Certificación ISO 27001',
    description: t('preview.obtenerCertificaciónDeSeguridad'),
    owner: t('preview.ninaKumar'),
    ownerAvatar: 'NK',
    status: 'in-progress',
    progress: 72,
    project: t('preview.securityCompliance'),
    startDate: '2024-12-01',
    endDate: '2025-03-31',
    impact: 'high',
    revenue: 650000,
    keyResults: [t('preview.auditoríaFase2Completada'), '94% controles implementados', t('preview.certificaciónMarzo')],
    evidence: 11,
    comments: 19,
    team: ['NK', 'TC', 'RP'],
  },
  {
    id: 'OBV-009',
    title: t('preview.desarrollarAppMóvilNativa'),
    description: t('preview.crearAppsNativasIos'),
    owner: t('preview.samuelMartinez'),
    ownerAvatar: 'SM',
    status: 'in-progress',
    progress: 40,
    project: t('preview.productInnovation23'),
    startDate: '2025-01-15',
    endDate: '2025-05-31',
    impact: 'high',
    revenue: 580000,
    keyResults: ['iOS beta lista', t('preview.android60Completado'), '200 beta testers'],
    evidence: 7,
    comments: 34,
    team: ['SM', 'BW', 'MH'],
  },
  {
    id: 'OBV-010',
    title: t('preview.partnershipEstratégicoConSalesforce'),
    description: t('preview.establecerPartnershipOficialE'),
    owner: t('preview.rachelPark'),
    ownerAvatar: 'RP',
    status: 'pending',
    progress: 10,
    project: t('preview.strategicPartnerships'),
    startDate: '2025-02-15',
    endDate: '2025-06-30',
    impact: 'high',
    revenue: 950000,
    keyResults: [t('preview.conversacionesIniciadas'), t('preview.technicalDiscoveryCompletado'), t('preview.propuestaEnviada')],
    evidence: 2,
    comments: 8,
    team: ['RP', 'LK'],
  },
  {
    id: 'OBV-011',
    title: t('preview.lanzarAcademyDeCapacitación'),
    description: t('preview.crearPlataformaDeCapacitación'),
    owner: t('preview.dianaLopez'),
    ownerAvatar: 'DL',
    status: 'in-progress',
    progress: 58,
    project: t('preview.customerSuccess22'),
    startDate: '2025-01-10',
    endDate: '2025-03-31',
    impact: 'medium',
    revenue: 120000,
    keyResults: ['8 cursos publicados', '350 estudiantes activos', 'Rating 4.7/5'],
    evidence: 6,
    comments: 22,
    team: ['DL', 'MR', 'AK'],
  },
  {
    id: 'OBV-012',
    title: t('preview.implementarAiCopilot'),
    description: t('preview.integrarAsistenteAiPara'),
    owner: t('preview.carlosMartinez'),
    ownerAvatar: 'CM',
    status: 'in-progress',
    progress: 35,
    project: t('preview.aiInnovation'),
    startDate: '2025-01-20',
    endDate: '2025-04-30',
    impact: 'high',
    revenue: 480000,
    keyResults: ['3 casos de uso activos', t('preview.ahorro120hmes'), 'Adopción 45%'],
    evidence: 5,
    comments: 38,
    team: ['CM', 'JD', 'BW'],
  },
  {
    id: 'OBV-013',
    title: t('preview.rediseñarExperienciaDeCheckout'),
    description: 'Optimizar proceso de checkout reduciendo abandono del 28% al 15%',
    owner: t('preview.mariaHernandez'),
    ownerAvatar: 'MH',
    status: 'completed',
    progress: 100,
    project: t('preview.ecommerce'),
    startDate: '2024-12-15',
    endDate: '2025-01-31',
    impact: 'high',
    revenue: 380000,
    keyResults: ['Abandono bajó a 14.2%', 'Conversión +18%', 'Revenue +$380K'],
    evidence: 10,
    comments: 27,
    team: ['MH', 'BW', 'SM'],
  },
  {
    id: 'OBV-014',
    title: t('preview.programaDeDiversityInclusion'),
    description: t('preview.aumentarDiversidadEnLeadership'),
    owner: t('preview.alexJohnson'),
    ownerAvatar: 'AJ',
    status: 'in-progress',
    progress: 50,
    project: t('preview.peopleCulture'),
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    impact: 'medium',
    revenue: 0,
    keyResults: ['Diversidad actual: 32%', '8 nuevos líderes', 'Engagement +15%'],
    evidence: 4,
    comments: 12,
    team: ['AJ', 'LK'],
  },
  {
    id: 'OBV-015',
    title: t('preview.migraciónAArquitecturaCloudnative'),
    description: t('preview.migrarInfraestructuraLegacyA'),
    owner: t('preview.kevinZhang'),
    ownerAvatar: 'KZ',
    status: 'in-progress',
    progress: 65,
    project: t('preview.infrastructure'),
    startDate: '2024-11-01',
    endDate: '2025-03-31',
    impact: 'high',
    revenue: 0,
    keyResults: ['12/18 servicios migrados', 'Uptime 99.97%', 'Latency -40%'],
    evidence: 9,
    comments: 41,
    team: ['KZ', 'NK', 'SM'],
  },
  {
    id: 'OBV-016',
    title: 'Expansion canal B2B2C',
    description: t('preview.lanzarEstrategiaB2b2cCon'),
    owner: t('preview.emmaWhite'),
    ownerAvatar: 'EW',
    status: 'pending',
    progress: 5,
    project: t('preview.businessDevelopment'),
    startDate: '2025-03-01',
    endDate: '2025-08-31',
    impact: 'high',
    revenue: 740000,
    keyResults: ['Pipeline inicial: $1.2M', '4 partners en conversación', t('preview.modeloDefinido')],
    evidence: 1,
    comments: 6,
    team: ['EW', 'RP'],
  },
  {
    id: 'OBV-017',
    title: t('preview.optimizarSeoYContenido'),
    description: t('preview.aumentarTráficoOrgánico150'),
    owner: t('preview.oliverBrown'),
    ownerAvatar: 'OB',
    status: 'in-progress',
    progress: 48,
    project: t('preview.marketingGrowth25'),
    startDate: '2025-01-05',
    endDate: '2025-04-30',
    impact: 'medium',
    revenue: 220000,
    keyResults: ['Tráfico +87%', '45 artículos publicados', 'DA score 52 -> 61'],
    evidence: 8,
    comments: 16,
    team: ['OB', 'AK', 'DL'],
  },
  {
    id: 'OBV-018',
    title: t('preview.implementarProgramaDeFeedback'),
    description: t('preview.sistema360DeFeedback'),
    owner: t('preview.sophiaTurner'),
    ownerAvatar: 'ST',
    status: 'completed',
    progress: 100,
    project: t('preview.peopleCulture'),
    startDate: '2024-12-01',
    endDate: '2025-01-31',
    impact: 'medium',
    revenue: 0,
    keyResults: ['Participación 94%', 'eNPS +18 puntos', 'Retención +8%'],
    evidence: 7,
    comments: 20,
    team: ['ST', 'AJ'],
  },
  {
    id: 'OBV-019',
    title: t('preview.desarrollarMarketplaceDeIntegraciones'),
    description: t('preview.crearMarketplaceCon50'),
    owner: t('preview.davidLee'),
    ownerAvatar: 'DL2',
    status: 'in-progress',
    progress: 42,
    project: t('preview.productInnovation23'),
    startDate: '2025-01-15',
    endDate: '2025-05-31',
    impact: 'high',
    revenue: 420000,
    keyResults: ['28 integraciones activas', '1,200 instalaciones', 'Rating 4.5/5'],
    evidence: 6,
    comments: 25,
    team: ['DL2', 'JD', 'KZ'],
  },
  {
    id: 'OBV-020',
    title: t('preview.lanzarProgramaDeCustomer'),
    description: t('preview.crearComunidadDeAdvocates'),
    owner: t('preview.isabellaGarcia'),
    ownerAvatar: 'IG',
    status: 'in-progress',
    progress: 38,
    project: t('preview.customerSuccess22'),
    startDate: '2025-01-20',
    endDate: '2025-04-30',
    impact: 'medium',
    revenue: 150000,
    keyResults: ['62 advocates activos', '23 case studies', '45 referencias'],
    evidence: 5,
    comments: 14,
    team: ['IG', 'MR', 'DL'],
  },
  {
    id: 'OBV-021',
    title: t('preview.implementarPredictiveAnalytics'),
    description: t('preview.sistemaDeMlPara'),
    owner: t('preview.ryanMitchell'),
    ownerAvatar: 'RM',
    status: 'in-progress',
    progress: 52,
    project: t('preview.aiInnovation'),
    startDate: '2025-01-10',
    endDate: '2025-03-31',
    impact: 'high',
    revenue: 320000,
    keyResults: ['Accuracy actual: 81%', t('preview.churnPrevenido12Cuentas'), 'ROI +240%'],
    evidence: 7,
    comments: 30,
    team: ['RM', 'CM', 'JD'],
  },
  {
    id: 'OBV-022',
    title: t('preview.rediseñarSistemaDePricing'),
    description: 'Nuevo modelo de pricing value-based aumentando ACV 25%',
    owner: t('preview.victoriaChen'),
    ownerAvatar: 'VC',
    status: 'at-risk',
    progress: 30,
    project: t('preview.businessDevelopment'),
    startDate: '2025-01-15',
    endDate: '2025-02-28',
    impact: 'high',
    revenue: 890000,
    keyResults: [t('preview.modeloDefinido'), t('preview.testingCon15Clientes'), t('preview.feedbackMixto')],
    evidence: 4,
    comments: 37,
    team: ['VC', 'SC', 'RP'],
  },
  {
    id: 'OBV-023',
    title: t('preview.establecerProgramaDeSostenibilidad'),
    description: t('preview.alcanzarCarbonNeutralityY'),
    owner: t('preview.nathanGreen'),
    ownerAvatar: 'NG',
    status: 'in-progress',
    progress: 44,
    project: t('preview.corporateResponsibility'),
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    impact: 'low',
    revenue: 0,
    keyResults: ['Emisiones -28%', t('preview.auditoríaBCorpIniciada'), '100% energía renovable'],
    evidence: 6,
    comments: 11,
    team: ['NG', 'TC'],
  },
  {
    id: 'OBV-024',
    title: t('preview.lanzarEnterpriseTier'),
    description: t('preview.crearPlanEnterpriseCon'),
    owner: t('preview.patriciaWilson'),
    ownerAvatar: 'PW',
    status: 'in-progress',
    progress: 70,
    project: t('preview.productInnovation23'),
    startDate: '2024-12-01',
    endDate: '2025-02-28',
    impact: 'high',
    revenue: 1100000,
    keyResults: ['8 clientes enterprise', 'ACV promedio: $137K', 'Pipeline $3.2M'],
    evidence: 9,
    comments: 43,
    team: ['PW', 'JD', 'NK', 'MR'],
  },
];

const getStatusIcon = (status: OBVStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'in-progress':
      return <Clock className="h-4 w-4" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4" />;
    case 'at-risk':
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: OBVStatus) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'in-progress':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'pending':
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    case 'at-risk':
      return 'bg-red-500/10 text-red-700 border-red-500/20';
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    case 'low':
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  }
};

export function OBVCenterPreviewModal({ open, onOpenChange }: OBVCenterPreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoveredOBV, setHoveredOBV] = useState<string | null>(null);
  const [selectedOBV, setSelectedOBV] = useState<OBV | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    owner: 'all',
    project: 'all',
    impact: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [newOBV, setNewOBV] = useState({
    title: '',
    description: '',
    project: '',
    impact: 'medium',
  });

  const totalSlides = 7;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const filteredOBVs = DEMO_OBVS.filter((obv) => {
    if (filters.status !== 'all' && obv.status !== filters.status) return false;
    if (filters.owner !== 'all' && obv.owner !== filters.owner) return false;
    if (filters.project !== 'all' && obv.project !== filters.project) return false;
    if (filters.impact !== 'all' && obv.impact !== filters.impact) return false;
    if (searchQuery && !obv.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: DEMO_OBVS.length,
    completed: DEMO_OBVS.filter((o) => o.status === 'completed').length,
    inProgress: DEMO_OBVS.filter((o) => o.status === 'in-progress').length,
    pending: DEMO_OBVS.filter((o) => o.status === 'pending').length,
    atRisk: DEMO_OBVS.filter((o) => o.status === 'at-risk').length,
    totalRevenue: DEMO_OBVS.reduce((sum, o) => sum + o.revenue, 0),
    avgProgress: Math.round(DEMO_OBVS.reduce((sum, o) => sum + o.progress, 0) / DEMO_OBVS.length),
    completionRate: Math.round((DEMO_OBVS.filter((o) => o.status === 'completed').length / DEMO_OBVS.length) * 100),
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 px-12">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-6 rounded-2xl">
              <Target className="h-20 w-20 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{t('preview.centroObvs')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl">{t('preview.hubCentralDeObjetivos')}</p>
            <div className="grid grid-cols-4 gap-6 mt-8 w-full max-w-3xl">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div className="text-3xl font-bold text-green-700">{stats.total}</div>
                <div className="text-sm text-green-600 mt-1">{t('preview.obvsTotales')}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-700">{stats.inProgress}</div>
                <div className="text-sm text-blue-600 mt-1">{t('preview.enProgreso')}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div className="text-3xl font-bold text-purple-700">{stats.completionRate}%</div>
                <div className="text-sm text-purple-600 mt-1">{t('preview.completionRate')}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                <div className="text-3xl font-bold text-orange-700">
                  ${(stats.totalRevenue / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-orange-600 mt-1">{t('preview.revenueImpact')}</div>
              </div>
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
              <p className="text-gray-600">
                {filteredOBVs.length} OBVs activas en la organización
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600">{t('preview.completadas')}</div>
                    <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600">{t('preview.enProgreso')}</div>
                    <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">{t('preview.pendientes')}</div>
                    <div className="text-2xl font-bold text-gray-700">{stats.pending}</div>
                  </div>
                  <AlertCircle className="h-8 w-8 text-gray-600" />
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-red-600">{t('preview.enRiesgo')}</div>
                    <div className="text-2xl font-bold text-red-700">{stats.atRisk}</div>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOBVs.slice(0, 8).map((obv) => (
                <div
                  key={obv.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    hoveredOBV === obv.id
                      ? 'border-purple-400 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onMouseEnter={() => setHoveredOBV(obv.id)}
                  onMouseLeave={() => setHoveredOBV(null)}
                  onClick={() => {
                    setSelectedOBV(obv);
                    setCurrentSlide(3);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {obv.ownerAvatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{obv.title}</div>
                        <div className="text-xs text-gray-500">{obv.id}</div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(obv.status)} flex items-center gap-1`}>
                      {getStatusIcon(obv.status)}
                      <span className="capitalize text-xs">{obv.status.replace('-', ' ')}</span>
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">{t('preview.progreso')}</span>
                      <span className="font-semibold">{obv.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${obv.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {obv.evidence}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {obv.comments}
                      </div>
                    </div>
                    {obv.revenue > 0 && (
                      <Badge className={getImpactColor(obv.impact)}>
                        <DollarSign className="h-3 w-3" />
                        {obv.impact}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">{t('preview.estado')}</Label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">{t('preview.todosLosEstados')}</option>
                    <option value="completed">{t('preview.completadas')}</option>
                    <option value="in-progress">{t('preview.enProgreso')}</option>
                    <option value="pending">{t('preview.pendientes')}</option>
                    <option value="at-risk">{t('preview.enRiesgo')}</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">{t('preview.impacto')}</Label>
                  <select
                    value={filters.impact}
                    onChange={(e) => setFilters({ ...filters, impact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">{t('preview.todosLosImpactos')}</option>
                    <option value="high">{t('preview.alto')}</option>
                    <option value="medium">{t('preview.medio')}</option>
                    <option value="low">{t('preview.bajo')}</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">{t('preview.owner')}</Label>
                  <select
                    value={filters.owner}
                    onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">{t('preview.todosLosOwners')}</option>
                    {Array.from(new Set(DEMO_OBVS.map((o) => o.owner))).map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">{t('preview.proyecto')}</Label>
                  <select
                    value={filters.project}
                    onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">{t('preview.todosLosProyectos')}</option>
                    {Array.from(new Set(DEMO_OBVS.map((o) => o.project))).map((project) => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-purple-700 font-medium">
                  {filteredOBVs.length} resultados encontrados
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({ status: 'all', owner: 'all', project: 'all', impact: 'all' });
                    setSearchQuery('');
                  }}
                >{t('preview.limpiarFiltros')}</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredOBVs.slice(0, 6).map((obv) => (
                <div
                  key={obv.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedOBV(obv);
                    setCurrentSlide(3);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {obv.ownerAvatar}
                      </div>
                      <div>
                        <div className="font-semibold">{obv.title}</div>
                        <div className="text-sm text-gray-500">
                          {obv.owner} • {obv.project}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(obv.impact)}>{obv.impact}</Badge>
                      <Badge className={getStatusColor(obv.status)}>
                        {getStatusIcon(obv.status)}
                      </Badge>
                      <div className="text-sm font-semibold text-gray-700">{obv.progress}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3: {
        const obvToShow = selectedOBV || DEMO_OBVS[0];
        return (
          <div className="overflow-auto p-6">
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentSlide(1)}
                className="mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />{t('preview.volverAlGrid')}</Button>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Eye className="h-6 w-6 text-purple-600" />
                    {obvToShow.title}
                  </h2>
                  <p className="text-gray-600">{obvToShow.id}</p>
                </div>
                <Badge className={`${getStatusColor(obvToShow.status)} text-base px-4 py-1`}>
                  {getStatusIcon(obvToShow.status)}
                  <span className="ml-2 capitalize">{obvToShow.status.replace('-', ' ')}</span>
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">{t('preview.progreso')}</div>
                <div className="text-3xl font-bold text-purple-700">{obvToShow.progress}%</div>
                <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${obvToShow.progress}%` }}
                  />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-600 mb-1">{t('preview.revenueImpact')}</div>
                <div className="text-3xl font-bold text-green-700">
                  ${(obvToShow.revenue / 1000).toFixed(0)}K
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">{t('preview.impacto')}</div>
                <div className="text-3xl font-bold text-blue-700 capitalize">{obvToShow.impact}</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />{t('preview.descripción')}</h3>
              <p className="text-gray-700">{obvToShow.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />{t('preview.ownerTeam')}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {obvToShow.ownerAvatar}
                  </div>
                  <div>
                    <div className="font-semibold">{obvToShow.owner}</div>
                    <div className="text-sm text-gray-500">{t('preview.owner')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {obvToShow.team.map((member, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    >
                      {member}
                    </div>
                  ))}
                  <div className="text-sm text-gray-500">+{obvToShow.team.length} miembros</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />{t('preview.timeline')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Inicio:</span>
                    <span className="font-semibold">{obvToShow.startDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fin:</span>
                    <span className="font-semibold">{obvToShow.endDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Proyecto:</span>
                    <Badge variant="outline">{obvToShow.project}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />{t('preview.keyResults')}</h3>
              <div className="space-y-2">
                {obvToShow.keyResults.map((kr, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{kr}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 mb-1">{t('preview.evidencias')}</div>
                    <div className="text-3xl font-bold text-blue-700">{obvToShow.evidence}</div>
                  </div>
                  <Paperclip className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600 mb-1">{t('preview.comentarios')}</div>
                    <div className="text-3xl font-bold text-purple-700">{obvToShow.comments}</div>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 4: {
        const timelineData = DEMO_OBVS.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        return (
          <div className="overflow-auto p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-purple-600" />{t('preview.timelineDeObvs')}</h2>
              <p className="text-gray-600">{t('preview.evoluciónTemporalDeObjetivos')}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-700">Q1 2025</div>
                  <div className="text-sm text-purple-600 mt-1">{t('preview.períodoActual')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700">{stats.inProgress}</div>
                  <div className="text-sm text-blue-600 mt-1">{t('preview.obvsActivas')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700">{stats.avgProgress}%</div>
                  <div className="text-sm text-green-600 mt-1">{t('preview.progresoPromedio')}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {timelineData.slice(0, 10).map((obv) => (
                <div
                  key={obv.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedOBV(obv);
                    setCurrentSlide(3);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {obv.ownerAvatar}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{obv.title}</div>
                        <Badge className={getStatusColor(obv.status)}>
                          {getStatusIcon(obv.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {obv.startDate} - {obv.endDate}
                        </div>
                        <div>{obv.project}</div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${obv.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 5:
        return (
          <div className="overflow-auto p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />{t('preview.analyticsDeObvs')}</h2>
              <p className="text-gray-600">{t('preview.métricasDeImpactoY')}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-green-600">{t('preview.completionRate')}</div>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-4xl font-bold text-green-700">{stats.completionRate}%</div>
                <div className="text-xs text-green-600 mt-1">+8% vs mes anterior</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-purple-600">{t('preview.progresoPromedio10')}</div>
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-purple-700">{stats.avgProgress}%</div>
                <div className="text-xs text-purple-600 mt-1">{t('preview.enTiempoEstimado')}</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-blue-600">{t('preview.obvsActivas11')}</div>
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-blue-700">{stats.inProgress}</div>
                <div className="text-xs text-blue-600 mt-1">{stats.atRisk} en riesgo</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />{t('preview.revenueImpact')}</h3>
                <Badge className="bg-orange-500 text-white">Q1 2025</Badge>
              </div>
              <div className="text-5xl font-bold text-orange-700 mb-2">
                ${(stats.totalRevenue / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm text-orange-600">{t('preview.impactoTotalEnRevenue')}</div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="text-xs text-orange-600">{t('preview.completadas')}</div>
                  <div className="text-xl font-bold text-orange-700">
                    ${(DEMO_OBVS.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.revenue, 0) / 1000000).toFixed(2)}M
                  </div>
                </div>
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="text-xs text-orange-600">{t('preview.enProgreso14')}</div>
                  <div className="text-xl font-bold text-orange-700">
                    ${(DEMO_OBVS.filter(o => o.status === 'in-progress').reduce((sum, o) => sum + o.revenue, 0) / 1000000).toFixed(2)}M
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />{t('preview.topPerformers')}</h3>
                <div className="space-y-3">
                  {[t('preview.sarahChen'), t('preview.marcusRodriguez'), t('preview.jenniferDavis'), t('preview.patriciaWilson')].map((name, idx) => {
                    const obvCount = DEMO_OBVS.filter(o => o.owner === name).length;
                    const completed = DEMO_OBVS.filter(o => o.owner === name && o.status === 'completed').length;
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {completed}/{obvCount} completadas
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />{t('preview.porProyecto')}</h3>
                <div className="space-y-3">
                  {Array.from(new Set(DEMO_OBVS.map(o => o.project))).slice(0, 4).map((project, idx) => {
                    const obvCount = DEMO_OBVS.filter(o => o.project === project).length;
                    const avgProgress = Math.round(DEMO_OBVS.filter(o => o.project === project).reduce((sum, o) => sum + o.progress, 0) / obvCount);
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{project}</span>
                          <span className="text-sm text-gray-600">{avgProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="overflow-auto p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Plus className="h-6 w-6 text-purple-600" />
                Crear Nueva OBV
              </h2>
              <p className="text-gray-600">{t('preview.defineUnNuevoObjetivo')}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-xl border border-purple-200">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                    Título del OBV
                  </Label>
                  <Input
                    id="title"
                    placeholder={t('preview.ejAumentarTasaDe')}
                    value={newOBV.title}
                    onChange={(e) => setNewOBV({ ...newOBV, title: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium mb-2 block">{t('preview.descripción')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('preview.describeElObjetivoContexto')}
                    value={newOBV.description}
                    onChange={(e) => setNewOBV({ ...newOBV, description: e.target.value })}
                    rows={4}
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project" className="text-sm font-medium mb-2 block">{t('preview.proyecto')}</Label>
                    <select
                      id="project"
                      value={newOBV.project}
                      onChange={(e) => setNewOBV({ ...newOBV, project: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="">{t('preview.seleccionarProyecto')}</option>
                      <option value={t('preview.salesExcellence21')}>{t('preview.salesExcellence')}</option>
                      <option value={t('preview.customerSuccess22')}>{t('preview.customerSuccess')}</option>
                      <option value={t('preview.productInnovation23')}>{t('preview.productInnovation')}</option>
                      <option value={t('preview.marketingGrowth25')}>{t('preview.marketingGrowth')}</option>
                      <option value={t('preview.operations24')}>{t('preview.operations')}</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="impact" className="text-sm font-medium mb-2 block">{t('preview.impactoEsperado')}</Label>
                    <select
                      id="impact"
                      value={newOBV.impact}
                      onChange={(e) => setNewOBV({ ...newOBV, impact: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="high">{t('preview.alto')}</option>
                      <option value="medium">{t('preview.medio')}</option>
                      <option value="low">{t('preview.bajo')}</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    Key Results (Resultados Clave)
                  </h4>
                  <div className="space-y-2">
                    <Input placeholder={t('preview.keyResult1')} className="text-sm" />
                    <Input placeholder={t('preview.keyResult2')} className="text-sm" />
                    <Input placeholder={t('preview.keyResult3')} className="text-sm" />
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />{t('preview.agregarKeyResult')}</Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">{t('preview.fechaDeInicio')}</Label>
                    <Input
                      id="startDate"
                      type="date"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">{t('preview.fechaDeFin')}</Label>
                    <Input
                      id="endDate"
                      type="date"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="owner" className="text-sm font-medium mb-2 block">{t('preview.owner')}</Label>
                  <select
                    id="owner"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">{t('preview.seleccionarOwner')}</option>
                    {Array.from(new Set(DEMO_OBVS.map((o) => o.owner))).map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear OBV
                  </Button>
                  <Button variant="outline" className="flex-1">{t('preview.cancelar')}</Button>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-900 text-sm mb-1">{t('preview.tipsParaCrearObvs')}</div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Define objetivos específicos y medibles</li>
                    <li>• Establece key results cuantificables</li>
                    <li>• Asigna owners responsables</li>
                    <li>• Alinea con la estrategia organizacional</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

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
              <Button
                variant="outline"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />{t('preview.anterior')}</Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentSlide
                        ? 'w-8 bg-gradient-to-r from-purple-600 to-blue-600'
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : nextSlide}
                className="gap-2"
              >
                {currentSlide === totalSlides - 1 ? 'Finalizar': t('preview.siguiente')}
                {currentSlide === totalSlides - 1 ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}