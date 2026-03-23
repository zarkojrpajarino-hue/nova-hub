/**
 * S5.2 — LazyChart wrapper
 *
 * Provides a Suspense boundary with a chart-sized loading placeholder.
 * Use this to wrap React.lazy chart components to prevent layout shift.
 *
 * Usage:
 * ```tsx
 * const MyChart = lazy(() => import('./MyChart').then(m => ({ default: m.MyChart })));
 *
 * <LazyChart height={400}>
 *   <MyChart data={data} />
 * </LazyChart>
 * ```
 */
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function ChartFallback({ height = 300 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-muted/30 rounded-lg animate-pulse"
      style={{ height }}
    >
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

interface LazyChartProps {
  children: React.ReactNode;
  height?: number;
}

export function LazyChart({ children, height = 300 }: LazyChartProps) {
  return (
    <Suspense fallback={<ChartFallback height={height} />}>
      {children}
    </Suspense>
  );
}
