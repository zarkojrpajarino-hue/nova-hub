-- V5.1.5: CRITICAL index for phase engine
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_phase_state_project_id
  ON project_phase_state(project_id);

-- V5.1.6: Dashboard speed
CREATE INDEX IF NOT EXISTS idx_project_phase_history_project_date
  ON project_phase_history(project_id, calculated_at DESC);

-- V5.1.7: Composite indexes for hot paths
CREATE INDEX IF NOT EXISTS idx_validation_order_month_position
  ON validation_order(month_year, position ASC);

CREATE INDEX IF NOT EXISTS idx_kpi_validaciones_approved
  ON kpi_validaciones(kpi_id, approved);

CREATE INDEX IF NOT EXISTS idx_obvs_project_cobro_estado
  ON obvs(project_id, cobro_estado)
  WHERE cobro_estado != 'cobrado_total';

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created
  ON activity_log(user_id, created_at DESC);
