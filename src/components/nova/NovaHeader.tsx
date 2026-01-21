import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSearch } from '@/contexts/SearchContext';
import { cn } from '@/lib/utils';

interface NovaHeaderProps {
  title: string;
  subtitle?: string;
  onNewOBV?: () => void;
}

export function NovaHeader({ title, subtitle, onNewOBV }: NovaHeaderProps) {
  const isMobile = useIsMobile();
  const { open: openSearch } = useSearch();

  return (
    <header className={cn(
      "sticky top-0 z-40 glass border-b border-border px-4 md:px-8 py-4 flex items-center justify-between gap-4",
      isMobile && "pl-16" // Space for mobile menu button
    )}>
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Search */}
        <button 
          onClick={openSearch}
          className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 md:px-4 py-2 hover:bg-accent transition-colors"
        >
          <Search size={16} className="text-muted-foreground" />
          <span className="hidden md:inline text-sm text-muted-foreground">Buscar...</span>
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* New OBV Button */}
        <Button onClick={onNewOBV} className="nova-gradient nova-glow font-semibold">
          <Plus size={16} className={cn("md:mr-1", isMobile && "mr-0")} />
          <span className="hidden md:inline">Nueva OBV</span>
        </Button>
      </div>
    </header>
  );
}