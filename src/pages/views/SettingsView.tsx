import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, LogOut, ChevronRight, FileText } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useSettings';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { AdminSettings } from '@/components/settings/AdminSettings';
import { DocumentManager } from '@/components/evidence';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { SettingsPreviewModal } from '@/components/preview/SettingsPreviewModal';

interface SettingsViewProps {
  onNewOBV?: () => void;
}

type SettingsTab = 'profile' | 'notifications' | 'admin' | 'evidence';

export function SettingsView({ onNewOBV }: SettingsViewProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: userRoles = [] } = useUserRoles();
  const { currentProject } = useCurrentProject();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
    { id: 'evidence' as const, label: 'Fuentes de Evidencia', icon: FileText },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Administración', icon: Shield }] : []),
  ];

  return (
    <>
      <NovaHeader
        title="Configuración"
        subtitle="Gestiona tu perfil y preferencias"
        onNewOBV={onNewOBV}
        showBackButton={true}
      />
      
      <div className="p-8">
        {/* How It Works */}
        <div className="mb-6">
          <HowItWorks
            title="Configuración del Sistema"
            description="Personaliza tu experiencia en Nova Hub"
            whatIsIt="Centro de configuración donde puedes gestionar tu perfil, preferencias de notificaciones y ajustes de administración. Controla cómo interactúas con la plataforma."
            dataInputs={[
              {
                from: "Tu Perfil",
                items: [
                  "Nombre y datos personales",
                  "Preferencias de idioma y zona horaria",
                  "Configuración de privacidad"
                ]
              }
            ]}
            dataOutputs={[
              {
                to: "Toda la plataforma",
                items: [
                  "Experiencia personalizada",
                  "Notificaciones configuradas",
                  "Permisos y accesos definidos"
                ]
              }
            ]}
            nextStep={{
              action: "Personaliza tu perfil y preferencias",
              destination: "Mejora tu experiencia diaria"
            }}
            onViewPreview={() => setShowPreviewModal(true)}
          />
        </div>

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
            {activeTab === 'evidence' && currentProject && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold mb-2">Fuentes de Evidencia</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Sube documentos (PDFs, CSVs, XLSX) para que la IA los use como fuentes de evidencia en todas las generaciones. Los documentos se procesan automáticamente con búsqueda de texto completo.
                  </p>
                  <DocumentManager projectId={currentProject.id} />
                </div>
              </div>
            )}
            {activeTab === 'admin' && isAdmin && <AdminSettings />}
          </div>
        </div>
      </div>

      <HelpWidget section="settings" />

      {/* Preview Modal */}
      <SettingsPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </>
  );
}
