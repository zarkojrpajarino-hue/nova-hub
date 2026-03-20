-- P8.V2.3 — Optimus feedback events
--
-- Tabla para registrar feedback (thumbs up/down + categoría) sobre recomendaciones de Optimus.
-- Permite identificar qué tipos de recomendación generan más rechazo o aceptación.

CREATE TABLE IF NOT EXISTS optimus_feedback_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL,  -- no FK a members para no bloquear si se borra el user
  -- Contexto de la recomendación evaluada
  primary_action  TEXT        NOT NULL,  -- primary.action exactamente como lo generó Optimus
  primary_block   TEXT,                  -- primary_block del input (clarity/traction/structural/none)
  optimus_mode    TEXT,                  -- exploracion|estandar|estricto
  confidence      TEXT,                  -- high|medium|low
  -- Feedback del founder
  vote            TEXT        NOT NULL CHECK (vote IN ('up', 'down')),
  category        TEXT        CHECK (category IN (
    'too_obvious',     -- ya lo sé
    'wrong_context',   -- no aplica a mi situación
    'not_actionable',  -- no puedo hacer nada con esto
    'disagree',        -- no estoy de acuerdo
    'helpful',         -- útil y accionable
    'other'
  )),
  note            TEXT,                  -- comentario libre (opcional)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice principal: por proyecto + fecha para queries de feedback reciente
CREATE INDEX IF NOT EXISTS idx_optimus_feedback_project_date
  ON optimus_feedback_events (project_id, created_at DESC);

-- Índice para analytics: por vote + category
CREATE INDEX IF NOT EXISTS idx_optimus_feedback_vote
  ON optimus_feedback_events (vote, category);

-- RLS
ALTER TABLE optimus_feedback_events ENABLE ROW LEVEL SECURITY;

-- Miembros del proyecto pueden insertar su propio feedback
CREATE POLICY "optimus_feedback: member insert"
  ON optimus_feedback_events FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND project_id IN (
      SELECT project_id FROM project_members WHERE member_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

-- Solo el propio usuario puede leer su feedback
CREATE POLICY "optimus_feedback: self read"
  ON optimus_feedback_events FOR SELECT
  USING (user_id = auth.uid());

-- Service role puede leer todo (para analytics)
CREATE POLICY "optimus_feedback: service read"
  ON optimus_feedback_events FOR SELECT
  USING (auth.role() = 'service_role');
