/**
 * PROJECTS VIEW - Enterprise Edition
 *
 * Vista rediseñada con tabs:
 * - Mis Proyectos: Lista de proyectos existentes
 * - Crear con IA: Generative Onboarding integrado
 * - Crear Manual: Formulario tradicional
 *
 * SIN datos demo - Solo datos reales
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, FolderKanban, Sparkles, Plus, Rocket } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { ProjectCard } from '@/components/nova/ProjectCard';
import { useProjects, useProjectMembers, useMemberStats } from '@/hooks/useNovaData';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { DeletedProjectsDialog } from '@/components/projects/DeletedProjectsDialog';
import { GenerativeOnboardingView } from './GenerativeOnboardingView';
import { HowItWorks } from '@/components/ui/how-it-works';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GenerativeOnboardingPreviewModal } from '@/components/preview/GenerativeOnboardingPreviewModal';

interface ProjectsViewProps {
  onNewOBV?: () => void;
}

export function ProjectsView({ onNewOBV }: ProjectsViewProps) {
  const _navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: members = [] } = useMemberStats();

  // Transform data for ProjectCard compatibility
  const projectsWithMembers = projects.map((p) => ({
    ...p,
    members: projectMembers.filter((pm) => pm.project_id === p.id).map((pm) => pm.member_id),
  }));

  const membersForCard = members.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    email: m.email || `${m.nombre.toLowerCase().replace(' ', '.')}@nova.com`,
    color: m.color || '#6366F1',
    avatar: m.avatar || null,
    lps: Number(m.lps) || 0,
    bps: Number(m.bps) || 0,
    obvs: Number(m.obvs) || 0,
    cps: Number(m.cps) || 0,
    exploracion: 0,
    validacion: 0,
    venta: 0,
    facturacion: Number(m.facturacion) || 0,
    margen: Number(m.margen) || 0,
  }));

  const projectRoles = projectMembers.map((pm) => ({
    project_id: pm.project_id,
    member_id: pm.member_id,
    role: pm.role,
  }));

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader
        title="Proyectos"
        subtitle="Punto de inicio de tu startup. Crea, valida y escala tu idea."
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8 space-y-6">
        {/* How it works */}
        <HowItWorks
          title="Cómo funciona"
          description="Proyectos es el corazón de Nova Hub donde defines tu startup"
          whatIsIt="Aquí creas tu proyecto/startup y generas TODOS los recursos necesarios: branding, productos, estrategia de validación, y más. Todo generado con IA en minutos."
          onViewPreview={() => setShowPreviewModal(true)}
          dataOutputs={[
            {
              to: 'Validaciones',
              items: [
                'Experimentos Lean Startup sugeridos',
                'Hipótesis a testear',
                'Criterios de éxito',
              ],
            },
            {
              to: 'CRM Global',
              items: [
                'Buyer Personas (cliente ideal)',
                'Value Propositions (por qué comprar)',
                'Battle cards vs competidores',
              ],
            },
            {
              to: 'Financiero',
              items: ['Productos con pricing', 'Modelo de monetización', 'Revenue forecast'],
            },
          ]}
          nextStep={{
            action: 'Una vez creado tu proyecto',
            destination: 'Ve a VALIDACIONES para testear tu idea con clientes reales',
          }}
          defaultExpanded={projects.length === 0}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="projects" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Mis Proyectos
              {projects.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {projects.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Crear con IA
              <Badge variant="default" className="ml-1 bg-gradient-to-r from-primary to-purple-500">
                Nuevo
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Manual
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Mis Proyectos */}
          <TabsContent value="projects" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {projects.length === 0
                    ? 'Aún no tienes proyectos'
                    : `${projects.length} ${projects.length === 1 ? 'Proyecto' : 'Proyectos'}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {projects.length === 0
                    ? 'Crea tu primer proyecto con IA en el tab "Crear con IA"'
                    : 'Click en un proyecto para ver detalles y métricas'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <DeletedProjectsDialog />
              </div>
            </div>

            {projects.length === 0 ? (
              <EmptyState
                icon={Rocket}
                title="¡Comienza tu viaje emprendedor!"
                description="Crea tu primer proyecto con IA. En menos de 10 minutos tendrás: branding completo, productos con pricing, buyer personas, y website deployado."
                action={{
                  label: 'Crear con IA',
                  onClick: () => setActiveTab('ai'),
                  variant: 'default',
                }}
                secondaryAction={{
                  label: 'Crear manual',
                  onClick: () => setActiveTab('manual'),
                }}
                variant="card"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projectsWithMembers.map((project, i) => (
                  <div
                    key={project.id}
                    className="animate-fade-in"
                    style={{ opacity: 0, animationDelay: `${i * 0.05}s` }}
                  >
                    <ProjectCard
                      project={project}
                      members={membersForCard}
                      roles={projectRoles}
                      showRoles
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Crear con IA (Generative Onboarding) */}
          <TabsContent value="ai" className="mt-6">
            <GenerativeOnboardingView />
          </TabsContent>

          {/* Tab 3: Crear Manual */}
          <TabsContent value="manual" className="mt-6 space-y-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">Crear Proyecto Manual</h3>
                <p className="text-sm text-muted-foreground">
                  Define tu proyecto paso a paso con el formulario tradicional
                </p>
              </div>

              <CreateProjectDialog
                trigger={
                  <EmptyState
                    icon={Plus}
                    title="Formulario de Creación Manual"
                    description="Si prefieres definir tu proyecto manualmente sin usar IA, usa este formulario. Podrás añadir: nombre, descripción, industria, target customer, etc."
                    action={{
                      label: 'Abrir Formulario',
                      onClick: () => {},
                      variant: 'outline',
                    }}
                    secondaryAction={{
                      label: 'Mejor usar IA',
                      onClick: () => setActiveTab('ai'),
                    }}
                    variant="card"
                  />
                }
              />

              <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-blue-600 mb-1">
                      ¿Por qué usar IA en lugar de manual?
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Genera branding completo en 2 minutos (logo, colores, tipografía)</li>
                      <li>• Crea 5 productos con pricing estratégico</li>
                      <li>• Define buyer personas con pain points reales</li>
                      <li>• Analiza competencia y genera battle cards</li>
                      <li>• Sugiere experimentos de validación</li>
                      <li>• Deploya website automáticamente</li>
                    </ul>
                    <p className="text-xs mt-2 text-blue-600 font-semibold">
                      Todo lo anterior te tomaría semanas hacerlo manual. Con IA: 10 minutos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Modal */}
      <GenerativeOnboardingPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </>
  );
}
