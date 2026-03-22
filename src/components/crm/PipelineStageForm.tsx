/**
 * FORMULARIO DINÁMICO POR FASE DEL PIPELINE
 *
 * Este componente muestra campos diferentes según la fase en la que
 * se encuentra el lead/OBV en el pipeline de ventas.
 *
 * Fases y campos:
 * - Frío/Tibio: Campos básicos (contacto, empresa, valor estimado)
 * - Hot: + Próxima acción y fecha
 * - Propuesta: + Detalles de la propuesta
 * - Negociación: + Condiciones y descuentos
 * - Cerrado Ganado: Convertir a venta (facturación, costes, producto)
 */

import { useMemo } from 'react';
import {
  Building2,
  Phone,
  Mail,
  Calendar,
  FileText,
  User,
  DollarSign,
  Package,
  Calculator,
  CheckCircle,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { LeadStatus } from '@/types';

import { useTranslation } from 'react-i18next';
interface PipelineStageFormProps {
  currentStage: LeadStatus;
  onStageChange: (newStage: LeadStatus) => void;
  formData: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  showStageSelector?: boolean;
}

interface StageConfig {
  title: string;
  color: string;
  icon: LucideIcon;
  description: string;
  fields: string[];
  nextStage: LeadStatus | null;
}

interface FieldDefinition {
  label: string;
  type: string;
  icon: LucideIcon;
  required?: boolean;
  placeholder?: string;
  prefix?: string;
  readonly?: boolean;
  options?: Array<{ value: string; label: string }>;
}

// Configuración de campos por fase
const STAGE_CONFIG: Record<LeadStatus, StageConfig> = {
  frio: {
    title: t('crm.leadFrío'),
    color: '#64748B',
    icon: AlertCircle,
    description: t('crm.contactoInicialSinEngagement'),
    fields: ['nombre_contacto', 'empresa', 'email_contacto', 'telefono_contacto', 'valor_potencial'],
    nextStage: 'tibio',
  },
  tibio: {
    title: t('crm.leadTibio'),
    color: '#F59E0B',
    icon: AlertCircle,
    description: t('crm.contactoConInterésMostrado'),
    fields: [
      'nombre_contacto',
      'empresa',
      'email_contacto',
      'telefono_contacto',
      'valor_potencial',
      'notas',
    ],
    nextStage: 'hot',
  },
  hot: {
    title: t('crm.leadHot'),
    color: '#EF4444',
    icon: AlertCircle,
    description: t('crm.oportunidadCalificada'),
    fields: [
      'nombre_contacto',
      'empresa',
      'email_contacto',
      'telefono_contacto',
      'valor_potencial',
      'proxima_accion',
      'proxima_accion_fecha',
      'notas',
    ],
    nextStage: 'propuesta',
  },
  propuesta: {
    title: t('crm.propuestaEnviada'),
    color: '#A855F7',
    icon: FileText,
    description: t('crm.propuestaComercialActiva'),
    fields: [
      'nombre_contacto',
      'empresa',
      'email_contacto',
      'telefono_contacto',
      'valor_potencial',
      'producto',
      'cantidad',
      'precio_unitario',
      'proxima_accion',
      'proxima_accion_fecha',
      'notas',
    ],
    nextStage: 'negociacion',
  },
  negociacion: {
    title: t('crm.enNegociación'),
    color: '#3B82F6',
    icon: DollarSign,
    description: t('crm.negociandoTérminosFinales'),
    fields: [
      'nombre_contacto',
      'empresa',
      'email_contacto',
      'telefono_contacto',
      'valor_potencial',
      'producto',
      'cantidad',
      'precio_unitario',
      'costes_estimados',
      'proxima_accion',
      'proxima_accion_fecha',
      'notas',
    ],
    nextStage: 'cerrado_ganado',
  },
  cerrado_ganado: {
    title: t('crm.cerradoGanado'),
    color: '#22C55E',
    icon: CheckCircle,
    description: t('crm.convertirAVenta'),
    fields: [
      'nombre_contacto',
      'empresa',
      'email_contacto',
      'telefono_contacto',
      'producto',
      'cantidad',
      'precio_unitario',
      'facturacion',
      'costes',
      'margen',
      'forma_pago',
      'numero_factura',
      'cobro_fecha_esperada',
      'notas',
    ],
    nextStage: null,
  },
  cerrado_perdido: {
    title: t('crm.cerradoPerdido'),
    color: '#6B7280',
    icon: AlertCircle,
    description: t('crm.oportunidadPerdida'),
    fields: ['nombre_contacto', 'empresa', 'notas'],
    nextStage: null,
  },
};

// Definición de todos los campos posibles
const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  // Campos básicos
  nombre_contacto: {
    label: t('crm.nombreDelContacto'),
    type: 'text',
    icon: User,
    required: true,
    placeholder: t('crm.ejJuanPérez'),
  },
  empresa: {
    label: t('crm.empresa'),
    type: 'text',
    icon: Building2,
    required: true,
    placeholder: t('crm.ejAcmeCorp'),
  },
  email_contacto: {
    label: t('crm.email'),
    type: 'email',
    icon: Mail,
    placeholder: 'juan@acme.com',
  },
  telefono_contacto: {
    label: t('crm.teléfono'),
    type: 'tel',
    icon: Phone,
    placeholder: '+34 600 123 456',
  },
  valor_potencial: {
    label: t('crm.valorPotencial'),
    type: 'number',
    icon: DollarSign,
    placeholder: '5000',
    prefix: '€',
  },

  // Campos de acción
  proxima_accion: {
    label: t('crm.próximaAcción'),
    type: 'text',
    icon: CheckCircle,
    placeholder: t('crm.ejLlamarParaSeguimiento'),
  },
  proxima_accion_fecha: {
    label: t('crm.fechaDePróximaAcción'),
    type: 'date',
    icon: Calendar,
  },
  notas: {
    label: t('crm.notas'),
    type: 'textarea',
    icon: FileText,
    placeholder: t('crm.observacionesDetallesAdicionales'),
  },

  // Campos de propuesta
  producto: {
    label: t('crm.productoservicio'),
    type: 'text',
    icon: Package,
    placeholder: t('crm.ejConsultoríaDigital'),
  },
  cantidad: {
    label: t('crm.cantidad'),
    type: 'number',
    icon: Calculator,
    placeholder: '1',
  },
  precio_unitario: {
    label: t('crm.precioUnitario'),
    type: 'number',
    icon: DollarSign,
    placeholder: '5000',
    prefix: '€',
  },

  // Campos de negociación
  costes_estimados: {
    label: t('crm.costesEstimados'),
    type: 'number',
    icon: Calculator,
    placeholder: '2000',
    prefix: '€',
  },

  // Campos de venta (cerrado ganado)
  facturacion: {
    label: t('crm.facturaciónTotal'),
    type: 'number',
    icon: DollarSign,
    required: true,
    placeholder: '5000',
    prefix: '€',
    readonly: true, // Calculado automáticamente
  },
  costes: {
    label: t('crm.costesTotales'),
    type: 'number',
    icon: Calculator,
    placeholder: '2000',
    prefix: '€',
  },
  margen: {
    label: t('crm.margen'),
    type: 'number',
    icon: DollarSign,
    placeholder: '3000',
    prefix: '€',
    readonly: true, // Calculado automáticamente
  },
  forma_pago: {
    label: t('crm.formaDePago'),
    type: 'select',
    icon: DollarSign,
    options: [
      { value: 'transferencia', label: t('crm.transferenciaBancaria') },
      { value: 'tarjeta', label: t('crm.tarjetaDeCrédito') },
      { value: 'efectivo', label: t('crm.efectivo') },
      { value: 'paypal', label: t('crm.paypal') },
      { value: 'bizum', label: t('crm.bizum') },
      { value: 'stripe', label: t('crm.stripe') },
    ],
  },
  numero_factura: {
    label: t('crm.númeroDeFactura'),
    type: 'text',
    icon: FileText,
    placeholder: 'FAC-2026-001',
  },
  cobro_fecha_esperada: {
    label: t('crm.fechaEsperadaDeCobro'),
    type: 'date',
    icon: Calendar,
  },
};

