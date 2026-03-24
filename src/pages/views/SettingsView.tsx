import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, LogOut, ChevronRight, FileText, CreditCard } from 'lucide-react';
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
import { ManageSubscription } from '@/components/subscription/ManageSubscription';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { SettingsPreviewModal } from '@/components/preview/SettingsPreviewModal';

import { useTranslation } from 'react-i18next';
interface SettingsViewProps {
  onNewOBV?: () => void;
}

type SettingsTab = 'profile' | 'notifications' | 'admin' | 'evidence' | 'subscription';

export function SettingsView({ onNewOBV }: SettingsViewProps) {
  const { t } = useTranslation();
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
    { id: 'profile' as const, label: t('settings.miPerfil'), icon: User },
    { id: 'notifications' as const, label: t('settings.notificaciones'), icon: Bell },
    { id: 'subscription' as const, label: t('settings.subscription'), icon: CreditCard },
    { id: 'evidence' as const, label: t('settings.fuentesDeEvidencia0'), icon: FileText },
    ...(isAdmin ? [{ id: 'admin' as const, label: t('settings.administración'), icon: Shield }] : []),
  ];

  return (
    <>
      <NovaHeader
        title={t('settings.configuración')}
        subtitle={t('settings.gestionaTuPerfilY')}
        onNewOBV={onNewOBV}
        showBackButton={true}
      />
      
      <div className="p-8">
        {/* How It Works */}
        <div className="mb-6">
          <HowItWorks
            title={t('settings.configuraciónDelSistema')}
            description={t('settings.personalizaTuExperienciaEn')}
            whatIsIt={t('settings.centroDeConfiguraciónDonde')}
            dataInputs={[
              {
                from: t('settings.tuPerfil'),
                items: [
                  t('settings.nombreYDatosPersonales'),
                  t('settings.preferenciasDeIdiomaY'),
                  t('settings.configuraciónDePrivacidad')
                ]
              }
            ]}
            dataOutputs={[
              {
                to: t('settings.todaLaPlataforma'),
                items: [
                  t('settings.experienciaPersonalizada'),
                  t('settings.notificacionesConfiguradas'),
                  t('settings.permisosYAccesosDefinidos')
                ]
              }
            ]}
            nextStep={{
              action: t('settings.personalizaTuPerfilY'),
              destination: t('settings.mejoraTuExperienciaDiaria')
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
              <LogOut size={18} className="mr-3" />{t('settings.cerrarSesión')}</Button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'subscription' && <ManageSubscription />}
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'evidence' && currentProject && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-semibold mb-2">{t('settings.fuentesDeEvidencia')}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{t('settings.subeDocumentosPdfsCsvs')}</p>
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
