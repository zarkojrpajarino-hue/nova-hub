/**
 * PROJECT HELP MENU
 *
 * Menú contextual de ayuda para ProjectPage.
 * Muestra ayuda para todas las pestañas: Dashboard, Equipo, CRM, Tareas, OBVs, Financiero, Onboarding.
 */

import { useState } from 'react';
import {
  HelpCircle,
  LayoutDashboard,
  Users,
  Target,
  Kanban,
  FileCheck,
  TrendingUp,
  Rocket,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getHelp } from '@/data/helpContent';
import type { HelpContent } from '@/components/ui/section-help';

const PROJECT_SECTIONS = [
  {
    id: 'proyecto.dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Vista general del proyecto',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'proyecto.equipo',
    label: 'Equipo',
    icon: Users,
    description: 'Miembros y roles',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'proyecto.crm',
    label: 'CRM',
    icon: Target,
    description: 'Pipeline de ventas',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'proyecto.tareas',
    label: 'Tareas',
    icon: Kanban,
    description: 'Gestión de tareas',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'proyecto.obvs',
    label: 'OBVs',
    icon: FileCheck,
    description: 'Observaciones de valor',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'proyecto.financiero',
    label: 'Financiero',
    icon: TrendingUp,
    description: 'Métricas financieras',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'proyecto.onboarding',
    label: 'Onboarding',
    icon: Rocket,
    description: 'Configuración adaptativa',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
];

interface HelpSectionDisplayProps {
  icon: React.ElementType;
  title: string;
  content: string | string[];
  iconColor: string;
}

const HelpSectionDisplay = ({ icon: Icon, title, content, iconColor }: HelpSectionDisplayProps) => (
  <div className="flex gap-3 py-3 border-b border-border/50 last:border-0">
    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-foreground mb-1">{title}</h4>
      {Array.isArray(content) ? (
        <ul className="text-sm text-muted-foreground space-y-1">
          {content.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
      )}
    </div>
  </div>
);

const HelpContentDisplay = ({ content }: { content: HelpContent }) => (
  <div className="space-y-1">
    <HelpSectionDisplay
      icon={HelpCircle}
      title="Descripción"
      content={content.description}
      iconColor="bg-blue-500/10 text-blue-500"
    />

    {content.howItWorks && (
      <HelpSectionDisplay
        icon={Target}
        title="Cómo funciona"
        content={content.howItWorks}
        iconColor="bg-purple-500/10 text-purple-500"
      />
    )}

    {content.dataSource && (
      <HelpSectionDisplay
        icon={LayoutDashboard}
        title="Origen de datos"
        content={content.dataSource}
        iconColor="bg-green-500/10 text-green-500"
      />
    )}

    {content.validation && (
      <HelpSectionDisplay
        icon={FileCheck}
        title="Proceso de validación"
        content={content.validation}
        iconColor="bg-amber-500/10 text-amber-500"
      />
    )}

    {content.tips && content.tips.length > 0 && (
      <HelpSectionDisplay
        icon={Rocket}
        title="Consejos útiles"
        content={content.tips}
        iconColor="bg-cyan-500/10 text-cyan-500"
      />
    )}
  </div>
);

export function ProjectHelpMenu() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
    setDialogOpen(true);
  };

  const selectedContent = selectedSection ? getHelp(selectedSection) : null;
  const selectedInfo = PROJECT_SECTIONS.find(s => s.id === selectedSection);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle size={16} />
            <span>¿Cómo funciona?</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <div className="px-2 py-1.5">
            <p className="text-sm font-semibold text-foreground">Guía del Proyecto</p>
            <p className="text-xs text-muted-foreground">Selecciona una sección para ver la ayuda</p>
          </div>
          <DropdownMenuSeparator />
          {PROJECT_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <DropdownMenuItem
                key={section.id}
                className="cursor-pointer gap-3"
                onClick={() => handleSectionClick(section.id)}
              >
                <div className={`w-8 h-8 rounded-lg ${section.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={section.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{section.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          {selectedContent && selectedInfo && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${selectedInfo.bgColor} flex items-center justify-center`}>
                    <selectedInfo.icon className={`w-5 h-5 ${selectedInfo.color}`} />
                  </div>
                  <div>
                    <span className="text-lg">{selectedContent.title}</span>
                    <p className="text-sm font-normal text-muted-foreground mt-0.5">
                      Guía completa de uso
                    </p>
                  </div>
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Guía de ayuda para {selectedContent.title}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                <HelpContentDisplay content={selectedContent} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
