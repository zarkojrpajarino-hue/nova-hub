-- =============================================================================
-- MIGRACIÓN 00012 — PROJECT_ACQUISITION_CHANNEL
--
-- Propósito: fuente canónica estructurada para O2.3 del Phase Engine (Fase 2).
--   "Repeatable acquisition channel — Can explain how to get next 10 customers"
--
-- Contexto de la decisión (2026-03-09):
--   O2.3 no tenía fuente estructurada. Los OBVs y process_artifacts no capturan
--   esta información de forma computable. Se crea tabla INPUT mínima.
--
-- Scoring O2.3 — PENDIENTE DE CIERRE EN ENGINE_SPEC_V1.md (antes de E4.3):
--   Factores cualitativos acordados:
--     a) canal primario declarado (is_primary=true existe)  → base
--     b) documented_playbook=true                           → incremento
--     c) last_validated_at dentro de ventana activa         → incremento
--     d) estimated_cac IS NOT NULL                          → incremento
--   Escala, pesos y umbrales exactos: PENDIENTE.
--
-- Trigger: cambios relevantes disparan run_phase_engine('acceleration').
--   Actualmente Fase 2 es placeholder → el trigger está preparado para E4.3.
--
-- Nota: last_validated_at requiere acción explícita del UI (botón "Validado hoy").
--   Sin UI, permanecerá NULL y el factor (c) no contribuirá al score.
-- =============================================================================

CREATE TABLE project_acquisition_channel (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id          UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Tipo de canal de adquisición
  -- inbound: SEO/blog/orgánico sin pauta
  -- content: contenido educativo/marca (YouTube, podcast, newsletters)
  -- outbound: cold email, cold call, SDR
  -- paid_ads: paid search/social (Meta, Google Ads, etc.)
  -- referral: recomendación de clientes o socios
  -- partnership: acuerdos de canal con terceros
  -- community: comunidades, eventos, foros
  -- product_led: freemium/trial/viral dentro del producto
  -- other: no encaja en ninguno de los anteriores
  channel_type        TEXT        NOT NULL CHECK (channel_type IN (
                                    'inbound', 'content', 'outbound', 'paid_ads',
                                    'referral', 'partnership', 'community',
                                    'product_led', 'other'
                                  )),

  -- ¿Es este el canal principal de adquisición del proyecto?
  -- Puede haber varios canales, pero el scorer de O2.3 prioriza is_primary=true.
  is_primary          BOOLEAN     NOT NULL DEFAULT FALSE,

  -- ¿Existe un playbook documentado de cómo ejecutar este canal?
  -- Equivale a: "tengo instrucciones repetibles para conseguir más clientes"
  documented_playbook BOOLEAN     NOT NULL DEFAULT FALSE,

  -- CAC estimado para este canal (USD). NULL = no medido aún.
  estimated_cac       NUMERIC     CHECK (estimated_cac >= 0),

  -- Notas libres del founder sobre el canal
  notes               TEXT,

  -- Última vez que el founder marcó este canal como "activo y validado".
  -- Debe actualizarse desde UI con acción explícita (no se auto-rellena).
  -- El engine usará esta fecha para determinar si el canal sigue "vivo".
  -- Ventana de vigencia: a definir en ENGINE_SPEC_V1.md (propuesta: 60 días).
  last_validated_at   TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE project_acquisition_channel IS
  'Fuente canónica para O2.3 Phase Engine Fase 2 — canal de adquisición repetible documentado. Multi-canal soportado. is_primary marca el canal principal. Scoring O2.3 pendiente de ENGINE_SPEC_V1.md (antes de implementar E4.3).';

COMMENT ON COLUMN project_acquisition_channel.last_validated_at IS
  'Timestamp de la última validación activa declarada por el founder. Actualizar desde UI con acción explícita. Ventana de vigencia a definir en spec (propuesta: 60 días). NULL = canal nunca validado activamente.';

COMMENT ON COLUMN project_acquisition_channel.documented_playbook IS
  'TRUE si existe un proceso documentado y repetible para este canal (equiv. a process_artifact de función demand con checklist). El founder lo declara manualmente.';

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- Acceso principal por proyecto (queries del engine y del UI)
CREATE INDEX idx_pac_project_id
  ON project_acquisition_channel(project_id);

-- Acceso rápido al canal primario (O2.3 scorer busca is_primary=true)
CREATE INDEX idx_pac_project_primary
  ON project_acquisition_channel(project_id)
  WHERE is_primary = TRUE;

-- =============================================================================
-- RLS — Row Level Security
-- Patrón: miembros del proyecto leen/escriben su propio proyecto.
-- =============================================================================

ALTER TABLE project_acquisition_channel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pac_select"
  ON project_acquisition_channel FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_acquisition_channel.project_id
        AND pm.member_id  = auth.uid()
    )
  );

CREATE POLICY "pac_insert"
  ON project_acquisition_channel FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_acquisition_channel.project_id
        AND pm.member_id  = auth.uid()
    )
  );

CREATE POLICY "pac_update"
  ON project_acquisition_channel FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_acquisition_channel.project_id
        AND pm.member_id  = auth.uid()
    )
  );

CREATE POLICY "pac_delete"
  ON project_acquisition_channel FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_acquisition_channel.project_id
        AND pm.member_id  = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGER — updated_at automático
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_pac_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_pac_updated_at
  BEFORE UPDATE ON project_acquisition_channel
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_pac_updated_at();

-- =============================================================================
-- TRIGGER — Phase Engine recalculation
--
-- Dispara run_phase_engine('acceleration') cuando cambian campos que alimentan
-- el score O2.3 de Fase 2.
--
-- Estado actual: run_phase_engine ignora estos datos (Fase 2 = placeholder).
-- El trigger queda preparado para cuando E4.3 implemente el calculador real.
--
-- Campos que disparan recalculo:
--   INSERT  → nuevo canal = potencial cambio en O2.3
--   UPDATE  → cambios en is_primary, documented_playbook, last_validated_at, estimated_cac
--   DELETE  → canal eliminado = O2.3 puede cambiar
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_pac_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_phase_engine(NEW.project_id, 'acceleration');

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_primary          IS DISTINCT FROM NEW.is_primary
    OR OLD.documented_playbook IS DISTINCT FROM NEW.documented_playbook
    OR OLD.last_validated_at   IS DISTINCT FROM NEW.last_validated_at
    OR OLD.estimated_cac       IS DISTINCT FROM NEW.estimated_cac
    OR OLD.channel_type        IS DISTINCT FROM NEW.channel_type
    THEN
      PERFORM run_phase_engine(NEW.project_id, 'acceleration');
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM run_phase_engine(OLD.project_id, 'acceleration');
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION trg_fn_pac_phase() IS
  'Trigger de project_acquisition_channel → run_phase_engine. Activo para Fase 2 scoring O2.3 (pendiente E4.3). INSERT/UPDATE campos relevantes/DELETE disparan recalculo.';

-- Trigger separado para UPDATE (con column filter) e INSERT/DELETE (sin filter)
CREATE OR REPLACE TRIGGER trg_pac_phase_update
  AFTER UPDATE OF is_primary, documented_playbook, last_validated_at, estimated_cac, channel_type
  ON project_acquisition_channel
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_pac_phase();

CREATE OR REPLACE TRIGGER trg_pac_phase_insert_delete
  AFTER INSERT OR DELETE
  ON project_acquisition_channel
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_pac_phase();
