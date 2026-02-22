import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationSettings {
  nuevas_obvs: boolean;
  validaciones: boolean;
  tareas: boolean;
  resumen_semanal: boolean;
}

export interface UserSettings {
  id: string;
  user_id: string;
  notifications: NotificationSettings;
}

const defaultNotifications: NotificationSettings = {
  nuevas_obvs: true,
  validaciones: true,
  tareas: true,
  resumen_semanal: false,
};

export function useUserSettings() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['user_settings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return default settings if none exist
      if (!data) {
        return {
          id: '',
          user_id: profile.id,
          notifications: defaultNotifications,
        } as UserSettings;
      }
      
      // Parse notifications from JSON
      const notifications = data.notifications as unknown as NotificationSettings;
      
      return {
        ...data,
        notifications: {
          ...defaultNotifications,
          ...notifications,
        },
      } as UserSettings;
    },
    enabled: !!profile?.id,
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (notifications: NotificationSettings) => {
      if (!profile?.id) throw new Error('No user');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('user_settings')
          .update({
            notifications: JSON.parse(JSON.stringify(notifications)),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', profile.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('user_settings')
          .insert([{
            user_id: profile.id,
            notifications: JSON.parse(JSON.stringify(notifications)),
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { nombre?: string; color?: string; avatar?: string | null }) => {
      if (!user?.id) throw new Error('No user');

      const { error } = await supabase
        .from('members')
        .update({
          nombre: data.nombre,
          color: data.color,
          avatar: data.avatar,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['member_stats'] });
    },
  });
}

export function useUpdateObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, target_value }: { id: string; target_value: number }) => {
      const { error } = await supabase
        .from('objectives')
        .update({ target_value })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
    },
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('No user');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      await supabase.storage.from('avatars').remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    },
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: ['user_roles_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'tlt' | 'member' }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
    },
  });
}
