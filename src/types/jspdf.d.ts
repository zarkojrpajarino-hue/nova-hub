/**
 * Module augmentation for jsPDF — V5.5.8
 * Adds autoTable plugin method and internal page count.
 */

import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
    internal: jsPDF['internal'] & {
      getNumberOfPages: () => number;
    };
  }
}
