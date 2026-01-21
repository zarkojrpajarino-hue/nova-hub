import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PendingPayment {
  id: string;
  titulo: string;
  importe: number;
  fecha_venta: string;
  fecha_cobro_esperada: string | null;
  estado_cobro: string;
  importe_cobrado: number;
  pendiente: number;
  dias_vencido: number;
  numero_factura: string | null;
  cliente: string | null;
  cliente_empresa: string | null;
  proyecto_nombre: string;
  proyecto_color: string;
  responsable_nombre: string;
}

interface PendingPaymentsCardProps {
  payments: PendingPayment[];
  onMarkPaid?: (id: string) => void;
}

export function PendingPaymentsCard({ payments, onMarkPaid }: PendingPaymentsCardProps) {
  const overdue = payments.filter(p => p.dias_vencido > 0);
  const upcoming = payments.filter(p => p.dias_vencido <= 0);
  const totalPending = payments.reduce((sum, p) => sum + (p.pendiente || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Cobros Pendientes
        </CardTitle>
        <Badge variant="secondary" className="text-lg px-3">
          €{totalPending.toLocaleString('es-ES')}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500/50" />
            <p>¡Todo cobrado!</p>
            <p className="text-sm">No hay pagos pendientes</p>
          </div>
        ) : (
          <>
            {/* Overdue */}
            {overdue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  Vencidos ({overdue.length})
                </div>
                {overdue.slice(0, 3).map((payment) => (
                  <PaymentItem 
                    key={payment.id} 
                    payment={payment} 
                    isOverdue 
                    onMarkPaid={onMarkPaid}
                  />
                ))}
              </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Próximos ({upcoming.length})
                </div>
                {upcoming.slice(0, 3).map((payment) => (
                  <PaymentItem 
                    key={payment.id} 
                    payment={payment} 
                    onMarkPaid={onMarkPaid}
                  />
                ))}
              </div>
            )}

            {payments.length > 6 && (
              <Button variant="ghost" size="sm" className="w-full">
                Ver todos ({payments.length})
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentItem({ 
  payment, 
  isOverdue = false,
  onMarkPaid 
}: { 
  payment: PendingPayment; 
  isOverdue?: boolean;
  onMarkPaid?: (id: string) => void;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      isOverdue ? "bg-destructive/5 border-destructive/20" : "bg-muted/30"
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">
            {payment.cliente || payment.titulo}
          </p>
          {payment.numero_factura && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {payment.numero_factura}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span 
            className="px-1.5 py-0.5 rounded text-[10px]"
            style={{ 
              backgroundColor: `${payment.proyecto_color}15`,
              color: payment.proyecto_color 
            }}
          >
            {payment.proyecto_nombre}
          </span>
          {payment.fecha_cobro_esperada && (
            <span className={isOverdue ? "text-destructive font-medium" : ""}>
              {isOverdue ? `${Math.abs(payment.dias_vencido)}d vencido` : 
                `en ${Math.abs(payment.dias_vencido)}d`}
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className={cn(
          "font-bold",
          isOverdue ? "text-destructive" : "text-foreground"
        )}>
          €{(payment.pendiente || 0).toLocaleString('es-ES')}
        </p>
        {onMarkPaid && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-6 px-2"
            onClick={() => onMarkPaid(payment.id)}
          >
            Cobrado
          </Button>
        )}
      </div>
    </div>
  );
}
