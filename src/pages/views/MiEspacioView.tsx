import { useState, useMemo } from 'react';
import { FileCheck, BookOpen, Trophy, Users, TrendingUp, Wallet, FolderKanban, CheckCircle2, Plus, Loader2 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { ValidationCard } from '@/components/nova/ValidationCard';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentMemberStats, useProjects, useProjectMembers, useObjectives } from '@/hooks/useNovaData';
import { ROLE_CONFIG } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { MyTasksList } from '@/components/tasks/MyTasksList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { useNavigate } from 'react-router-dom';

interface MiEspacioViewProps {
  onNewOBV?: () => void;
}

export function MiEspacioView({ onNewOBV }: MiEspacioViewProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: currentUserStats, isLoading: loadingStats } = useCurrentMemberStats(profile?.email);
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: objectives = [] } = useObjectives();
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Map objectives
  const objectivesMap = useMemo(() => {
    const map: Record<string, number> = {
      obvs: 150,
      lps: 18,
      bps: 66,
      cps: 40,
      facturacion: 15000,
      margen: 7500,
    };
    objectives.forEach(obj => {
      map[obj.name] = obj.target_value;
    });
    return map;
  }, [objectives]);

  // Get user's projects
  const userProjectIds = projectMembers
    .filter(pm => pm.member_id === profile?.id)
    .map(pm => pm.project_id);

  const userProjects = projects.filter(p => userProjectIds.includes(p.id));

  // Get user's roles per project
  const userRoles = projectMembers.filter(pm => pm.member_id === profile?.id);

  // Stats with fallback
  const stats = {
    obvs: Number(currentUserStats?.obvs) || 0,
    lps: Number(currentUserStats?.lps) || 0,
    bps: Number(currentUserStats?.bps) || 0,
    cps: Number(currentUserStats?.cps) || 0,
    facturacion: Number(currentUserStats?.facturacion) || 0,
    margen: Number(currentUserStats?.margen) || 0,
  };

  // First project for task form (default)
  const firstProject = userProjects[0];

  if (loadingStats || loadingProjects) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader 
        title="Mi Espacio" 
        subtitle={`Bienvenido, ${profile?.nombre || 'Usuario'}`} 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        {/* Personal Stats */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <StatCard 
            icon={FileCheck} 
            value={stats.obvs} 
            label="Mis OBVs" 
            progress={(stats.obvs / objectivesMap.obvs) * 100}
            target={objectivesMap.obvs}
            color="#6366F1"
            delay={1}
          />
          <StatCard 
            icon={BookOpen} 
            value={stats.lps} 
            label="Mis LPs" 
            progress={(stats.lps / objectivesMap.lps) * 100}
            target={objectivesMap.lps}
            color="#F59E0B"
            delay={2}
          />
          <StatCard 
            icon={Trophy} 
            value={stats.bps} 
            label="Mis BPs" 
            progress={(stats.bps / objectivesMap.bps) * 100}
            target={objectivesMap.bps}
            color="#22C55E"
            delay={3}
          />
          <StatCard 
            icon={Users} 
            value={stats.cps} 
            label="Mis CPs" 
            progress={(stats.cps / objectivesMap.cps) * 100}
            target={objectivesMap.cps}
            color="#EC4899"
            delay={4}
          />
          <StatCard 
            icon={TrendingUp} 
            value={`€${stats.facturacion.toFixed(0)}`} 
            label="Mi Facturación" 
            progress={(stats.facturacion / objectivesMap.facturacion) * 100}
            target={`€${objectivesMap.facturacion}`}
            color="#3B82F6"
            delay={5}
          />
          <StatCard 
            icon={Wallet} 
            value={`€${stats.margen.toFixed(0)}`} 
            label="Mi Margen" 
            progress={(stats.margen / objectivesMap.margen) * 100}
            target={`€${objectivesMap.margen}`}
            color="#22C55E"
            delay={6}
          />
        </div>

        {/* My Projects */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6 animate-fade-in delay-2" style={{ opacity: 0 }}>
          <div className="p-5 border-b border-border flex items-center gap-2.5">
            <FolderKanban size={18} className="text-primary" />
            <h3 className="font-semibold">Mis Proyectos y Roles</h3>
          </div>
          
          <div className="p-6">
            {userProjects.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No estás asignado a ningún proyecto</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {userProjects.map(project => {
                  const roleData = userRoles.find(r => r.project_id === project.id);
                  const role = roleData ? ROLE_CONFIG[roleData.role] : null;
                  
                  return (
                    <div 
                      key={project.id} 
                      onClick={() => navigate(`/proyecto/${project.id}`)}
                      className="relative bg-background border border-border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div 
                        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                        style={{ background: project.color }}
                      />
                      
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: `${project.color}20` }}
                        >
                          {project.icon}
                        </div>
                        {role && (
                          <div 
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ 
                              background: `${role.color}20`,
                              color: role.color 
                            }}
                          >
                            <role.icon size={14} />
                            {role.label}
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-bold text-base mb-1">{project.nombre}</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Fase: {project.fase.replace('_', ' ')} • {project.tipo === 'operacion' ? 'En operación' : 'En validación'}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                        <div className="text-center">
                          <p className="font-bold">-</p>
                          <p className="text-[10px] text-muted-foreground uppercase">OBVs</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">-</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Tareas</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">-</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Leads</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tasks & Validations */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in delay-3" style={{ opacity: 0 }}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-success" />
                Mis Tareas
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTaskForm(true)}
                disabled={!firstProject}
              >
                <Plus size={14} className="mr-1" />
                Añadir
              </Button>
            </div>
            <div className="p-6">
              <MyTasksList />
            </div>
          </div>

          <ValidationCard limit={3} delay={4} />
        </div>
      </div>

      {/* Task form for first project */}
      {firstProject && (
        <TaskForm
          projectId={firstProject.id}
          projectMembers={[{ id: profile?.id || '', nombre: profile?.nombre || '', color: profile?.color || '#6366F1' }]}
          open={showTaskForm}
          onOpenChange={setShowTaskForm}
        />
      )}
    </>
  );
}
