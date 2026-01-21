import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoMode } from '@/contexts/DemoModeContext';

export function DemoModeBanner() {
  const { isDemoMode, disableDemo } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm">Modo Demostración Activo</span>
            <span className="text-amber-100 text-xs ml-2 hidden sm:inline">
              Estás viendo datos de ejemplo para explorar las funcionalidades
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={disableDemo}
          className="text-white hover:bg-white/20 hover:text-white gap-1"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </div>
  );
}
