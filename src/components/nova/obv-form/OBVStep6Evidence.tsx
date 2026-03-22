import { memo } from 'react';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { EvidenceUrlInput } from '@/components/evidence/EvidenceUrlInput';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { OBVFormData } from './useOBVFormLogic';

import { useTranslation } from 'react-i18next';
interface Project {
  id: string;
  nombre: string;
}

interface OBVStep6EvidenceProps {
  step: number;
  formData: OBVFormData;
  projects: Project[];
  isVenta: boolean;
  onUpdate: (updates: Partial<OBVFormData>) => void;
}

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  payment:             t('obv.comprobanteDePago'),
  interview_recording: t('obv.grabaciónDeEntrevista'),
  public_url:          'URL pública (web, social)',
  screenshot:          t('obv.capturaDePantalla'),
  doc:                 t('obv.documento'),
  other:               t('obv.otro'),
};

const OUTCOME_OPTIONS = [
  {
    value: 'success',
    label: t('obv.éxito'),
    description: t('obv.hipótesisConfirmada'),
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10 border-success/40',
  },
  {
    value: 'partial',
    label: t('obv.parcial'),
    description: t('obv.señalMixtaNoConfirmado'),
    icon: MinusCircle,
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/40',
  },
  {
    value: 'fail',
    label: t('obv.noValidó'),
    description: t('obv.hipótesisRefutada'),
    icon: XCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/40',
  },
] as const;

export const OBVStep6Evidence = memo(function OBVStep6Evidence({
  step,
  formData,
  projects,
  isVenta,
  onUpdate
}: OBVStep6EvidenceProps) {
  const { t } = useTranslation();
  return (
    <>
      <h4 className="text-lg font-semibold text-center mb-6">
        Paso {step}: Resultado y evidencia
      </h4>
      <div className="max-w-lg mx-auto space-y-5 mb-8">

        {/* obv_outcome — resultado del OBV (drives velocity + scoring) */}
        <div>
          <Label className="mb-2 block">{t('obv.cuálFueElResultado')}<span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {OUTCOME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = formData.obvOutcome === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ obvOutcome: opt.value })}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all',
                    selected ? opt.bg + ' border-2' : 'border-border hover:border-muted-foreground/40'
                  )}
                >
                  <Icon size={20} className={selected ? opt.color : 'text-muted-foreground'} />
                  <span className={cn('text-sm font-medium', selected ? opt.color : '')}>{opt.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{opt.description}</span>
                </button>
              );
            })}
          </div>
          {!formData.obvOutcome && (
            <p className="text-xs text-destructive mt-1.5">{t('obv.obligatorioSinResultadoEl')}</p>
          )}
        </div>

        {/* evidence_type */}
        <div>
          <Label className="mb-2 block">Tipo de evidencia<span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Select
            value={formData.evidenceType}
            onValueChange={(v) => onUpdate({ evidenceType: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('obv.seleccionaTipoDeEvidencia')} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVIDENCE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.evidenceType === 'payment' && (
            <p className="text-xs text-success mt-1.5">{t('obv.comprobanteDePagoVerificado')}</p>
          )}
        </div>

        {/* evidence_url */}
        <EvidenceUrlInput
          value={formData.evidenceUrl}
          onChange={(value) => onUpdate({ evidenceUrl: value })}
          label="Enlace a la evidencia (Google Drive, etc.)"
        />

        {/* Summary */}
        <div className="p-4 bg-muted rounded-xl space-y-2">
          <h5 className="font-semibold">{t('obv.resumen')}</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium capitalize">{formData.tipo}</span>
            <span className="text-muted-foreground">Proyecto:</span>
            <span className="font-medium">{projects.find(p => p.id === formData.projectId)?.nombre}</span>
            <span className="text-muted-foreground">Título:</span>
            <span className="font-medium">{formData.titulo}</span>
            {isVenta && (
              <>
                <span className="text-muted-foreground">Facturación:</span>
                <span className="font-medium text-success">€{formData.facturacion}</span>
              </>
            )}
            {formData.obvOutcome && (
              <>
                <span className="text-muted-foreground">Resultado:</span>
                <span className="font-medium capitalize">
                  {OUTCOME_OPTIONS.find(o => o.value === formData.obvOutcome)?.label ?? formData.obvOutcome}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
