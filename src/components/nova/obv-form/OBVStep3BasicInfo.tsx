import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { OBVFormData } from './useOBVFormLogic';

import { useTranslation } from 'react-i18next';
interface OBVStep3BasicInfoProps {
  formData: OBVFormData;
  onUpdate: (updates: Partial<OBVFormData>) => void;
}

export const OBVStep3BasicInfo = memo(function OBVStep3BasicInfo({
  formData,
  onUpdate
}: OBVStep3BasicInfoProps) {
  const { t } = useTranslation();
  return (
    <>
      <h4 className="text-lg font-semibold text-center mb-6">{t('obv.paso3InformaciónBásica')}</h4>
      <div className="max-w-lg mx-auto space-y-4 mb-8">
        <div>
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            placeholder={t('obv.ejReuniónConProveedor')}
            value={formData.titulo}
            onChange={e => onUpdate({ titulo: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="descripcion">{t('obv.descripción')}</Label>
          <Textarea
            id="descripcion"
            placeholder={t('obv.describeBrevementeLaActividad')}
            value={formData.descripcion}
            onChange={e => onUpdate({ descripcion: e.target.value })}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="fecha">Fecha *</Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha}
            onChange={e => onUpdate({ fecha: e.target.value })}
          />
        </div>
      </div>
    </>
  );
});
