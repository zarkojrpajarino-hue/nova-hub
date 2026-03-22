import { useState } from 'react';
import {
  LayoutDashboard, User, FolderKanban, FileCheck, Phone, Wallet,
  BookOpen, Settings, LogOut, LucideIcon, BarChart3, TrendingUp, Trophy, Crown, ArrowLeftRight, Shield, Plug, Bell, Rocket, Sparkles, ChevronDown, ChevronRight, Lock, Mic, Target, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { useTranslation } from 'react-i18next';
import { ThemeToggle, LanguageToggle } from '@/components/ui/theme-toggle';
import { PlanSelectionModal } from '@/components/subscription/PlanSelectionModal';
import { useAvailablePlans } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NovaSidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: {
    nombre?: string;
    color?: string;
  } | null;
  onSignOut?: () => void;
  onMenuHover?: (viewId: string) => void; // ✨ OPTIMIZADO: Para preloading
  projectId?: string; // Project ID para verificar features premium
}

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  route?: string; // Ruta opcional para navegación con React Router
  requiredFeature?: 'ai_role_generation' | 'ai_task_generation' | 'ai_logo_generation' | 'ai_buyer_persona' | 'advanced_analytics' | 'custom_branding' | 'api_access' | 'priority_support' | 'white_label' | 'custom_domain'; // Feature premium requerida
  requiredPlan?: 'starter' | 'pro' | 'advanced' | 'enterprise'; // Plan mínimo (para mostrar en badge)
}

// Navegación reorganizada con jerarquía lógica
// NOTA: Las rutas son relativas al proyecto (/proyecto/:projectId)
const coreItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'nav.dashboard', route: '' }, // ruta vacía = base del proyecto
  { id: 'mi-espacio', icon: User, label: 'nav.mySpace', route: 'mi-espacio' },
  { id: 'mi-desarrollo', icon: TrendingUp, label: 'nav.myDevelopment', route: 'mi-desarrollo' },
  { id: 'mi-modelo', icon: Layers, label: 'nav.myModel', route: 'mi-modelo' },
];

const createValidateItems: NavItem[] = [
  { id: 'proyectos', icon: FolderKanban, label: 'nav.projects', route: 'proyectos' },
  { id: 'validaciones', icon: Shield, label: 'nav.validations', route: 'validaciones' },
  { id: 'obvs', icon: FileCheck, label: 'nav.obvCenter', route: 'obvs' },
];

const executeItems: NavItem[] = [
  { id: 'startup-os', icon: Target, label: 'nav.startupOS', route: 'startup-os' },
  { id: 'crm', icon: Phone, label: 'nav.crmGlobal', route: 'crm' },
  { id: 'financiero', icon: Wallet, label: 'nav.financial', route: 'financiero' },
  { id: 'meetings', icon: Mic, label: 'nav.meetingIntelligence', route: 'meetings' },
  { id: 'analisis-ia', icon: Sparkles, label: 'nav.aiAnalysis', route: 'analisis-ia' },
  { id: 'toolkit', icon: Layers, label: 'nav.founderToolkit', route: 'toolkit' },
];

const teamItems: NavItem[] = [
  { id: 'exploration', icon: Rocket, label: 'nav.roleExploration', route: 'exploration' },
  { id: 'path-to-master', icon: Trophy, label: 'nav.masterPath', route: 'path-to-master' },
  { id: 'rankings', icon: Trophy, label: 'nav.rankings', route: 'rankings' },
  { id: 'masters', icon: Crown, label: 'nav.masters', route: 'masters' },
  { id: 'rotacion', icon: ArrowLeftRight, label: 'nav.rotation', route: 'rotacion' },
];

const measureItems: NavItem[] = [
  { id: 'kpis', icon: BookOpen, label: 'nav.kpis', route: 'kpis' },
  {
    id: 'analytics',
    icon: BarChart3,
    label: 'nav.analytics',
    route: 'analytics',
    requiredFeature: 'advanced_analytics',
    requiredPlan: 'advanced'
  },
  {
    id: 'team-performance',
    icon: BarChart3,
    label: 'nav.globalView',
    route: 'team-performance',
    requiredFeature: 'advanced_analytics',
    requiredPlan: 'advanced'
  },
];

const systemItems: NavItem[] = [
  { id: 'settings', icon: Settings, label: 'nav.settings', route: 'settings' },
  {
    id: 'integrations',
    icon: Plug,
    label: 'nav.integrations',
    route: 'integrations',
    requiredFeature: 'api_access',
    requiredPlan: 'advanced'
  },
  { id: 'notificaciones', icon: Bell, label: 'nav.notifications', route: 'notificaciones' },
];

