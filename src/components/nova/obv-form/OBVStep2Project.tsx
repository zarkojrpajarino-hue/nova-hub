import { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OBVFormData } from './useOBVFormLogic';

interface Project {
  id: string;
  nombre: string;
  icon: string;
  color: string;
  fase: string;
  tipo: string;
}

interface OBVStep2ProjectProps {
  formData: OBVFormData;
  userProjects: Project[];
  onUpdate: (updates: Partial<OBVFormData>) => void;
}

export const OBVStep2Project = memo(function OBVStep2Project({
  formData,
  userProjects,
  onUpdate
}: OBVStep2ProjectProps) {
  return (
    <>
      <h4 className="text-lg font-semibold text-center mb-6">
        Paso 2: Selecciona el proyecto
      </h4>
      <div className="max-w-md mx-auto space-y-4 mb-8">
        {userProjects.length === 0 ? (
          <p className="text-center text-muted-foreground">No estás asignado a ningún proyecto</p>
        ) : (
          <div className="grid gap-3">
            {userProjects.map(project => (
              <div
                key={project.id}
                onClick={() => onUpdate({ projectId: project.id })}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  formData.projectId === project.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${project.color}20` }}
                >
                  {project.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{project.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.fase} • {project.tipo}
                  </p>
                </div>
                {formData.projectId === project.id && (
                  <Check size={20} className="text-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
});
