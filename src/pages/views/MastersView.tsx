import { useState, useMemo } from 'react';
import { Crown, Star, Swords, Loader2, TrendingUp } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTeamMasters, useMasterApplications, useMasterChallenges, useMyMasterApplications } from '@/hooks/useMasters';
import { useProfiles, useProjectMembers } from '@/hooks/useNovaData';
import { MasterCard } from '@/components/masters/MasterCard';
import { ApplicationsList } from '@/components/masters/ApplicationsList';
import { ChallengesList } from '@/components/masters/ChallengesList';
import { ApplyForMasterDialog } from '@/components/masters/ApplyForMasterDialog';
import { ROLE_CONFIG } from '@/data/mockData';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { MastersPreviewModal } from '@/components/preview/MastersPreviewModal';
import type { Master, MasterChallenge, Profile, ProjectMember, EnrichedMaster, MastersByRole } from '@/types/masters';

import { useTranslation } from 'react-i18next';
export function MastersView() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  // Only real data - no demo mode
  const { data: masters = [], isLoading: loadingMasters } = useTeamMasters();
  const { data: applications = [] } = useMasterApplications('voting');
  const { data: challenges = [] } = useMasterChallenges();
  const { data: myApplications = [] } = useMyMasterApplications(profile?.id);
  const { data: profiles = [] } = useProfiles();
  const { data: projectMembers = [] } = useProjectMembers();

  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Get user's roles for applying
  const userRoles = useMemo<string[]>(() => {
    if (!profile?.id) return [];
    const roles = projectMembers
      .filter((pm: ProjectMember) => pm.member_id === profile.id)
      .map((pm: ProjectMember) => pm.role);
    return [...new Set(roles)];
  }, [projectMembers, profile?.id]);

  // Check if user is already a master
  const isUserMaster = useMemo<boolean>(() => {
    return masters.some((m: Master) => m.user_id === profile?.id);
  }, [masters, profile?.id]);

  // Enrich masters with profile data
  const enrichedMasters = useMemo<EnrichedMaster[]>(() => {
    return masters.map((master: Master): EnrichedMaster => {
      const userProfile = profiles.find((p: Profile) => p.id === master.user_id);
      return {
        ...master,
        userName: userProfile?.nombre || t('masters.usuario'),
        userAvatar: userProfile?.avatar ?? null,
        userColor: userProfile?.color || '#6366F1',
      };
    });
  }, [masters, profiles]);

  // Group masters by role
  const mastersByRole = useMemo<MastersByRole>(() => {
    return enrichedMasters.reduce((acc: MastersByRole, master: EnrichedMaster) => {
      if (!acc[master.role_name]) {
        acc[master.role_name] = [];
      }
      acc[master.role_name].push(master);
      return acc;
    }, {} as MastersByRole);
  }, [enrichedMasters]);

  // Stats
  const stats = useMemo(() => ({
    totalMasters: masters.length,
    pendingApplications: applications.length,
    activeChallenges: challenges.filter((c: MasterChallenge) => c.status === 'in_progress').length,
    myApplications: myApplications.length,
  }), [masters, applications, challenges, myApplications]);

  if (loadingMasters) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader
        title={t('masters.mastersDeNova')}
        subtitle={t('masters.hallOfFameDe')}
        showBackButton={true}
      />

      <div className="p-8">
        {/* How it works */}
        <HowItWorks
          title={t('masters.cómoFunciona')}
          description={t('masters.galeríaDeMastersActuales')}
          whatIsIt={t('masters.hallOfFamePúblico')}
          dataInputs={[
            {
              from: t('masters.caminoAMaster'),
              items: [
                'Masters actuales por rol (quién es el #1)',
                t('masters.requisitosCumplidosParaPoder'),
                t('masters.historialDeDesafíosGanadosperdidos'),
              ],
            },
            {
              from: t('masters.rankings'),
              items: [
                t('masters.top3PorRol'),
                t('masters.performanceScoreVsMaster'),
              ],
            },
          ]}
          dataOutputs={[
            {
              to: t('masters.mastersActuales'),
              items: [
                t('masters.listaDeTodosLos'),
                t('masters.nivelJuniorMasterSenior'),
                t('masters.desafíosDefendidosExitosamente'),
                'Número de mentees (personas que mentorean)',
              ],
            },
            {
              to: t('masters.aplicacionesEnVotación'),
              items: [
                t('masters.aplicacionesNuevasPendientesDe'),
                t('masters.votosAFavorenContra'),
                t('masters.deadlineDeVotación'),
              ],
            },
            {
              to: t('masters.desafíosActivos0'),
              items: [
                'Challenges en progreso (Master vs Retador)',
                t('masters.tipoDeDesafíoPerformance'),
                t('masters.deadlineYProgreso'),
              ],
            },
          ]}
          nextStep={{
            action: t('masters.revisaMastersActualesCumple'),
            destination: t('masters.veACaminoA'),
          }}
          onViewPreview={() => setShowPreviewModal(true)}
        />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Crown className="text-amber-500" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMasters}</p>
                <p className="text-sm text-muted-foreground">{t('masters.mastersActivos')}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Star className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingApplications}</p>
                <p className="text-sm text-muted-foreground">{t('masters.enVotación')}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Swords className="text-destructive" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeChallenges}</p>
                <p className="text-sm text-muted-foreground">{t('masters.desafíosActivos')}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="text-success" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.myApplications}</p>
                <p className="text-sm text-muted-foreground">{t('masters.misAplicaciones')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Apply Button */}
        {!isUserMaster && userRoles.length > 0 && (
          <div className="mb-6">
            <Button onClick={() => setShowApplyDialog(true)} className="gap-2">
              <Crown size={18} />{t('masters.aplicarParaSerMaster')}</Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="masters" className="space-y-6">
          <TabsList>
            <TabsTrigger value="masters" className="gap-2">
              <Crown size={16} />{t('masters.masters')}</TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Star size={16} />
              Aplicaciones
              {stats.pendingApplications > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.pendingApplications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-2">
              <Swords size={16} />{t('masters.desafíos')}</TabsTrigger>
          </TabsList>

          {/* Masters Tab */}
          <TabsContent value="masters">
            {Object.keys(mastersByRole).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <Crown size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">{t('masters.sinMastersAún')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t('masters.séElPrimeroEn')}</p>
                  {userRoles.length > 0 && (
                    <Button onClick={() => setShowApplyDialog(true)}>{t('masters.aplicarAhora')}</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(mastersByRole).map(([roleName, roleMasters]: [string, EnrichedMaster[]]) => {
                  const roleConfig = ROLE_CONFIG[roleName];
                  const RoleIcon = roleConfig?.icon || Crown;

                  return (
                    <Card key={roleName}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ background: `${roleConfig?.color || '#6366F1'}20` }}
                          >
                            <RoleIcon size={20} style={{ color: roleConfig?.color || '#6366F1' }} />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              Masters de {roleConfig?.label || roleName}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {roleMasters.length} master{roleMasters.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {roleMasters.map((master: EnrichedMaster) => (
                            <MasterCard
                              key={master.id}
                              master={master}
                              canChallenge={profile?.id !== master.user_id}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <ApplicationsList 
              applications={applications}
              profiles={profiles}
              currentUserId={profile?.id}
            />
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <ChallengesList 
              challenges={challenges}
              masters={masters}
              profiles={profiles}
              currentUserId={profile?.id}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Apply Dialog */}
      <ApplyForMasterDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
        userRoles={userRoles}
        userId={profile?.id}
      />

      {/* Preview Modal */}
      <MastersPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />

      <HelpWidget section="masters" />
    </>
  );
}
