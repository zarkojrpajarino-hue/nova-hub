/**
 * 📁 SELECT PROJECT PAGE
 *
 * Página que se muestra cuando el usuario tiene múltiples proyectos
 * Permite seleccionar cuál proyecto quiere trabajar
 */

import { useNavigate } from 'react-router-dom';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { useProjectPlan } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRight, Clock, Crown, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function SelectProjectPage() {
  const navigate = useNavigate();
  const { userProjects, setCurrentProject } = useCurrentProject();

  const handleSelectProject = (project: Record<string, unknown> & { id: string }) => {
    setCurrentProject(project);
    navigate(`/proyecto/${project.id}`);
  };

  const handleCreateNewProject = () => {
    navigate('/select-onboarding-type');
  };

  if (userProjects.length === 0) {
    // Si no tiene proyectos, redirigir a crear primero
    navigate('/create-first-project');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Selecciona un Proyecto</h1>
          <p className="text-gray-600">
            Tienes {userProjects.length} proyecto{userProjects.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {userProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => handleSelectProject(project)}
            />
          ))}

          {/* Create New Project Card */}
          <Card
            className="border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-all hover:shadow-lg"
            onClick={handleCreateNewProject}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[250px] p-6">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Crear Nuevo Proyecto</h3>
              <p className="text-sm text-gray-600 text-center">
                Empieza un nuevo proyecto desde cero
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onSelect }: { project: Record<string, unknown> & { id: string; nombre: string; updated_at: string }; onSelect: () => void }) {
  const { data: subscription } = useProjectPlan(project.id);

  const getPlanBadge = () => {
    if (!subscription) return null;

    const isTrial = subscription.status === 'trial';
    const isExpired = subscription.status === 'expired';

    if (isExpired) {
      return (
        <Badge variant="destructive" className="mb-2">
          <Clock className="h-3 w-3 mr-1" />
          Expirado
        </Badge>
      );
    }

    if (isTrial) {
      const daysLeft = subscription.trial_ends_at
        ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      return (
        <Badge variant="secondary" className="mb-2">
          <Clock className="h-3 w-3 mr-1" />
          Trial - {daysLeft} días
        </Badge>
      );
    }

    const planColors = {
      starter: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-amber-100 text-amber-800',
    };

    const planIcons = {
      starter: Zap,
      pro: Crown,
      enterprise: Crown,
    };

    const Icon = planIcons[subscription.plan_id as keyof typeof planIcons] || Zap;
    const colorClass = planColors[subscription.plan_id as keyof typeof planColors] || 'bg-gray-100 text-gray-800';

    return (
      <Badge className={`mb-2 ${colorClass}`}>
        <Icon className="h-3 w-3 mr-1" />
        {subscription.plan?.display_name}
      </Badge>
    );
  };

  const getWorkModeLabel = () => {
    const labels = {
      individual: 'Individual',
      team_small: 'Equipo Pequeño',
      team_established: 'Equipo Establecido',
      no_roles: 'Sin Roles',
    };
    return labels[project.work_mode as keyof typeof labels] || project.work_mode;
  };

  return (
    <Card className="hover:shadow-xl transition-all cursor-pointer group" onClick={onSelect}>
      <CardHeader>
        {getPlanBadge()}

        {/* Logo/Icon */}
        {project.logo_url ? (
          <img
            src={project.logo_url}
            alt={project.nombre}
            className="w-16 h-16 rounded-lg mb-4 object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 text-2xl font-bold text-white">
            {project.nombre.charAt(0).toUpperCase()}
          </div>
        )}

        <CardTitle className="mb-2">{project.nombre}</CardTitle>

        {project.descripcion && (
          <CardDescription className="line-clamp-2">
            {project.descripcion}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-2 mb-4">
          {/* Work Mode */}
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium mr-2">Modo:</span>
            <span>{getWorkModeLabel()}</span>
          </div>

          {/* Industry */}
          {project.industry && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium mr-2">Industria:</span>
              <span>{project.industry}</span>
            </div>
          )}

          {/* Last updated */}
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium mr-2">Actualizado:</span>
            <span>
              {formatDistanceToNow(new Date(project.updated_at), {
                addSuffix: true,
                locale: es
              })}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
          variant="outline"
        >
          Abrir Proyecto
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
