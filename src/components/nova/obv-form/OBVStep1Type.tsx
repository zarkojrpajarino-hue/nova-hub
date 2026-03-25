import { memo } from 'react';
import { Check, Search, CheckCircle, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OBVFormData } from './useOBVFormLogic';

import { useTranslation } from 'react-i18next';

function getObvTypes(t: (key: string) => string) {
  return [
    { id: 'exploracion', Icon: Search, title: t('obv.exploración'), desc: t('obv.primerContactoInvestigaciónDe'), color: '#6366F1' },
    { id: 'validacion', Icon: CheckCircle, title: t('obv.validación'), desc: t('obv.reuniónDemoPropuestaEnviada'), color: '#F59E0B' },
    { id: 'venta', Icon: Wallet, title: t('obv.venta'), desc: t('obv.cierreConfirmadoConTransacción'), color: '#22C55E' },
  ];
}

interface OBVStep1TypeProps {
  formData: OBVFormData;
  onUpdate: (updates: Partial<OBVFormData>) => void;
}

export const OBVStep1Type = memo(function OBVStep1Type({ formData, onUpdate }: OBVStep1TypeProps) {
  const { t } = useTranslation();
  const OBV_TYPES = getObvTypes(t);
  return (
    <>
      <h4 className="text-lg font-semibold text-center mb-6">{t('obv.quéTipoDeActividad')}</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {OBV_TYPES.map(type => (
          <button
            key={type.id}
            type="button"
            onClick={() => onUpdate({ tipo: type.id })}
            className={cn(
              "p-6 rounded-xl border-2 text-left transition-all duration-200 active:scale-95",
              "hover:shadow-lg hover:border-primary/50",
              formData.tipo === type.id
                ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
              style={{ background: `${type.color}15` }}
            >
              <type.Icon size={28} />
            </div>
            <h5 className="font-bold text-base mb-2">{type.title}</h5>
            <p className="text-sm text-muted-foreground">{type.desc}</p>
            {formData.tipo === type.id && (
              <div className="mt-3 flex items-center gap-1.5 text-primary text-sm font-medium">
                <Check size={14} />{t('obv.seleccionado')}</div>
            )}
          </button>
        ))}
      </div>
    </>
  );
});
