/**
 * EQ26.2 — InviteLinkDialog: generación de enlace de invitación
 *
 * Modal para crear invitaciones por enlace.
 * - Selector de rol (6 specialization_roles)
 * - Email opcional (restricción)
 * - Single-use vs multi-use
 * - Genera enlace y permite copiar
 * - Lista de invitaciones activas con revoke
 */

import { useState } from 'react';
import { Copy, Check, Link2, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_CONFIG } from '@/data/mockData';

interface InviteLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function InviteLinkDialog({ isOpen, onClose, projectId }: InviteLinkDialogProps) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<string>('sales');
  const [email, setEmail] = useState('');
  const [multiUse, setMultiUse] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // List active invitations
  const { data: invitations } = useQuery({
    queryKey: ['invitations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_invitations')
        .select('id, token, role, email, status, uses_count, max_uses, expires_at, created_at')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isOpen,
  });

  // Create invitation
  const createInvitation = useMutation({
    mutationFn: async () => {
      // Generate token via RPC
      const { data: token, error: tokenErr } = await supabase.rpc('generate_invitation_token');
      if (tokenErr || !token) throw tokenErr ?? new Error('Token generation failed');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Get current user as invited_by
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase.from('project_invitations').insert({
        project_id: projectId,
        invited_by: profile.id,
        token,
        role,
        email: email.trim() || null,
        max_uses: multiUse ? 10 : 1,
        expires_at: expiresAt.toISOString(),
      });
      if (error) throw error;

      return token as string;
    },
    onSuccess: (token) => {
      const link = `${window.location.origin}/invite/${token}`;
      setGeneratedLink(link);
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      toast.success('Enlace de invitación creado');
    },
    onError: () => {
      toast.error('Error al crear invitación');
    },
  });

  // Revoke invitation
  const revokeInvitation = useMutation({
    mutationFn: async (invId: string) => {
      const { error } = await supabase
        .from('project_invitations')
        .update({ status: 'revoked' })
        .eq('id', invId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      toast.success('Invitación revocada');
    },
  });

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Invitar miembro por enlace</DialogTitle>
        <DialogDescription>
          Genera un enlace de invitación para añadir miembros al proyecto.
        </DialogDescription>

        <div className="space-y-4 mt-2">
          {/* Role selector */}
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email restriction */}
          <div className="space-y-1.5">
            <Label>Email (opcional — restringe quién puede aceptar)</Label>
            <Input
              type="email"
              placeholder="persona@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Multi-use toggle */}
          <div className="flex items-center justify-between">
            <Label>Enlace multi-uso (hasta 10 personas)</Label>
            <Switch checked={multiUse} onCheckedChange={setMultiUse} />
          </div>

          {/* Generate button */}
          <Button
            className="w-full"
            onClick={() => createInvitation.mutate()}
            disabled={createInvitation.isPending}
          >
            {createInvitation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generando...</>
            ) : (
              <><Link2 className="h-4 w-4 mr-2" />Generar enlace</>
            )}
          </Button>

          {/* Generated link */}
          {generatedLink && (
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Enlace generado (expira en 7 días):</p>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="text-xs" />
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Active invitations */}
          {invitations && invitations.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Invitaciones activas ({invitations.length})
              </p>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                    <div>
                      <span className="font-medium">{ROLE_CONFIG[inv.role]?.label ?? inv.role}</span>
                      {inv.email && <span className="text-muted-foreground ml-1">({inv.email})</span>}
                      <span className="text-muted-foreground ml-2">
                        {inv.uses_count}/{inv.max_uses} usos
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => revokeInvitation.mutate(inv.id)}
                      disabled={revokeInvitation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
