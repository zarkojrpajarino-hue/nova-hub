import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle2, XCircle, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface KPIValidationListProps {
  type: 'lp' | 'bp' | 'cp';
}

const TYPE_LABELS = {
  lp: 'Learning Path',
  bp: 'Book Point',
  cp: 'Community Point',
};

interface KPIWithOwner {
  id: string;
  titulo: string;
  descripcion: string | null;
  evidence_url: string | null;
  type: string;
  cp_points: number | null;
  created_at: string;
  owner: {
    id: string;
    nombre: string;
    color: string;
  };
  validations: Array<{
    validator_id: string;
    approved: boolean;
    comentario: string | null;
    validator_nombre: string;
  }>;
}

export function KPIValidationList({ type }: KPIValidationListProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [votingId, setVotingId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: pendingKPIs = [], isLoading } = useQuery({
    queryKey: ['pending_kpis', type, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Fetch pending KPIs of this type
      const { data: kpis, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('type', type)
        .eq('status', 'pending')
        .neq('owner_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!kpis?.length) return [];

      // Fetch validations
      const kpiIds = kpis.map(k => k.id);
      const { data: validaciones } = await supabase
        .from('kpi_validaciones')
        .select('*')
        .in('kpi_id', kpiIds);

      // Fetch owners
      const ownerIds = [...new Set(kpis.map(k => k.owner_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, color')
        .in('id', ownerIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Fetch validator names
      const validatorIds = [...new Set((validaciones || []).map(v => v.validator_id))];
      const { data: validators } = await supabase
        .from('profiles')
        .select('id, nombre')
        .in('id', validatorIds);
      
      const validatorsMap = new Map(validators?.map(v => [v.id, v.nombre]) || []);

      // Map and filter
      const result: KPIWithOwner[] = kpis
        .map(kpi => {
          const owner = profilesMap.get(kpi.owner_id);
          const kpiValidations = (validaciones || [])
            .filter(v => v.kpi_id === kpi.id)
            .map(v => ({
              validator_id: v.validator_id,
              approved: v.approved || false,
              comentario: v.comentario,
              validator_nombre: validatorsMap.get(v.validator_id) || 'Desconocido',
            }));
          
          return {
            id: kpi.id,
            titulo: kpi.titulo,
            descripcion: kpi.descripcion,
            evidence_url: kpi.evidence_url,
            type: kpi.type,
            cp_points: kpi.cp_points,
            created_at: kpi.created_at || '',
            owner: owner || { id: kpi.owner_id, nombre: 'Desconocido', color: '#6366F1' },
            validations: kpiValidations,
          };
        })
        .filter(kpi => !kpi.validations.some(v => v.validator_id === profile.id));

      return result;
    },
    enabled: !!profile?.id,
  });

  const handleVote = async (kpiId: string, approved: boolean) => {
    if (!profile?.id) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('kpi_validaciones').insert({
        kpi_id: kpiId,
        validator_id: profile.id,
        approved,
        comentario: comment.trim() || null,
      });

      if (error) throw error;

      toast.success(approved ? 'KPI aprobado' : 'KPI rechazado');
      queryClient.invalidateQueries({ queryKey: ['pending_kpis'] });
      queryClient.invalidateQueries({ queryKey: ['member_stats'] });
      
      setVotingId(null);
      setComment('');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Error al registrar el voto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (pendingKPIs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No hay {TYPE_LABELS[type]}s pendientes de validar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingKPIs.map((kpi) => (
        <div
          key={kpi.id}
          className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start gap-4">
            {/* Owner avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: kpi.owner.color }}
            >
              {kpi.owner.nombre.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{kpi.titulo}</h4>
                {kpi.type === 'cp' && kpi.cp_points && kpi.cp_points > 1 && (
                  <Badge variant="outline" className="text-xs">
                    {kpi.cp_points} pts
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                Por <span className="font-medium">{kpi.owner.nombre}</span>
              </p>

              {kpi.descripcion && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {kpi.descripcion}
                </p>
              )}

              {/* Evidence link */}
              {kpi.evidence_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(kpi.evidence_url!, '_blank')}
                  className="mb-3"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver evidencia
                </Button>
              )}

              {/* Existing validations */}
              {kpi.validations.length > 0 && (
                <div className="mb-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Votos:</p>
                  {kpi.validations.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {v.approved ? (
                        <CheckCircle2 className="w-3 h-3 text-success" />
                      ) : (
                        <XCircle className="w-3 h-3 text-destructive" />
                      )}
                      <span>{v.validator_nombre}</span>
                      {v.comentario && (
                        <span className="text-muted-foreground">- "{v.comentario}"</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Voting form */}
              {votingId === kpi.id ? (
                <div className="space-y-3 pt-2 border-t border-border">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comentario opcional..."
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVotingId(null);
                        setComment('');
                      }}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleVote(kpi.id, false)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Rechazar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleVote(kpi.id, true)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Aprobar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVotingId(kpi.id)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Validar
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
