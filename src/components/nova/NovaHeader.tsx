import { Search, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NovaHeaderProps {
  title: string;
  subtitle?: string;
  onNewOBV?: () => void;
}

export function NovaHeader({ title, subtitle, onNewOBV }: NovaHeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 w-72">
          <Search size={16} className="text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar... ⌘K"
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full flex items-center justify-center">
            4
          </span>
        </button>

        {/* New OBV Button */}
        <Button onClick={onNewOBV} className="nova-gradient nova-glow font-semibold">
          <Plus size={16} className="mr-1" />
          Nueva OBV
        </Button>
      </div>
    </header>
  );
}
