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
import { queryKeys } from '@/lib/queryKeys';

import { useTranslation } from 'react-i18next';
interface TaskFormProps {
  projectId: string;
  projectMembers: Array<{ id: string; nombre: string; color: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getPRIORITY_OPTIONS(t: (k: string) => string) {
  return [
  { value: '1', label: t('tasks.alta'), color: '#EF4444' },
  { value: '2', label: t('tasks.media'), color: '#F59E0B' },
  { value: '3', label: t('tasks.baja'), color: '#22C55E' },
];
}

function getFUNCTION_TYPE_OPTIONS(t: (k: string) => string) {
  return [
  { value: 'demand',   label: t('tasks.demanda'),  color: '#F59E0B' },
  { value: 'delivery', label: t('tasks.delivery'), color: '#3B82F6' },
  { value: 'cash',     label: t('tasks.cash'),     color: '#22C55E' },
  { value: 'support',  label: t('tasks.soporte'),  color: '#A855F7' },
];
}

export function TaskForm({ projectId, projectMembers, open, onOpenChange }: TaskFormProps) {
  const { t } = useTranslation();
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
      toast.error(t('tasks.elTítuloEsObligatorio'));
      return;
    }

    // C3.6 — leader ≠ executor
    if (formData.leaderId && formData.assigneeId && formData.leaderId === formData.assigneeId) {
      toast.error(t('tasks.elResponsableYEl'));
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
        toast.error(t('tasks.máximo5TareasActivas'));
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

      toast.success(t('tasks.tareaCreada'));
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

      setFormData({ titulo: '', descripcion: '', assigneeId: '', leaderId: '', prioridad: '2', fechaLimite: '', functionType: '' });
      onOpenChange(false);
    } catch (_error) {
      toast.error(t('tasks.errorAlCrearLa'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('tasks.nuevaTarea')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder={t('tasks.prepararPresentaciónDelPitch')}
              />
            </div>

            <div>
              <Label>{t('tasks.descripción')}</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder={t('tasks.detallesDeLaTarea')}
                rows={3}
              />
            </div>

            <div>
              <Label className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />{t('tasks.funciónDelNegocio')}</Label>
              <Select
                value={formData.functionType}
                onValueChange={(v) => setFormData({ ...formData, functionType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('tasks.sinClasificarNoContabiliza')} />
                </SelectTrigger>
                <SelectContent>
                  {getFUNCTION_TYPE_OPTIONS(t).map((opt) => (
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
                  <User className="w-3.5 h-3.5" />{t('tasks.ejecutor')}</Label>
                <Select
                  value={formData.assigneeId}
                  onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('tasks.seleccionar')} />
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
                  <Shield className="w-3.5 h-3.5 text-amber-500" />{t('tasks.responsable')}<Tooltip>
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
                    <SelectValue placeholder={t('tasks.opcional')} />
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
                  <Flag className="w-3.5 h-3.5" />{t('tasks.prioridad')}</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(v) => setFormData({ ...formData, prioridad: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getPRIORITY_OPTIONS(t).map((opt) => (
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
                  <Calendar className="w-3.5 h-3.5" />{t('tasks.fechaLímite')}</Label>
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
              >{t('tasks.cancelar')}</Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('tasks.creando')}</>
                ) : (
                  t('tasks.crearTarea')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
