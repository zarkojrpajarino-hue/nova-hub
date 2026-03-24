-- =============================================================================
-- V4.2 — Fix critical RLS policies: overly permissive USING(true) / WITH CHECK(true)
-- =============================================================================
-- Edge functions use service_role (bypasses RLS), so these policies only affect
-- frontend/anon queries. Replacing blanket true with project-member checks.
--
-- NOTE: profiles.id != auth.uid(). The correct mapping is:
--   member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
-- This is consistent with the latest migrations (fase 25, 26, 22, 12).
-- =============================================================================


-- =============================================
-- V4.2.1: Fix competitor_snapshots RLS
-- Was: "Service role can manage snapshots" FOR ALL USING(true)
-- =============================================

DROP POLICY IF EXISTS "Service role can manage snapshots" ON competitor_snapshots;
DROP POLICY IF EXISTS "Users can view their competitor snapshots" ON competitor_snapshots;
-- Also drop names from user's spec in case they exist from a different migration
DROP POLICY IF EXISTS "authenticated_all_competitor_snapshots" ON competitor_snapshots;
DROP POLICY IF EXISTS "Authenticated users can manage competitor snapshots" ON competitor_snapshots;

-- Read: project members only
CREATE POLICY "project_members_select_competitor_snapshots" ON competitor_snapshots
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Insert: project members only
CREATE POLICY "project_members_insert_competitor_snapshots" ON competitor_snapshots
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Update: project members only
CREATE POLICY "project_members_update_competitor_snapshots" ON competitor_snapshots
  FOR UPDATE USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Delete: project members only
CREATE POLICY "project_members_delete_competitor_snapshots" ON competitor_snapshots
  FOR DELETE USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );


-- =============================================
-- V4.2.2: Fix market_intelligence RLS
-- Was: "Service role can manage market intelligence" FOR ALL USING(true)
-- =============================================

DROP POLICY IF EXISTS "Service role can manage market intelligence" ON market_intelligence;
DROP POLICY IF EXISTS "Users can view their market intelligence" ON market_intelligence;

-- Read: project members only
CREATE POLICY "project_members_select_market_intelligence" ON market_intelligence
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Insert: project members only
CREATE POLICY "project_members_insert_market_intelligence" ON market_intelligence
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Update: project members only
CREATE POLICY "project_members_update_market_intelligence" ON market_intelligence
  FOR UPDATE USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Delete: project members only
CREATE POLICY "project_members_delete_market_intelligence" ON market_intelligence
  FOR DELETE USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );


-- =============================================
-- V4.2.3: Fix ai_analysis_cache INSERT/UPDATE
-- Was: "ai_analysis_cache: service insert" WITH CHECK(true)
--       "ai_analysis_cache: service update" USING(true)
-- Keep SELECT and DELETE policies (already correct).
-- =============================================

DROP POLICY IF EXISTS "ai_analysis_cache: service insert" ON ai_analysis_cache;
DROP POLICY IF EXISTS "ai_analysis_cache: service update" ON ai_analysis_cache;

-- Insert: project members only (edge functions use service_role, bypass RLS)
CREATE POLICY "ai_analysis_cache: members insert" ON ai_analysis_cache
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Update: project members only
CREATE POLICY "ai_analysis_cache: members update" ON ai_analysis_cache
  FOR UPDATE USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );


-- =============================================
-- V4.2.4: Fix metric_alerts, ai_recommendations, weekly_insights INSERT
-- Was: FOR INSERT WITH CHECK(true) on all three
-- =============================================

-- metric_alerts: replace open INSERT
DROP POLICY IF EXISTS "Service role can create alerts" ON metric_alerts;

CREATE POLICY "project_members_insert_metric_alerts" ON metric_alerts
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- ai_recommendations: replace open INSERT
DROP POLICY IF EXISTS "Service role can create recommendations" ON ai_recommendations;

CREATE POLICY "project_members_insert_ai_recommendations" ON ai_recommendations
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- weekly_insights: replace open INSERT
DROP POLICY IF EXISTS "Service role can create insights" ON weekly_insights;

CREATE POLICY "project_members_insert_weekly_insights" ON weekly_insights
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );


-- =============================================
-- V4.2.8: Fix upsert_obv_participants — add project-member auth check
-- Was: only checked OBV owner. Now also checks project membership.
-- =============================================

CREATE OR REPLACE FUNCTION upsert_obv_participants(
  p_obv_id      UUID,
  p_participants JSONB   -- [{member_id: UUID, porcentaje: NUMERIC}]
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- V4.2.8: Verify caller is a member of the project that owns this OBV
  IF NOT EXISTS (
    SELECT 1 FROM project_members pm
    JOIN obvs o ON o.project_id = pm.project_id
    WHERE o.id = p_obv_id AND pm.member_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this project';
  END IF;

  -- Original check: only the OBV owner can edit participants
  IF NOT EXISTS (
    SELECT 1 FROM obvs
    WHERE id = p_obv_id
      AND owner_id = public.get_profile_id(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: only the OBV owner can edit participants';
  END IF;

  -- Atomically replace participants (DELETE + INSERT in same transaction)
  DELETE FROM obv_participantes WHERE obv_id = p_obv_id;

  INSERT INTO obv_participantes (obv_id, member_id, porcentaje)
  SELECT
    p_obv_id,
    (e->>'member_id')::UUID,
    (e->>'porcentaje')::NUMERIC
  FROM jsonb_array_elements(p_participants) AS e;
END;
$$;
