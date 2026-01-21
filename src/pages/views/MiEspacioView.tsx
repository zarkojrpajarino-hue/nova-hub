import { FileCheck, BookOpen, Trophy, Users, TrendingUp, Wallet, FolderKanban, CheckCircle2, Plus, Zap } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { ValidationCard } from '@/components/nova/ValidationCard';
import { Member, Project, PROJECT_ROLES, ROLE_CONFIG, OBJECTIVES, PENDING_VALIDATIONS } from '@/data/mockData';
import { Button } from '@/components/ui/button';

interface MiEspacioViewProps {
  currentUser: Member;
  projects: Project[];
  onNewOBV?: () => void;
}

export function MiEspacioView({ currentUser, projects, onNewOBV }: MiEspacioViewProps) {
  const userProjects = projects.filter(p => p.members.includes(currentUser.id));
  const userRoles = PROJECT_ROLES.filter(r => r.member_id === currentUser.id);

  return (
    <>
      <NovaHeader 
        title="Mi Espacio" 
        subtitle={`Bienvenido, ${currentUser.nombre}`} 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        {/* Personal Stats */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <StatCard 
            icon={FileCheck} 
            value={currentUser.obvs} 
            label="Mis OBVs" 
            progress={(currentUser.obvs / OBJECTIVES.obvs) * 100}
            target={OBJECTIVES.obvs}
            color="#6366F1"
            delay={1}
          />
          <StatCard 
            icon={BookOpen} 
            value={currentUser.lps} 
            label="Mis LPs" 
            progress={(currentUser.lps / OBJECTIVES.lps) * 100}
            target={OBJECTIVES.lps}
            color="#F59E0B"
            delay={2}
          />
          <StatCard 
            icon={Trophy} 
            value={currentUser.bps} 
            label="Mis BPs" 
            progress={(currentUser.bps / OBJECTIVES.bps) * 100}
            target={OBJECTIVES.bps}
            color="#22C55E"
            delay={3}
          />
          <StatCard 
            icon={Users} 
            value={currentUser.cps} 
            label="Mis CPs" 
            progress={(currentUser.cps / OBJECTIVES.cps) * 100}
            target={OBJECTIVES.cps}
            color="#EC4899"
            delay={4}
          />
          <StatCard 
            icon={TrendingUp} 
            value={`€${currentUser.facturacion.toFixed(0)}`} 
            label="Mi Facturación" 
            progress={(currentUser.facturacion / OBJECTIVES.facturacion) * 100}
            target={`€${OBJECTIVES.facturacion}`}
            color="#3B82F6"
            delay={5}
          />
          <StatCard 
            icon={Wallet} 
            value={`€${currentUser.margen.toFixed(0)}`} 
            label="Mi Margen" 
            progress={(currentUser.margen / OBJECTIVES.margen) * 100}
            target={`€${OBJECTIVES.margen}`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {userProjects.map(project => {
                const roleData = userRoles.find(r => r.project_id === project.id);
                const role = roleData ? ROLE_CONFIG[roleData.role] : null;
                
                return (
                  <div 
                    key={project.id} 
                    className="relative bg-background border border-border rounded-xl p-5 hover:border-muted-foreground/30 transition-all cursor-pointer"
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
                        <p className="font-bold">12</p>
                        <p className="text-[10px] text-muted-foreground uppercase">OBVs</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">5</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Tareas</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">3</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Leads</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks & Validations */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in delay-3" style={{ opacity: 0 }}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-success" />
                Mis Tareas de Hoy
              </h3>
              <Button variant="outline" size="sm">
                <Plus size={14} className="mr-1" />
                Añadir
              </Button>
            </div>
            <div className="p-6">
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={28} className="text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Sin tareas pendientes</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  ¡Buen trabajo! No tienes tareas para hoy.
                </p>
                <Button className="nova-gradient">
                  <Zap size={16} className="mr-1" />
                  Generar tareas con IA
                </Button>
              </div>
            </div>
          </div>

          <ValidationCard validations={PENDING_VALIDATIONS.slice(0, 3)} delay={4} />
        </div>
      </div>
    </>
  );
}
