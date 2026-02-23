import { useEffect, useState } from 'react';
import { Users, Check, X, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  nombre: string;
  email: string;
  avatar?: string;
  color?: string;
}

interface StepEquipoProps {
  projectId: string;
  selectedMembers: string[];
  onChange: (memberIds: string[]) => void;
  minMembers?: number;
  maxMembers?: number;
}

export function StepEquipo({ 
  projectId, 
  selectedMembers, 
  onChange,
  minMembers = 2,
  maxMembers = 6,
}: StepEquipoProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [existingMembers, setExistingMembers] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nombre, email, avatar, color')
          .order('nombre');

        if (profilesError) throw profilesError;

        // Fetch existing members of this project
        const { data: membersData, error: membersError } = await supabase
          .from('project_members')
          .select('member_id')
          .eq('project_id', projectId);

        if (membersError) throw membersError;

        type ProfileRow = { id: string; nombre: string; email: string; avatar: string | null; color: string | null };
        setProfiles((profilesData as ProfileRow[] || []).map(p => ({
          id: p.id,
          nombre: p.nombre,
          email: p.email,
          avatar: p.avatar ?? undefined,
          color: p.color ?? undefined,
        })));
        const existingIds = (membersData || []).map(m => m.member_id);
        setExistingMembers(existingIds);

        // If there are existing members, preselect them
        if (existingIds.length > 0 && selectedMembers.length === 0) {
          onChange(existingIds);
        }
      } catch (_error) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // intentional: runs only when projectId changes; onChange and selectedMembers are used only for initial preselection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const toggleMember = (profileId: string) => {
    if (selectedMembers.includes(profileId)) {
      // Don't allow removing if at minimum
      if (selectedMembers.length <= minMembers) return;
      onChange(selectedMembers.filter(id => id !== profileId));
    } else {
      // Don't allow adding if at maximum
      if (selectedMembers.length >= maxMembers) return;
      onChange([...selectedMembers, profileId]);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Users className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Selecciona el Equipo</h3>
        <p className="text-muted-foreground text-sm">
          Elige los miembros que trabajarán en este proyecto ({minMembers}-{maxMembers} personas)
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Badge variant={selectedMembers.length >= minMembers ? "default" : "destructive"}>
          {selectedMembers.length} seleccionados
        </Badge>
        {selectedMembers.length < minMembers && (
          <span className="text-sm text-destructive">
            Mínimo {minMembers} miembros
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {profiles.map(profile => {
          const isSelected = selectedMembers.includes(profile.id);
          const isExisting = existingMembers.includes(profile.id);
          
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => toggleMember(profile.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                "hover:shadow-md active:scale-[0.98]",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border hover:border-primary/50"
              )}
            >
              {/* Selection indicator */}
              <div className={cn(
                "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-primary text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                {isSelected ? <Check size={14} /> : <span className="text-xs">+</span>}
              </div>

              <div className="flex flex-col items-center text-center gap-2">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile.avatar || undefined} />
                  <AvatarFallback style={{ backgroundColor: profile.color || '#6366F1' }}>
                    {getInitials(profile.nombre)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm truncate max-w-[120px]">
                    {profile.nombre}
                  </p>
                  {isExisting && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Ya miembro
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedMembers.length > 0 && (
        <div className="p-4 rounded-xl bg-muted/50 space-y-2">
          <Label className="text-sm font-medium">Equipo seleccionado:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map(memberId => {
              const profile = profiles.find(p => p.id === memberId);
              if (!profile) return null;
              return (
                <Badge 
                  key={memberId} 
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2"
                >
                  <Avatar className="w-4 h-4">
                    <AvatarFallback 
                      className="text-[8px]"
                      style={{ backgroundColor: profile.color || '#6366F1' }}
                    >
                      {getInitials(profile.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  {profile.nombre.split(' ')[0]}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedMembers.length > minMembers) {
                        onChange(selectedMembers.filter(id => id !== memberId));
                      }
                    }}
                    className="ml-1 hover:text-destructive"
                    disabled={selectedMembers.length <= minMembers}
                  >
                    <X size={12} />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
