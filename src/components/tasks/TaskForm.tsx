import { useState } from 'react';
import { Loader2, Calendar, Flag, User, Layers, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TaskFormProps {
  projectId: string;
  projectMembers: Array<{ id: string; nombre: string; color: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIORITY_OPTIONS = [
  { value: '1', label: 'Alta', color: '#EF4444' },
  { value: '2', label: 'Media', color: '#F59E0B' },
  { value: '3', label: 'Baja', color: '#22C55E' },
];

const FUNCTION_TYPE_OPTIONS = [
  { value: 'demand',   label: 'Demanda',  color: '#F59E0B' },
  { value: 'delivery', label: 'Delivery', color: '#3B82F6' },
  { value: 'cash',     label: 'Cash',     color: '#22C55E' },
  { value: 'support',  label: 'Soporte',  color: '#A855F7' },
];

export function TaskForm({ projectId, projectMembers, open, onOpenChange }: TaskFormProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    assigneeId: '',
    leaderId: '',
    prioridad: '2',
    fechaLimite: '',
    functionType: '',
  });

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    // C3.6 — leader ≠ executor
    if (formData.leaderId && formData.assigneeId && formData.leaderId === formData.assigneeId) {
      toast.error('El responsable y el ejecutor no pueden ser la misma persona');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check active tasks limit (5 tasks per project)
      const { data: activeTasks, error: countError } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: false })
        .eq('project_id', projectId)
        .neq('status', 'done');

      if (countError) throw countError;

      if (activeTasks && activeTasks.length >= 5) {
        toast.error('Máximo 5 tareas activas por proyecto. Completa una antes de crear otra.');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('tasks').insert({
        project_id: projectId,
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        assignee_id: formData.assigneeId || profile?.id || null,
        // leader_id is intentionally NOT auto-assigned.
        // NULL = sin dato (tareas sin liderazgo explícito no cuentan en E4.5 analytics).
        leader_id: formData.leaderId || null,
        prioridad: parseInt(formData.prioridad),
        fecha_limite: formData.fechaLimite || null,
        function_type: formData.functionType || null,
        status: 'todo',
        ai_generated: false,
      });

      if (error) throw error;

      toast.success('Tarea creada');
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });

      setFormData({ titulo: '', descripcion: '', assigneeId: '', leaderId: '', prioridad: '2', fechaLimite: '', functionType: '' });
      onOpenChange(false);
    } catch (_error) {
      toast.error('Error al crear la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Preparar presentación del pitch..."
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalles de la tarea..."
                rows={3}
              />
            </div>

            <div>
              <Label className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Función del negocio
              </Label>
              <Select
                value={formData.functionType}
                onValueChange={(v) => setFormData({ ...formData, functionType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin clasificar (no contabiliza)" />
                </SelectTrigger>
                <SelectContent>
                  {FUNCTION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: opt.color }}
                        />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Ejecutor
                </Label>
                <Select
                  value={formData.assigneeId}
                  onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projectMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: member.color }}
                          />
                          {member.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  Responsable
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-muted-foreground text-xs ml-0.5">(?)</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-52">
                      <p className="text-xs">
                        Quien responde por el resultado final, aunque no lo ejecute.
                        Debe ser distinto al ejecutor. Opcional.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={formData.leaderId}
                  onValueChange={(v) => setFormData({ ...formData, leaderId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: member.color }}
                          />
                          {member.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  Prioridad
                </Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(v) => setFormData({ ...formData, prioridad: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: opt.color }}
                          />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Fecha límite
                </Label>
                <Input
                  type="date"
                  value={formData.fechaLimite}
                  onChange={(e) => setFormData({ ...formData, fechaLimite: e.target.value })}
                />
              </div>
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
                  'Crear Tarea'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
