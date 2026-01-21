import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface KPIUploadFormProps {
  type: 'lp' | 'bp' | 'cp';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CP_ACTIVITIES = [
  { value: 'mentoring', label: 'Mentoring individual', points: 1 },
  { value: 'evento_mta', label: 'Participar en evento MTA', points: 1 },
  { value: 'workshop', label: 'Organizar workshop', points: 2 },
  { value: 'liderar_evento', label: 'Liderar evento MTA', points: 3 },
];

const TYPE_LABELS = {
  lp: 'Learning Path',
  bp: 'Book Point',
  cp: 'Community Point',
};

const TYPE_PLACEHOLDERS = {
  lp: {
    titulo: 'Ej: Design Thinking - IDEO',
    descripcion: 'Describe qué aprendiste y cómo lo aplicarás',
  },
  bp: {
    titulo: 'Ej: Lean Startup - Eric Ries',
    descripcion: 'Resume los puntos clave del libro',
  },
  cp: {
    titulo: 'Ej: Workshop de Pitch para startups',
    descripcion: 'Describe la actividad comunitaria realizada',
  },
};

export function KPIUploadForm({ type, open, onOpenChange }: KPIUploadFormProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    evidenceUrl: '',
    cpActivity: '',
  });

  const selectedActivity = CP_ACTIVITIES.find(a => a.value === formData.cpActivity);
  const cpPoints = selectedActivity?.points || 1;

  const handleSubmit = async () => {
    if (!profile?.id) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (!formData.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    if (type === 'cp' && !formData.cpActivity) {
      toast.error('Selecciona el tipo de actividad');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('kpis').insert({
        owner_id: profile.id,
        type,
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        evidence_url: formData.evidenceUrl || null,
        cp_points: type === 'cp' ? cpPoints : 1,
        status: 'pending',
      });

      if (error) throw error;

      toast.success(`${TYPE_LABELS[type]} enviado a validación`);
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['my_kpis'] });
      queryClient.invalidateQueries({ queryKey: ['pending_kpis'] });
      
      setFormData({ titulo: '', descripcion: '', evidenceUrl: '', cpActivity: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating KPI:', error);
      toast.error('Error al crear el KPI');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo {TYPE_LABELS[type]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder={TYPE_PLACEHOLDERS[type].titulo}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder={TYPE_PLACEHOLDERS[type].descripcion}
              rows={3}
            />
          </div>

          {type === 'cp' && (
            <div>
              <Label>Tipo de actividad *</Label>
              <Select 
                value={formData.cpActivity} 
                onValueChange={(v) => setFormData({ ...formData, cpActivity: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona actividad" />
                </SelectTrigger>
                <SelectContent>
                  {CP_ACTIVITIES.map((activity) => (
                    <SelectItem key={activity.value} value={activity.value}>
                      {activity.label} ({activity.points} pt{activity.points > 1 ? 's' : ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedActivity && (
                <p className="text-sm text-muted-foreground mt-1">
                  Esta actividad otorga <span className="font-semibold text-primary">{cpPoints} punto{cpPoints > 1 ? 's' : ''}</span>
                </p>
              )}
            </div>
          )}

          <div>
            <Label>Evidencia (URL Google Drive)</Label>
            <Input
              value={formData.evidenceUrl}
              onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
              placeholder="https://drive.google.com/..."
              type="url"
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
                  Enviando...
                </>
              ) : (
                'Enviar a validación'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
