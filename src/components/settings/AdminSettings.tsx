import { useState } from 'react';
import { Target, Users, Shield, Crown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useObjectives, useProfiles } from '@/hooks/useNovaData';
import { useUpdateObjective, useUserRoles, useUpdateUserRole } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';

export function AdminSettings() {
  const { profile } = useAuth();
  const { data: objectives = [], isLoading: loadingObjectives } = useObjectives();
  const { data: profiles = [] } = useProfiles();
  const { data: userRoles = [] } = useUserRoles();
  const updateObjective = useUpdateObjective();
  const updateRole = useUpdateUserRole();

  const [editedObjectives, setEditedObjectives] = useState<Record<string, number>>({});

  const handleObjectiveChange = (id: string, value: number) => {
    setEditedObjectives(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveObjective = async (id: string) => {
    const value = editedObjectives[id];
    if (value === undefined) return;

    try {
      await updateObjective.mutateAsync({ id, target_value: value });
      toast.success('Objetivo actualizado');
      setEditedObjectives(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (error) {
      toast.error('Error al actualizar objetivo');
    }
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'tlt' | 'member') => {
    try {
      await updateRole.mutateAsync({ userId, role });
      toast.success('Rol actualizado');
    } catch (error) {
      toast.error('Solo los administradores pueden cambiar roles');
    }
  };

  const getUserRole = (userId: string) => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'member';
  };

  if (loadingObjectives) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={20} />
            Objetivos Globales del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Define los objetivos semestrales por socio (se multiplican x9 para el equipo)
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {objectives.map(obj => {
              const currentValue = editedObjectives[obj.id] ?? obj.target_value;
              const hasChanged = editedObjectives[obj.id] !== undefined;

              return (
                <div key={obj.id} className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide">
                    {obj.name} {obj.unit !== 'units' && `(${obj.unit})`}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={currentValue}
                      onChange={(e) => handleObjectiveChange(obj.id, parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    {hasChanged && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveObjective(obj.id)}
                        disabled={updateObjective.isPending}
                      >
                        {updateObjective.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          '✓'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Gestión de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Asigna roles y permisos a los miembros del equipo
          </p>

          <div className="space-y-3">
            {profiles.map(member => {
              const memberRole = getUserRole(member.id);
              const isCurrentUser = member.id === profile?.id;

              return (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: member.color || '#6366F1' }}
                    >
                      {member.nombre?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {member.nombre}
                        {memberRole === 'admin' && <Crown size={14} className="text-amber-500" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>

                  <Select
                    value={memberRole}
                    onValueChange={(value) => handleRoleChange(member.id, value as 'admin' | 'tlt' | 'member')}
                    disabled={isCurrentUser}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Miembro</SelectItem>
                      <SelectItem value="tlt">TLT</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield size={20} />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Acciones que no se pueden deshacer
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
              Exportar todos los datos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
