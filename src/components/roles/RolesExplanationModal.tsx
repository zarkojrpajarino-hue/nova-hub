/**
 * 📋 ROLES EXPLANATION MODAL
 *
 * Modal que muestra los roles generados por IA
 * Explica cada rol con sus responsabilidades y habilidades
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, CheckCircle, User, Briefcase, Target, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectRole {
  id: string;
  role_name: string;
  description: string;
  responsibilities: string[];
  required_skills: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'expert';
  department: string;
  is_critical: boolean;
}

interface RolesExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: ProjectRole[];
  onContinue: () => void;
}

const EXPERIENCE_LABELS = {
  entry: { label: 'Junior', color: 'bg-green-100 text-green-800' },
  mid: { label: 'Mid', color: 'bg-blue-100 text-blue-800' },
  senior: { label: 'Senior', color: 'bg-purple-100 text-purple-800' },
  expert: { label: 'Expert', color: 'bg-amber-100 text-amber-800' },
};

export function RolesExplanationModal({
  isOpen,
  onClose,
  roles,
  onContinue,
}: RolesExplanationModalProps) {
  // Ordenar roles: críticos primero, luego por display_order
  const sortedRoles = [...roles].sort((a, b) => {
    if (a.is_critical && !b.is_critical) return -1;
    if (!a.is_critical && b.is_critical) return 1;
    return 0;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">
              Roles Generados con IA
            </DialogTitle>
          </div>
          <p className="text-gray-600">
            Hemos creado {roles.length} roles personalizados para tu proyecto.
            Estos roles te ayudarán a estructurar tu equipo de forma óptima.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {sortedRoles.map((role) => (
            <Card
              key={role.id}
              className={cn(
                'border-2 transition-all',
                role.is_critical && 'border-primary bg-primary/5'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {role.is_critical && (
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      )}
                      <CardTitle className="text-lg">
                        {role.role_name}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-gray-600">
                      {role.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <Badge
                      className={cn(
                        'text-xs',
                        EXPERIENCE_LABELS[role.experience_level].color
                      )}
                    >
                      {EXPERIENCE_LABELS[role.experience_level].label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {role.department}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Responsibilities */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-gray-600" />
                    <h4 className="font-semibold text-sm">Responsabilidades</h4>
                  </div>
                  <ul className="space-y-1">
                    {role.responsibilities.map((resp, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Required Skills */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-gray-600" />
                    <h4 className="font-semibold text-sm">Habilidades Requeridas</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.required_skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {role.is_critical && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-xs text-amber-800 font-medium flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Rol crítico para el lanzamiento del MVP
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-blue-900 mb-1">
                ¿Cómo funcionan estos roles?
              </h4>
              <p className="text-sm text-blue-800">
                Estos roles son sugerencias personalizadas según tu proyecto.
                Puedes invitar miembros a tu equipo y asignarles roles de forma flexible.
                No es necesario cubrir todos los roles de inmediato.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            onClick={onContinue}
            size="lg"
            className="min-w-[200px]"
          >
            Entendido, Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
