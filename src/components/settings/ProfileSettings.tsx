import { useState, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile, useUploadAvatar } from '@/hooks/useSettings';

const PROFILE_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
  '#22C55E', '#14B8A6', '#3B82F6', '#06B6D4', '#84CC16',
  '#F97316', '#A855F7', '#10B981', '#FBBF24', '#FB7185'
];

export function ProfileSettings() {
  const { profile, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nombre, setNombre] = useState(profile?.nombre || '');
  const [color, setColor] = useState(profile?.color || '#6366F1');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar || null);
  
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar 2MB');
      return;
    }

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to storage
      const publicUrl = await uploadAvatar.mutateAsync(file);
      
      // Update profile with new avatar URL
      await updateProfile.mutateAsync({ avatar: publicUrl });
      toast.success('Avatar actualizado');
    } catch (_error) {
      toast.error('Error al subir el avatar');
      setAvatarPreview(profile?.avatar || null);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile.mutateAsync({ avatar: null });
      setAvatarPreview(null);
      toast.success('Avatar eliminado');
    } catch (_error) {
      toast.error('Error al eliminar el avatar');
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ nombre, color });
      toast.success('Perfil actualizado');
    } catch (_error) {
      toast.error('Error al guardar');
    }
  };

  const isLoading = updateProfile.isPending || uploadAvatar.isPending;

  return (
    <div className="space-y-6">
      {/* Avatar & Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👤 Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white overflow-hidden"
                  style={{ background: color }}
                >
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    nombre?.charAt(0) || 'U'
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
                >
                  {uploadAvatar.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              
              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  className="text-xs text-destructive mt-2 hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Eliminar foto
                </button>
              )}
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El email no se puede cambiar
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎨 Color Identificativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Este color te identifica en rankings, proyectos y equipo
          </p>
          
          <div className="flex flex-wrap gap-2">
            {PROFILE_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-10 h-10 rounded-xl transition-all",
                  color === c 
                    ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" 
                    : "hover:scale-105"
                )}
                style={{ background: c }}
              >
                {color === c && (
                  <span className="text-white text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <><Loader2 size={16} className="mr-2 animate-spin" /> Guardando...</>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </div>
  );
}
