import { memo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Clock, CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface KPIListProps {
  type: 'lp' | 'bp' | 'cp';
}

interface KPIData {
  id: string;
  titulo: string;
  descripcion?: string | null;
  status?: string;
  created_at?: string | null;
  evidence_url?: string | null;
  cp_points?: number | null;
}

const TYPE_LABELS = {
  lp: 'Learning Path',
  bp: 'Book Point',
  cp: 'Community Point',
};

// Helper functions moved outside component for better performance
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'validated':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Clock className="w-4 h-4 text-warning" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'validated':
      return 'Validado';
    case 'rejected':
      return 'Rechazado';
    default:
      return 'Pendiente';
  }
};

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'validated':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// Memoized KPI item component
const KPIItem = memo(function KPIItem({
  kpi,
  type,
  onOpenEvidence,
}: {
  kpi: KPIData;
  type: 'lp' | 'bp' | 'cp';
  onOpenEvidence?: (url: string) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon(kpi.status || 'pending')}
            <h4 className="font-medium truncate">{kpi.titulo}</h4>
            {type === 'cp' && kpi.cp_points && kpi.cp_points > 1 && (
              <Badge variant="outline" className="text-xs">
                {kpi.cp_points} pts
              </Badge>
            )}
          </div>

          {kpi.descripcion && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {kpi.descripcion}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Badge variant={getStatusVariant(kpi.status || 'pending')}>
              {getStatusLabel(kpi.status || 'pending')}
            </Badge>

            <span className="text-xs text-muted-foreground">
              {new Date(kpi.created_at || '').toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {kpi.evidence_url && onOpenEvidence && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenEvidence(kpi.evidence_url)}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

export function KPIList({ type }: KPIListProps) {
  const { profile } = useAuth();

  const { data: kpis = [], isLoading } = useQuery({
    queryKey: ['my_kpis', profile?.id, type],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('owner_id', profile.id)
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const handleOpenEvidence = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  // IMPORTANT: All hooks must be called before any conditional returns
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: kpis.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  if (kpis.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tienes {TYPE_LABELS[type]}s registrados</p>
        <p className="text-sm mt-1">¡Sube tu primero usando el botón de arriba!</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
            className="px-1"
          >
            <KPIItem
              kpi={kpis[virtualItem.index]}
              type={type}
              onOpenEvidence={handleOpenEvidence}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
