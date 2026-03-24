import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, User, FolderKanban, FileCheck, Phone, Wallet,
  BookOpen, Settings, LogOut, LucideIcon, BarChart3, TrendingUp, Trophy, Crown, ArrowLeftRight, Shield, Plug, Bell, Rocket, Sparkles, ChevronDown, ChevronRight, Lock, Mic, Target, Layers, Home, Users, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimusLogo } from '@/components/brand/OptimusLogo';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { useTranslation } from 'react-i18next';
import { ThemeToggle, LanguageToggle } from '@/components/ui/theme-toggle';
import { PlanSelectionModal } from '@/components/subscription/PlanSelectionModal';
import { useAvailablePlans } from '@/hooks/useSubscription';
import { useProjectContext } from '@/hooks/useProjectContext';
import { usePhaseFeatures } from '@/hooks/usePhaseFeatures';
import { SIDEBAR_PHASE_CONFIG, SIDEBAR_TEASER_REASONS, type SidebarItemStatus } from '@/lib/phase-features';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NovaSidebarProps {
  currentView?: string; // legacy — no longer used for active state, kept for API compat
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

export function NovaSidebar({ setCurrentView, currentUser, onSignOut, onMenuHover, projectId }: NovaSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { canUseFeature } = useFeatureAccess(projectId);
  const availablePlans = useAvailablePlans();

  // S4.6 — Solo founder mode: hide team section when team_size <= 1
  const { data: projectContext } = useProjectContext(projectId);
  const isSoloMode = projectContext?.mode === 'solo';

  // UI.A — Phase-adaptive sidebar
  const { phase } = usePhaseFeatures(projectId);
  const phaseConfig = SIDEBAR_PHASE_CONFIG[phase] ?? SIDEBAR_PHASE_CONFIG[4];

  // UI.A.4 — "NUEVO" badge: detect newly visible items after phase change
  const lsKey = projectId ? `optimus_last_seen_phase_${projectId}` : null;
  const [clickedNewItems, setClickedNewItems] = useState<Set<string>>(new Set());

  const newlyVisibleItems = useMemo(() => {
    if (!lsKey) return new Set<string>();
    const storedPhase = parseInt(localStorage.getItem(lsKey) ?? '-1', 10);
    if (storedPhase < 0 || storedPhase >= phase) return new Set<string>();
    // Items that were hidden/teaser in stored phase but visible now
    const prevConfig = SIDEBAR_PHASE_CONFIG[storedPhase] ?? {};
    const curConfig = SIDEBAR_PHASE_CONFIG[phase] ?? {};
    const result = new Set<string>();
    for (const [id, status] of Object.entries(curConfig)) {
      if (status === 'visible') {
        const prev = prevConfig[id] ?? 'hidden';
        if (prev !== 'visible') result.add(id);
      }
    }
    return result;
  }, [lsKey, phase]);

  // Persist current phase on mount/change
  useEffect(() => {
    if (lsKey && phase >= 0) {
      const stored = parseInt(localStorage.getItem(lsKey) ?? '-1', 10);
      // Only update if we've had time to show badges (next render cycle after mount)
      if (stored < 0) {
        localStorage.setItem(lsKey, String(phase));
      }
    }
  }, [lsKey, phase]);

  const markNewItemSeen = useCallback((itemId: string) => {
    setClickedNewItems(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    // If all new items have been clicked, update stored phase
    if (lsKey && newlyVisibleItems.size > 0) {
      const allSeen = [...newlyVisibleItems].every(
        id => id === itemId || clickedNewItems.has(id)
      );
      if (allSeen) {
        localStorage.setItem(lsKey, String(phase));
      }
    }
  }, [lsKey, newlyVisibleItems, clickedNewItems, phase]);

  const getSidebarItemStatus = useCallback((itemId: string): SidebarItemStatus => {
    return phaseConfig[itemId] ?? 'visible';
  }, [phaseConfig]);

  const isNewItem = useCallback((itemId: string): boolean => {
    return newlyVisibleItems.has(itemId) && !clickedNewItems.has(itemId);
  }, [newlyVisibleItems, clickedNewItems]);

  // Filter items by phase visibility (removes hidden, keeps visible + teaser)
  const filterByPhase = useCallback((items: NavItem[]): NavItem[] => {
    return items.filter(item => getSidebarItemStatus(item.id) !== 'hidden');
  }, [getSidebarItemStatus]);

  // Estado para controlar que secciones estan abiertas (permite multiples)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['core']));

  // Estado para modal de upgrade
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [_selectedLockedFeature, setSelectedLockedFeature] = useState<{ name: string; requiredPlan: string } | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const renderSection = (
    id: string,
    SectionIcon: LucideIcon,
    title: string,
    items: NavItem[]
  ) => {
    // UI.A.2 — Filter items by phase visibility
    const visibleItems = filterByPhase(items);

    // Don't render section if no items are visible after filtering
    if (visibleItems.length === 0) return null;

    const isOpen = openSections.has(id);

    return (
      <div key={id} className="mb-1">
        {/* Header clickable */}
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <SectionIcon size={13} /> {title}
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
            {visibleItems.map((item) => {
              const phaseStatus = getSidebarItemStatus(item.id);
              const isPhaseTeaser = phaseStatus === 'teaser';

              // Verificar si está bloqueado por plan (subscription)
              const isPlanLocked = !isPhaseTeaser && item.requiredFeature && !canUseFeature(item.requiredFeature);

              const isItemActive = () => {
                if (isPhaseTeaser) return false;
                if (item.route !== undefined && projectId) {
                  const basePath = `/proyecto/${projectId}`;
                  const fullPath = item.route === '' ? basePath : `${basePath}/${item.route}`;
                  return location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`);
                }
                return false;
              };

              return (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  isActive={isItemActive()}
                  isLocked={isPlanLocked}
                  isPhaseTeaser={isPhaseTeaser}
                  isNew={isNewItem(item.id)}
                  teaserReason={isPhaseTeaser ? (SIDEBAR_TEASER_REASONS[item.id] ?? 'sidebar.teaser.default') : undefined}
                  onClick={() => {
                    if (isPhaseTeaser) {
                      // UI.A.3 — Click on teaser: show toast with reason
                      const reasonKey = SIDEBAR_TEASER_REASONS[item.id] ?? 'sidebar.teaser.default';
                      toast.info(t(reasonKey), { duration: 4000 });
                      return;
                    }
                    // UI.A.4 — Mark new item as seen on click
                    if (isNewItem(item.id)) {
                      markNewItemSeen(item.id);
                    }
                    if (item.route !== undefined) {
                      if (projectId) {
                        const basePath = `/proyecto/${projectId}`;
                        const targetPath = item.route === '' ? basePath : `${basePath}/${item.route}`;
                        navigate(targetPath);
                      } else {
                        navigate(item.route);
                      }
                    } else {
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
          <div aria-label={t('nova.logoOptimusk')}>
            <OptimusLogo size={40} variant="auto" />
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
        {renderSection('core', Home, t('nav.sections.core'), coreItems)}
        {renderSection('create', Rocket, t('nav.sections.createValidate'), createValidateItems)}
        {renderSection('execute', Briefcase, t('nav.sections.execute'), executeItems)}
        {/* S4.6 — Hide team section in solo mode */}
        {!isSoloMode && renderSection('team', Users, t('nav.sections.team'), teamItems)}
        {renderSection('measure', BarChart3, t('nav.sections.measure'), measureItems)}
        {renderSection('system', Settings, t('nav.sections.system'), systemItems)}
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
        onSelectPlan={(planId, billingCycle) => {
          console.info('[Upgrade] Plan selected:', { planId, billingCycle, context: 'sidebar' });
          setShowUpgradeModal(false);
          setSelectedLockedFeature(null);
        }}
        availablePlans={availablePlans}
      />
    </aside>
  );
}

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isLocked?: boolean;
  isPhaseTeaser?: boolean;
  isNew?: boolean;
  teaserReason?: string;
  onClick: () => void;
  onHover?: () => void;
}

function SidebarNavItem({
  item,
  isActive,
  isLocked = false,
  isPhaseTeaser = false,
  isNew = false,
  teaserReason,
  onClick,
  onHover,
}: SidebarNavItemProps) {
  const { t } = useTranslation();
  const translatedLabel = t(item.label);

  // UI.A.3 — Phase teaser rendering
  if (isPhaseTeaser) {
    const reasonText = teaserReason ? t(teaserReason) : t('sidebar.teaser.default');
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClick}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium',
                'opacity-50 cursor-not-allowed text-muted-foreground'
              )}
              aria-label={`${translatedLabel} - ${t('sidebar.teaser.locked')}`}
              role="menuitem"
            >
              <Lock
                size={16}
                className="text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <span className="flex-1 text-left">{translatedLabel}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="font-semibold mb-1">{translatedLabel}</p>
            <p className="text-xs text-muted-foreground">{reasonText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const content = (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
        isLocked && "opacity-60 hover:opacity-80",
        !isLocked && isActive && "optimus-gradient-subtle optimus-border text-foreground",
        !isLocked && !isActive && "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
      )}
      aria-label={isLocked ? `${translatedLabel} (${t('nav.featureRequiresPlan', { plan: item.requiredPlan })})` : `${t('sidebar.navigateTo')} ${translatedLabel}`}
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

      {/* UI.A.4 — "NUEVO" dot badge for newly unlocked items */}
      {isNew && !isLocked && (
        <span
          className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"
          aria-label={t('sidebar.newBadge')}
        />
      )}

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
      {!isLocked && !isNew && item.badge && (
        <span
          className="ml-auto bg-destructive text-destructive-foreground text-[11px] font-semibold px-2 py-0.5 rounded-full"
          aria-label={`${item.badge} ${t('nav.pending')}`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );

  // Si está bloqueado por plan, envolver con tooltip
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
              {t('nav.featureRequiresPlan', { plan: item.requiredPlan })}
            </p>
            <p className="text-xs text-primary">{t('nova.clickParaVerPlanes')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
