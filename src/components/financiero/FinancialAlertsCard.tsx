import { AlertTriangle, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FinancialAlert {
  type: 'error' | 'warning' | 'success';
  title: string;
  description: string;
}

interface FinancialAlertsCardProps {
  totalPending: number;
  overdueCount: number;
  marginPercent: number;
  monthlyGrowth: number;
}

export function FinancialAlertsCard({ 
  totalPending, 
  overdueCount, 
  marginPercent,
  monthlyGrowth 
}: FinancialAlertsCardProps) {
  const alerts: FinancialAlert[] = [];

  // Check for overdue payments
  if (overdueCount > 0) {
    alerts.push({
      type: 'error',
      title: `${overdueCount} factura${overdueCount > 1 ? 's' : ''} vencida${overdueCount > 1 ? 's' : ''}`,
      description: `€${totalPending.toLocaleString('es-ES')} pendientes de cobro`,
    });
  }

  // Check margin
  if (marginPercent < 30) {
    alerts.push({
      type: 'warning',
      title: 'Margen bajo',
      description: `Margen actual ${marginPercent.toFixed(0)}% - objetivo mínimo 30%`,
    });
  }

  // Check growth
  if (monthlyGrowth > 10) {
    alerts.push({
      type: 'success',
      title: 'Crecimiento positivo',
      description: `+${monthlyGrowth.toFixed(0)}% respecto al mes anterior`,
    });
  } else if (monthlyGrowth < -10) {
    alerts.push({
      type: 'warning',
      title: 'Descenso en facturación',
      description: `${monthlyGrowth.toFixed(0)}% respecto al mes anterior`,
    });
  }

  // If no alerts, show all good
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      title: '¡Todo en orden!',
      description: 'No hay alertas financieras pendientes',
    });
  }

  const getIcon = (type: FinancialAlert['type']) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <TrendingDown className="w-4 h-4" />;
      case 'success': return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getColors = (type: FinancialAlert['type']) => {
    switch (type) {
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'success': return 'bg-green-500/10 text-green-600 border-green-500/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Alertas Financieras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, i) => (
          <div 
            key={i}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border",
              getColors(alert.type)
            )}
          >
            <div className="mt-0.5">
              {getIcon(alert.type)}
            </div>
            <div>
              <p className="font-medium text-sm">{alert.title}</p>
              <p className="text-xs opacity-80">{alert.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
