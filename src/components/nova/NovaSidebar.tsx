import { 
  LayoutDashboard, User, FolderKanban, FileCheck, Phone, Wallet, 
  BookOpen, Users2, Settings, LogOut, LucideIcon, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NovaSidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: {
    nombre?: string;
    color?: string;
  } | null;
  onSignOut?: () => void;
}

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'mi-espacio', icon: User, label: 'Mi Espacio' },
  { id: 'proyectos', icon: FolderKanban, label: 'Proyectos', badge: 7 },
  { id: 'obvs', icon: FileCheck, label: 'Centro OBVs' },
  { id: 'crm', icon: Phone, label: 'CRM Global' },
  { id: 'financiero', icon: Wallet, label: 'Financiero' },
  { id: 'kpis', icon: BookOpen, label: 'Otros KPIs' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'roles', icon: Users2, label: 'Reuniones de Rol' },
  { id: 'settings', icon: Settings, label: 'Configuración' },
];

export function NovaSidebar({ currentView, setCurrentView, currentUser, onSignOut }: NovaSidebarProps) {
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen fixed z-50">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 nova-gradient rounded-xl flex items-center justify-center font-bold text-lg text-primary-foreground animate-pulse-glow">
            N
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">NOVA</span>
            <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-semibold">
              BETA
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Principal
          </p>
          {navItems.slice(0, 2).map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentView === item.id}
              onClick={() => setCurrentView(item.id)}
            />
          ))}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Gestión
          </p>
          {navItems.slice(2, 8).map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentView === item.id}
              onClick={() => setCurrentView(item.id)}
            />
          ))}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Equipo
          </p>
          {navItems.slice(8, 10).map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentView === item.id}
              onClick={() => setCurrentView(item.id)}
            />
          ))}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Sistema
          </p>
          {navItems.slice(10).map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentView === item.id}
              onClick={() => setCurrentView(item.id)}
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
            <p className="font-semibold text-sm truncate">{currentUser?.nombre || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground">Team Member</p>
          </div>
          <Settings size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <button 
          onClick={onSignOut}
          className="w-full mt-2 flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors text-sm"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ item, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
        isActive
          ? "nova-gradient-subtle nova-border text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
      )}
    >
      <item.icon 
        size={18} 
        className={cn(
          "transition-colors",
          isActive ? "text-primary" : "opacity-70"
        )} 
      />
      {item.label}
      {item.badge && (
        <span className="ml-auto bg-destructive text-destructive-foreground text-[11px] font-semibold px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </button>
  );
}
