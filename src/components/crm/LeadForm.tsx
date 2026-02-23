import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { PipelineStageForm } from './PipelineStageForm';
import { leadService } from '@/services/LeadService';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { LeadStatus } from '@/types';

// eslint-disable-next-line react-refresh/only-export-components
export const PIPELINE_STAGES = [
  { id: 'frio', label: 'Frío', color: '#64748B' },
  { id: 'tibio', label: 'Tibio', color: '#F59E0B' },
  { id: 'hot', label: 'Hot', color: '#EF4444' },
  { id: 'propuesta', label: 'Propuesta', color: '#A855F7' },
  { id: 'negociacion', label: 'Negociación', color: '#3B82F6' },
  { id: 'cerrado_ganado', label: 'Cerrado Ganado', color: '#22C55E' },
  { id: 'cerrado_perdido', label: 'Cerrado Perdido', color: '#6B7280' },
];

interface LeadFormProps {
  projectId?: string;
  projects: Array<{ id: string; nombre: string; icon: string }>;
  members: Array<{ id: string; nombre: string; color: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: string;
}

export function LeadForm({ projectId, projects, members, open, onOpenChange, initialStatus = 'frio' }: LeadFormProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStage, setCurrentStage] = useState<LeadStatus>(initialStatus as LeadStatus);
  const [formData, setFormData] = useState({
    // Project and responsable (not part of PipelineStageForm)
    responsable_id: profile?.id || '',
    project_id: projectId || '',
    // Fields from PipelineStageForm
    nombre_contacto: '',
    empresa: '',
    email_contacto: '',
    telefono_contacto: '',
    valor_potencial: '',
    notas: '',
    proxima_accion: '',
    proxima_accion_fecha: '',
    producto: '',
    cantidad: '',
    precio_unitario: '',
    costes_estimados: '',
    facturacion: '',
    costes: '',
    margen: '',
    forma_pago: '',
    numero_factura: '',
    cobro_fecha_esperada: '',
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStage(initialStatus as LeadStatus);
      setFormData({
        responsable_id: profile?.id || '',
        project_id: projectId || '',
        nombre_contacto: '',
        empresa: '',
        email_contacto: '',
        telefono_contacto: '',
        valor_potencial: '',
        notas: '',
        proxima_accion: '',
        proxima_accion_fecha: '',
        producto: '',
        cantidad: '',
        precio_unitario: '',
        costes_estimados: '',
        facturacion: '',
        costes: '',
        margen: '',
        forma_pago: '',
        numero_factura: '',
        cobro_fecha_esperada: '',
      });
    }
  }, [open, initialStatus, profile?.id, projectId]);

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre_contacto?.trim()) {
      toast.error('El nombre del contacto es obligatorio');
      return;
    }
    if (!formData.empresa?.trim()) {
      toast.error('La empresa es obligatoria');
      return;
    }
    if (!formData.project_id) {
      toast.error('Selecciona un proyecto');
      return;
    }

    setIsSubmitting(true);

    try {
      await leadService.create({
        nombre: formData.nombre_contacto,
        empresa: formData.empresa || null,
        email: formData.email_contacto || null,
        telefono: formData.telefono_contacto || null,
        status: currentStage as Database["public"]["Enums"]["lead_status"],
        valor_potencial: formData.valor_potencial ? parseFloat(formData.valor_potencial) : null,
        notas: formData.notas || null,
        proxima_accion: formData.proxima_accion || null,
        proxima_accion_fecha: formData.proxima_accion_fecha || null,
        responsable_id: formData.responsable_id || profile?.id || null,
        project_id: formData.project_id,
      });

      toast.success('Lead creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['pipeline_global'] });
      queryClient.invalidateQueries({ queryKey: ['project_leads'] });

      onOpenChange(false);
    } catch (_error) {
      toast.error('Error al crear el lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Metadata: Proyecto y Responsable */}
          <div className="grid grid-cols-2 gap-4">
            {/* Proyecto */}
            {!projectId && (
              <div>
                <Label>Proyecto *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(v) => handleFieldChange('project_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.icon} {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Responsable */}
            <div>
              <Label>Responsable</Label>
              <Select
                value={formData.responsable_id}
                onValueChange={(v) => handleFieldChange('responsable_id', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar responsable" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: m.color }}
                        />
                        {m.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Dynamic Pipeline Form */}
          <PipelineStageForm
            currentStage={currentStage}
            onStageChange={setCurrentStage}
            formData={formData}
            onChange={handleFieldChange}
            showStageSelector={true}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Lead'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
