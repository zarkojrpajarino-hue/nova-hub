-- PR1: Crear tablas del sistema Meeting Intelligence
-- Resuelve runtime failures activos en useMeetings.ts (5 hooks) + 3 edge functions
-- que referenciaban meetings y tablas satélite inexistentes.
--
-- Tablas creadas: meetings, meeting_participants, meeting_insights,
-- meeting_ai_questions, meeting_ai_recommendations, meeting_decisions
--
-- Schema derivado de useMeetings.ts (Meeting interface + CreateMeetingInput)
-- y edge functions transcribe-meeting, analyze-meeting, apply-meeting-insights.

-- ---------------------------------------------
-- MEETINGS
-- ---------------------------------------------

CREATE TABLE meetings (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                    TEXT        NOT NULL,
  meeting_type             TEXT        NOT NULL,
  description              TEXT,
  objectives               TEXT,
  estimated_duration_min   INTEGER,
  strategic_context        JSONB,
  started_at               TIMESTAMPTZ,
  ended_at                 TIMESTAMPTZ,
  duration_actual_min      INTEGER,
  audio_url                TEXT,
  transcript               TEXT,
  insights                 JSONB,
  summary                  TEXT,
  key_points               TEXT[],
  ai_confidence_score      NUMERIC(4,3),
  status                   TEXT        NOT NULL DEFAULT 'configuring',
  created_by               UUID        NOT NULL REFERENCES profiles(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meetings_project_id ON meetings (project_id, created_at DESC);

-- ---------------------------------------------
-- MEETING PARTICIPANTS
-- ---------------------------------------------

CREATE TABLE meeting_participants (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id       UUID        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  member_id        UUID        NOT NULL,
  attended         BOOLEAN     NOT NULL DEFAULT TRUE,
  can_receive_tasks BOOLEAN    NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_meeting_participant UNIQUE (meeting_id, member_id)
);

CREATE INDEX idx_meeting_participants_meeting ON meeting_participants (meeting_id);

-- ---------------------------------------------
-- MEETING INSIGHTS
-- (generados por analyze-meeting, aprobados/rechazados por usuario,
--  aplicados por apply-meeting-insights)
-- ---------------------------------------------

CREATE TABLE meeting_insights (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id        UUID        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  insight_type      TEXT        NOT NULL,  -- 'task'|'decision'|'lead'|'obv_update'|'blocker'|'metric'
  content           JSONB       NOT NULL,
  review_status     TEXT        NOT NULL DEFAULT 'pending_review',  -- 'pending_review'|'approved'|'rejected'
  applied           BOOLEAN     NOT NULL DEFAULT FALSE,
  applied_entity_id UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meeting_insights_meeting ON meeting_insights (meeting_id);
CREATE INDEX idx_meeting_insights_pending ON meeting_insights (meeting_id)
  WHERE review_status = 'pending_review' AND applied = FALSE;

-- ---------------------------------------------
-- MEETING AI QUESTIONS
-- (preguntas generadas por IA durante la reunión)
-- ---------------------------------------------

CREATE TABLE meeting_ai_questions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  question    TEXT,
  asked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meeting_ai_questions_meeting ON meeting_ai_questions (meeting_id, asked_at);

-- ---------------------------------------------
-- MEETING AI RECOMMENDATIONS
-- (recomendaciones proactivas generadas por IA)
-- ---------------------------------------------

CREATE TABLE meeting_ai_recommendations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  recommendation  TEXT,
  shown_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meeting_ai_recommendations_meeting ON meeting_ai_recommendations (meeting_id, shown_at);

-- ---------------------------------------------
-- MEETING DECISIONS
-- (decisiones formales registradas durante la reunión)
-- ---------------------------------------------

CREATE TABLE meeting_decisions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title       TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meeting_decisions_meeting ON meeting_decisions (meeting_id, created_at DESC);

-- ---------------------------------------------
-- RLS
-- ---------------------------------------------

ALTER TABLE meetings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_insights          ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_ai_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_decisions         ENABLE ROW LEVEL SECURITY;

-- Acceso a meetings: miembros del proyecto
CREATE POLICY "meetings_project_member" ON meetings
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE member_id = public.get_profile_id(auth.uid())
    )
  );

CREATE POLICY "meeting_participants_project_member" ON meeting_participants
  FOR ALL USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE member_id = public.get_profile_id(auth.uid())
      )
    )
  );

CREATE POLICY "meeting_insights_project_member" ON meeting_insights
  FOR ALL USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE member_id = public.get_profile_id(auth.uid())
      )
    )
  );

CREATE POLICY "meeting_ai_questions_project_member" ON meeting_ai_questions
  FOR ALL USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE member_id = public.get_profile_id(auth.uid())
      )
    )
  );

CREATE POLICY "meeting_ai_recommendations_project_member" ON meeting_ai_recommendations
  FOR ALL USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE member_id = public.get_profile_id(auth.uid())
      )
    )
  );

CREATE POLICY "meeting_decisions_project_member" ON meeting_decisions
  FOR ALL USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE member_id = public.get_profile_id(auth.uid())
      )
    )
  );
