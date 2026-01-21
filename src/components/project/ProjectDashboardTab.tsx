import { FileCheck, TrendingUp, Target, Users, Wallet } from 'lucide-react';
import { StatCard } from '@/components/nova/StatCard';
import { ROLE_CONFIG } from '@/data/mockData';

interface ProjectDashboardTabProps {
  project: any;
  stats: any;
  teamMembers: any[];
  leadsCount: number;
}

export function ProjectDashboardTab({ project, stats, teamMembers, leadsCount }: ProjectDashboardTabProps) {
  const facturacion = Number(stats?.facturacion) || 0;
  const margen = Number(stats?.margen) || 0;
  const totalOBVs = Number(stats?.total_obvs) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={FileCheck}
          value={totalOBVs}
          label="OBVs"
          progress={0}
          color="#6366F1"
          delay={1}
        />
        <StatCard
          icon={Target}
          value={leadsCount}
          label="Leads"
          progress={0}
          color="#F59E0B"
          delay={2}
        />
        <StatCard
          icon={Users}
          value={teamMembers.length}
          label="Miembros"
          progress={0}
          color="#EC4899"
          delay={3}
        />
        <StatCard
          icon={TrendingUp}
          value={`€${facturacion}`}
          label="Facturación"
          progress={0}
          color="#3B82F6"
          delay={4}
        />
        <StatCard
          icon={Wallet}
          value={`€${margen}`}
          label="Margen"
          progress={0}
          color="#22C55E"
          delay={5}
        />
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Equipo
          </h3>
          <div className="space-y-3">
            {teamMembers.map((member: any) => {
              const roleConfig = ROLE_CONFIG[member.role];
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-background rounded-xl">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ background: member.color || '#6366F1' }}
                  >
                    {member.nombre?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{member.nombre}</p>
                    {roleConfig && (
                      <p className="text-xs" style={{ color: roleConfig.color }}>
                        {roleConfig.label}
                      </p>
                    )}
                  </div>
                  {member.isLead && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md font-medium">
                      Lead
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileCheck size={18} className="text-primary" />
            Estado del Proyecto
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Fase</span>
                <span className="font-medium capitalize">{project.fase}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <span className="font-medium">
                  {project.tipo === 'operacion' ? 'En operación' : 'En validación'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Onboarding</span>
                <span className={`font-medium ${project.onboarding_completed ? 'text-success' : 'text-warning'}`}>
                  {project.onboarding_completed ? 'Completado' : 'Pendiente'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-success/10 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Leads Ganados</p>
              <p className="text-2xl font-bold text-success">{stats?.leads_ganados || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
