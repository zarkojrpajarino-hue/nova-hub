/**
 * ADD MEMBER WIZARD
 *
 * Añade un miembro registrado al proyecto por email.
 * Fuente única de verdad para roles: project_members.role (specialization_role ENUM).
 *
 * Flujo:
 *   1. Usuario introduce email + rol opcional
 *   2. Submit busca profiles por email
 *   3. Si existe y no es ya miembro → INSERT en project_members
 *   4. Si no existe → error claro "usuario no registrado"
 *
 * Nota: no es un sistema de invitación real (sin email, sin tokens).
 * La invitación por email se implementará en FASE 7 como feature nueva.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mail, Briefcase, AlertCircle } from 'lucide-react';
import { useFeatureAccess, useCurrentPlanTier } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

import { useTranslation } from 'react-i18next';
type SpecializationRole = Database['public']['Enums']['specialization_role'];

// C3.3 — fuente única de verdad: enum specialization_role
// Elimina dependencia de project_roles (tabla ghost).
function getROLE_OPTIONS(t: (k: string) => string) {
  return [
  { value: 'sales',      label: t('roles.ventas'),          description: t('roles.captaciónYCierreDe') },
  { value: 'marketing',  label: t('roles.marketing'),        description: t('roles.adquisiciónYComunicación') },
  { value: 'ai_tech',    label: 'Tecnología / IA',  description: t('roles.desarrolloDeProductoY') },
  { value: 'operations', label: t('roles.operaciones'),      description: t('roles.entregaDeServicioY') },
  { value: 'finance',    label: t('roles.finanzas'),         description: t('roles.gestiónDeCobrosY') },
  { value: 'strategy',   label: t('roles.estrategia'),       description: t('roles.direcciónYDecisionesDe') },
];
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
  const { t } = useTranslation();
  const { getLimitInfo } = useFeatureAccess(projectId);
  const membersLimit = getLimitInfo('members');
  const { tier } = useCurrentPlanTier(projectId);

  const [email, setEmail] = useState('');
  // C3.2 — selectedRole almacena directamente un valor de specialization_role
  const [selectedRole, setSelectedRole] = useState<SpecializationRole | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddMember = membersLimit.isUnlimited || membersLimit.current < membersLimit.max;

  // C3.1 — submit real: busca profile por email, verifica no duplicado, inserta en project_members
  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(t('roles.elEmailEsObligatorio'));
      return;
    }

    if (!selectedRole) {
      setError(t('roles.elRolEsObligatorio'));
      return;
    }

    if (!canAddMember) {
      setError(`Has alcanzado el límite de ${membersLimit.max} miembros en tu plan actual`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Buscar perfil por email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nombre')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!profile) {
        setError(t('roles.usuarioNoRegistradoPídele'));
        return;
      }

      // 2. Verificar que no sea ya miembro
      const { data: existing } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('member_id', profile.id)
        .single();

      if (existing) {
        setError(`${profile.nombre} ya es miembro de este proyecto.`);
        return;
      }

      // 3. Server-side member count check against plan limit (V5.3.13)
      const planMemberLimit = tier.members;
      if (planMemberLimit !== -1) {
        const { count: memberCount } = await supabase
          .from('project_members')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId);

        if (memberCount !== null && memberCount >= planMemberLimit) {
          setError(t('roles.memberLimitReached', { limit: planMemberLimit }));
          return;
        }
      }

      // 4. Añadir a project_members con el rol seleccionado
      const { error: insertError } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          member_id: profile.id,
          role: selectedRole,
        });

      if (insertError) throw insertError;

      onSuccess?.();
      handleClose();
    } catch (_err) {
      setError(t('roles.errorAlAñadirEl'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSelectedRole('');
    setError(null);
    onClose();
  };

  const roleInfo = getROLE_OPTIONS(t).find(r => r.value === selectedRole);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">{t('roles.añadirMiembroAlProyecto')}</DialogTitle>
          </div>
          <p className="text-muted-foreground text-sm">{t('roles.elUsuarioDebeTener')}</p>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Limit warning */}
          {!canAddMember && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  Has alcanzado el límite de {membersLimit.max} miembros en tu plan actual.
                </p>
              </div>
            </div>
          )}

          {/* Members usage */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('roles.miembrosEnElProyecto')}</span>
              <span className="text-sm font-semibold">
                {membersLimit.current} / {membersLimit.isUnlimited ? '∞' : membersLimit.max}
              </span>
            </div>
            {!membersLimit.isUnlimited && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    membersLimit.percentage >= 90 ? 'bg-destructive' : 'bg-primary'
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
              placeholder={t('roles.nombreejemplocom')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!canAddMember || isSubmitting}
            />
          </div>

          {/* Role — C3.2: selector sobre specialization_role, no sobre project_roles */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Rol *
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as SpecializationRole)}
              disabled={!canAddMember || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('roles.sinRolAsignado')} />
              </SelectTrigger>
              <SelectContent>
                {getROLE_OPTIONS(t).map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {roleInfo && (
              <p className="text-xs text-muted-foreground pl-1">{roleInfo.description}</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button onClick={handleClose} variant="outline" disabled={isSubmitting}>{t('roles.cancelar')}</Button>
          <Button
            onClick={handleSubmit}
            disabled={!canAddMember || isSubmitting || !email.trim() || !selectedRole}
          >
            {isSubmitting ? t('roles.añadiendo') : t('roles.añadirMiembro')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
