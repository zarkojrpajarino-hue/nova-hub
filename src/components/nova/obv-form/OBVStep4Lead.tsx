import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { OBVFormData } from './useOBVFormLogic';

import { useTranslation } from 'react-i18next';
function getLEAD_STATUS_OPTIONS(t: (k: string) => string) {
  return [
  { value: 'frio', label: t('obv.frío') },
  { value: 'tibio', label: t('obv.tibio') },
  { value: 'hot', label: 'Hot' },
  { value: 'propuesta', label: t('obv.propuesta') },
  { value: 'negociacion', label: t('obv.negociación') },
  { value: 'cerrado_ganado', label: t('obv.cerradoGanado') },
];
}

interface Lead {
  id: string;
  nombre: string;
  empresa?: string | null;
}

interface OBVStep4LeadProps {
  formData: OBVFormData;
  projectLeads: Lead[];
  onUpdate: (updates: Partial<OBVFormData>) => void;
}

export const OBVStep4Lead = memo(function OBVStep4Lead({
  formData,
  projectLeads,
  onUpdate
}: OBVStep4LeadProps) {
  const { t } = useTranslation();
  return (
    <>
      <h4 className="text-lg font-semibold text-center mb-6">{t('obv.paso4DatosDel')}</h4>
      <div className="max-w-lg mx-auto space-y-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'none', label: t('obv.sinLead') },
            { id: 'existing', label: t('obv.leadExistente') },
            { id: 'new', label: t('obv.nuevoLead') },
          ] as const).map(opt => (
            <button
              key={opt.id}
              onClick={() => onUpdate({ leadOption: opt.id })}
              className={cn(
                "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                formData.leadOption === opt.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {formData.leadOption === 'existing' && (
          <div>
            <Label>{t('obv.seleccionarLead')}</Label>
            <Select
              value={formData.leadId}
              onValueChange={v => onUpdate({ leadId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('obv.seleccionaUnLead')} />
              </SelectTrigger>
              <SelectContent>
                {projectLeads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id!}>
                    {lead.nombre} - {lead.empresa || t('obv.sinEmpresa')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.leadOption === 'new' && (
          <>
            <div>
              <Label htmlFor="leadNombre">Nombre del contacto *</Label>
              <Input
                id="leadNombre"
                placeholder={t('obv.juanGarcía')}
                value={formData.leadNombre}
                onChange={e => onUpdate({ leadNombre: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="leadEmpresa">{t('obv.empresa')}</Label>
              <Input
                id="leadEmpresa"
                placeholder={t('obv.empresaSl')}
                value={formData.leadEmpresa}
                onChange={e => onUpdate({ leadEmpresa: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="leadEmail">{t('obv.email')}</Label>
              <Input
                id="leadEmail"
                type="email"
                placeholder={t('obv.contactoempresacom')}
                value={formData.leadEmail}
                onChange={e => onUpdate({ leadEmail: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('obv.estadoDelLead')}</Label>
              <Select
                value={formData.leadStatus}
                onValueChange={v => onUpdate({ leadStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getLEAD_STATUS_OPTIONS(t).map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </>
  );
});
