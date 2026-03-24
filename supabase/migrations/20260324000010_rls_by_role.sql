-- V4.10.1 — RLS by role for financial tables
-- Restricts SELECT on financial_projections and cobros_parciales
-- to admin users or members with specialization_role in ('finance', 'operations').
-- Note: cash_flow_entries table does not exist in the schema; only the two existing tables are covered.

-- ── financial_projections ────────────────────────────────────────────────────

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Users can manage their financial projections" ON financial_projections;

-- SELECT: only admin or finance/operations members of the project
CREATE POLICY "rls_financial_projections_select_by_role" ON financial_projections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE p.auth_id = auth.uid() AND ur.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.member_id
      WHERE p.auth_id = auth.uid()
        AND pm.project_id = financial_projections.project_id
        AND pm.role IN ('finance', 'operations')
    )
  );

-- INSERT/UPDATE/DELETE: same role-based restriction
CREATE POLICY "rls_financial_projections_insert_by_role" ON financial_projections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE p.auth_id = auth.uid() AND ur.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.member_id
      WHERE p.auth_id = auth.uid()
        AND pm.project_id = financial_projections.project_id
        AND pm.role IN ('finance', 'operations')
    )
  );

CREATE POLICY "rls_financial_projections_update_by_role" ON financial_projections
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE p.auth_id = auth.uid() AND ur.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.member_id
      WHERE p.auth_id = auth.uid()
        AND pm.project_id = financial_projections.project_id
        AND pm.role IN ('finance', 'operations')
    )
  );

CREATE POLICY "rls_financial_projections_delete_by_role" ON financial_projections
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE p.auth_id = auth.uid() AND ur.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.member_id
      WHERE p.auth_id = auth.uid()
        AND pm.project_id = financial_projections.project_id
        AND pm.role IN ('finance', 'operations')
    )
  );

-- ── cobros_parciales ─────────────────────────────────────────────────────────

-- Drop existing permissive SELECT policy
DROP POLICY IF EXISTS "All authenticated can view cobros parciales" ON cobros_parciales;

-- cobros_parciales references obv_id, not project_id directly.
-- We join through obvs to get the project_id.
CREATE POLICY "rls_cobros_parciales_select_by_role" ON cobros_parciales
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE p.auth_id = auth.uid() AND ur.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM obvs o
      JOIN project_members pm ON pm.project_id = o.project_id AND pm.role IN ('finance', 'operations')
      JOIN profiles p ON p.id = pm.member_id
      WHERE o.id = cobros_parciales.obv_id
        AND p.auth_id = auth.uid()
    )
  );
