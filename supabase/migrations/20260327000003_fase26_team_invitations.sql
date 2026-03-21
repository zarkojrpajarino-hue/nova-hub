-- =============================================================================
-- MIGRACIÓN FASE 26 — Sistema de Equipo v2
--
-- 1. Tabla project_invitations (invitaciones por enlace)
-- 2. Función generate_invitation_token() (token criptográfico)
-- 3. RPC accept_invitation(token) (aceptar invitación + insertar project_members)
-- 4. ALTER project_members ADD role_profile JSONB (EQ26.5)
-- 5. RLS para project_invitations
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PASO 1 — project_invitations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS project_invitations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invited_by    UUID        NOT NULL REFERENCES members(id),
  token         TEXT        NOT NULL UNIQUE,
  role          specialization_role NOT NULL,
  email         TEXT,                            -- restricción opcional por email
  status        TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  max_uses      SMALLINT    NOT NULL DEFAULT 1,
  uses_count    SMALLINT    NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  accepted_at   TIMESTAMPTZ,
  accepted_by   UUID        REFERENCES members(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_invitations_token
  ON project_invitations (token) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_project_invitations_project
  ON project_invitations (project_id, status);

COMMENT ON TABLE project_invitations IS
  'FASE 26: Invitaciones por enlace con token criptográfico. max_uses=1 para single-use, N para multi-use.';

-- RLS
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

-- Lectura: solo miembros del proyecto ven sus invitaciones
CREATE POLICY "project_invitations: project members can read"
  ON project_invitations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_invitations.project_id
        AND pm.member_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    )
  );

-- Solo owner/leader del proyecto puede crear/actualizar invitaciones
CREATE POLICY "project_invitations: project owner can manage"
  ON project_invitations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_invitations.project_id
        AND pm.member_id = (SELECT id FROM members WHERE auth_id = auth.uid())
        AND pm.is_lead = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_invitations.project_id
        AND pm.member_id = (SELECT id FROM members WHERE auth_id = auth.uid())
        AND pm.is_lead = TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- PASO 2 — generate_invitation_token()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- base64url: reemplazar +→-, /→_, eliminar =
  RETURN replace(replace(replace(
    encode(gen_random_bytes(24), 'base64'),
    '+', '-'), '/', '_'), '=', '');
END;
$$;

COMMENT ON FUNCTION generate_invitation_token() IS
  'FASE 26: Genera token criptográfico de 32 chars para invitaciones. Usa pgcrypto (schema extensions).';

-- ---------------------------------------------------------------------------
-- PASO 3 — accept_invitation(token)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv          RECORD;
  v_member_id    UUID;
  v_auth_id      UUID;
  v_already      BOOLEAN;
BEGIN
  -- Get current user
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT id INTO v_member_id FROM members WHERE auth_id = v_auth_id;
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('error', 'User profile not found');
  END IF;

  -- Find invitation
  SELECT * INTO v_inv
  FROM   project_invitations
  WHERE  token = p_token
    AND  status = 'pending'
  FOR UPDATE;

  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('error', 'Invitation not found or already used');
  END IF;

  -- Check expiration
  IF v_inv.expires_at < NOW() THEN
    UPDATE project_invitations SET status = 'expired' WHERE id = v_inv.id;
    RETURN jsonb_build_object('error', 'Invitation expired');
  END IF;

  -- Check max uses
  IF v_inv.uses_count >= v_inv.max_uses THEN
    UPDATE project_invitations SET status = 'accepted' WHERE id = v_inv.id;
    RETURN jsonb_build_object('error', 'Invitation max uses reached');
  END IF;

  -- Check email restriction
  IF v_inv.email IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM members WHERE id = v_member_id AND email = v_inv.email) THEN
      RETURN jsonb_build_object('error', 'This invitation is restricted to a specific email');
    END IF;
  END IF;

  -- Check not already a member
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = v_inv.project_id AND member_id = v_member_id
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('error', 'Already a member of this project');
  END IF;

  -- Insert project member
  INSERT INTO project_members (project_id, member_id, role, is_lead, role_accepted)
  VALUES (v_inv.project_id, v_member_id, v_inv.role, FALSE, FALSE);

  -- Update invitation
  UPDATE project_invitations
  SET    uses_count  = uses_count + 1,
         accepted_at = NOW(),
         accepted_by = v_member_id,
         status      = CASE WHEN uses_count + 1 >= max_uses THEN 'accepted' ELSE status END
  WHERE  id = v_inv.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'project_id', v_inv.project_id,
    'role', v_inv.role::TEXT
  );
END;
$$;

COMMENT ON FUNCTION accept_invitation(TEXT) IS
  'FASE 26: Acepta invitación por token. Valida: auth, expiration, max_uses, email restriction, duplicate member. Inserta project_members.';

-- ---------------------------------------------------------------------------
-- PASO 3b — get_invitation_by_token(token) — lectura pública segura
-- Retorna solo datos necesarios para la landing (no el token ni accepted_by).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
BEGIN
  SELECT
    pi.id, pi.project_id, pi.role::TEXT as role, pi.email,
    pi.status, pi.expires_at, pi.uses_count, pi.max_uses,
    p.nombre as project_name, p.descripcion as project_description
  INTO v_inv
  FROM   project_invitations pi
  JOIN   projects p ON p.id = pi.project_id
  WHERE  pi.token = p_token
    AND  pi.status = 'pending';

  IF v_inv IS NULL THEN
    RETURN jsonb_build_object('error', 'Invitation not found');
  END IF;

  RETURN jsonb_build_object(
    'id', v_inv.id,
    'project_id', v_inv.project_id,
    'role', v_inv.role,
    'email', v_inv.email,
    'status', v_inv.status,
    'expires_at', v_inv.expires_at,
    'uses_count', v_inv.uses_count,
    'max_uses', v_inv.max_uses,
    'project_name', v_inv.project_name,
    'project_description', v_inv.project_description
  );
END;
$$;

COMMENT ON FUNCTION get_invitation_by_token(TEXT) IS
  'FASE 26: Lectura pública de invitación por token. Retorna solo datos de presentación, no datos sensibles.';

-- ---------------------------------------------------------------------------
-- PASO 4 — ALTER project_members: role_profile (EQ26.5)
-- ---------------------------------------------------------------------------

ALTER TABLE project_members
  ADD COLUMN IF NOT EXISTS role_profile JSONB;

COMMENT ON COLUMN project_members.role_profile IS
  'FASE 26: Perfil profesional del miembro. { experience_level, skills, tools, availability_hours, onboarded_at }. Usado por generate-tasks-v2.';
