import { useState, useMemo } from 'react';
import { Crown, Trophy, Star, Users, Swords, Loader2, Award, Medal, Shield, TrendingUp } from 'lucide-react';
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
import { SectionHelp, HelpWidget } from '@/components/ui/section-help';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { DEMO_MASTERS, DEMO_MASTER_APPLICATIONS, DEMO_MASTER_CHALLENGES, DEMO_MEMBERS, DEMO_PROJECT_MEMBERS } from '@/data/demoData';

export function MastersView() {
  const { isDemoMode } = useDemoMode();
  const { profile } = useAuth();
  const { data: realMasters = [], isLoading: loadingMasters } = useTeamMasters();
  const { data: realApplications = [] } = useMasterApplications('voting');
  const { data: realChallenges = [] } = useMasterChallenges();
  const { data: myApplications = [] } = useMyMasterApplications(profile?.id);
  const { data: realProfiles = [] } = useProfiles();
  const { data: realProjectMembers = [] } = useProjectMembers();
  
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  // Use demo data when in demo mode
  const masters = isDemoMode ? DEMO_MASTERS.map(m => ({
    id: m.id,
    user_id: m.user_id,
    role_name: m.role_name,
    level: m.nivel,
    title: m.title,
    is_active: m.is_active,
    appointed_at: m.appointed_at,
    successful_defenses: m.successful_defenses,
    total_mentees: m.total_mentees,
    expires_at: null,
    created_at: m.appointed_at,
  })) as any[] : realMasters;
  
  const applications = isDemoMode ? DEMO_MASTER_APPLICATIONS.map(a => ({
    id: a.id,
    user_id: a.user_id,
    role_name: a.role_name,
    motivation: a.motivation,
    status: a.status,
    votes_for: a.votes_for,
    votes_against: a.votes_against,
    votes_required: a.votes_required,
    voting_deadline: a.voting_deadline,
    created_at: a.created_at,
    project_id: null,
    achievements: null,
    reviewed_at: null,
    updated_at: a.created_at,
  })) as any[] : realApplications;
  
  const challenges = isDemoMode ? DEMO_MASTER_CHALLENGES.map(c => ({
    id: c.id,
    master_id: c.master_id,
    challenger_id: c.challenger_id,
    role_name: c.role_name,
    status: c.status,
    description: c.description,
    deadline: c.deadline,
    created_at: c.created_at,
    challenge_type: 'performance',
    criteria: null,
    result: null,
    result_notes: null,
    completed_at: null,
  })) as any[] : realChallenges;
  
  const profiles = isDemoMode ? DEMO_MEMBERS.map(m => ({
    id: m.id,
    nombre: m.nombre,
    email: m.email,
    avatar: m.avatar,
    color: m.color,
    auth_id: m.id,
    created_at: null,
    updated_at: null,
    especialization: null,
  })) as any[] : realProfiles;
  
  const projectMembers = isDemoMode ? DEMO_PROJECT_MEMBERS as any[] : realProjectMembers;

  // Get user's roles for applying - in demo mode, show Zarko's roles
  const demoUserId = isDemoMode ? '1' : profile?.id;
  const userRoles = useMemo(() => {
    if (!demoUserId) return [];
    const roles = projectMembers
      .filter((pm: any) => pm.member_id === demoUserId)
      .map((pm: any) => pm.role);
    return [...new Set(roles)] as string[];
  }, [projectMembers, demoUserId]);

  // Check if user is already a master
  const isUserMaster = useMemo(() => {
    return masters.some((m: any) => m.user_id === demoUserId);
  }, [masters, demoUserId]);

  // Enrich masters with profile data
  const enrichedMasters = useMemo(() => {
    return masters.map((master: any) => {
      const userProfile = profiles.find((p: any) => p.id === master.user_id);
      return {
        ...master,
        userName: userProfile?.nombre || 'Usuario',
        userAvatar: userProfile?.avatar,
        userColor: userProfile?.color || '#6366F1',
      };
    });
  }, [masters, profiles]);

  // Group masters by role
  const mastersByRole = useMemo(() => {
    return enrichedMasters.reduce((acc: Record<string, any[]>, master: any) => {
      if (!acc[master.role_name]) {
        acc[master.role_name] = [];
      }
      acc[master.role_name].push(master);
      return acc;
    }, {} as Record<string, any[]>);
  }, [enrichedMasters]);

  // Stats
  const stats = useMemo(() => ({
    totalMasters: masters.length,
    pendingApplications: applications.length,
    activeChallenges: challenges.filter((c: any) => c.status === 'in_progress').length,
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
        title="Masters de NOVA" 
        subtitle="Líderes de conocimiento y mentores del equipo" 
      />
      
      <div className="p-8">
        <SectionHelp section="masters" variant="inline" />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Crown className="text-amber-500" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMasters}</p>
                <p className="text-sm text-muted-foreground">Masters Activos</p>
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
                <p className="text-sm text-muted-foreground">En Votación</p>
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
                <p className="text-sm text-muted-foreground">Desafíos Activos</p>
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
                <p className="text-sm text-muted-foreground">Mis Aplicaciones</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Apply Button */}
        {!isUserMaster && userRoles.length > 0 && (
          <div className="mb-6">
            <Button onClick={() => setShowApplyDialog(true)} className="gap-2">
              <Crown size={18} />
              Aplicar para ser Master
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="masters" className="space-y-6">
          <TabsList>
            <TabsTrigger value="masters" className="gap-2">
              <Crown size={16} />
              Masters
            </TabsTrigger>
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
              <Swords size={16} />
              Desafíos
            </TabsTrigger>
          </TabsList>

          {/* Masters Tab */}
          <TabsContent value="masters">
            {Object.keys(mastersByRole).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <Crown size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">Sin Masters aún</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sé el primero en aplicar para convertirte en Master de tu rol
                  </p>
                  {userRoles.length > 0 && (
                    <Button onClick={() => setShowApplyDialog(true)}>
                      Aplicar ahora
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(mastersByRole).map(([roleName, roleMasters]: [string, any[]]) => {
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
                          {roleMasters.map((master: any) => (
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

      <HelpWidget section="masters" />
    </>
  );
}
