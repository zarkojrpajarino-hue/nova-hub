-- V5.6.11 — CRM leads RPC for optimized querying
CREATE OR REPLACE FUNCTION get_crm_leads(p_project_id UUID, p_status TEXT DEFAULT NULL)
RETURNS SETOF obvs AS $$
  SELECT * FROM obvs
  WHERE project_id = p_project_id
  AND es_venta = true
  AND (p_status IS NULL OR status::text = p_status)
  ORDER BY created_at DESC;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Grant execute to authenticated users (RLS on obvs still applies via SECURITY DEFINER context)
GRANT EXECUTE ON FUNCTION get_crm_leads(UUID, TEXT) TO authenticated;
