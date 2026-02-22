/* eslint-disable react-refresh/only-export-components */
/**
 * ✨ OPTIMIZED: Virtualized List Component
 *
 * Renderiza solo los items visibles en el viewport, mejorando performance
 * para listas largas (>50 items).
 *
 * ANTES: Renderizar 500 items = 500 DOM nodes
 * DESPUÉS: Renderizar 500 items = ~15 DOM nodes visibles
 * MEJORA: ~95% menos DOM nodes, scroll ultra fluido
 */

import { useRef, ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
  items: T[];
  estimateSize?: number; // Altura estimada por item
  overscan?: number; // Items extra a renderizar fuera del viewport
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  emptyState?: ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
}

/**
 * Componente de lista virtualizada genérico
 *
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={leads}
 *   estimateSize={80}
 *   renderItem={(lead) => <LeadCard lead={lead} />}
 *   getItemKey={(lead) => lead.id}
 * />
 * ```
 */
export function VirtualizedList<T>({
  items,
  estimateSize = 80,
  overscan = 5,
  renderItem,
  className = '',
  emptyState,
  getItemKey,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  if (items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          const key = getItemKey
            ? getItemKey(item, virtualItem.index)
            : virtualItem.index;

          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook para virtualización en grids
 * Útil para componentes tipo Kanban o dashboards con muchas tarjetas
 */
export function useVirtualGrid(
  rowCount: number,
  columnCount: number,
  options?: {
    estimateRowHeight?: number;
    estimateColumnWidth?: number;
    overscan?: number;
  }
) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => options?.estimateRowHeight || 80,
    overscan: options?.overscan || 5,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columnCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => options?.estimateColumnWidth || 300,
    overscan: options?.overscan || 2,
  });

  return {
    parentRef,
    rowVirtualizer,
    columnVirtualizer,
  };
}

/**
 * Ejemplo de uso con CRM Leads:
 *
 * ```tsx
 * import { VirtualizedList } from '@/components/ui/VirtualizedList';
 *
 * function CRMLeadsList({ leads }: { leads: Lead[] }) {
 *   return (
 *     <VirtualizedList
 *       items={leads}
 *       estimateSize={100}
 *       className="h-[600px]"
 *       renderItem={(lead) => (
 *         <LeadCard
 *           key={lead.id}
 *           lead={lead}
 *           onClick={() => handleLeadClick(lead)}
 *         />
 *       )}
 *       getItemKey={(lead) => lead.id}
 *       emptyState={
 *         <div className="text-center text-muted-foreground py-10">
 *           No hay leads para mostrar
 *         </div>
 *       }
 *     />
 *   );
 * }
 * ```
 *
 * Ejemplo de uso con KPIs:
 *
 * ```tsx
 * function KPIValidationList({ kpis }: { kpis: KPI[] }) {
 *   return (
 *     <VirtualizedList
 *       items={kpis}
 *       estimateSize={120}
 *       className="h-screen"
 *       renderItem={(kpi) => (
 *         <KPIValidationCard kpi={kpi} />
 *       )}
 *       getItemKey={(kpi) => kpi.id}
 *     />
 *   );
 * }
 * ```
 *
 * Ejemplo de uso con Grid (Kanban):
 *
 * ```tsx
 * function KanbanBoard({ columns, tasks }: { columns: Column[], tasks: Task[] }) {
 *   const { parentRef, columnVirtualizer } = useVirtualGrid(1, columns.length, {
 *     estimateColumnWidth: 320,
 *   });
 *
 *   return (
 *     <div ref={parentRef} className="overflow-x-auto h-screen">
 *       <div style={{ width: `${columnVirtualizer.getTotalSize()}px`, display: 'flex' }}>
 *         {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
 *           const column = columns[virtualColumn.index];
 *           const columnTasks = tasks.filter(t => t.status === column.id);
 *
 *           return (
 *             <div
 *               key={column.id}
 *               style={{
 *                 position: 'absolute',
 *                 top: 0,
 *                 left: 0,
 *                 width: `${virtualColumn.size}px`,
 *                 transform: `translateX(${virtualColumn.start}px)`,
 *               }}
 *             >
 *               <KanbanColumn column={column} tasks={columnTasks} />
 *             </div>
 *           );
 *         })}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * NOTAS DE PERFORMANCE:
 *
 * ✅ USAR virtualización cuando:
 * - Lista tiene >50 items
 * - Items tienen altura consistente o predecible
 * - Scroll performance es crítico
 * - Usuarios frecuentemente scrollean
 *
 * ❌ NO USAR virtualización cuando:
 * - Lista tiene <30 items (overhead innecesario)
 * - Items tienen altura muy variable
 * - Lista no es scrollable
 * - Lista se carga toda de una vez sin paginación
 *
 * AJUSTES DE PERFORMANCE:
 * - estimateSize: Altura promedio real del item (mide con DevTools)
 * - overscan: 5 para scroll suave, 10 para cambios de dirección frecuentes
 * - getItemKey: Siempre proporcionar key única para evitar re-renders
 *
 * MÉTRICAS ESPERADAS:
 * - Initial render: ~50ms para 1000 items (vs ~500ms sin virtualización)
 * - Scroll FPS: 60fps constante (vs 30-40fps sin virtualización)
 * - Memory usage: ~10MB para 1000 items (vs ~50MB sin virtualización)
 */
