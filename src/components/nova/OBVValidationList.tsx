import { useState, memo, useCallback } from 'react';
import { Check, X, Loader2, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EvidenceViewer } from '@/components/evidence/EvidenceViewer';

interface OBV {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  fecha: string;
  evidence_url: string | null;
  es_venta: boolean;
  facturacion: number | null;
  margen: number | null;
  producto: string | null;
  status: string;
  owner: {
    id: string;
    nombre: string;
    color: string;
  };
  project: {
    nombre: string;
    icon: string;
    color: string;
  } | null;
  validations: {
    validator_id: string;
    approved: boolean;
    comentario: string | null;
    validator_nombre: string;
  }[];
}

// Memoized OBV Card component to prevent unnecessary re-renders
const OBVCard = memo(function OBVCard({
  obv,
  isVoting,
  comentario,
  isSubmitting,
  onStartVoting,
  onCancelVoting,
  onCommentChange,
  onConfirmReject,
  onVote,
}: {
  obv: OBV;
  isVoting: boolean;
  comentario: string;
  isSubmitting: boolean;
  onStartVoting: () => void;
  onCancelVoting: () => void;
  onCommentChange: (value: string) => void;
  onConfirmReject: () => void;
  onVote: (approved: boolean) => void;
}) {
  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in"
    >
      <div className="p-5 border-b border-border flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
          style={{ background: obv.owner.color }}
        >
          {obv.owner.nombre.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold">{obv.titulo}</p>
          <p className="text-sm text-muted-foreground">
            {obv.owner.nombre} • {obv.fecha}
          </p>
        </div>

        <div className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase",
          obv.tipo === 'exploracion' && "bg-info/20 text-info",
          obv.tipo === 'validacion' && "bg-warning/20 text-warning",
          obv.tipo === 'venta' && "bg-success/20 text-success",
        )}>
          {obv.tipo}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {obv.descripcion && (
          <p className="text-sm text-muted-foreground">{obv.descripcion}</p>
        )}

        {obv.project && (
          <div className="flex items-center gap-2">
            <span className="text-lg">{obv.project.icon}</span>
            <span className="text-sm font-medium" style={{ color: obv.project.color }}>
              {obv.project.nombre}
            </span>
          </div>
        )}

        {obv.es_venta && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground">Producto</p>
              <p className="font-medium">{obv.producto}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Facturación</p>
              <p className="font-bold text-success">€{obv.facturacion}</p>
            </div>
          </div>
        )}

        {obv.evidence_url && (
          <EvidenceViewer url={obv.evidence_url} compact />
        )}

        {obv.validations.length > 0 && (
          <div className="flex gap-2">
            {obv.validations.map((v, i) => (
              <div
                key={i}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5",
                  v.approved ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                )}
              >
                {v.approved ? <Check size={12} /> : <X size={12} />}
                {v.validator_nombre}
              </div>
            ))}
          </div>
        )}

        {isVoting ? (
          <div className="space-y-3 pt-3 border-t border-border">
            <Textarea
              placeholder="Comentario opcional..."
              value={comentario}
              onChange={e => onCommentChange(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancelVoting}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                onClick={onConfirmReject}
                disabled={isSubmitting}
              >
                <X size={16} className="mr-1" />
                Rechazar
              </Button>
              <Button
                className="flex-1 bg-success hover:bg-success/90"
                onClick={() => onVote(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <><Check size={16} className="mr-1" /> Aprobar</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end pt-3 border-t border-border">
            <Button onClick={onStartVoting}>
              Validar OBV
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export function OBVValidationList() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [votingId, setVotingId] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmReject, setConfirmReject] = useState<string | null>(null);

  const { data: pendingOBVs = [], isLoading } = useQuery({
    queryKey: ['pending_obvs_for_validation'],
    queryFn: async () => {
      const { data: obvs, error } = await supabase
        .from('obvs')
        .select(`
          id, titulo, descripcion, tipo, fecha, evidence_url, 
          es_venta, facturacion, margen, producto, status, owner_id, project_id
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const obvIds = obvs?.map(o => o.id) || [];
      const { data: validations } = await supabase
        .from('obv_validaciones')
        .select('obv_id, validator_id, approved, comentario')
        .in('obv_id', obvIds);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, color');

      const { data: projects } = await supabase
        .from('projects')
        .select('id, nombre, icon, color');

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const projectMap = new Map(projects?.map(p => [p.id, p]) || []);

      return obvs?.map(obv => {
        const obvValidations = validations?.filter(v => v.obv_id === obv.id) || [];
        const owner = profileMap.get(obv.owner_id);
        const project = projectMap.get(obv.project_id || '');

        return {
          ...obv,
          owner: owner ? { id: owner.id, nombre: owner.nombre, color: owner.color } : { id: '', nombre: 'Unknown', color: '#6366F1' },
          project: project ? { nombre: project.nombre, icon: project.icon, color: project.color } : null,
          validations: obvValidations.map(v => ({
            ...v,
            validator_nombre: profileMap.get(v.validator_id)?.nombre || 'Unknown',
          })),
        };
      }).filter(obv => {
        if (obv.owner_id === profile?.id) return false;
        const alreadyVoted = obv.validations.some(v => v.validator_id === profile?.id);
        return !alreadyVoted;
      }) as OBV[];
    },
    enabled: !!profile?.id,
  });

  const handleVote = useCallback(async (obvId: string, approved: boolean) => {
    if (!profile?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('obv_validaciones')
        .insert({
          obv_id: obvId,
          validator_id: profile.id,
          approved,
          comentario: comentario || null,
        });

      if (error) throw error;

      toast.success(approved ? '✅ OBV aprobada correctamente' : '❌ OBV rechazada');
      setVotingId(null);
      setComentario('');
      setConfirmReject(null);
      queryClient.invalidateQueries({ queryKey: ['pending_obvs_for_validation'] });
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Error al votar. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }, [profile?.id, comentario, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <SkeletonCard key={i} rows={4} />
        ))}
      </div>
    );
  }

  if (pendingOBVs.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl">
        <EmptyState
          icon={FileCheck}
          title="¡Todo al día!"
          description="No hay OBVs pendientes de validar. Vuelve más tarde cuando tus compañeros suban nuevas OBVs."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingOBVs.map(obv => (
        <OBVCard
          key={obv.id}
          obv={obv}
          isVoting={votingId === obv.id}
          comentario={comentario}
          isSubmitting={isSubmitting}
          onStartVoting={useCallback(() => setVotingId(obv.id), [obv.id])}
          onCancelVoting={useCallback(() => setVotingId(null), [])}
          onCommentChange={useCallback((value: string) => setComentario(value), [])}
          onConfirmReject={useCallback(() => setConfirmReject(obv.id), [obv.id])}
          onVote={useCallback((approved: boolean) => handleVote(obv.id, approved), [obv.id, handleVote])}
        />
      ))}

      {/* Confirm Reject Dialog */}
      <ConfirmDialog
        open={!!confirmReject}
        onOpenChange={() => setConfirmReject(null)}
        title="¿Rechazar esta OBV?"
        description="Esta acción notificará al propietario de la OBV. Asegúrate de haber dejado un comentario explicando el motivo del rechazo."
        confirmLabel="Sí, rechazar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => confirmReject && handleVote(confirmReject, false)}
        isLoading={isSubmitting}
      />
    </div>
  );
}