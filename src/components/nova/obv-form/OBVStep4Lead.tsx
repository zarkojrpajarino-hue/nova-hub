import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { OBVFormData } from './useOBVFormLogic';

const LEAD_STATUS_OPTIONS = [
  { value: 'frio', label: 'Frío' },
  { value: 'tibio', label: 'Tibio' },
  { value: 'hot', label: 'Hot' },
  { value: 'propuesta', label: 'Propuesta' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'cerrado_ganado', label: 'Cerrado Ganado' },
];

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
  return (
    <>
      <h4 className="text-lg font-semibold text-center mb-6">
        Paso 4: Datos del Lead
      </h4>
      <div className="max-w-lg mx-auto space-y-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'none', label: 'Sin Lead' },
            { id: 'existing', label: 'Lead Existente' },
            { id: 'new', label: 'Nuevo Lead' },
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
            <Label>Seleccionar Lead</Label>
            <Select
              value={formData.leadId}
              onValueChange={v => onUpdate({ leadId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un lead..." />
              </SelectTrigger>
              <SelectContent>
                {projectLeads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id!}>
                    {lead.nombre} - {lead.empresa || 'Sin empresa'}
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
                placeholder="Juan García"
                value={formData.leadNombre}
                onChange={e => onUpdate({ leadNombre: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="leadEmpresa">Empresa</Label>
              <Input
                id="leadEmpresa"
                placeholder="Empresa S.L."
                value={formData.leadEmpresa}
                onChange={e => onUpdate({ leadEmpresa: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="leadEmail">Email</Label>
              <Input
                id="leadEmail"
                type="email"
                placeholder="contacto@empresa.com"
                value={formData.leadEmail}
                onChange={e => onUpdate({ leadEmail: e.target.value })}
              />
            </div>
            <div>
              <Label>Estado del Lead</Label>
              <Select
                value={formData.leadStatus}
                onValueChange={v => onUpdate({ leadStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS_OPTIONS.map(opt => (
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
