-- V5.1.9 — Data integrity constraints
-- FK: obvs.responsable_id → profiles.id
ALTER TABLE obvs
  ADD CONSTRAINT fk_obvs_responsable
  FOREIGN KEY (responsable_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- UNIQUE: prevent duplicate KPI validations per validator
ALTER TABLE kpi_validaciones
  ADD CONSTRAINT uq_kpi_validator
  UNIQUE(kpi_id, validator_id);

-- UNIQUE: prevent duplicate OBV validations per validator
ALTER TABLE obv_validaciones
  ADD CONSTRAINT uq_obv_validator
  UNIQUE(obv_id, validator_id);

-- V5.1.10 — Safe FTS function with RLS-aware filtering
CREATE OR REPLACE FUNCTION fts_project_documents_safe(p_user_id UUID, p_query TEXT)
RETURNS SETOF project_documents AS $$
  SELECT pd.* FROM project_documents pd
  WHERE (pd.user_id = p_user_id OR EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = pd.project_id
    AND pm.member_id = p_user_id
  ))
  AND pd.content_tsvector @@ websearch_to_tsquery(p_query)
  ORDER BY ts_rank(pd.content_tsvector, websearch_to_tsquery(p_query)) DESC;
$$ LANGUAGE SQL SECURITY DEFINER;
