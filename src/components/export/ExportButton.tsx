import { Button } from '@/components/ui/button';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExcelExport } from '@/hooks/useExcelExport';

interface ExportOption {
  label: string;
  type: string;
  data: Record<string, unknown>[];
  metadata?: {
    title?: string;
    currencyColumns?: number[];
    percentageColumns?: number[];
  };
}

interface ExportButtonProps {
  options: ExportOption[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ExportButton({
  options,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: ExportButtonProps) {
  const { exportToExcel, isExporting } = useExcelExport();

  if (options.length === 1) {
    // Single export option - simple button
    const option = options[0];
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => exportToExcel(option.type, option.data, option.metadata)}
        disabled={isExporting || option.data.length === 0}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 mr-2" />
        )}
        {showLabel && (isExporting ? 'Exportando...' : 'Exportar a Excel')}
      </Button>
    );
  }

  // Multiple export options - dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {showLabel && (isExporting ? 'Exportando...' : 'Exportar')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Exportar a Excel
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => exportToExcel(option.type, option.data, option.metadata)}
            disabled={option.data.length === 0}
          >
            <span className="flex-1">{option.label}</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({option.data.length} filas)
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
