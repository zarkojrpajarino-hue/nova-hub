/**
 * EQ26.3 — /invite/:token — Landing de invitación
 *
 * Página semi-pública que muestra info del proyecto y rol.
 * Si usuario logueado: "Unirme al proyecto" → accept_invitation RPC.
 * Si no logueado: redirige a login con returnTo.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_CONFIG } from '@/data/mockData';
import { useEffect, useState } from 'react';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  // Fetch invitation data via RPC (no RLS needed — public function)
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_invitation_by_token', { p_token: token! });
      if (error) throw error;
      const result = data as Record<string, unknown> | null;
      if (!result || result.error) return null;
      return result as {
        id: string;
        project_id: string;
        role: string;
        email: string | null;
        status: string;
        expires_at: string;
        uses_count: number;
        max_uses: number;
        project_name: string;
        project_description: string | null;
      };
    },
    enabled: !!token,
  });

  // Accept invitation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('accept_invitation', { p_token: token! });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string; project_id?: string };
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      toast.success('¡Te has unido al proyecto!');
      // Navigate to mini-onboarding or project
      navigate(`/proyecto/${data.project_id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al aceptar invitación');
    },
  });

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invitación no válida</h2>
            <p className="text-sm text-muted-foreground">
              Esta invitación no existe, ha expirado o ya fue utilizada.
            </p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = { nombre: invitation.project_name, descripcion: invitation.project_description };
  const roleConfig = ROLE_CONFIG[invitation.role];
  const isExpired = new Date(invitation.expires_at) < new Date();
  const isMaxed = invitation.uses_count >= invitation.max_uses;

  if (isExpired || isMaxed) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {isExpired ? 'Invitación expirada' : 'Invitación agotada'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isExpired
                ? 'Esta invitación ha expirado. Pide un nuevo enlace al líder del proyecto.'
                : 'Esta invitación ya alcanzó el máximo de usos.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold">Te han invitado a un proyecto</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium">{project?.nombre ?? 'Proyecto'}</p>
              {project?.descripcion && (
                <p className="text-xs text-muted-foreground mt-1">{project.descripcion}</p>
              )}
            </div>

            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: roleConfig?.color ?? '#6366F1' }}
              >
                {(roleConfig?.label ?? invitation.role).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">Rol: {roleConfig?.label ?? invitation.role}</p>
                {roleConfig?.desc && (
                  <p className="text-xs text-muted-foreground">{roleConfig.desc}</p>
                )}
              </div>
            </div>
          </div>

          {isAuthenticated ? (
            <Button
              className="w-full gap-2"
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Uniéndome...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" />Unirme al proyecto</>
              )}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => navigate(`/auth?returnTo=/invite/${token}`)}
            >
              Iniciar sesión para unirme
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
