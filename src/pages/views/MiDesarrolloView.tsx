import { useState, useMemo } from 'react';
import { Loader2, TrendingUp, Lightbulb, BookOpen, Trophy, Target } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRolePerformance, useRoleRankings } from '@/hooks/useDevelopment';
import { useProjectMembers } from '@/hooks/useNovaData';
import { RolePerformanceCard } from '@/components/development/RolePerformanceCard';
import { InsightsList } from '@/components/development/InsightsList';
import { PlaybookViewer } from '@/components/development/PlaybookViewer';
import { ROLE_CONFIG } from '@/data/mockData';

export function MiDesarrolloView() {
  const { profile } = useAuth();
  const { data: performances = [], isLoading: loadingPerformance } = useRolePerformance(profile?.id);
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: rankings = [] } = useRoleRankings();
  
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('rendimiento');

  // Get user's roles
  const userRoles = useMemo(() => {
    const roles = projectMembers
      .filter(pm => pm.member_id === profile?.id)
      .map(pm => pm.role);
    return [...new Set(roles)];
  }, [projectMembers, profile?.id]);

  // Get rankings for current user
  const userRankings = useMemo(() => {
    return rankings.reduce((acc, r) => {
      if (r.user_id === profile?.id) {
        acc[`${r.role_name}-${r.project_id}`] = {
          position: r.ranking_position,
          previousPosition: r.previous_position,
        };
      }
      return acc;
    }, {} as Record<string, { position: number; previousPosition: number | null }>);
  }, [rankings, profile?.id]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (performances.length === 0) return null;
    
    const avgTaskRate = performances.reduce((sum, p) => sum + p.task_completion_rate, 0) / performances.length;
    const totalOBVs = performances.reduce((sum, p) => sum + p.validated_obvs, 0);
    const totalFacturacion = performances.reduce((sum, p) => sum + p.total_facturacion, 0);
    const avgScore = performances.reduce((sum, p) => sum + p.performance_score, 0) / performances.length;
    
    return { avgTaskRate, totalOBVs, totalFacturacion, avgScore };
  }, [performances]);

  if (loadingPerformance) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader 
        title="Mi Desarrollo" 
        subtitle="Rendimiento, aprendizajes y crecimiento profesional" 
      />
      
      <div className="p-8">
        {/* Overall Stats */}
        {overallStats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallStats.avgScore.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Puntuación Promedio</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Target className="text-success" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallStats.avgTaskRate.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Completitud Tareas</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="text-amber-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallStats.totalOBVs}</p>
                  <p className="text-sm text-muted-foreground">OBVs Validadas</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userRoles.length}</p>
                  <p className="text-sm text-muted-foreground">Roles Activos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="rendimiento" className="gap-2">
                <TrendingUp size={16} />
                Rendimiento
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Lightbulb size={16} />
                Insights
              </TabsTrigger>
              <TabsTrigger value="playbook" className="gap-2">
                <BookOpen size={16} />
                Playbook
              </TabsTrigger>
            </TabsList>

            {activeTab === 'rendimiento' && userRoles.length > 0 && (
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {userRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {ROLE_CONFIG[role]?.label || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Rendimiento Tab */}
          <TabsContent value="rendimiento">
            {performances.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <TrendingUp size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">Sin datos de rendimiento</h3>
                  <p className="text-sm text-muted-foreground">
                    Necesitas estar asignado a proyectos para ver tu rendimiento
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performances
                  .filter(p => selectedRole === 'all' || p.role_name === selectedRole)
                  .map(performance => (
                    <RolePerformanceCard
                      key={`${performance.project_id}-${performance.role_name}`}
                      performance={performance}
                      ranking={userRankings[`${performance.role_name}-${performance.project_id}`]}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <Card>
              <CardContent className="p-6">
                <InsightsList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playbook Tab */}
          <TabsContent value="playbook">
            {userRoles.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <BookOpen size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">Sin roles asignados</h3>
                  <p className="text-sm text-muted-foreground">
                    Únete a un proyecto para obtener un playbook personalizado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {userRoles.map(role => {
                    const config = ROLE_CONFIG[role];
                    return (
                      <Badge
                        key={role}
                        variant={selectedRole === role ? 'default' : 'outline'}
                        className="cursor-pointer px-4 py-2"
                        onClick={() => setSelectedRole(role)}
                        style={selectedRole === role ? {} : { borderColor: config?.color, color: config?.color }}
                      >
                        {config?.icon && <config.icon size={14} className="mr-1" />}
                        {config?.label || role}
                      </Badge>
                    );
                  })}
                </div>
                
                {selectedRole && selectedRole !== 'all' && (
                  <PlaybookViewer roleName={selectedRole} />
                )}
                
                {selectedRole === 'all' && userRoles.length > 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center">
                      <BookOpen size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        Selecciona un rol para ver su playbook personalizado
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
