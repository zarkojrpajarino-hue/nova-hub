import { memo } from 'react';
import { EvidenceUrlInput } from '@/components/evidence/EvidenceUrlInput';
import type { OBVFormData } from './useOBVFormLogic';

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

export const OBVStep6Evidence = memo(function OBVStep6Evidence({
  step,
  formData,
  projects,
  isVenta,
  onUpdate
}: OBVStep6EvidenceProps) {
  return (
    <>
      <h4 className="text-lg font-semibold text-center mb-6">
        Paso {step}: Evidencia
      </h4>
      <div className="max-w-lg mx-auto space-y-4 mb-8">
        <EvidenceUrlInput
          value={formData.evidenceUrl}
          onChange={(value) => onUpdate({ evidenceUrl: value })}
          label="Evidencia (URL Google Drive)"
        />

        {/* Summary */}
        <div className="p-4 bg-muted rounded-xl space-y-2">
          <h5 className="font-semibold">Resumen</h5>
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
          </div>
        </div>
      </div>
    </>
  );
});