export function NovaSidebar({ currentView, setCurrentView, currentUser, onSignOut, onMenuHover, projectId }: NovaSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { canUseFeature } = useFeatureAccess(projectId);
  const availablePlans = useAvailablePlans();

  // Estado para controlar qué secciones están abiertas (solo una a la vez)
  const [openSection, setOpenSection] = useState<string>('core');

  // Estado para modal de upgrade
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [_selectedLockedFeature, setSelectedLockedFeature] = useState<{ name: string; requiredPlan: string } | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? '' : section);
  };

  const renderSection = (
    id: string,
    emoji: string,
    title: string,
    items: NavItem[]
  ) => {
    const isOpen = openSection === id;

    return (
      <div key={id} className="mb-1">
        {/* Header clickable */}
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {emoji} {title}
          </span>
          {isOpen ? (
            <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>

        {/* Items (solo se muestran si está abierto) */}
        {isOpen && (
          <div className="mt-1 space-y-0.5">
            {items.map((item) => {
              // Verificar si está bloqueado
              const isLocked = item.requiredFeature && !canUseFeature(item.requiredFeature);

              const isItemActive = () => {
                if (item.route !== undefined && projectId) {
                  const basePath = `/proyecto/${projectId}`;
                  const fullPath = item.route === '' ? basePath : `${basePath}/${item.route}`;
                  // Comparación exacta para ruta base, o que termine con la ruta
                  return location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`);
                }
                // Fallback al sistema antiguo
                return currentView === item.id;
              };

              return (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={isItemActive()}
                  isLocked={isLocked}
                  onClick={() => {
                    // ✨ CAMBIO: Siempre permitir navegación para que vean el valor
                    // El bloqueo se hace en la vista con FeatureGate
                    if (item.route !== undefined) {
                      // Si está dentro de un proyecto, navegar relativamente
                      if (projectId) {
                        const basePath = `/proyecto/${projectId}`;
                        const targetPath = item.route === '' ? basePath : `${basePath}/${item.route}`;
                        navigate(targetPath);
                      } else {
                        // Fallback a navegación absoluta
                        navigate(item.route);
                      }
                    } else {
                      // Fallback al sistema antiguo de vistas
                      setCurrentView(item.id);
                    }
                  }}
                  onHover={() => onMenuHover?.(item.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen fixed z-50"
      aria-label={t('nav.mainNavigation', t('nova.navegaciónPrincipal'))}
    >
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3" role="banner">
          <div
            className="w-10 h-10 nova-gradient rounded-xl flex items-center justify-center font-bold text-lg text-primary-foreground animate-pulse-glow"
            aria-label={t('nova.logoOptimusk')}
          >
            O
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">OPTIMUS-K</span>
            <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-semibold">
              BETA
            </span>
          </div>
        </div>
      </div>

      {/* Navigation con Accordion */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-2" aria-label={t('nova.menúDeNavegación')}>
        {renderSection('core', '🏠', t('nav.sections.core'), coreItems)}
        {renderSection('create', '🚀', t('nav.sections.createValidate'), createValidateItems)}
        {renderSection('execute', '💼', t('nav.sections.execute'), executeItems)}
        {renderSection('team', '👥', t('nav.sections.team'), teamItems)}
        {renderSection('measure', '📊', t('nav.sections.measure'), measureItems)}
        {renderSection('system', '⚙️', t('nav.sections.system'), systemItems)}

        {/* SISTEMA - deprecated old code below this line */}
        <div className="hidden">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            ⚙️ Sistema
          </p>
          {systemItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={item.route ? location.pathname === item.route : currentView === item.id}
              onClick={() => {
                if (item.route) {
                  navigate(item.route);
                } else {
                  setCurrentView(item.id);
                }
              }}
            />
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer group">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm text-primary-foreground"
            style={{ background: currentUser?.color || '#6366F1' }}
          >
            {currentUser?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{currentUser?.nombre || t('nav.user')}</p>
            <p className="text-xs text-muted-foreground">{t('nova.teamMember')}</p>
          </div>
          <Settings size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <div className="flex items-center gap-1 mt-2">
          <ThemeToggle className="h-8 w-8" />
          <LanguageToggle className="h-8" />
        </div>
        <button
          onClick={onSignOut}
          className="w-full mt-1 flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors text-sm"
          aria-label={t('nav.signOut')}
        >
          <LogOut size={16} aria-hidden="true" />
          {t('nav.signOut')}
        </button>
      </div>

      {/* Upgrade Modal */}
      <PlanSelectionModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setSelectedLockedFeature(null);
        }}
        onSelectPlan={(_planId, _billingCycle) => {
          // TODO: Implementar upgrade en Fase 7
          setShowUpgradeModal(false);
          setSelectedLockedFeature(null);
        }}
        availablePlans={availablePlans}
      />
    </aside>
  );
}

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  isLocked?: boolean;
  onClick: () => void;
  onHover?: () => void; // ✨ OPTIMIZADO: Para preloading en hover
}

function NavItem({ item, isActive, isLocked = false, onClick, onHover }: NavItemProps) {
  const { t } = useTranslation();
  const translatedLabel = t(item.label);
  const content = (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
        isLocked && "opacity-60 hover:opacity-80",
        !isLocked && isActive && "nova-gradient-subtle nova-border text-foreground",
        !isLocked && !isActive && "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
      )}
      aria-label={isLocked ? `${translatedLabel} (Requiere ${item.requiredPlan})` : `Navegar a ${translatedLabel}`}
      aria-current={isActive ? 'page' : undefined}
      role="menuitem"
    >
      <item.icon
        size={18}
        className={cn(
          "transition-colors",
          isActive && !isLocked ? "text-primary" : "opacity-70"
        )}
        aria-hidden="true"
      />
      <span className="flex-1 text-left">{translatedLabel}</span>

      {/* Badge de plan requerido si está bloqueado */}
      {isLocked && item.requiredPlan && (
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 h-5 gap-1 bg-amber-100 text-amber-700 border-amber-200"
        >
          <Lock size={10} />
          {item.requiredPlan.charAt(0).toUpperCase() + item.requiredPlan.slice(1)}
        </Badge>
      )}

      {/* Badge normal si no está bloqueado */}
      {!isLocked && item.badge && (
        <span
          className="ml-auto bg-destructive text-destructive-foreground text-[11px] font-semibold px-2 py-0.5 rounded-full"
          aria-label={`${item.badge} pendientes`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );

  // Si está bloqueado, envolver con tooltip
  if (isLocked) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="font-semibold mb-1">{translatedLabel}</p>
            <p className="text-xs text-muted-foreground mb-2">
              Esta funcionalidad requiere el plan{' '}
              <span className="font-semibold text-foreground">{item.requiredPlan}</span>
            </p>
            <p className="text-xs text-primary">{t('nova.clickParaVerPlanes')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
