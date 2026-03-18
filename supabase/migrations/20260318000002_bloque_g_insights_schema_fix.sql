-- BLOQUE G — Integration Insights: corrección de schema para cumplir AGENTS_CONTRACT.md
--
-- AGENTS_CONTRACT.md §4 (AgentInsight interface) define campos que no estaban en la
-- tabla original (20260315000002): expires_at y include_in_context.
-- §10 anti-ruido usa: "no re-emitir si expires_at > NOW()"
-- §7 síntesis usa: WHERE include_in_context = true
-- Sin estos campos, el sistema de anti-ruido y la síntesis no pueden ejecutarse.
--
-- NOTA: source_timestamp en la tabla original = "cuándo ocurrió el hecho en el provider"
-- ≠ generated_at del contrato = "cuándo generó el agente el insight".
-- Mantenemos source_timestamp (semántica correcta para trazabilidad) y añadimos
-- generated_at como alias de created_at para cumplir el contrato.
-- En la práctica: generated_at = created_at (el agente genera en el momento del sync).

ALTER TABLE integration_insights
  ADD COLUMN IF NOT EXISTS expires_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS include_in_context BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índice para el filtro de síntesis: insights activos y elegibles para contexto
CREATE INDEX IF NOT EXISTS idx_insights_synthesis
  ON integration_insights (project_id, include_in_context, expires_at)
  WHERE include_in_context = true;

-- Índice para anti-ruido: buscar insight previo del mismo tipo por proyecto
CREATE INDEX IF NOT EXISTS idx_insights_dedup
  ON integration_insights (project_id, agent_type, insight_type, generated_at DESC);

COMMENT ON COLUMN integration_insights.expires_at IS
  'Cuándo deja de ser válido este insight. NULL = no expira (para críticos). '
  'Anti-ruido (§10): no re-emitir si hay insight del mismo tipo con expires_at > NOW(). '
  'Defaults por severity: info=7d, attention=3d, warning=24h, critical=NULL.';

COMMENT ON COLUMN integration_insights.include_in_context IS
  'Si este insight debe incluirse en get_optimus_context(). '
  'La síntesis (§9) filtra por este campo. Se pone a false cuando: '
  '(a) contradice el motor central (§8) o (b) pierde prioridad en la síntesis.';

COMMENT ON COLUMN integration_insights.generated_at IS
  'Momento en que el agente generó el insight. Distinto de source_timestamp '
  '(que es cuándo ocurrió el hecho en el provider).';
