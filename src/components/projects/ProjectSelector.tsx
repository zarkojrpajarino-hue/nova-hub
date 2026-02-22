/**
 * 🔄 PROJECT SELECTOR
 *
 * Dropdown en navbar para cambiar entre proyectos
 * Muestra proyecto actual y permite seleccionar otro
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, Check, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProjectSelector() {
  const navigate = useNavigate();
  const { currentProject, userProjects, switchProject } = useCurrentProject();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectProject = (projectId: string) => {
    switchProject(projectId);
    setIsOpen(false);
  };

  const handleCreateProject = () => {
    navigate('/create-project');
    setIsOpen(false);
  };

  const handleViewAllProjects = () => {
    navigate('/select-project');
    setIsOpen(false);
  };

  if (!currentProject && userProjects.length === 0) {
    return (
      <Button
        onClick={() => navigate('/create-first-project')}
        variant="outline"
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Crear Proyecto
      </Button>
    );
  }

  if (!currentProject && userProjects.length > 0) {
    return (
      <Button
        onClick={handleViewAllProjects}
        variant="outline"
        size="sm"
      >
        <Folder className="h-4 w-4 mr-2" />
        Seleccionar Proyecto
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            {currentProject?.logo_url ? (
              <img
                src={currentProject.logo_url}
                alt={currentProject.nombre}
                className="w-5 h-5 rounded object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {currentProject?.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate font-medium">
              {currentProject?.nombre}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[300px]">
        <DropdownMenuLabel className="text-xs text-gray-500">
          PROYECTOS ({userProjects.length})
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* List of projects */}
        <div className="max-h-[300px] overflow-y-auto">
          {userProjects.map((project) => {
            const isCurrent = project.id === currentProject?.id;

            return (
              <DropdownMenuItem
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className={cn(
                  'cursor-pointer py-3',
                  isCurrent && 'bg-primary/5'
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  {/* Logo/Icon */}
                  {project.logo_url ? (
                    <img
                      src={project.logo_url}
                      alt={project.nombre}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {project.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {project.nombre}
                      </p>
                      {isCurrent && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>

                    {project.industry && (
                      <p className="text-xs text-gray-500 truncate">
                        {project.industry}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mt-1">
                      <WorkModeBadge workMode={project.work_mode} />
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuItem
          onClick={handleCreateProject}
          className="cursor-pointer text-primary font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Nuevo Proyecto
        </DropdownMenuItem>

        {userProjects.length > 3 && (
          <DropdownMenuItem
            onClick={handleViewAllProjects}
            className="cursor-pointer"
          >
            <Folder className="h-4 w-4 mr-2" />
            Ver Todos los Proyectos
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkModeBadge({ workMode }: { workMode: string }) {
  const labels = {
    individual: { text: 'Individual', color: 'bg-blue-100 text-blue-800' },
    team_small: { text: 'Equipo', color: 'bg-green-100 text-green-800' },
    team_established: { text: 'Empresa', color: 'bg-purple-100 text-purple-800' },
    no_roles: { text: 'Sin Roles', color: 'bg-gray-100 text-gray-800' },
  };

  const config = labels[workMode as keyof typeof labels] || labels.team_small;

  return (
    <Badge className={cn('text-xs px-2 py-0', config.color)}>
      {config.text}
    </Badge>
  );
}
