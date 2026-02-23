/**
 * CREATE PROJECT DIALOG
 *
 * Diálogo para crear un nuevo proyecto con wizard básico.
 * Después del wizard, redirige al onboarding completo.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const ICONS = ['🚀', '💡', '🎯', '⚡', '🔥', '✨', '🌟', '💎', '🎨', '🏆', '📊', '💼'];
const COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#6366F1', // indigo
];

export function CreateProjectDialog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form data
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [color, setColor] = useState('#3B82F6');
  const [tipo, setTipo] = useState<'validacion' | 'operacion'>('validacion');

  const handleCreate = async () => {
    // Validations
    if (!nombre.trim()) {
      toast.error('El nombre del proyecto es requerido');
      return;
    }

    if (nombre.length < 3) {
      toast.error('El nombre debe tener al menos 3 caracteres');
      return;
    }

    setIsCreating(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No autenticado');
        setIsCreating(false);
        return;
      }

      // Get user's profile (member_id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!profile) {
        toast.error('Perfil no encontrado');
        setIsCreating(false);
        return;
      }

      // Create project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          icon,
          color,
          tipo,
          fase: 'idea',
          onboarding_completed: false,
          created_by: profile.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      toast.success('¡Proyecto creado! Completando onboarding...');

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Close dialog
      setOpen(false);

      // Reset form
      setNombre('');
      setDescripcion('');
      setIcon('🚀');
      setColor('#3B82F6');
      setTipo('validacion');

      // Navigate to project page (will show onboarding wizard)
      navigate(`/proyecto/${newProject.id}`);
    } catch (_error) {
      toast.error('Error al crear el proyecto');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Nuevo Proyecto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Configura los datos básicos. Después completarás el onboarding adaptativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="nombre">Nombre del Proyecto *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Nova AI Assistant"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={100}
              className="mt-2"
            />
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Breve descripción del proyecto..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={500}
              className="mt-2 min-h-[80px]"
            />
          </div>

          {/* Tipo */}
          <div>
            <Label htmlFor="tipo">Tipo de Proyecto *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="validacion">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">🧪 Validación</span>
                    <span className="text-xs text-muted-foreground">
                      Para proyectos en fase de exploración y validación
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="operacion">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">🚀 Operación</span>
                    <span className="text-xs text-muted-foreground">
                      Para proyectos con clientes y operación establecida
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icono</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                      icon === i
                        ? 'bg-primary text-primary-foreground scale-110'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${color}20` }}
              >
                {icon}
              </div>
              <div>
                <p className="font-semibold">{nombre || 'Nombre del proyecto'}</p>
                <p className="text-sm text-muted-foreground">
                  {descripcion || 'Sin descripción'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !nombre.trim()}>
            {isCreating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Crear Proyecto
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
