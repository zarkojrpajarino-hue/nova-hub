-- =====================================================
-- SISTEMA COMPLETO: FASES + BADGES + NOTIFICACIONES
-- =====================================================

-- =====================================================
-- PARTE 1: VISTA DE LEADERBOARD POR ROL
-- =====================================================

CREATE OR REPLACE VIEW role_leaderboard AS
SELECT
  m.id as member_id,
  m.nombre,
  m.email,
  rep.role,
  AVG(rep.fit_score) as avg_fit_score,
  MAX(rep.fit_score) as best_fit_score,
  COUNT(rep.id) as times_explored,
  MAX(rep.end_date) as last_explored,
  RANK() OVER (PARTITION BY rep.role ORDER BY AVG(rep.fit_score) DESC) as ranking,
  -- ¿Es Master actual?
  EXISTS (
    SELECT 1 FROM masters
    WHERE user_id = m.id AND role_name = rep.role AND is_active = true
  ) as is_current_master,
  -- Puede desafiar (top 3 + fit >= 4.0)
  (
    RANK() OVER (PARTITION BY rep.role ORDER BY AVG(rep.fit_score) DESC) <= 3
    AND AVG(rep.fit_score) >= 4.0
  ) as can_challenge
FROM role_exploration_periods rep
JOIN members m ON m.id = rep.member_id
WHERE rep.status = 'completed'
  AND rep.fit_score IS NOT NULL
GROUP BY m.id, m.nombre, m.email, rep.role;

-- =====================================================
-- PARTE 2: TABLA DE BADGES/LOGROS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.member_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT, -- emoji o nombre de icono
  badge_category TEXT, -- 'challenge', 'phase', 'contribution', 'achievement'
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(member_id, badge_key)
);

CREATE INDEX idx_member_badges_member ON member_badges(member_id);
CREATE INDEX idx_member_badges_category ON member_badges(badge_category);

-- Tabla de definiciones de badges (catálogo)
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  badge_key TEXT PRIMARY KEY,
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  badge_category TEXT NOT NULL,
  requirement_description TEXT,
  points_value INTEGER DEFAULT 0,
  is_rare BOOLEAN DEFAULT false
);

-- Insertar badges predefinidos
INSERT INTO badge_definitions (badge_key, badge_name, badge_description, badge_icon, badge_category, requirement_description, points_value, is_rare) VALUES
-- Challenges
('first_blood', 'Primera Sangre', 'Ganar tu primer desafío', '🩸', 'challenge', 'Ganar 1 desafío', 50, false),
('invincible', 'Invicto', 'Defender tu título 3 veces seguidas', '⚔️', 'challenge', 'Defender 3 veces', 150, true),
('king_of_role', 'Rey del Rol', 'Defender tu título 5 veces en total', '👑', 'challenge', 'Defender 5 veces', 250, true),
('legend', 'Leyenda', 'Defender tu título 10 veces', '🔥', 'challenge', 'Defender 10 veces', 500, true),
('good_sport', 'Buen Deportista', 'Perder un desafío con gracia', '🤝', 'challenge', 'Recibir feedback positivo tras perder', 25, false),

-- Phases
('explorer', 'Explorador', 'Completar Fase 1 (4 roles)', '🌱', 'phase', 'Explorar 4 roles diferentes', 100, false),
('specialist', 'Especialista', 'Completar Fase 2', '📈', 'phase', 'Especializarse en 2 roles', 150, false),
('master_role', 'Master', 'Obtener título de Master en un rol', '⭐', 'phase', 'Ser #1 en un rol', 200, false),
('polymath', 'Polímata', 'Fit score >4.0 en 3+ roles', '💎', 'phase', 'Tener fit score alto en múltiples roles', 300, true),

-- Contribution
('innovator', 'Innovador', '10+ insights valiosos', '💡', 'contribution', 'Compartir 10 insights públicos', 75, false),
('mentor', 'Mentor', 'Ayudar a 3+ personas con feedback', '🎯', 'contribution', 'Dar feedback de calidad a 3+ compañeros', 100, false),
('initiative', 'Iniciativa', '20+ OBVs propios creados', '🚀', 'contribution', 'Crear 20 OBVs de iniciativa propia', 125, false),

