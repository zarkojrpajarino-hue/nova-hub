import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { useCreateInsight, useUpdateInsight, type UserInsight } from '@/hooks/useDevelopment';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useNovaDataOptimized';
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';
interface InsightFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insight?: UserInsight;
  defaultProjectId?: string;
  defaultRoleContext?: string;
}

function getTIPOS(t: (k: string) => string) {
  return [
  { value: 'aprendizaje', label: t('development.aprendizaje') },
  { value: 'reflexion', label: t('development.reflexión') },
  { value: 'error', label: t('development.error') },
  { value: 'exito', label: t('development.éxito') },
  { value: 'idea', label: t('development.idea') },
];
}

export function InsightForm({ 
  open, 
  onOpenChange, 
  insight, 
  defaultProjectId,
  defaultRoleContext 
}: InsightFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const createInsight = useCreateInsight();
  const updateInsight = useUpdateInsight();

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [tipo, setTipo] = useState<UserInsight['tipo']>('aprendizaje');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [roleContext, setRoleContext] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  useEffect(() => {
    if (insight) {
      setTitulo(insight.titulo);
      setContenido(insight.contenido);
      setTipo(insight.tipo);
      setProjectId(insight.project_id);
      setRoleContext(insight.role_context || '');
      setTags(insight.tags);
      setIsPrivate(insight.is_private);
    } else {
      setTitulo('');
      setContenido('');
      setTipo('aprendizaje');
      setProjectId(defaultProjectId || null);
      setRoleContext(defaultRoleContext || '');
      setTags([]);
      setIsPrivate(true);
    }
  }, [insight, defaultProjectId, defaultRoleContext, open]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !contenido.trim() || !profile?.id) {
      toast.error(t('development.completaTítuloYContenido'));
      return;
    }

    try {
      if (insight) {
        await updateInsight.mutateAsync({
          id: insight.id,
          titulo,
          contenido,
          tipo,
          project_id: projectId,
          role_context: roleContext || null,
          tags,
          is_private: isPrivate,
        });
        toast.success(t('development.insightActualizado'));
      } else {
        await createInsight.mutateAsync({
          user_id: profile.id,
          titulo,
          contenido,
          tipo,
          project_id: projectId,
          role_context: roleContext || null,
          tags,
          is_private: isPrivate,
        });
        toast.success(t('development.insightGuardado'));
      }
      onOpenChange(false);
    } catch (_error) {
      toast.error(t('development.errorAlGuardarEl'));
    }
  };

  const isLoading = createInsight.isPending || updateInsight.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {insight ? 'Editar Insight': t('development.nuevoInsight')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="titulo">{t('development.título')}</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder={t('development.ejDescubríQueLos')}
            />
          </div>

          <div>
            <Label htmlFor="contenido">{t('development.contenido')}</Label>
            <Textarea
              id="contenido"
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              placeholder={t('development.describeTuAprendizajeReflexión')}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('development.tipo')}</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as UserInsight['tipo'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTIPOS(t).map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Proyecto (opcional)</Label>
              <Select value={projectId || 'none'} onValueChange={(v) => setProjectId(v === 'none' ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('development.sinProyecto0')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('development.sinProyecto')}</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.icon} {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="roleContext">Rol (contexto)</Label>
            <Input
              id="roleContext"
              value={roleContext}
              onChange={e => setRoleContext(e.target.value)}
              placeholder={t('development.ejComercialCloserTécnico')}
            />
          </div>

          <div>
            <Label>{t('development.tags')}</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder={t('development.añadirTag')}
                onKeyDown={e => e.key === t('development.enter') && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>{t('development.añadir')}</Button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  #{tag}
                  <button onClick={() => handleRemoveTag(tag)}>
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private" className="text-sm">
                Privado (solo visible para ti)
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('development.cancelar')}</Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {insight ? 'Actualizar': t('development.guardar')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
