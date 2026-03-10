import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Star, BookOpen, DollarSign, Trash2,
  CheckCircle2, Clock, AlertCircle, Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AcquisitionChannel {
  id: string;
  project_id: string;
  channel_type: string;
  is_primary: boolean;
  documented_playbook: boolean;
  estimated_cac: number | null;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<string, string> = {
  inbound:     'SEO / Orgánico',
  content:     'Contenido (blog, podcast)',
  outbound:    'Cold outreach',
  paid_ads:    'Publicidad pagada',
  referral:    'Referidos',
  partnership: 'Partnerships',
  community:   'Comunidad / Eventos',
  product_led: 'Product-led (freemium/viral)',
  other:       'Otro',
};

const CHANNEL_TYPES = Object.keys(CHANNEL_LABELS);

// Days threshold for "validado recientemente" (matches O2.3 window)
const VALIDATION_WINDOW_DAYS = 60;

// ─── Helper ──────────────────────────────────────────────────────────────────

function isValidatedRecently(lastValidatedAt: string | null): boolean {
  if (!lastValidatedAt) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - VALIDATION_WINDOW_DAYS);
  return new Date(lastValidatedAt) >= cutoff;
}

function o23Score(channel: AcquisitionChannel): number {
  let score = 30;
  if (channel.documented_playbook)              score += 30;
  if (isValidatedRecently(channel.last_validated_at)) score += 25;
  if (channel.estimated_cac !== null)            score += 15;
  return score;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AcquisitionChannelEditorProps {
  projectId: string;
}

export function AcquisitionChannelEditor({ projectId }: AcquisitionChannelEditorProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCacId, setEditingCacId] = useState<string | null>(null);
  const [cacDraft, setCacDraft] = useState('');

  const [formData, setFormData] = useState({
    channel_type: '',
    is_primary: false,
    documented_playbook: false,
    estimated_cac: '',
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['acquisition_channels', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_acquisition_channel')
        .select('*')
        .eq('project_id', projectId)
        .order('is_primary', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as AcquisitionChannel[];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['acquisition_channels', projectId] });

  // ── Add channel ────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!formData.channel_type) {
      toast.error('Selecciona un tipo de canal');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_acquisition_channel')
        .insert({
          project_id:          projectId,
          channel_type:        formData.channel_type,
          is_primary:          formData.is_primary,
          documented_playbook: formData.documented_playbook,
          estimated_cac:       formData.estimated_cac ? parseFloat(formData.estimated_cac) : null,
        });
      if (error) throw error;

      toast.success('Canal añadido');
      invalidate();
      setShowForm(false);
      setFormData({ channel_type: '', is_primary: false, documented_playbook: false, estimated_cac: '' });
    } catch {
      toast.error('Error al añadir canal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Validar hoy ────────────────────────────────────────────────────────────
  const handleValidateNow = async (channelId: string) => {
    const { error } = await supabase
      .from('project_acquisition_channel')
      .update({ last_validated_at: new Date().toISOString() })
      .eq('id', channelId);
    if (error) {
      toast.error('Error al actualizar');
    } else {
      toast.success('Canal marcado como validado hoy');
      invalidate();
    }
  };

  // ── Toggle fields ──────────────────────────────────────────────────────────
  const handleToggle = async (
    channelId: string,
    field: 'is_primary' | 'documented_playbook',
    current: boolean,
  ) => {
    const { error } = await supabase
      .from('project_acquisition_channel')
      .update({ [field]: !current })
      .eq('id', channelId);
    if (error) {
      toast.error('Error al actualizar');
    } else {
      invalidate();
    }
  };

  // ── Save CAC ───────────────────────────────────────────────────────────────
  const handleSaveCac = async (channelId: string) => {
    const value = cacDraft.trim() === '' ? null : parseFloat(cacDraft);
    if (cacDraft.trim() !== '' && isNaN(value as number)) {
      toast.error('CAC debe ser un número');
      return;
    }
    const { error } = await supabase
      .from('project_acquisition_channel')
      .update({ estimated_cac: value })
      .eq('id', channelId);
    if (error) {
      toast.error('Error al guardar CAC');
    } else {
      toast.success('CAC actualizado');
      invalidate();
    }
    setEditingCacId(null);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (channelId: string) => {
    const { error } = await supabase
      .from('project_acquisition_channel')
      .delete()
      .eq('id', channelId);
    if (error) {
      toast.error('Error al eliminar canal');
    } else {
      toast.success('Canal eliminado');
      invalidate();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Radio size={18} className="text-primary" />
          Canales de adquisición
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
        >
          <Plus size={14} className="mr-1" />
          Nuevo canal
        </Button>
      </div>

      {/* Empty state */}
      {!isLoading && channels.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Sin canales declarados. Añade tu canal principal para que el motor pueda calcular O2.3.
        </p>
      )}

      {/* Channel list */}
      <div className="space-y-3">
        {channels.map((ch) => {
          const validRecently = isValidatedRecently(ch.last_validated_at);
          const score = ch.is_primary ? o23Score(ch) : null;

          return (
            <div
              key={ch.id}
              className="border border-border rounded-xl p-4 space-y-3"
            >
              {/* Row 1: Label + badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {CHANNEL_LABELS[ch.channel_type] ?? ch.channel_type}
                  </span>
                  {ch.is_primary && (
                    <Badge variant="default" className="text-xs">
                      <Star size={10} className="mr-1" />
                      Principal
                    </Badge>
                  )}
                  {score !== null && (
                    <Badge
                      variant={score >= 75 ? 'default' : score >= 50 ? 'secondary' : 'outline'}
                      className="text-xs font-mono"
                    >
                      O2.3: {score}/100
                    </Badge>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                  onClick={() => handleDelete(ch.id)}
                  title="Eliminar canal"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              {/* Row 2: Indicators */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {/* Primary toggle */}
                <button
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  onClick={() => handleToggle(ch.id, 'is_primary', ch.is_primary)}
                  title="Marcar como canal principal"
                >
                  <Star
                    size={12}
                    className={ch.is_primary ? 'text-amber-500 fill-amber-500' : ''}
                  />
                  {ch.is_primary ? 'Principal' : 'Secundario'}
                </button>

                {/* Playbook toggle */}
                <button
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  onClick={() => handleToggle(ch.id, 'documented_playbook', ch.documented_playbook)}
                  title="Toggle playbook documentado"
                >
                  <BookOpen
                    size={12}
                    className={ch.documented_playbook ? 'text-primary' : ''}
                  />
                  {ch.documented_playbook ? 'Playbook' : 'Sin playbook'}
                </button>

                {/* CAC */}
                {editingCacId === ch.id ? (
                  <div className="flex items-center gap-1">
                    <DollarSign size={12} />
                    <Input
                      className="h-6 w-24 text-xs py-0 px-1"
                      value={cacDraft}
                      onChange={(e) => setCacDraft(e.target.value)}
                      placeholder="CAC en €"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveCac(ch.id);
                        if (e.key === 'Escape') setEditingCacId(null);
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleSaveCac(ch.id)}
                    >
                      ✓
                    </Button>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => {
                      setEditingCacId(ch.id);
                      setCacDraft(ch.estimated_cac !== null ? String(ch.estimated_cac) : '');
                    }}
                    title="Editar CAC estimado"
                  >
                    <DollarSign size={12} />
                    {ch.estimated_cac !== null ? `€${ch.estimated_cac} CAC` : 'Sin CAC'}
                  </button>
                )}

                {/* Validation status */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {validRecently ? (
                    <CheckCircle2 size={12} className="text-success" />
                  ) : ch.last_validated_at ? (
                    <AlertCircle size={12} className="text-warning" />
                  ) : (
                    <Clock size={12} />
                  )}
                  <span>
                    {ch.last_validated_at
                      ? formatDistanceToNow(new Date(ch.last_validated_at), {
                          addSuffix: true,
                          locale: es,
                        })
                      : 'Sin validar'}
                  </span>
                </div>
              </div>

              {/* Row 3: Validar hoy button */}
              {!validRecently && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => handleValidateNow(ch.id)}
                >
                  <CheckCircle2 size={12} className="mr-1.5" />
                  Validado hoy
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add channel dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo canal de adquisición</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label>Tipo de canal *</Label>
              <Select
                value={formData.channel_type}
                onValueChange={(v) => setFormData({ ...formData, channel_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CHANNEL_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Canal principal</Label>
                <p className="text-xs text-muted-foreground">El canal que genera más clientes ahora</p>
              </div>
              <Switch
                checked={formData.is_primary}
                onCheckedChange={(v) => setFormData({ ...formData, is_primary: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Playbook documentado</Label>
                <p className="text-xs text-muted-foreground">Tienes instrucciones repetibles</p>
              </div>
              <Switch
                checked={formData.documented_playbook}
                onCheckedChange={(v) => setFormData({ ...formData, documented_playbook: v })}
              />
            </div>

            <div>
              <Label>CAC estimado (€)</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 120"
                value={formData.estimated_cac}
                onChange={(e) => setFormData({ ...formData, estimated_cac: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Coste de adquisición por cliente. Opcional.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleAdd}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Añadiendo...' : 'Añadir canal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