-- Achievement
('overachiever', 'Sobresaliente', 'Fit score perfecto (5.0) en un rol', '🌟', 'achievement', 'Alcanzar fit score de 5.0', 200, true),
('all_rounder', 'Todo Terreno', 'Probar los 7 roles disponibles', '🎪', 'achievement', 'Explorar todos los roles', 250, true),
('speedrun', 'Velocista', 'Completar Fase 1 + 2 en tiempo récord', '⚡', 'achievement', 'Terminar en 6 semanas exactas', 150, false)
ON CONFLICT (badge_key) DO NOTHING;

-- =====================================================
-- PARTE 3: TABLA DE NOTIFICACIONES MEJORADA
-- =====================================================

-- Ya existe notifications, agreguemos campos si faltan
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='priority') THEN
    ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='action_url') THEN
    ALTER TABLE notifications ADD COLUMN action_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='metadata') THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='expires_at') THEN
    ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- =====================================================
-- PARTE 4: TABLA DE FASES (TRACKING)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.member_phase_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  current_phase INTEGER DEFAULT 1 CHECK (current_phase IN (1, 2, 3)),
  phase_1_started_at TIMESTAMP WITH TIME ZONE,
  phase_1_completed_at TIMESTAMP WITH TIME ZONE,
  phase_2_started_at TIMESTAMP WITH TIME ZONE,
  phase_2_completed_at TIMESTAMP WITH TIME ZONE,
  phase_3_started_at TIMESTAMP WITH TIME ZONE,
  roles_explored_phase_1 TEXT[] DEFAULT '{}',
  top_2_roles TEXT[] DEFAULT '{}',
  star_role TEXT,
  secondary_role TEXT,
  total_weeks_elapsed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id)
);

CREATE INDEX idx_phase_progress_member ON member_phase_progress(member_id);
CREATE INDEX idx_phase_progress_phase ON member_phase_progress(current_phase);

-- =====================================================
-- PARTE 5: FUNCIONES AUTOMÁTICAS
-- =====================================================

-- Función: Auto-otorgar badges
CREATE OR REPLACE FUNCTION auto_grant_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_uuid UUID;
  role_count INTEGER;
  fit_count INTEGER;
