import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  TrendingUp,
  FileCheck,
  MessageSquare,
  Star,
  Award,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Calendar,
  Target,
  Zap,
  BarChart3
} from "lucide-react";

interface ValidacionesPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationItem {
  id: string;
  obviTitle: string;
  creator: string;
  creatorAvatar: string;
  department: string;
  impact: "high" | "medium" | "low";
  status: "pending" | "approved" | "rejected";
  daysOpen: number;
  description: string;
  evidences: string[];
  expectedResults: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ValidationHistory {
  id: string;
  obviTitle: string;
  validator: string;
  validatorAvatar: string;
  status: "approved" | "rejected";
  date: string;
  comment: string;
  rating: number;
}

const VALIDATION_QUEUE: ValidationItem[] = [
  {
    id: "VAL-2024-089",
    obviTitle: t('preview.automatizaciónDeReportesFinancieros'),
    creator: t('preview.maríaGarcía'),
    creatorAvatar: "MG",
    department: t('preview.finanzas'),
    impact: "high",
    status: "pending",
    daysOpen: 2,
    description: t('preview.implementéUnSistemaAutomatizado'),
    evidences: [
      t('preview.scriptPythonDocumentado'),
      t('preview.dashboardPowerBiInteractivo'),
      t('preview.manualDeUsuario'),
      t('preview.comparativaAntesdespués')
    ],
    expectedResults: t('preview.reducciónDe90En')
  },
  {
    id: "VAL-2024-087",
    obviTitle: t('preview.optimizaciónProcesoOnboardingClientes'),
    creator: t('preview.carlosRuiz'),
    creatorAvatar: "CR",
    department: t('preview.ventas'),
    impact: "high",
    status: "pending",
    daysOpen: 1,
    description: t('preview.rediseñéElFlujoDe'),
    evidences: [t('preview.checklistDigital'), t('preview.métricasDeSatisfacción'), t('preview.templatesAutomatizados')],
    expectedResults: t('preview.tiempoDeOnboardingReducido')
  },
  {
    id: "VAL-2024-085",
    obviTitle: t('preview.sistemaDeFeedbackEn'),
    creator: t('preview.anaMartínez'),
    creatorAvatar: "AM",
    department: t('preview.soporte'),
    impact: "medium",
    status: "pending",
    daysOpen: 3,
    description: t('preview.implementéUnWidgetDe'),
    evidences: [t('preview.widgetImplementado'), t('preview.dashboardDeMétricas'), t('preview.análisisDeResultados')],
    expectedResults: t('preview.incrementoDel40En')
  },
  {
    id: "VAL-2024-083",
    obviTitle: t('preview.bibliotecaDeComponentesReutilizables'),
    creator: t('preview.luisTorres'),
    creatorAvatar: "LT",
    department: t('preview.tecnología'),
    impact: "medium",
    status: "pending",
    daysOpen: 4,
    description: t('preview.creéUnaBibliotecaDe'),
    evidences: [t('preview.códigoFuente'), t('preview.storybookDeployment'), t('preview.guíaDeUso')],
    expectedResults: t('preview.reducciónDel50En')
  },
  {
    id: "VAL-2024-081",
    obviTitle: "Proceso optimizado de inventario con código QR",
    creator: t('preview.patriciaLópez'),
    creatorAvatar: "PL",
    department: t('preview.operaciones'),
    impact: "low",
    status: "pending",
    daysOpen: 5,
    description: t('preview.implementéUnSistemaDe'),
    evidences: [t('preview.appMobile'), "Sistema QR", t('preview.resultadosPiloto')],
    expectedResults: "Reducción de errores de inventario en 85%"
  }
];

const VALIDATION_HISTORY: ValidationHistory[] = [
  {
    id: "VAL-2024-078",
    obviTitle: t('preview.chatbotInteligenteParaFaq'),
    validator: t('preview.robertoSánchez'),
    validatorAvatar: "RS",
    status: "approved",
    date: "2024-01-28",
    comment: t('preview.excelenteImplementaciónElChatbot'),
    rating: 5
  },
  {
    id: "VAL-2024-076",
    obviTitle: t('preview.dashboardEjecutivoEnTiempo'),
    validator: t('preview.carmenDíaz'),
    validatorAvatar: "CD",
    status: "approved",
    date: "2024-01-26",
    comment: t('preview.impactoDemostradoLaDirección'),
    rating: 5
  },
  {
    id: "VAL-2024-074",
    obviTitle: t('preview.procesoDeAprobacionesDigitales'),
    validator: t('preview.miguelÁngelRuiz'),
    validatorAvatar: "MR",
    status: "approved",
    date: "2024-01-24",
    comment: t('preview.soluciónEfectivaQueAgiliza'),
    rating: 4
  },
  {
    id: "VAL-2024-072",
    obviTitle: t('preview.sistemaDeNotificacionesPush'),
    validator: t('preview.lauraFernández'),
    validatorAvatar: "LF",
    status: "rejected",
    date: "2024-01-22",
    comment: t('preview.aunqueLaIdeaEs'),
    rating: 2
  },
  {
    id: "VAL-2024-070",
    obviTitle: t('preview.automatizaciónDeBackupDe'),
    validator: t('preview.javierMoreno'),
    validatorAvatar: "JM",
    status: "approved",
    date: "2024-01-20",
    comment: t('preview.críticoParaLaContinuidad'),
    rating: 5
  },
  {
    id: "VAL-2024-068",
    obviTitle: t('preview.rediseñoDeProcesoDe'),
    validator: t('preview.isabelCastro'),
    validatorAvatar: "IC",
    status: "approved",
    date: "2024-01-18",
    comment: t('preview.impactoCuantificableEnReducción'),
    rating: 5
  }
];

export function ValidacionesPreviewModal({ open, onOpenChange }: ValidacionesPreviewModalProps) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedValidation, setSelectedValidation] = useState<ValidationItem>(VALIDATION_QUEUE[0]);
  const [validationComment, setValidationComment] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "1", label: t('preview.elObvEstáClaramente'), checked: false },
    { id: "2", label: t('preview.lasEvidenciasProporcionadasSon'), checked: false },
    { id: "3", label: t('preview.elImpactoDeclaradoEs'), checked: false },
    { id: "4", label: t('preview.laSoluciónEsReplicable'), checked: false },
    { id: "5", label: t('preview.losResultadosEstánDocumentados'), checked: false }
  ]);
  const [validationAction, setValidationAction] = useState<"approved" | "rejected" | null>(null);

  const totalSlides = 6;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleChecklistToggle = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleValidationAction = (action: "approved" | "rejected") => {
    setValidationAction(action);
    setTimeout(() => {
      setValidationAction(null);
      setChecklist(prev => prev.map(item => ({ ...item, checked: false })));
      setValidationComment("");
    }, 2000);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case "high": return t('preview.altoImpacto');
      case "medium": return t('preview.impactoMedio');
      case "low": return t('preview.bajoImpacto');
      default: return impact;
    }
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        // Intro
        return (
          <div className="flex flex-col items-center justify-center space-y-6 py-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-3xl opacity-20 animate-pulse"></div>
              <Shield className="w-24 h-24 text-purple-600 relative" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-4 max-w-2xl">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('preview.sistemaDeValidaciones')}</h2>
              <p className="text-xl text-gray-600">{t('preview.aseguraLaCalidadCon')}</p>
              <div className="grid grid-cols-3 gap-4 pt-8">
                <Card className="p-4 border-2 hover:border-purple-300 transition-all hover:shadow-lg">
                  <Users className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
                  <p className="text-2xl font-bold text-gray-900">127</p>
                  <p className="text-sm text-gray-600">{t('preview.validadoresActivos')}</p>
                </Card>
                <Card className="p-4 border-2 hover:border-green-300 transition-all hover:shadow-lg">
                  <FileCheck className="w-8 h-8 text-green-600 mb-2 mx-auto" />
                  <p className="text-2xl font-bold text-gray-900">342</p>
                  <p className="text-sm text-gray-600">{t('preview.obvsValidados')}</p>
                </Card>
                <Card className="p-4 border-2 hover:border-blue-300 transition-all hover:shadow-lg">
                  <TrendingUp className="w-8 h-8 text-blue-600 mb-2 mx-auto" />
                  <p className="text-2xl font-bold text-gray-900">94%</p>
                  <p className="text-sm text-gray-600">{t('preview.tasaDeAprobación')}</p>
                </Card>
              </div>
            </div>
          </div>
        );

      case 1:
        // Dashboard de validaciones pendientes
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{t('preview.colaDeValidaciones')}</h3>
                <p className="text-gray-600">{t('preview.tienes5ObvsEsperando')}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 text-lg px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                5 Pendientes
              </Badge>
            </div>

            <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
              {VALIDATION_QUEUE.map((item, index) => (
                <Card
                  key={item.id}
                  className={`p-4 border-2 transition-all cursor-pointer hover:shadow-lg ${
                    selectedValidation.id === item.id
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                  onClick={() => setSelectedValidation(item)}
                  style={{
                    animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                        {item.creatorAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">{item.obviTitle}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span>{item.creator}</span>
                          <span className="text-gray-400">•</span>
                          <span>{item.department}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getImpactColor(item.impact)} text-xs`}>
                            {getImpactLabel(item.impact)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {item.daysOpen} {item.daysOpen === 1 ? 'día' : 'días'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedValidation.id === item.id ? "default" : "outline"}
                      className={selectedValidation.id === item.id ? "bg-purple-600 hover:bg-purple-700" : ""}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {selectedValidation.id === item.id ? 'Seleccionado': 'Ver'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <style>{`
              @keyframes slideIn {
                from {
                  opacity: 0;
                  transform: translateX(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
            `}</style>
          </div>
        );

      case 2:
        // Detalle de OBV a validar
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                {selectedValidation.creatorAvatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">{selectedValidation.obviTitle}</h3>
                  <Badge className={getImpactColor(selectedValidation.impact)}>
                    {getImpactLabel(selectedValidation.impact)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">{selectedValidation.creator}</span>
                  <span className="text-gray-400">•</span>
                  <span>{selectedValidation.department}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-purple-600 font-medium">{selectedValidation.id}</span>
                </div>
              </div>
            </div>

            <Card className="p-4 border-2 border-blue-200 bg-blue-50">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Descripción del OBV</p>
                  <p className="text-blue-800 leading-relaxed">{selectedValidation.description}</p>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 border-2 hover:border-green-300 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">{t('preview.evidenciasProporcionadas')}</h4>
                </div>
                <ul className="space-y-2">
                  {selectedValidation.evidences.map((evidence, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{evidence}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-4 border-2 hover:border-purple-300 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">{t('preview.resultadosEsperados')}</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">{selectedValidation.expectedResults}</p>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Enviado hace {selectedValidation.daysOpen} {selectedValidation.daysOpen === 1 ? 'día' : 'días'}</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-medium text-purple-900">{t('preview.comoValidadorTuRol')}</p>
              </div>
            </Card>
          </div>
        );

      case 3:
        // Proceso de validación interactivo
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{t('preview.procesoDeValidación')}</h3>
                <p className="text-gray-600">{t('preview.completaElChecklistY')}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 px-3 py-1">
                {selectedValidation.id}
              </Badge>
            </div>

            <Card className="p-5 border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">{t('preview.checklistDeValidación')}</h4>
                <Badge variant="outline" className="ml-auto">
                  {checklist.filter(item => item.checked).length}/{checklist.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      item.checked
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => handleChecklistToggle(item.id)}
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => handleChecklistToggle(item.id)}
                      className="mt-0.5"
                    />
                    <label className="flex-1 text-sm font-medium text-gray-900 cursor-pointer">
                      {item.label}
                    </label>
                    {item.checked && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">{t('preview.comentariosDeValidación')}</h4>
              </div>
              <Textarea
                placeholder={t('preview.agregaTusObservacionesRecomendaciones')}
                className="min-h-[120px] resize-none border-2"
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">{t('preview.tusComentariosAyudaránAl')}</p>
            </Card>

            {validationAction ? (
              <Card className={`p-6 text-center border-2 ${
                validationAction === "approved"
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}>
                <div className="flex flex-col items-center gap-3">
                  {validationAction === "approved" ? (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-green-600 animate-bounce" />
                      <h4 className="text-xl font-bold text-green-900">{t('preview.obvAprobado')}</h4>
                      <p className="text-green-700">{t('preview.laValidaciónSeHa')}</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-16 h-16 text-red-600 animate-bounce" />
                      <h4 className="text-xl font-bold text-red-900">{t('preview.obvRechazado')}</h4>
                      <p className="text-red-700">{t('preview.seHaSolicitadoRevisión')}</p>
                    </>
                  )}
                </div>
              </Card>
            ) : (
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold"
                  onClick={() => handleValidationAction("rejected")}
                  disabled={checklist.filter(item => item.checked).length === 0}
                >
                  <ThumbsDown className="w-5 h-5 mr-2" />
                  Rechazar OBV
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
                  onClick={() => handleValidationAction("approved")}
                  disabled={checklist.filter(item => item.checked).length < checklist.length}
                >
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  Aprobar OBV
                </Button>
              </div>
            )}

            {checklist.filter(item => item.checked).length < checklist.length && (
              <Card className="p-3 bg-yellow-50 border-2 border-yellow-200">
                <div className="flex items-center gap-2 text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">
                    Completa todos los items del checklist para aprobar este OBV
                  </span>
                </div>
              </Card>
            )}
          </div>
        );

      case 4:
        // Historial de validaciones
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{t('preview.historialDeValidaciones')}</h3>
                <p className="text-gray-600">{t('preview.últimasValidacionesCompletadasPor')}</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-700 px-3 py-1">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  5 Aprobadas
                </Badge>
                <Badge className="bg-red-100 text-red-700 px-3 py-1">
                  <XCircle className="w-3 h-3 mr-1" />
                  1 Rechazada
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
              {VALIDATION_HISTORY.map((item, index) => (
                <Card
                  key={item.id}
                  className={`p-4 border-2 transition-all hover:shadow-lg ${
                    item.status === "approved"
                      ? "border-green-200 bg-green-50 hover:border-green-300"
                      : "border-red-200 bg-red-50 hover:border-red-300"
                  }`}
                  style={{
                    animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {item.validatorAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.obviTitle}</h4>
                          <p className="text-sm text-gray-600">Validado por<span className="font-medium">{item.validator}</span>
                          </p>
                        </div>
                        <Badge className={
                          item.status === "approved"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }>
                          {item.status === "approved" ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" />{t('preview.aprobado')}</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" />{t('preview.rechazado')}</>
                          )}
                        </Badge>
                      </div>

                      <Card className="p-3 bg-white border mb-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 italic">{item.comment}</p>
                        </div>
                      </Card>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < item.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">{t('preview.estadísticasGenerales')}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">94%</p>
                    <p className="text-gray-600">{t('preview.tasaDeAprobación')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">1.8</p>
                    <p className="text-gray-600">{t('preview.díasPromedio')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">4.7</p>
                    <p className="text-gray-600">{t('preview.ratingPromedio')}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 5:
        // Impacto del sistema
        return (
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center mb-4">
                <Award className="w-16 h-16 text-yellow-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{t('preview.impactoDelSistemaDe')}</h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                La validación peer-to-peer garantiza calidad, transparencia y credibilidad en cada OBV
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 w-full max-w-4xl">
              <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-600 rounded-xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('preview.calidadMejorada')}</h3>
                    <p className="text-gray-700 mb-3">{t('preview.losObvsPasanPor')}</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">+35%</span>
                      <span className="text-sm text-gray-600">en calidad documentada</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('preview.transparenciaTotal')}</h3>
                    <p className="text-gray-700 mb-3">{t('preview.cadaValidaciónQuedaRegistrada')}</p>
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-600">100%</span>
                      <span className="text-sm text-gray-600">rastreabilidad</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-600 rounded-xl">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('preview.colaboraciónEfectiva')}</h3>
                    <p className="text-gray-700 mb-3">{t('preview.losEquiposSeAyudan')}</p>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="text-2xl font-bold text-purple-600">127</span>
                      <span className="text-sm text-gray-600">validadores activos</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 hover:shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-600 rounded-xl">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('preview.procesoÁgil')}</h3>
                    <p className="text-gray-700 mb-3">{t('preview.validacionesRápidasYEficientes')}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-2xl font-bold text-yellow-600">1.8</span>
                      <span className="text-sm text-gray-600">días promedio</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white w-full max-w-4xl border-0">
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-bold">{t('preview.porQuéEsImportante')}</h3>
                <p className="text-lg text-purple-100">
                  La validación peer-to-peer no solo asegura la calidad de los OBVs, sino que también:
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <CheckCircle2 className="w-8 h-8 mb-2 mx-auto" />
                    <p className="font-semibold">{t('preview.previeneFraudes')}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <CheckCircle2 className="w-8 h-8 mb-2 mx-auto" />
                    <p className="font-semibold">{t('preview.fomentaElAprendizaje')}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <CheckCircle2 className="w-8 h-8 mb-2 mx-auto" />
                    <p className="font-semibold">{t('preview.aumentaLaConfianza')}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-8">
        <VisuallyHidden>
          <DialogTitle>{t('preview.validacionesPreview')}</DialogTitle>
          <DialogDescription>{t('preview.interactivePreviewOfThe')}</DialogDescription>
        </VisuallyHidden>
        <div className="flex-1 overflow-y-auto">
          {renderSlide()}
        </div>

        <div className="flex items-center justify-between pt-6 border-t flex-shrink-0">
            <div className="flex gap-2">
              {[...Array(totalSlides)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-8 bg-purple-600'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSlide === 0}
                className="min-w-[100px]"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />{t('preview.anterior')}</Button>
              <Button
                onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : handleNext}
                className="min-w-[100px] bg-purple-600 hover:bg-purple-700"
              >
                {currentSlide === totalSlides - 1 ? 'Finalizar': t('preview.siguiente')}
                {currentSlide === totalSlides - 1 ? <CheckCircle2 className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
