import { useState } from 'react';
import { Loader2, Building2, Phone, Mail, Calendar, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { leadService } from '@/services/LeadService';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

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
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    status: initialStatus,
    valor_potencial: '',
    notas: '',
    proxima_accion: '',
    proxima_accion_fecha: '',
    responsable_id: profile?.id || '',
    project_id: projectId || '',
  });

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!formData.project_id) {
      toast.error('Selecciona un proyecto');
      return;
    }

    setIsSubmitting(true);

    try {
      await leadService.create({
        nombre: formData.nombre,
        empresa: formData.empresa || null,
        email: formData.email || null,
        telefono: formData.telefono || null,
        status: formData.status as Database["public"]["Enums"]["lead_status"],
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
      
      setFormData({
        nombre: '',
        empresa: '',
        email: '',
        telefono: '',
        status: 'frio',
        valor_potencial: '',
        notas: '',
        proxima_accion: '',
        proxima_accion_fecha: '',
        responsable_id: profile?.id || '',
        project_id: projectId || '',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Error al crear el lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Proyecto */}
          {!projectId && (
            <div>
              <Label>Proyecto *</Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(v) => setFormData({ ...formData, project_id: v })}
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

          {/* Nombre y Empresa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Nombre *
              </Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan García"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Empresa
              </Label>
              <Input
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                placeholder="Empresa S.L."
              />
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Email
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan@empresa.com"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Teléfono
              </Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>
          </div>

          {/* Estado y Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estado</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Potencial (€)</Label>
              <Input
                type="number"
                value={formData.valor_potencial}
                onChange={(e) => setFormData({ ...formData, valor_potencial: e.target.value })}
                placeholder="5000"
              />
            </div>
          </div>

          {/* Responsable */}
          <div>
            <Label>Responsable</Label>
            <Select 
              value={formData.responsable_id} 
              onValueChange={(v) => setFormData({ ...formData, responsable_id: v })}
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

          {/* Próxima acción */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Próxima acción
              </Label>
              <Input
                value={formData.proxima_accion}
                onChange={(e) => setFormData({ ...formData, proxima_accion: e.target.value })}
                placeholder="Llamar para seguimiento"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Fecha
              </Label>
              <Input
                type="date"
                value={formData.proxima_accion_fecha}
                onChange={(e) => setFormData({ ...formData, proxima_accion_fecha: e.target.value })}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Notas adicionales sobre el lead..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
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