BEGIN
  member_uuid := NEW.member_id;

  -- Badge: Explorador (completar Fase 1)
  IF NEW.current_phase >= 2 AND NEW.phase_1_completed_at IS NOT NULL THEN
    INSERT INTO member_badges (member_id, badge_key, badge_name, badge_description, badge_icon, badge_category)
    SELECT member_uuid, 'explorer', 'Explorador', 'Completar Fase 1 (4 roles)', '🌱', 'phase'
    WHERE NOT EXISTS (
      SELECT 1 FROM member_badges WHERE member_id = member_uuid AND badge_key = 'explorer'
    );
  END IF;

  -- Badge: Especialista (completar Fase 2)
  IF NEW.current_phase >= 3 AND NEW.phase_2_completed_at IS NOT NULL THEN
    INSERT INTO member_badges (member_id, badge_key, badge_name, badge_description, badge_icon, badge_category)
    SELECT member_uuid, 'specialist', 'Especialista', 'Completar Fase 2', '📈', 'phase'
    WHERE NOT EXISTS (
      SELECT 1 FROM member_badges WHERE member_id = member_uuid AND badge_key = 'specialist'
    );
  END IF;

  -- Badge: Polímata (fit >4.0 en 3+ roles)
  SELECT COUNT(DISTINCT role) INTO fit_count
  FROM role_exploration_periods
  WHERE member_id = member_uuid
    AND fit_score >= 4.0
    AND status = 'completed';

  IF fit_count >= 3 THEN
    INSERT INTO member_badges (member_id, badge_key, badge_name, badge_description, badge_icon, badge_category)
    SELECT member_uuid, 'polymath', 'Polímata', 'Fit score >4.0 en 3+ roles', '💎', 'phase'
    WHERE NOT EXISTS (
      SELECT 1 FROM member_badges WHERE member_id = member_uuid AND badge_key = 'polymath'
    );
  END IF;

  -- Badge: Todo Terreno (probar 7 roles)
  SELECT COUNT(DISTINCT role) INTO role_count
  FROM role_exploration_periods
  WHERE member_id = member_uuid
    AND status = 'completed';

  IF role_count >= 7 THEN
    INSERT INTO member_badges (member_id, badge_key, badge_name, badge_description, badge_icon, badge_category)
    SELECT member_uuid, 'all_rounder', 'Todo Terreno', 'Probar los 7 roles disponibles', '🎪', 'achievement'
    WHERE NOT EXISTS (
      SELECT 1 FROM member_badges WHERE member_id = member_uuid AND badge_key = 'all_rounder'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para auto-badges
DROP TRIGGER IF EXISTS trigger_auto_grant_badges ON member_phase_progress;

CREATE TRIGGER trigger_auto_grant_badges
  AFTER INSERT OR UPDATE ON member_phase_progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_grant_badges();

-- Función: Crear notificación cuando cambias de fase
CREATE OR REPLACE FUNCTION notify_phase_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_auth_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  action_button TEXT;
BEGIN
  -- Obtener auth_id del miembro
  SELECT auth_id INTO member_auth_id
  FROM members
  WHERE id = NEW.member_id;

  -- Fase 1 completada → Iniciar Fase 2
  IF NEW.phase_1_completed_at IS NOT NULL AND OLD.phase_1_completed_at IS NULL THEN
    notification_title := '✅ Fase 1 Completada';
    notification_message := 'Has explorado ' || array_length(NEW.roles_explored_phase_1, 1) || ' roles. Tus mejores: ' || array_to_string(NEW.top_2_roles, ', ');
    action_button := 'Iniciar Fase 2';

    INSERT INTO notifications (user_id, title, message, priority, action_url, metadata)
    VALUES (
      member_auth_id,
      notification_title,
      notification_message,
      'high',
      '/exploration',
      jsonb_build_object(
        'phase', 2,
        'top_roles', NEW.top_2_roles,
        'action', 'start_phase_2'
      )
    );
  END IF;

  -- Fase 2 completada → Iniciar Fase 3
  IF NEW.phase_2_completed_at IS NOT NULL AND OLD.phase_2_completed_at IS NULL THEN
    notification_title := '🎉 Fase 2 Completada';
    notification_message := 'Has especializado tus roles. Rol Estrella: ' || NEW.star_role || '. Rol Secundario: ' || NEW.secondary_role;
    action_button := 'Ver Rankings';

    INSERT INTO notifications (user_id, title, message, priority, action_url, metadata)
    VALUES (
      member_auth_id,
      notification_title,
      notification_message,
      'critical',
      '/team-performance?tab=rankings',
      jsonb_build_object(
        'phase', 3,
        'star_role', NEW.star_role,
        'secondary_role', NEW.secondary_role,
        'action', 'view_rankings'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para notificaciones de fase
DROP TRIGGER IF EXISTS trigger_notify_phase_change ON member_phase_progress;

CREATE TRIGGER trigger_notify_phase_change
  AFTER UPDATE ON member_phase_progress
  FOR EACH ROW
  EXECUTE FUNCTION notify_phase_change();

-- =====================================================
-- PARTE 6: CONECTAR INSIGHTS CON ROLES
-- =====================================================

-- Agregar columna exploration_period_id a user_insights
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_insights' AND column_name='exploration_period_id') THEN
    ALTER TABLE user_insights ADD COLUMN exploration_period_id UUID REFERENCES role_exploration_periods(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_insights_exploration ON user_insights(exploration_period_id);

-- Vista: Insights por rol
CREATE OR REPLACE VIEW role_insights AS
SELECT
  ui.id,
  ui.user_id,
  ui.titulo,
  ui.contenido,
  ui.tipo,
  ui.tags,
  ui.is_private,
  ui.created_at,
  rep.role,
  rep.project_id,
  rep.fit_score,
  m.nombre as user_name
FROM user_insights ui
LEFT JOIN role_exploration_periods rep ON rep.id = ui.exploration_period_id
JOIN members m ON m.id = ui.user_id
WHERE ui.is_private = false; -- Solo insights públicos

-- =====================================================
-- PARTE 7: VERIFICACIÓN
-- =====================================================

-- Ver leaderboard
SELECT * FROM role_leaderboard ORDER BY role, ranking LIMIT 20;

-- Ver badges disponibles
SELECT * FROM badge_definitions ORDER BY badge_category, points_value DESC;

-- Ver progreso de fases
SELECT
  m.nombre,
  pp.current_phase,
  pp.roles_explored_phase_1,
  pp.star_role,
  pp.secondary_role,
  (SELECT COUNT(*) FROM member_badges WHERE member_id = m.id) as badges_count
FROM member_phase_progress pp
JOIN members m ON m.id = pp.member_id;

-- ✅ SISTEMA COMPLETO CREADO
