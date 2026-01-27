import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExportMetadata {
  title?: string;
  currencyColumns?: number[];
  percentageColumns?: number[];
}

export function useExcelExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async (
    exportType: string,
    data: any[],
    metadata?: ExportMetadata
  ) => {
    setIsExporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No estás autenticado');
        return;
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/export-excel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            exportType,
            data,
            metadata,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al exportar');
      }

      const result = await response.json();

      // Download the file
      const binaryString = atob(result.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: 'application/vnd.ms-excel',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Archivo Excel descargado correctamente');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al exportar a Excel'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToExcel, isExporting };
}
