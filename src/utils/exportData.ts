/**
 * EXPORT DATA UTILITIES
 *
 * Funciones para exportar datos a CSV y PDF
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// CSV EXPORT
// ============================================

export function convertToCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (data.length === 0) return '';

  // Get headers from first object if not provided
  const keys = headers || Object.keys(data[0]);

  // Create header row
  const csvHeaders = keys.join(',');

  // Create data rows
  const csvRows = data.map((row) => {
    return keys
      .map((key) => {
        let value = row[key];

        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }

        // Handle dates
        if (value instanceof Date) {
          value = format(value, 'dd/MM/yyyy', { locale: es });
        }

        // Handle objects/arrays
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }

        // Escape quotes and wrap in quotes if contains comma
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value}"`;
        }

        return value;
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

export function downloadCSV(data: Record<string, unknown>[], filename: string, headers?: string[]): void {
  const csv = convertToCSV(data, headers);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// JSON EXPORT
// ============================================

export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// PDF EXPORT (usando jsPDF)
// ============================================

export async function downloadPDF(
  title: string,
  data: Record<string, unknown>[],
  columns: Array<{ header: string; key: string; width?: number }>,
  filename: string
): Promise<void> {
  // Lazy load jsPDF
  const { jsPDF } = await import('jspdf');
  // @ts-expect-error - autoTable es un plugin
  const _autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(128);
  doc.text(format(new Date(), "d 'de' MMMM, yyyy", { locale: es }), 14, 28);

  // Reset color
  doc.setTextColor(0);

  // Add table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jsPDF plugin autoTable not typed
  (doc as any).autoTable({
    startY: 35,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => {
      const value = row[col.key];

      if (value === null || value === undefined) return '';
      if (value instanceof Date) return format(value, 'dd/MM/yyyy');
      if (typeof value === 'object') return JSON.stringify(value);

      return String(value);
    })),
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [99, 102, 241], // Primary color
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 250],
    },
    columnStyles: columns.reduce((acc, col, idx) => {
      if (col.width) {
        acc[idx] = { cellWidth: col.width };
      }
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
  });

  // Add page numbers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jsPDF internal API not fully typed
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() - 30,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Download
  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ============================================
// EXCEL EXPORT (usando xlsx)
// ============================================

export async function downloadExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Datos'
): Promise<void> {
  // Lazy load xlsx
  const XLSX = await import('xlsx');

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns
  const maxWidth = 50;
  const wscols = Object.keys(data[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLen + 2, maxWidth) };
  });
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// ============================================
// HELPERS
// ============================================

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

export function getExportTimestamp(): string {
  return format(new Date(), 'yyyy-MM-dd_HH-mm');
}
