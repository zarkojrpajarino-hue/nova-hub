-- FIX: get_optimus_context lost optimus_profile (F28) when F30 redefined it.
-- This migration adds the optimus_profile block back without touching the rest.
-- Strategy: wrapper function that enriches the output with the missing fields.

CREATE OR REPLACE FUNCTION get_optimus_context_enriched(
  p_project_id UUID,
  p_user_id    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base JSONB;
  v_profile RECORD;
  v_profile_json JSONB := NULL;
BEGIN
  -- Get base context (F30 version with founder_patterns + financial_risks)
  v_base := get_optimus_context(p_project_id, p_user_id);

  -- Add optimus_profile from F28 (lost in F30 redefinition)
  IF p_user_id IS NOT NULL THEN
    SELECT
      preferred_depth,
      risk_tolerance,
      response_style,
      total_feedbacks
    INTO v_profile
    FROM optimus_profiles
    WHERE user_id = p_user_id
    LIMIT 1;

    IF FOUND THEN
      v_profile_json := jsonb_build_object(
        'preferred_depth', v_profile.preferred_depth,
        'risk_tolerance',  v_profile.risk_tolerance,
        'response_style',  v_profile.response_style,
        'total_feedbacks', v_profile.total_feedbacks
      );
    END IF;
  END IF;

  -- Merge missing fields
  RETURN v_base || jsonb_build_object(
    'optimus_profile', COALESCE(v_profile_json, jsonb_build_object(
      'preferred_depth', 'detallado',
      'risk_tolerance',  'moderado',
      'response_style',  'equilibrado',
      'total_feedbacks', 0
    ))
  );
END;
$$;

COMMENT ON FUNCTION get_optimus_context_enriched(UUID, UUID) IS
  'Wrapper over get_optimus_context that adds optimus_profile (F28) '
  'lost during F30 redefinition. Use this instead of get_optimus_context '
  'in edge functions that need personalization.';
