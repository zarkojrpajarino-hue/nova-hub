/**
 * 👥 INVITE MEMBER WIZARD
 *
 * Wizard para invitar miembros al equipo con asignación flexible de roles
 * Respeta límites de miembros según el plan de suscripción
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mail, User, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ProjectRole {
  id: string;
  role_name: string;
  description: string;
  department: string;
  is_critical: boolean;
}

interface InviteMemberWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
}

export function InviteMemberWizard({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: InviteMemberWizardProps) {
  const { getLimitInfo } = useFeatureAccess(projectId);
  const membersLimit = getLimitInfo('members');

  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['project-roles', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_roles')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order');

      if (error) throw error;
      return data as ProjectRole[];
    },
    enabled: isOpen && !!projectId,
  });

  // Check if limit reached
  const canAddMember = membersLimit.isUnlimited || membersLimit.current < membersLimit.max;

  const handleSubmit = async () => {
    // Validación
    if (!email || !nombre) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!canAddMember) {
      setError(`Has alcanzado el límite de ${membersLimit.max} miembros en tu plan actual`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // TODO: Implementar invitación real en Fase 7
      // Por ahora solo simulamos la invitación

      // En producción, esto debería:
      // 1. Crear una invitación en la tabla project_invitations
      // 2. Enviar email con link de invitación
      // 3. Al aceptar, crear el member con el role asignado

      // Simulación de delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError('Error al enviar la invitación. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setNombre('');
    setSelectedRoleId('');
    setError(null);
    onClose();
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">
              Invitar Miembro al Equipo
            </DialogTitle>
          </div>
          <p className="text-gray-600">
            Invita a un nuevo miembro y asígnale un rol personalizado
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Limit Warning */}
          {!canAddMember && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-red-900 mb-1">
                    Límite de Miembros Alcanzado
                  </h4>
                  <p className="text-sm text-red-800">
                    Has alcanzado el límite de {membersLimit.max} miembros en tu plan actual.
                    Actualiza tu plan para invitar más miembros.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Members Usage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Miembros en el proyecto
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {membersLimit.current} / {membersLimit.isUnlimited ? '∞' : membersLimit.max}
              </span>
            </div>
            {!membersLimit.isUnlimited && (
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    membersLimit.percentage >= 90 ? 'bg-red-500' : 'bg-primary'
                  )}
                  style={{ width: `${Math.min(membersLimit.percentage, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!canAddMember || isSubmitting}
            />
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nombre *
            </Label>
            <Input
              id="nombre"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={!canAddMember || isSubmitting}
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Rol Asignado (Opcional)
            </Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={!canAddMember || isSubmitting || isLoadingRoles}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin rol asignado (puede elegir más tarde)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-role">Sin rol asignado</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      {role.role_name}
                      {role.is_critical && (
                        <Badge variant="outline" className="text-xs ml-2">
                          Crítico
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Role Details */}
          {selectedRole && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">
                {selectedRole.role_name}
              </h4>
              <p className="text-sm text-blue-800">
                {selectedRole.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {selectedRole.department}
                </Badge>
                {selectedRole.is_critical && (
                  <Badge className="text-xs bg-amber-500">
                    Crítico para MVP
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <CheckCircle className="h-4 w-4 inline mr-1 text-green-600" />
              El miembro recibirá un email de invitación. Puede aceptar o rechazar la invitación.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canAddMember || isSubmitting || !email || !nombre}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
