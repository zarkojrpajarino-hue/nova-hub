/**
 * START CHALLENGE DIALOG
 *
 * Modal para seleccionar el tipo de desafío antes de iniciarlo
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trophy, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';
interface StartChallengeDialogProps {
  open: boolean;
  onClose: () => void;
  role: string;
  currentUserId: string;
  masterName?: string;
  onSuccess?: () => void;
}

function getChallengeTypes(t: (key: string) => string) {
  return [
    {
      id: 'performance_battle',
      name: t('challenges.performanceBattle'),
      icon: Zap,
      duration: '2 semanas',
      description: t('challenges.competenciaDirectaEnMétricas'),
      details: t('challenges.ganaQuienTengaMayor'),
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    },
    {
      id: 'project_showdown',
      name: t('challenges.projectShowdown'),
      icon: Trophy,
      duration: '3 semanas',
      description: t('challenges.ambosLideranUnProyecto'),
      details: t('challenges.ganaQuienRecibaMás'),
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    },
    {
      id: 'peer_vote',
      name: t('challenges.peerVote'),
      icon: Users,
      duration: '1 semana',
      description: t('challenges.elEquipoVotaDirectamente'),
      details: t('challenges.masterNecesita51De'),
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    },
  ];
}

export function StartChallengeDialog({
  open,
  onClose,
  role,
  currentUserId,
  masterName,
  onSuccess,
}: StartChallengeDialogProps) {
  const { t } = useTranslation();
  const CHALLENGE_TYPES = getChallengeTypes(t);
  const [selectedType, setSelectedType] = useState<string>('performance_battle');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChallenge = async () => {
    if (!selectedType) {
      toast.error(t('challenges.seleccionaUnTipoDe'));
      return;
    }

    setIsLoading(true);

    try {
      // Obtener member_id del usuario actual
      const { data: member } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', currentUserId)
        .single();

      if (!member) throw new Error(t('challenges.usuarioNoEncontrado'));

      // Llamar a la función de inicio de desafío
      const { data, error } = await supabase.rpc('start_master_challenge', {
        p_challenger_id: member.id,
        p_role: role,
        p_challenge_type: selectedType,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        toast.error(result.error || t('challenges.noSePudoIniciar'));
        return;
      }

      toast.success(result.message || 'Desafio iniciado con exito!');
      onSuccess?.();
      onClose();
    } catch (_error) {
      toast.error(error instanceof Error ? error.message : t('challenges.errorAlIniciarEl'));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedChallengeData = CHALLENGE_TYPES.find((t) => t.id === selectedType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="text-amber-500" />{t('challenges.iniciarDesafío')}</DialogTitle>
          <DialogDescription>
            Vas a desafiar{' '}
            {masterName ? (
              <>
                a <strong>{masterName}</strong>
              </>
            ) : (
              'al Master actual'
            )}{' '}
            por el rol de <strong className="capitalize">{role.replace('_', ' ')}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selector de tipo */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Selecciona el tipo de desafío:
            </Label>

            <RadioGroup value={selectedType} onValueChange={setSelectedType} className="space-y-3">
              {CHALLENGE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedType === type.id
                        ? `bg-gradient-to-br ${type.color}`
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <RadioGroupItem value={type.id} id={type.id} className="mt-1" />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={20} className={selectedType === type.id ? 'text-primary' : ''} />
                        <Label htmlFor={type.id} className="font-semibold cursor-pointer">
                          {type.name}
                        </Label>
                        <span className="text-xs text-muted-foreground ml-auto">
                          ({type.duration})
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-1">{type.description}</p>
                      <p className="text-xs font-medium">{type.details}</p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Detalles del tipo seleccionado */}
          {selectedChallengeData && (
            <div className={`p-4 rounded-lg border-2 bg-gradient-to-br ${selectedChallengeData.color}`}>
              <h4 className="font-semibold mb-2">Detalles del desafío:</h4>
              <ul className="text-sm space-y-1">
                <li>
                  <strong>Duración:</strong> {selectedChallengeData.duration}
                </li>
                <li>
                  <strong>Transparencia:</strong> Todo el equipo podrá ver el progreso en
                  tiempo real
                </li>
                <li>
                  <strong>Notificaciones:</strong> Recibirás updates cada vez que cambien las
                  métricas
                </li>
                <li>
                  <strong>Cooldown:</strong> El Master tendrá 3 meses de cooldown después de
                  este desafío
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('challenges.cancelar')}</Button>
          <Button onClick={handleStartChallenge} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />{t('challenges.iniciando')}</>
            ) : (
              <>
                <Trophy className="mr-2" size={16} />{t('challenges.confirmarDesafío')}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
