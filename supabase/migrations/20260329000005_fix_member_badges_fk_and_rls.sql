-- HOLE-2: Fix member_badges FK from members(id) → profiles(id)
-- The table was created referencing public.members which doesn't exist.
-- Also add RLS policies and ensure tables exist properly.

-- Recreate member_badges with correct FK if it exists with wrong FK
DO $$
BEGIN
  -- Check if member_badges exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_badges' AND table_schema = 'public') THEN
    -- Drop the old FK constraint (name varies, so drop all FKs on member_id)
    DECLARE
      fk_name TEXT;
    BEGIN
      FOR fk_name IN
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'member_badges' AND constraint_type = 'FOREIGN KEY'
      LOOP
        EXECUTE 'ALTER TABLE public.member_badges DROP CONSTRAINT IF EXISTS ' || fk_name;
      END LOOP;
    END;

    -- Add correct FK to profiles
    ALTER TABLE public.member_badges
      ADD CONSTRAINT member_badges_member_id_fkey
      FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  ELSE
    -- Create from scratch with correct FK
    CREATE TABLE public.member_badges (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      badge_key TEXT NOT NULL,
      badge_name TEXT NOT NULL,
      badge_description TEXT,
      badge_icon TEXT,
      badge_category TEXT,
      earned_at TIMESTAMPTZ DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb,
      UNIQUE(member_id, badge_key)
    );

    CREATE INDEX IF NOT EXISTS idx_member_badges_member ON member_badges(member_id);
    CREATE INDEX IF NOT EXISTS idx_member_badges_category ON member_badges(badge_category);
  END IF;
END $$;

-- Ensure badge_definitions exists
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

-- Seed badge definitions (upsert)
INSERT INTO badge_definitions (badge_key, badge_name, badge_description, badge_icon, badge_category, requirement_description, points_value, is_rare) VALUES
  ('first_blood', 'First Blood', 'Gana tu primer desafio de rol', '🩸', 'challenge', 'Ganar 1 desafio', 50, false),
  ('invincible', 'Invencible', 'Defiende tu titulo 3 veces consecutivas', '⚔️', 'challenge', 'Defender titulo 3 veces', 150, true),
  ('king_of_role', 'Rey del Rol', 'Mantente como Master por 4 semanas', '👑', 'challenge', 'Master por 4 semanas', 250, true),
  ('legend', 'Leyenda', 'Gana 10 desafios en total', '🏆', 'challenge', 'Ganar 10 desafios', 500, true),
  ('good_sport', 'Buen Competidor', 'Participa en 5 desafios (ganar o perder)', '🤝', 'challenge', 'Participar en 5 desafios', 25, false),
  ('explorer', 'Explorador', 'Completa la fase de exploracion (4+ roles)', '🌍', 'phase', 'Explorar 4+ roles', 100, false),
  ('specialist', 'Especialista', 'Completa la fase de especializacion', '🎯', 'phase', 'Completar especializacion', 150, false),
  ('master_role', 'Maestro del Rol', 'Alcanza el nivel Master en un rol', '⭐', 'phase', 'Nivel Master', 200, true),
  ('polymath', 'Polimath', 'Explora los 7 roles disponibles', '🧠', 'phase', 'Explorar 7 roles', 300, true),
  ('innovator', 'Innovador', 'Propone 3 ideas aceptadas por el equipo', '💡', 'contribution', 'Proponer 3 ideas', 75, false),
  ('mentor', 'Mentor', 'Da feedback constructivo a 5 companeros', '🎓', 'contribution', 'Dar 5 feedbacks', 100, false),
  ('initiative', 'Iniciativa', 'Completa 10 tareas antes de la fecha limite', '🚀', 'contribution', 'Completar 10 tareas a tiempo', 125, false),
  ('overachiever', 'Sobrenatural', 'Supera el 90% de performance en un mes', '🔥', 'achievement', 'Performance 90%+', 200, true),
  ('all_rounder', 'Todoterreno', 'Score > 70% en 4+ roles', '🌟', 'achievement', 'Score 70%+ en 4 roles', 250, true),
  ('speedrun', 'Speedrun', 'Pasa de fase 1 a fase 2 en menos de 3 semanas', '⚡', 'achievement', 'Fase 1→2 en < 3 semanas', 150, false)
ON CONFLICT (badge_key) DO NOTHING;

-- Enable RLS on both tables
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

-- RLS: users can see their own badges
DROP POLICY IF EXISTS "Users can view own badges" ON member_badges;
CREATE POLICY "Users can view own badges" ON member_badges
  FOR SELECT TO authenticated
  USING (member_id = public.get_profile_id(auth.uid()));

-- RLS: system can insert badges (triggers run as owner, bypass RLS)
DROP POLICY IF EXISTS "System can insert badges" ON member_badges;
CREATE POLICY "System can insert badges" ON member_badges
  FOR INSERT TO authenticated
  WITH CHECK (member_id = public.get_profile_id(auth.uid()));

-- RLS: badge definitions are public read
DROP POLICY IF EXISTS "Badge definitions are public" ON badge_definitions;
CREATE POLICY "Badge definitions are public" ON badge_definitions
  FOR SELECT TO authenticated
  USING (true);

-- Also fix member_phase_progress if it exists with wrong FK
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_phase_progress' AND table_schema = 'public') THEN
    DECLARE
      fk_name TEXT;
    BEGIN
      FOR fk_name IN
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'member_phase_progress' AND constraint_type = 'FOREIGN KEY'
      LOOP
        EXECUTE 'ALTER TABLE public.member_phase_progress DROP CONSTRAINT IF EXISTS ' || fk_name;
      END LOOP;
    END;

    ALTER TABLE public.member_phase_progress
      ADD CONSTRAINT member_phase_progress_member_id_fkey
      FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.member_phase_progress ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own phase progress" ON member_phase_progress;
    CREATE POLICY "Users can view own phase progress" ON member_phase_progress
      FOR SELECT TO authenticated
      USING (member_id = public.get_profile_id(auth.uid()));
  END IF;
END $$;

-- Add role_rankings RLS + indexes (were missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_rankings' AND table_schema = 'public') THEN
    ALTER TABLE public.role_rankings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Rankings are public read" ON role_rankings;
    CREATE POLICY "Rankings are public read" ON role_rankings
      FOR SELECT TO authenticated
      USING (true);

    CREATE INDEX IF NOT EXISTS idx_role_rankings_role_name ON role_rankings(role_name);
    CREATE INDEX IF NOT EXISTS idx_role_rankings_user_id ON role_rankings(user_id);
    CREATE INDEX IF NOT EXISTS idx_role_rankings_project_id ON role_rankings(project_id);
    CREATE INDEX IF NOT EXISTS idx_role_rankings_period ON role_rankings(period_start, period_end);
  END IF;
END $$;