export function PipelineStageForm({
  currentStage,
  onStageChange,
  formData,
  onChange,
  showStageSelector = true,
}: PipelineStageFormProps) {
  const { t } = useTranslation();
  const stageConfig = STAGE_CONFIG[currentStage];
  const StageIcon = stageConfig.icon;

  // Calcular automáticamente facturación y margen
  useMemo(() => {
    const cantidad = parseFloat(String(formData.cantidad)) || 0;
    const precioUnitario = parseFloat(String(formData.precio_unitario)) || 0;
    const costes = parseFloat(String(formData.costes)) || 0;

    const facturacion = cantidad * precioUnitario;
    const margen = facturacion - costes;

    if (formData.facturacion !== facturacion) {
      onChange('facturacion', facturacion);
    }
    if (formData.margen !== margen) {
      onChange('margen', margen);
    }
  }, [formData.cantidad, formData.precio_unitario, formData.costes, formData.facturacion, formData.margen, onChange]);

  const renderField = (fieldName: string) => {
    const field = FIELD_DEFINITIONS[fieldName];
    if (!field) return null;

    const FieldIcon = field.icon;
    const value = String(formData[fieldName] || '');

    if (field.type === 'textarea') {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="flex items-center gap-2">
            <FieldIcon className="w-4 h-4 text-muted-foreground" />
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Textarea
            id={fieldName}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onChange(fieldName, e.target.value)}
            required={field.required}
            rows={3}
          />
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="flex items-center gap-2">
            <FieldIcon className="w-4 h-4 text-muted-foreground" />
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Select value={value} onValueChange={(val) => onChange(fieldName, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName} className="flex items-center gap-2">
          <FieldIcon className="w-4 h-4 text-muted-foreground" />
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </Label>
        <div className="relative">
          {field.prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {field.prefix}
            </span>
          )}
          <Input
            id={fieldName}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onChange(fieldName, e.target.value)}
            required={field.required}
            readOnly={field.readonly}
            className={field.prefix ? 'pl-8' : ''}
            disabled={field.readonly}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con Badge de Fase */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stageConfig.color}20` }}
              >
                <StageIcon className="w-6 h-6" style={{ color: stageConfig.color }} />
              </div>
              <div>
                <CardTitle className="text-lg">{stageConfig.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{stageConfig.description}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-sm px-3 py-1"
              style={{ borderColor: stageConfig.color, color: stageConfig.color }}
            >
              {currentStage.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Selector de Fase (opcional) */}
      {showStageSelector && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('crm.cambiarFaseDelPipeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={currentStage}
              onValueChange={(val) => onStageChange(val as LeadStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STAGE_CONFIG).map(([stage, config]) => (
                  <SelectItem key={stage} value={stage}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Formulario Dinámico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('crm.informaciónDeLaOportunidad')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stageConfig.fields.map((fieldName) => renderField(fieldName))}
          </div>
        </CardContent>
      </Card>

      {/* Botón de Avanzar Fase */}
      {stageConfig.nextStage && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('crm.listoParaAvanzar')}</p>
                <p className="text-sm text-muted-foreground">
                  Pasar a: {STAGE_CONFIG[stageConfig.nextStage].title}
                </p>
              </div>
              <Button
                onClick={() => onStageChange(stageConfig.nextStage!)}
                style={{ backgroundColor: STAGE_CONFIG[stageConfig.nextStage].color }}
              >
                Avanzar a {STAGE_CONFIG[stageConfig.nextStage].title}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
