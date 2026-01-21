import { useState, useEffect } from 'react';
import { Crown, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCheckMasterEligibility, useCreateMasterApplication } from '@/hooks/useMasters';
import { ROLE_CONFIG } from '@/data/mockData';
import { toast } from 'sonner';

interface ApplyForMasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRoles: string[];
  userId?: string;
}

export function ApplyForMasterDialog({ open, onOpenChange, userRoles, userId }: ApplyForMasterDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [motivation, setMotivation] = useState('');
  const [achievements, setAchievements] = useState<Array<{ title: string; description: string }>>([
    { title: '', description: '' },
  ]);

  const { data: eligibility, isLoading: checkingEligibility } = useCheckMasterEligibility(userId, selectedRole);
  const createApplication = useCreateMasterApplication();

  useEffect(() => {
    if (userRoles.length > 0 && !selectedRole) {
      setSelectedRole(userRoles[0]);
    }
  }, [userRoles, selectedRole]);

  const handleAddAchievement = () => {
    setAchievements([...achievements, { title: '', description: '' }]);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleAchievementChange = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...achievements];
    updated[index][field] = value;
    setAchievements(updated);
  };

  const handleSubmit = async () => {
    if (!userId || !selectedRole || !motivation.trim()) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    if (!eligibility?.eligible) {
      toast.error('No cumples los requisitos para aplicar');
      return;
    }

    try {
      await createApplication.mutateAsync({
        user_id: userId,
        role_name: selectedRole,
        motivation,
        achievements: achievements.filter(a => a.title.trim()),
      });
      toast.success('Aplicación enviada. ¡Buena suerte!');
      onOpenChange(false);
      setMotivation('');
      setAchievements([{ title: '', description: '' }]);
    } catch (error) {
      toast.error('Error al enviar la aplicación');
    }
  };

  const roleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="text-amber-500" size={24} />
            Aplicar para ser Master
          </DialogTitle>
          <DialogDescription>
            Los Masters son líderes de conocimiento que guían y mentorean al equipo en su especialidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role Selection */}
          <div>
            <Label>Rol para el que aplicas</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map(role => {
                  const config = ROLE_CONFIG[role];
                  return (
                    <SelectItem key={role} value={role}>
                      <span className="flex items-center gap-2">
                        {config?.icon && <config.icon size={16} style={{ color: config.color }} />}
                        {config?.label || role}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Eligibility Check */}
          {selectedRole && (
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Verificación de Elegibilidad</span>
                {checkingEligibility ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : eligibility?.eligible ? (
                  <Badge className="bg-success text-success-foreground gap-1">
                    <CheckCircle2 size={14} />
                    Elegible
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle size={14} />
                    No Elegible
                  </Badge>
                )}
              </div>

              {eligibility && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rendimiento</span>
                    <div className="flex items-center gap-2">
                      <Progress value={eligibility.performance} className="w-20 h-2" />
                      <span className={eligibility.performance >= 70 ? 'text-success' : 'text-destructive'}>
                        {eligibility.performance.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tiempo en rol</span>
                    <span className={eligibility.months_in_role >= 3 ? 'text-success' : 'text-destructive'}>
                      {eligibility.months_in_role} meses
                    </span>
                  </div>

                  {eligibility.reasons.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      {eligibility.reasons.map((reason, i) => (
                        <div key={i} className="flex items-center gap-2 text-destructive text-xs">
                          <AlertCircle size={12} />
                          {reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Motivation */}
          <div>
            <Label htmlFor="motivation">¿Por qué quieres ser Master de {roleConfig?.label || selectedRole}?</Label>
            <Textarea
              id="motivation"
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              placeholder="Explica tu motivación, experiencia y cómo puedes ayudar al equipo..."
              rows={4}
            />
          </div>

          {/* Achievements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Logros destacados (opcional)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddAchievement}>
                + Añadir
              </Button>
            </div>
            
            <div className="space-y-2">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Título del logro"
                    value={achievement.title}
                    onChange={e => handleAchievementChange(index, 'title', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                  <input
                    type="text"
                    placeholder="Descripción breve"
                    value={achievement.description}
                    onChange={e => handleAchievementChange(index, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                  {achievements.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAchievement(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!eligibility?.eligible || createApplication.isPending || !motivation.trim()}
              className="gap-2"
            >
              {createApplication.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown size={16} />
              )}
              Enviar Aplicación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
