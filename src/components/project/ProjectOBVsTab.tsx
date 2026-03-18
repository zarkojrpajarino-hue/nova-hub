import { memo, useState } from 'react';
import { Loader2, FileCheck, CheckCircle, Clock, XCircle, Users, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUpsertOBVParticipants } from '@/hooks/useNovaDataOptimized';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectOBVsTabProps {
  projectId: string;
}

interface OBVParticipantData {
  member_id: string;
  porcentaje: number | null;
}

interface OBVRawRow {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string | null;
  status: string | null;
  es_venta: boolean | null;
  facturacion: number | null;
  margen: number | null;
  owner_id: string;
  obv_participantes: OBVParticipantData[];
}

interface OBVWithOwner {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string | null;
  status: string | null;
  es_venta: boolean | null;
  facturacion: number | null;
  margen: number | null;
  owner_id: string;
  owner: { id: string; nombre: string; color: string } | null;
  // Non-owner contributors only (owner shown separately)
  participants: Array<{ member_id: string; porcentaje: number; nombre: string; color: string }>;
}

interface DraftParticipant {
  member_id: string;
  porcentaje: number;
  nombre: string;
  color: string;
}

function ProjectOBVsTabComponent({ projectId }: ProjectOBVsTabProps) {
  const { profile } = useAuth();

  const { data: obvs = [], isLoading } = useQuery<OBVWithOwner[]>({
    queryKey: ['project_obvs', projectId],
    queryFn: async () => {
      const { data: rawOBVs, error } = await supabase
        .from('obvs')
        .select('id, titulo, tipo, fecha, status, es_venta, facturacion, margen, owner_id, obv_participantes(member_id, porcentaje)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (rawOBVs ?? []) as unknown as OBVRawRow[];
      if (rows.length === 0) return [];

      // Collect all profile IDs (owners + participants) for one batched fetch
      const allProfileIds = new Set<string>();
      for (const obv of rows) {
        if (obv.owner_id) allProfileIds.add(obv.owner_id);
        for (const p of obv.obv_participantes ?? []) {
          allProfileIds.add(p.member_id);
        }
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, color')
        .in('id', [...allProfileIds]);

      type ProfileData = { id: string; nombre: string; color: string | null };
      const profileMap = new Map<string, ProfileData>(
        (profiles ?? []).map(p => [p.id, p]),
      );

      return rows.map(obv => {
        const ownerProfile = profileMap.get(obv.owner_id);
        const participants = (obv.obv_participantes ?? [])
          .filter(p => p.member_id !== obv.owner_id) // owner shown separately
          .map(p => {
            const pProfile = profileMap.get(p.member_id);
            return {
              member_id: p.member_id,
              porcentaje: p.porcentaje ?? 0,
              nombre: pProfile?.nombre ?? 'Desconocido',
              color: pProfile?.color ?? '#6366F1',
            };
          });

        return {
          id: obv.id,
          titulo: obv.titulo,
          tipo: obv.tipo,
          fecha: obv.fecha,
          status: obv.status,
          es_venta: obv.es_venta,
          facturacion: obv.facturacion,
          margen: obv.margen,
          owner_id: obv.owner_id,
          owner: ownerProfile
            ? { id: ownerProfile.id, nombre: ownerProfile.nombre, color: ownerProfile.color ?? '#6366F1' }
            : null,
          participants,
        };
      });
    },
  });

  // Project members for participant selector — only loaded when editing
  const [editingOBVId, setEditingOBVId] = useState<string | null>(null);
  const [draftParticipants, setDraftParticipants] = useState<DraftParticipant[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const { data: projectMembers = [] } = useQuery<Array<{ id: string; nombre: string; color: string }>>({
    queryKey: ['project-members-profiles', projectId],
    queryFn: async () => {
      const { data: pm } = await supabase
        .from('project_members')
        .select('member_id')
        .eq('project_id', projectId);

      if (!pm?.length) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, color')
        .in('id', pm.map(m => m.member_id));

      return (profiles ?? []).map(p => ({
        id: p.id,
        nombre: p.nombre,
        color: p.color ?? '#6366F1',
      }));
    },
    enabled: editingOBVId !== null,
  });

  const { mutate: upsertParticipants, isPending: isSaving } = useUpsertOBVParticipants();

  const startEditing = (obv: OBVWithOwner) => {
    setDraftParticipants(obv.participants.map(p => ({ ...p })));
    setSelectedMemberId('');
    setEditingOBVId(obv.id);
  };

  const cancelEditing = () => {
    setEditingOBVId(null);
    setDraftParticipants([]);
    setSelectedMemberId('');
  };

  const addDraftParticipant = (obv: OBVWithOwner) => {
    if (!selectedMemberId) return;
    if (selectedMemberId === obv.owner_id) return;
    if (draftParticipants.find(p => p.member_id === selectedMemberId)) return;
    const member = projectMembers.find(m => m.id === selectedMemberId);
    if (!member) return;
    setDraftParticipants(prev => [...prev, { member_id: member.id, porcentaje: 10, nombre: member.nombre, color: member.color }]);
    setSelectedMemberId('');
  };

  const removeDraftParticipant = (memberId: string) => {
    setDraftParticipants(prev => prev.filter(p => p.member_id !== memberId));
  };

  const updateDraftPct = (memberId: string, pct: number) => {
    const clamped = Math.min(99, Math.max(1, pct));
    setDraftParticipants(prev => prev.map(p => p.member_id === memberId ? { ...p, porcentaje: clamped } : p));
  };

  const saveParticipants = (obv: OBVWithOwner) => {
    const otherTotal = draftParticipants.reduce((sum, p) => sum + p.porcentaje, 0);
    if (otherTotal > 99) {
      toast.error('La suma de participantes no puede superar 99%');
      return;
    }
    const ownerPct = 100 - otherTotal;
    const allParticipants = [
      { member_id: obv.owner_id, porcentaje: ownerPct },
      ...draftParticipants.map(p => ({ member_id: p.member_id, porcentaje: p.porcentaje })),
    ];
    upsertParticipants(
      { obvId: obv.id, projectId, participants: allParticipants },
      {
        onSuccess: () => {
          toast.success('Crédito actualizado');
          cancelEditing();
        },
        onError: () => toast.error('Error al actualizar crédito'),
      },
    );
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'validated': return <CheckCircle size={16} className="text-success" />;
      case 'rejected': return <XCircle size={16} className="text-destructive" />;
      default: return <Clock size={16} className="text-warning" />;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'validated': return 'Validada';
      case 'rejected': return 'Rechazada';
      default: return 'Pendiente';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentOBV = editingOBVId ? obvs.find(o => o.id === editingOBVId) : null;

  // Available members to add (not already a participant, not the owner)
  const availableToAdd = currentOBV
    ? projectMembers.filter(
        m => m.id !== currentOBV.owner_id && !draftParticipants.find(p => p.member_id === m.id),
      )
    : [];

  const draftOtherTotal = draftParticipants.reduce((sum, p) => sum + p.porcentaje, 0);
  const ownerRemainingPct = 100 - draftOtherTotal;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <FileCheck size={18} className="text-primary" />
          <h3 className="font-semibold">OBVs del Proyecto</h3>
          <span className="ml-auto text-sm text-muted-foreground">{obvs.length} registradas</span>
        </div>

        {obvs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay OBVs registradas en este proyecto
          </div>
        ) : (
          <div className="divide-y divide-border">
            {obvs.map(obv => {
              const isOwner = profile?.id === obv.owner_id;
              const isEditing = editingOBVId === obv.id;

              return (
                <div key={obv.id}>
                  {/* Main row */}
                  <div className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Owner avatar */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold shrink-0"
                        style={{ background: obv.owner?.color || '#6366F1' }}
                      >
                        {obv.owner?.nombre?.charAt(0) || '?'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{obv.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {obv.owner?.nombre || 'Unknown'} • {obv.fecha || 'Sin fecha'}
                        </p>
                      </div>

                      {/* Type */}
                      <div className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase',
                        obv.tipo === 'exploracion' && 'bg-info/20 text-info',
                        obv.tipo === 'validacion' && 'bg-warning/20 text-warning',
                        obv.tipo === 'venta' && 'bg-success/20 text-success',
                      )}>
                        {obv.tipo}
                      </div>

                      {/* Sale amount */}
                      {obv.es_venta && (
                        <div className="text-right">
                          <p className="font-bold text-success">€{obv.facturacion || 0}</p>
                          <p className="text-xs text-muted-foreground">+€{obv.margen || 0} margen</p>
                        </div>
                      )}

                      {/* Status */}
                      <div className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                        obv.status === 'validated' && 'bg-success/20 text-success',
                        obv.status === 'rejected' && 'bg-destructive/20 text-destructive',
                        obv.status === 'pending' && 'bg-warning/20 text-warning',
                      )}>
                        {getStatusIcon(obv.status)}
                        {getStatusLabel(obv.status)}
                      </div>

                      {/* Share credit button — owner only */}
                      {isOwner && !isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground h-7 px-2"
                          onClick={() => startEditing(obv)}
                        >
                          <Users size={12} className="mr-1" />
                          Compartir crédito
                        </Button>
                      )}
                      {isOwner && isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground h-7 px-2"
                          onClick={cancelEditing}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>

                    {/* Participants display (non-editing, non-empty) */}
                    {!isEditing && obv.participants.length > 0 && (
                      <div className="mt-2 ml-14 flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">Compartido:</span>
                        {obv.participants.map(p => (
                          <span
                            key={p.member_id}
                            className="inline-flex items-center gap-1 text-xs bg-muted/40 rounded-md px-2 py-0.5"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: p.color }}
                            />
                            {p.nombre} {p.porcentaje}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inline participant editor */}
                  {isEditing && currentOBV && (
                    <div className="px-4 pb-4 bg-muted/20 border-t border-border">
                      <div className="pt-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Editar reparto de crédito
                        </p>

                        {/* Owner row (auto-computed, read-only) */}
                        <div className="flex items-center gap-3 p-2 bg-background rounded-lg">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-semibold shrink-0"
                            style={{ background: currentOBV.owner?.color || '#6366F1' }}
                          >
                            {currentOBV.owner?.nombre?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm flex-1">{currentOBV.owner?.nombre} <span className="text-muted-foreground">(propietario)</span></span>
                          <span className={cn(
                            'text-sm font-semibold tabular-nums',
                            ownerRemainingPct < 1 ? 'text-destructive' : 'text-muted-foreground',
                          )}>
                            {ownerRemainingPct}%
                          </span>
                        </div>

                        {/* Draft participants */}
                        {draftParticipants.map(p => (
                          <div key={p.member_id} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-semibold shrink-0"
                              style={{ background: p.color }}
                            >
                              {p.nombre?.charAt(0)}
                            </div>
                            <span className="text-sm flex-1">{p.nombre}</span>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={p.porcentaje}
                              onChange={e => updateDraftPct(p.member_id, Number(e.target.value))}
                              className="w-16 text-sm text-right bg-muted rounded px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                            <button
                              type="button"
                              onClick={() => removeDraftParticipant(p.member_id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {/* Add participant */}
                        {availableToAdd.length > 0 && (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedMemberId}
                              onChange={e => setSelectedMemberId(e.target.value)}
                              className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">Añadir colaborador...</option>
                              {availableToAdd.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre}</option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addDraftParticipant(currentOBV)}
                              disabled={!selectedMemberId}
                            >
                              Añadir
                            </Button>
                          </div>
                        )}

                        {/* Validation error */}
                        {draftOtherTotal > 99 && (
                          <p className="text-xs text-destructive">
                            La suma de participantes supera 99%. El propietario debe conservar al menos 1%.
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => saveParticipants(currentOBV)}
                            disabled={isSaving || ownerRemainingPct < 1}
                          >
                            {isSaving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                            Guardar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditing}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios
export const ProjectOBVsTab = memo(ProjectOBVsTabComponent);
