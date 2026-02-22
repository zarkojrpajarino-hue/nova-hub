/**
 * LEARNING PATH GENERATOR
 *
 * Wizard para generar nuevo learning path con IA
 * Conecta con edge function: generate-learning-path
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Target, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface LearningPathGeneratorProps {
  onComplete: (pathId: string) => void;
  onCancel: () => void;
}

export function LearningPathGenerator({ onComplete, onCancel }: LearningPathGeneratorProps) {
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();

  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    targetRole: '',
    currentSkills: '',
    timeCommitment: '5', // hours per week
    duration: '8', // weeks
    difficulty: 'intermediate',
    focusAreas: '',
  });

  const handleGenerate = async () => {
    if (!formData.targetRole) {
      toast.error('Por favor ingresa el rol objetivo');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-path', {
        body: {
          targetRole: formData.targetRole,
          currentSkills: formData.currentSkills.split(',').map(s => s.trim()).filter(Boolean),
          timeCommitment: parseInt(formData.timeCommitment),
          duration: parseInt(formData.duration),
          difficulty: formData.difficulty,
          focusAreas: formData.focusAreas.split(',').map(s => s.trim()).filter(Boolean),
        },
      });

      if (error) throw error;

      toast.success('Learning Path generado exitosamente');
      onComplete(data.pathId);
    } catch (error) {
      console.error('Error generating learning path:', error);
      toast.error('Error al generar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl nova-gradient flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Generar Learning Path con IA</CardTitle>
              <CardDescription>
                La IA creará un plan de aprendizaje personalizado basado en tus objetivos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Target Role */}
          <div className="space-y-2">
            <Label htmlFor="targetRole" className="flex items-center gap-2">
              <Target size={14} />
              Rol Objetivo *
            </Label>
            <Input
              id="targetRole"
              placeholder="Ej: Senior Product Manager, Tech Lead, Growth Hacker..."
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              ¿Qué rol quieres alcanzar o en qué quieres mejorar?
            </p>
          </div>

          {/* Current Skills */}
          <div className="space-y-2">
            <Label htmlFor="currentSkills">Habilidades Actuales (opcional)</Label>
            <Textarea
              id="currentSkills"
              placeholder="Ej: React, Node.js, SQL, Gestión de equipos..."
              value={formData.currentSkills}
              onChange={(e) => setFormData({ ...formData, currentSkills: e.target.value })}
              disabled={isGenerating}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Separa con comas. Ayuda a personalizar el contenido inicial.
            </p>
          </div>

          {/* Time Commitment & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeCommitment" className="flex items-center gap-2">
                <Clock size={14} />
                Horas por Semana
              </Label>
              <Select
                value={formData.timeCommitment}
                onValueChange={(value) => setFormData({ ...formData, timeCommitment: value })}
                disabled={isGenerating}
              >
                <SelectTrigger id="timeCommitment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 horas/semana</SelectItem>
                  <SelectItem value="5">5 horas/semana</SelectItem>
                  <SelectItem value="10">10 horas/semana</SelectItem>
                  <SelectItem value="15">15 horas/semana</SelectItem>
                  <SelectItem value="20">20+ horas/semana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <TrendingUp size={14} />
                Duración Total
              </Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
                disabled={isGenerating}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 semanas</SelectItem>
                  <SelectItem value="8">8 semanas</SelectItem>
                  <SelectItem value="12">12 semanas (3 meses)</SelectItem>
                  <SelectItem value="24">24 semanas (6 meses)</SelectItem>
                  <SelectItem value="48">48 semanas (1 año)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">Nivel de Dificultad</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              disabled={isGenerating}
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Principiante
                    </Badge>
                    <span className="text-xs text-muted-foreground">Empezando desde cero</span>
                  </div>
                </SelectItem>
                <SelectItem value="intermediate">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      Intermedio
                    </Badge>
                    <span className="text-xs text-muted-foreground">Ya tengo experiencia básica</span>
                  </div>
                </SelectItem>
                <SelectItem value="advanced">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      Avanzado
                    </Badge>
                    <span className="text-xs text-muted-foreground">Quiero especializarme</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Focus Areas */}
          <div className="space-y-2">
            <Label htmlFor="focusAreas">Áreas de Enfoque (opcional)</Label>
            <Textarea
              id="focusAreas"
              placeholder="Ej: Liderazgo, Comunicación, Habilidades técnicas, Growth, Analytics..."
              value={formData.focusAreas}
              onChange={(e) => setFormData({ ...formData, focusAreas: e.target.value })}
              disabled={isGenerating}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Áreas específicas en las que quieres mejorar. Separa con comas.
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>💡 Tip:</strong> La IA analizará tu perfil actual, fit score, y progreso
              reciente para crear un plan totalmente personalizado con recursos específicos.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <EvidenceAIGenerator
              functionName="generate-learning-path"
              evidenceProfile="learning"
              projectId={currentProject?.id || ''}
              userId={user?.id || ''}
              buttonLabel="🎓 Generar Learning Path con Evidencias"
              buttonClassName="flex-1"
              additionalParams={{
                target_role: formData.targetRole,
                current_skills: formData.currentSkills.split(',').map(s => s.trim()).filter(Boolean),
                time_commitment: parseInt(formData.timeCommitment),
                duration: parseInt(formData.duration),
                difficulty: formData.difficulty,
                focus_areas: formData.focusAreas.split(',').map(s => s.trim()).filter(Boolean),
              }}
              onGenerationComplete={(result) => {
                if (result.content?.path_id) {
                  onComplete(result.content.path_id);
                }
              }}
            />
            <Button onClick={onCancel} variant="outline" disabled={isGenerating}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
