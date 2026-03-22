/**
 * EXPORT BUTTON COMPONENT
 *
 * Botón reutilizable para exportar datos
 * Soporta CSV, Excel, PDF y JSON
 */

import { useState } from 'react';
import { Download, FileDown, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadCSV, downloadExcel, downloadPDF, downloadJSON, sanitizeFilename } from '@/utils/exportData';
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';
type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  formats?: ExportFormat[];
  // For PDF export
  pdfConfig?: {
    title: string;
    columns: Array<{ header: string; key: string; width?: number }>;
  };
  // For CSV export
  csvHeaders?: string[];
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const FORMAT_ICONS = {
  csv: FileText,
  excel: FileSpreadsheet,
  pdf: FileDown,
  json: FileJson,
};

const FORMAT_LABELS = {
  csv: 'CSV (Excel)',
  excel: 'Excel (.xlsx)',
  pdf: 'PDF',
  json: 'JSON',
};

export function ExportButton({
  data,
  filename,
  formats = ['csv', 'excel', 'pdf'],
  pdfConfig,
  csvHeaders,
  disabled = false,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0) {
      toast.error(t('common.noHayDatosPara'));
      return;
    }

    setIsExporting(true);
    const sanitizedFilename = sanitizeFilename(filename);

    try {
      switch (format) {
        case 'csv':
          downloadCSV(data, sanitizedFilename, csvHeaders);
          toast.success(t('common.csvDescargadoCorrectamente'));
          break;

        case 'excel':
          await downloadExcel(data, sanitizedFilename);
          toast.success(t('common.excelDescargadoCorrectamente'));
          break;

        case 'pdf':
          if (!pdfConfig) {
            toast.error(t('common.configuraciónDePdfNo'));
            return;
          }
          await downloadPDF(
            pdfConfig.title,
            data,
            pdfConfig.columns,
            sanitizedFilename
          );
          toast.success(t('common.pdfDescargadoCorrectamente'));
          break;

        case 'json':
          downloadJSON(data, sanitizedFilename);
          toast.success(t('common.jsonDescargadoCorrectamente'));
          break;
      }
    } catch (_error) {
      toast.error(t('common.errorAlExportarLos'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting || data.length === 0}
          className="gap-2"
        >
          <Download size={16} />
          {size !== 'icon' && <span>{isExporting ? 'Exportando...': t('common.exportar')}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('common.exportarComo')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => {
          const Icon = FORMAT_ICONS[format];
          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
              className="cursor-pointer"
            >
              <Icon size={16} className="mr-2" />
              {FORMAT_LABELS[format]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
