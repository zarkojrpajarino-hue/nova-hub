import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRightLeft, TrendingUp, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles, useProjectMembers } from '@/hooks/useNovaData';
import { toast } from 'sonner';

interface Suggestion {
  user1_id: string;
  user2_id: string;
  role1: string;
  role2: string;
  project1_id: string;
  project2_id: string;
  score: number;
  recommendation: string;
  risks: string[];
}

const ROLE_LABELS: Record<string, string> = {
  sales: 'Sales',
  finance: 'Finance',
  ai_tech: 'IA/Tech',
  marketing: 'Marketing',
  operations: 'Operations',
  strategy: 'Strategy',
};

export function AIRotationSuggestions({ projectId }: { projectId?: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: profiles = [] } = useProfiles();
  const { data: allMembers = [] } = useProjectMembers();
  
  // Filter members by project if projectId is provided
  const members = projectId 
    ? allMembers.filter(m => m.project_id === projectId)
    : allMembers;

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newSuggestions: Suggestion[] = [];
      
      // Get relevant members with accepted roles
      const relevantMembers = members.filter(m => m.role_accepted);
      
      // Generate unique pairs
      for (let i = 0; i < relevantMembers.length; i++) {
        for (let j = i + 1; j < relevantMembers.length; j++) {
          const m1 = relevantMembers[i];
          const m2 = relevantMembers[j];
          
          // Only suggest swaps between different roles
          if (m1.role && m2.role && m1.role !== m2.role) {
            try {
              const { data, error: rpcError } = await supabase.rpc('calculate_rotation_compatibility', {
                p_user1_id: m1.member_id,
                p_user2_id: m2.member_id,
                p_role1: m1.role,
                p_role2: m2.role,
              });
              
              if (rpcError) {
                console.warn('Error calculating compatibility:', rpcError);
                continue;
              }
              
              // Only include suggestions with score >= 50
              if (data && typeof data === 'object' && 'score' in data && (data.score as number) >= 50) {
                const resultData = data as Record<string, unknown>;
                const risks = Array.isArray(resultData.risks) 
                  ? (resultData.risks as unknown[]).map(r => String(r))
                  : [];
                
                newSuggestions.push({
                  user1_id: m1.member_id,
                  user2_id: m2.member_id,
                  role1: m1.role,
                  role2: m2.role,
                  project1_id: m1.project_id,
                  project2_id: m2.project_id,
                  score: resultData.score as number,
                  recommendation: (resultData.recommendation as string) || 'neutral',
                  risks,
                });
              }
            } catch (e) {
              console.warn('Error calculating pair compatibility:', e);
            }
          }
        }
      }
      
      // Sort by score descending and take top 5
      newSuggestions.sort((a, b) => b.score - a.score);
      setSuggestions(newSuggestions.slice(0, 5));
    } catch (e) {
      console.error('Error generating suggestions:', e);
      setError('Error al generar sugerencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (members.length > 0) {
      generateSuggestions();
    } else {
      setLoading(false);
    }
  }, [members.length, projectId]);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'highly_recommended': return 'bg-green-500/15 text-green-600';
      case 'recommended': return 'bg-blue-500/15 text-blue-600';
      case 'neutral': return 'bg-gray-500/15 text-gray-600';
      default: return 'bg-red-500/15 text-red-600';
    }
  };

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case 'highly_recommended': return 'Muy recomendado';
      case 'recommended': return 'Recomendado';
      case 'neutral': return 'Neutral';
      default: return 'No recomendado';
    }
  };

  const getUserName = (id: string) => 
    profiles.find(p => p.id === id)?.nombre || 'Usuario';

  const handleProposeSuggestion = async (suggestion: Suggestion) => {
    toast.info('Para proponer este intercambio, usa el botón "Nueva Solicitud" y selecciona al compañero.');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Sparkles className="w-8 h-8 mx-auto animate-pulse text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Analizando compatibilidades...</p>
          <Loader2 className="w-4 h-4 mx-auto mt-2 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive/50 mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={generateSuggestions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay sugerencias de rotación en este momento
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Las sugerencias aparecen cuando hay miembros con roles aceptados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Sugerencias de Rotación IA
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={generateSuggestions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((s, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3 hover:bg-muted/30 transition-colors">
            {/* Users and roles */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{getUserName(s.user1_id)}</span>
                <Badge variant="outline" className="text-xs">
                  {ROLE_LABELS[s.role1] || s.role1}
                </Badge>
                <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{getUserName(s.user2_id)}</span>
                <Badge variant="outline" className="text-xs">
                  {ROLE_LABELS[s.role2] || s.role2}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-bold text-lg">{Math.round(s.score)}%</span>
              </div>
            </div>

            {/* Recommendation badge */}
            <div className="flex items-center gap-2">
              <Badge className={getRecommendationColor(s.recommendation)}>
                {getRecommendationLabel(s.recommendation)}
              </Badge>
            </div>

            {/* Risks */}
            {s.risks.length > 0 && (
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {s.risks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}

            {/* Action */}
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => handleProposeSuggestion(s)}
            >
              Proponer Intercambio
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
