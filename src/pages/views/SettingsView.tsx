import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { AdminSettings } from '@/components/settings/AdminSettings';
import { SectionHelp, HelpWidget } from '@/components/ui/section-help';

interface SettingsViewProps {
  onNewOBV?: () => void;
}

type SettingsTab = 'profile' | 'notifications' | 'admin';

export function SettingsView({ onNewOBV }: SettingsViewProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: userRoles = [] } = useUserRoles();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Check if current user is admin or tlt
  const currentUserRole = userRoles.find(r => r.user_id === profile?.id)?.role;
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'tlt';

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const tabs = [
    { id: 'profile' as const, label: 'Mi Perfil', icon: User },
    { id: 'notifications' as const, label: 'Notificaciones', icon: Bell },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Administración', icon: Shield }] : []),
  ];

  return (
    <>
      <NovaHeader 
        title="Configuración" 
        subtitle="Gestiona tu perfil y preferencias" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        <SectionHelp section="settings" variant="inline" />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                <tab.icon size={18} />
                <span className="font-medium">{tab.label}</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
            ))}

            {/* Logout Button */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start mt-4 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <LogOut size={18} className="mr-3" />
              Cerrar sesión
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'admin' && isAdmin && <AdminSettings />}
          </div>
        </div>
      </div>

      <HelpWidget section="settings" />
    </>
  );
}
