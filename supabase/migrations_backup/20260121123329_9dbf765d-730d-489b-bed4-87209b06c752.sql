-- Add payment tracking columns to obvs table
ALTER TABLE public.obvs 
ADD COLUMN IF NOT EXISTS iva_porcentaje NUMERIC DEFAULT 21,
ADD COLUMN IF NOT EXISTS iva_importe NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_factura NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS forma_pago TEXT DEFAULT 'transferencia',
ADD COLUMN IF NOT EXISTS fecha_cobro_esperada DATE,
ADD COLUMN IF NOT EXISTS estado_cobro TEXT DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS importe_cobrado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_factura TEXT,
ADD COLUMN IF NOT EXISTS numero_presupuesto TEXT;

-- Add check constraint for estado_cobro
ALTER TABLE public.obvs 
ADD CONSTRAINT obvs_estado_cobro_check 
CHECK (estado_cobro IN ('pendiente', 'parcial', 'cobrado', 'impagado'));

-- Add check constraint for forma_pago
ALTER TABLE public.obvs 
ADD CONSTRAINT obvs_forma_pago_check 
CHECK (forma_pago IN ('contado', 'transferencia', 'tarjeta', 'plazos', 'credito'));

-- Create view for pending payments
CREATE OR REPLACE VIEW public.pending_payments AS
SELECT 
  o.id,
  o.titulo,
  o.facturacion as importe,
  o.fecha as fecha_venta,
  o.fecha_cobro_esperada,
  o.estado_cobro,
  o.importe_cobrado,
  o.facturacion - COALESCE(o.importe_cobrado, 0) as pendiente,
  CASE 
    WHEN o.fecha_cobro_esperada IS NULL THEN 0
    ELSE CURRENT_DATE - o.fecha_cobro_esperada 
  END as dias_vencido,
  o.numero_factura,
  l.nombre as cliente,
  l.empresa as cliente_empresa,
  p.nombre as proyecto_nombre,
  p.color as proyecto_color,
  pr.nombre as responsable_nombre,
  pr.id as responsable_id
FROM public.obvs o
LEFT JOIN public.leads l ON o.lead_id = l.id
LEFT JOIN public.projects p ON o.project_id = p.id
LEFT JOIN public.profiles pr ON o.owner_id = pr.id
WHERE o.es_venta = true 
  AND o.status = 'validated'
  AND o.estado_cobro IN ('pendiente', 'parcial')
ORDER BY o.fecha_cobro_esperada NULLS LAST;

-- Create view for financial metrics by month
CREATE OR REPLACE VIEW public.financial_metrics AS
SELECT 
  p.id as project_id,
  p.nombre as project_name,
  p.color as project_color,
  DATE_TRUNC('month', o.fecha) as month,
  SUM(o.facturacion) as facturacion,
  SUM(o.costes) as costes,
  SUM(o.margen) as margen,
  COUNT(*) as num_ventas,
  ROUND(AVG(o.margen / NULLIF(o.facturacion, 0) * 100), 2) as margen_percent,
  SUM(CASE WHEN o.estado_cobro = 'cobrado' THEN o.facturacion ELSE 0 END) as cobrado,
  SUM(CASE WHEN o.estado_cobro IN ('pendiente', 'parcial') THEN o.facturacion - COALESCE(o.importe_cobrado, 0) ELSE 0 END) as pendiente_cobro
FROM public.obvs o
JOIN public.projects p ON o.project_id = p.id
WHERE o.es_venta = true AND o.status = 'validated'
GROUP BY p.id, p.nombre, p.color, DATE_TRUNC('month', o.fecha)
ORDER BY month DESC;