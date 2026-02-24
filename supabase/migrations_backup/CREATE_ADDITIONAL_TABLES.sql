-- =============================================
-- CREAR TABLAS ADICIONALES FALTANTES
-- =============================================

-- Tabla: objectives (objetivos/metas del equipo)
CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  unit TEXT,
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

-- Políticas para objectives
DROP POLICY IF EXISTS "objectives_all" ON objectives;
DROP POLICY IF EXISTS "objectives_anon" ON objectives;
CREATE POLICY "objectives_all" ON objectives FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "objectives_anon" ON objectives FOR ALL TO anon USING (true) WITH CHECK (true);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_objectives_updated_at ON objectives;
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON objectives
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índice
CREATE INDEX IF NOT EXISTS idx_objectives_name ON objectives(name);

-- =============================================
-- VISTAS MATERIALIZADAS / VISTAS
-- =============================================

-- Vista: member_stats (estadísticas calculadas de miembros)
CREATE OR REPLACE VIEW member_stats AS
SELECT
  m.id,
  m.nombre,
  m.color,
  m.avatar,
  m.email,
  COALESCE(COUNT(DISTINCT o.id), 0)::INTEGER AS obvs,
  COALESCE(SUM(CASE WHEN o.priority = 'low' THEN 1 ELSE 0 END), 0)::INTEGER AS lps,
  COALESCE(SUM(CASE WHEN o.priority = 'balanced' THEN 1 ELSE 0 END), 0)::INTEGER AS bps,
  COALESCE(SUM(CASE WHEN o.priority = 'critical' THEN 1 ELSE 0 END), 0)::INTEGER AS cps,
  COALESCE(SUM(pm.facturacion), 0)::NUMERIC AS facturacion,
  COALESCE(SUM(pm.margen), 0)::NUMERIC AS margen
FROM members_public m
LEFT JOIN obvs o ON o.owner_id = m.id
LEFT JOIN (
  SELECT
    pm.member_id,
    COALESCE(SUM(p.facturacion), 0) AS facturacion,
    COALESCE(SUM(p.margen), 0) AS margen
  FROM project_members pm
  LEFT JOIN projects p ON p.id = pm.project_id
  GROUP BY pm.member_id
) pm ON pm.member_id = m.id
GROUP BY m.id, m.nombre, m.color, m.avatar, m.email;

-- Vista: project_stats (estadísticas calculadas de proyectos)
CREATE OR REPLACE VIEW project_stats AS
SELECT
  p.id,
  COALESCE(p.facturacion, 0)::NUMERIC AS facturacion,
  COALESCE(p.margen, 0)::NUMERIC AS margen,
  COALESCE(COUNT(DISTINCT o.id), 0)::INTEGER AS total_obvs,
  COALESCE(COUNT(DISTINCT CASE WHEN l.status = 'ganado' THEN l.id END), 0)::INTEGER AS leads_ganados
FROM projects p
LEFT JOIN obvs o ON o.project_id = p.id
LEFT JOIN leads l ON l.project_id = p.id
GROUP BY p.id, p.facturacion, p.margen;
