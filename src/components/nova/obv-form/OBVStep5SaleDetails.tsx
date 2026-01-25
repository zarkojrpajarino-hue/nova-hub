import { memo } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { OBVFormData } from './useOBVFormLogic';

interface Member {
  id: string;
  nombre: string;
  color: string;
}

interface OBVStep5SaleDetailsProps {
  formData: OBVFormData;
  members: Member[];
  projectMembersList: any[];
  onUpdateSaleCalculations: (updates: Partial<OBVFormData>) => void;
  onAddParticipant: (memberId: string) => void;
  onRemoveParticipant: (memberId: string) => void;
  onUpdateParticipantPercentage: (memberId: string, porcentaje: number) => void;
}

export const OBVStep5SaleDetails = memo(function OBVStep5SaleDetails({
  formData,
  members,
  projectMembersList,
  onUpdateSaleCalculations,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipantPercentage,
}: OBVStep5SaleDetailsProps) {
  return (
    <>
      <h4 className="text-lg font-semibold text-center mb-6">
        Paso 5: Detalles de la Venta
      </h4>
      <div className="max-w-lg mx-auto space-y-4 mb-8">
        <div>
          <Label htmlFor="producto">Producto/Servicio *</Label>
          <Input
            id="producto"
            placeholder="Ej: Pack de menús premium"
            value={formData.producto}
            onChange={e => onUpdateSaleCalculations({ producto: e.target.value })}
            className="h-12 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.cantidad}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                onUpdateSaleCalculations({ cantidad: parseInt(val) || 0 });
              }}
              className="h-12 text-base text-center font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="precioUnitario">Precio Unitario (€)</Label>
            <Input
              id="precioUnitario"
              inputMode="decimal"
              value={formData.precioUnitario}
              onChange={e => {
                const val = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                onUpdateSaleCalculations({ precioUnitario: parseFloat(val) || 0 });
              }}
              className="h-12 text-base text-center font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Facturación Total</Label>
            <div className="h-12 px-3 flex items-center justify-center bg-muted rounded-md">
              <span className="text-lg font-bold text-primary">
                €{formData.facturacion.toFixed(2)}
              </span>
            </div>
          </div>
          <div>
            <Label htmlFor="costes">Costes (€)</Label>
            <Input
              id="costes"
              inputMode="decimal"
              value={formData.costes}
              onChange={e => {
                const val = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                onUpdateSaleCalculations({ costes: parseFloat(val) || 0 });
              }}
              className="h-12 text-base text-center font-semibold"
            />
          </div>
        </div>

        {/* Margen */}
        <div className="p-4 bg-success/10 rounded-xl border border-success/20">
          <p className="text-sm text-muted-foreground mb-1">Margen Bruto</p>
          <p className={cn(
            "text-2xl font-bold",
            formData.margen >= 0 ? "text-success" : "text-destructive"
          )}>
            €{formData.margen.toFixed(2)}
          </p>
        </div>

        {/* Participants */}
        <div>
          <Label>Participantes (opcional)</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Añade otros socios que participaron en esta venta
          </p>
          <div className="space-y-2">
            {formData.participants.map(p => {
              const member = members.find(m => m.id === p.memberId);
              return (
                <div key={p.memberId} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                    style={{ background: member?.color || '#6366F1' }}
                  >
                    {member?.nombre.charAt(0)}
                  </div>
                  <span className="flex-1 text-sm font-medium">{member?.nombre}</span>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={p.porcentaje}
                    onChange={e => onUpdateParticipantPercentage(p.memberId, parseInt(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveParticipant(p.memberId)}
                    className="text-destructive"
                  >
                    ×
                  </Button>
                </div>
              );
            })}
          </div>
          {projectMembersList.length > formData.participants.length && (
            <Select onValueChange={onAddParticipant}>
              <SelectTrigger className="mt-2">
                <Plus size={14} className="mr-2" />
                <SelectValue placeholder="Añadir participante..." />
              </SelectTrigger>
              <SelectContent>
                {projectMembersList
                  .filter(m => m && !formData.participants.find(p => p.memberId === m.id))
                  .map(m => m && (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </>
  );
});
