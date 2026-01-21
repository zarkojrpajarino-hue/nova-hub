import { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Crown, Star, Loader2, RefreshCw } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoleRankings, useRolePerformance } from '@/hooks/useDevelopment';
import { useProfiles, useProjects, useProjectMembers } from '@/hooks/useNovaData';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_CONFIG } from '@/data/mockData';
import { RankingLeaderboard } from '@/components/rankings/RankingLeaderboard';
import { RankingTrends } from '@/components/rankings/RankingTrends';
import { MyRankingCard } from '@/components/rankings/MyRankingCard';

export function RankingsView() {
  const { profile } = useAuth();
  const { data: rankings = [], isLoading: loadingRankings } = useRoleRankings();
  const { data: performances = [] } = useRolePerformance();
  const { data: profiles = [] } = useProfiles();
  const { data: projects = [] } = useProjects();
  const { data: projectMembers = [] } = useProjectMembers();
  
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Get all unique roles
  const allRoles = useMemo(() => {
    const roles = [...new Set(projectMembers.map(pm => pm.role))];
    return roles.filter(role => ROLE_CONFIG[role]);
  }, [projectMembers]);

  // Get user's rankings
  const myRankings = useMemo(() => {
    return rankings.filter(r => r.user_id === profile?.id);
  }, [rankings, profile?.id]);

  // Enrich rankings with profile data
  const enrichedRankings = useMemo(() => {
    return rankings.map(ranking => {
      const userProfile = profiles.find(p => p.id === ranking.user_id);
      const project = projects.find(p => p.id === ranking.project_id);
      const performance = performances.find(
        p => p.user_id === ranking.user_id && 
             p.project_id === ranking.project_id && 
             p.role_name === ranking.role_name
      );
      
      return {
        ...ranking,
        userName: userProfile?.nombre || 'Usuario',
        userAvatar: userProfile?.avatar,
        userColor: userProfile?.color || '#6366F1',
        projectName: project?.nombre || 'Proyecto',
        projectColor: project?.color || '#6366F1',
        performance,
      };
    });
  }, [rankings, profiles, projects, performances]);

  // Filter rankings
  const filteredRankings = useMemo(() => {
    return enrichedRankings.filter(r => {
      if (selectedRole !== 'all' && r.role_name !== selectedRole) return false;
      if (selectedProject !== 'all' && r.project_id !== selectedProject) return false;
      return true;
    }).sort((a, b) => a.ranking_position - b.ranking_position);
  }, [enrichedRankings, selectedRole, selectedProject]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalParticipants = new Set(rankings.map(r => r.user_id)).size;
    const rolesWithRankings = new Set(rankings.map(r => r.role_name)).size;
    const avgScore = rankings.length > 0 
      ? rankings.reduce((sum, r) => sum + Number(r.score), 0) / rankings.length 
      : 0;
    
    return { totalParticipants, rolesWithRankings, avgScore };
  }, [rankings]);

  if (loadingRankings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader 
        title="Rankings" 
        subtitle="Clasificación global por roles y proyectos" 
      />
      
      <div className="p-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Trophy className="text-amber-500" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Participantes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Medal className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rolesWithRankings}</p>
                <p className="text-sm text-muted-foreground">Roles Rankeados</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Star className="text-success" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgScore.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Score Promedio</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Crown className="text-purple-500" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{myRankings.length}</p>
                <p className="text-sm text-muted-foreground">Mis Rankings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Rankings Summary */}
        {myRankings.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              Mis Posiciones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRankings.map(ranking => {
                const project = projects.find(p => p.id === ranking.project_id);
                return (
                  <MyRankingCard 
                    key={ranking.id} 
                    ranking={ranking}
                    projectName={project?.nombre || 'Proyecto'}
                    projectColor={project?.color || '#6366F1'}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs for different views */}
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy size={16} />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="trends" className="gap-2">
                <TrendingUp size={16} />
                Tendencias
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-3">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {allRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {ROLE_CONFIG[role]?.label || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.icon} {project.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="leaderboard">
            <RankingLeaderboard 
              rankings={filteredRankings} 
              currentUserId={profile?.id}
            />
          </TabsContent>

          <TabsContent value="trends">
            <RankingTrends 
              rankings={enrichedRankings}
              selectedRole={selectedRole}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
