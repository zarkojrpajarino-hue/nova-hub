/**
 * CHALLENGE CHECKER
 *
 * Verifica en tiempo real si un usuario cumple los 8 requisitos
 * estrictos para desafiar a un Master en un rol específico
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StartChallengeDialog } from './StartChallengeDialog';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  TrendingUp,
  Clock,
  Target,
  MessageSquare,
  FileCheck,
  FolderKanban,
  BarChart3,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChallengeCheckerProps {
  role: string;
  currentUserId: string;
  onChallengeSuccess?: () => void;
}

interface RequirementCheck {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  met: boolean;
  current: number | string;
  required: number | string;
  progress: number; // 0-100
}

export function ChallengeChecker({ role, currentUserId, onChallengeSuccess }: ChallengeCheckerProps) {
  const [requirements, setRequirements] = useState<RequirementCheck[]>([]);
  const [canChallenge, setCanChallenge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMaster, setCurrentMaster] = useState<{ nombre: string; fit_score: number } | null>(null);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);

  useEffect(() => {
    loadRequirements();
  }, [role, currentUserId]);

  const loadRequirements = async () => {
    try {
      // Call the can_challenge_master function
      const { data, error } = await supabase.rpc('can_challenge_master', {
        p_member_id: currentUserId,
        p_role: role,
      });

      if (error) throw error;

      // Parse the result
      const result = data || {};

      const checks: RequirementCheck[] = [
        {
          id: 'fit_score',
          label: 'Fit Score ≥ 4.2',
          description: 'Necesitas un Fit Score mínimo de 4.2/5.0 en este rol',
          icon: TrendingUp,
          met: result.fit_score >= 4.2,
          current: result.fit_score?.toFixed(1) || '0.0',
          required: '4.2',
          progress: Math.min(100, (result.fit_score / 4.2) * 100),
        },
        {
          id: 'weeks',
          label: 'Experiencia ≥ 4 semanas',
          description: 'Debes haber explorado este rol durante al menos 4 semanas',
          icon: Clock,
          met: result.weeks_explored >= 4,
          current: result.weeks_explored || 0,
          required: 4,
          progress: Math.min(100, (result.weeks_explored / 4) * 100),
        },
        {
          id: 'ranking',
          label: 'Top 3 Ranking',
          description: 'Debes estar en el Top 3 del ranking de este rol',
          icon: Trophy,
          met: result.ranking > 0 && result.ranking <= 3,
          current: result.ranking > 0 ? `#${result.ranking}` : 'N/A',
          required: '≤ #3',
          progress: result.ranking > 0 ? Math.max(0, 100 - (result.ranking - 1) * 33.33) : 0,
        },
        {
          id: 'tasks_on_time',
          label: 'Tareas a tiempo ≥ 80%',
          description: 'Al menos 80% de tus tareas deben completarse a tiempo',
          icon: Target,
          met: result.tasks_on_time_rate >= 0.8,
          current: `${((result.tasks_on_time_rate || 0) * 100).toFixed(0)}%`,
          required: '80%',
          progress: (result.tasks_on_time_rate || 0) * 100,
        },
        {
          id: 'feedback',
          label: 'Feedback positivo ≥ 3',
          description: 'Necesitas al menos 3 feedbacks positivos de tus compañeros',
          icon: MessageSquare,
          met: result.positive_feedback >= 3,
          current: result.positive_feedback || 0,
          required: 3,
          progress: Math.min(100, (result.positive_feedback / 3) * 100),
        },
        {
          id: 'obvs',
          label: 'OBVs validadas ≥ 2',
          description: 'Debes tener al menos 2 OBVs validadas en este rol',
          icon: FileCheck,
          met: result.obvs_validated >= 2,
          current: result.obvs_validated || 0,
          required: 2,
          progress: Math.min(100, (result.obvs_validated / 2) * 100),
        },
        {
          id: 'projects',
          label: 'Proyectos diferentes ≥ 2',
          description: 'Debes haber trabajado en al menos 2 proyectos diferentes',
          icon: FolderKanban,
          met: result.different_projects >= 2,
          current: result.different_projects || 0,
          required: 2,
          progress: Math.min(100, (result.different_projects / 2) * 100),
        },
        {
          id: 'consistency',
          label: 'Consistencia (varianza < 0.5)',
          description: 'Tu desempeño debe ser consistente a lo largo del tiempo',
          icon: BarChart3,
          met: result.fit_score_variance < 0.5,
          current: result.fit_score_variance?.toFixed(2) || '0.00',
          required: '< 0.50',
          progress: Math.max(0, 100 - (result.fit_score_variance || 0) * 200),
        },
      ];

      setRequirements(checks);
      setCanChallenge(result.can_challenge === true);

      // Load current Master info
      if (result.current_master_id) {
        const { data: masterData } = await supabase
          .from('members')
          .select('nombre')
          .eq('id', result.current_master_id)
          .single();

        if (masterData) {
          setCurrentMaster({
            nombre: masterData.nombre,
            fit_score: result.current_master_fit_score || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
      toast.error('Error al verificar los requisitos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const metCount = requirements.filter((r) => r.met).length;
  const totalCount = requirements.length;
  const overallProgress = (metCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 capitalize">
                <Shield className="text-primary" />
                Requisitos para Desafiar - {role}
              </CardTitle>
              <CardDescription>
                {canChallenge
                  ? '¡Cumples todos los requisitos! Puedes lanzar tu desafío.'
                  : `Cumples ${metCount} de ${totalCount} requisitos. Sigue trabajando para desbloquear el desafío.`}
              </CardDescription>
            </div>
            {currentMaster && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Master actual:</p>
                <p className="font-semibold">{currentMaster.nombre}</p>
                <p className="text-sm text-primary">{currentMaster.fit_score.toFixed(1)} Fit Score</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso General</span>
              <span className="font-bold">
                {metCount}/{totalCount} completados
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {canChallenge && (
            <Button onClick={() => setShowChallengeDialog(true)} className="w-full mt-4" size="lg">
              <Trophy className="mr-2" />
              Lanzar Desafío al Master
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Requirements Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {requirements.map((req) => {
          const Icon = req.icon;
          return (
            <Card
              key={req.id}
              className={req.met ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={20} className={req.met ? 'text-green-600' : 'text-yellow-600'} />
                    <CardTitle className="text-base">{req.label}</CardTitle>
                  </div>
                  {req.met ? (
                    <CheckCircle2 size={20} className="text-green-600" />
                  ) : (
                    <XCircle size={20} className="text-yellow-600" />
                  )}
                </div>
                <CardDescription className="text-xs mt-1">{req.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tu valor:</span>
                  <span className="font-bold">{req.current}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Requerido:</span>
                  <span className="font-bold">{req.required}</span>
                </div>
                <Progress value={req.progress} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Footer */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Todos los requisitos deben cumplirse simultáneamente para poder desafiar al Master.
            Los desafíos son momentos importantes que determinan quién lidera cada rol en la organización.
          </p>
        </CardContent>
      </Card>

      {/* Challenge Dialog */}
      <StartChallengeDialog
        open={showChallengeDialog}
        onClose={() => setShowChallengeDialog(false)}
        role={role}
        currentUserId={currentUserId}
        masterName={currentMaster?.nombre}
        onSuccess={() => {
          loadRequirements();
          onChallengeSuccess?.();
        }}
      />
    </div>
  );
}
