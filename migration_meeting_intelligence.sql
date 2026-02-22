-- ============================================================================
-- MEETING INTELLIGENCE SYSTEM - Database Schema
-- ============================================================================
-- Sistema completo de IA para reuniones: grabación, transcripción, análisis,
-- extracción de insights y aplicación automática en el sistema.
-- ============================================================================

-- ============================================================================
-- 1. TABLA: meetings
-- Almacena información de todas las reuniones
-- ============================================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Información básica
  title VARCHAR(255) NOT NULL,
  meeting_type VARCHAR(100) NOT NULL, -- sprint_planning, retrospective, one_on_one, client, etc.
  description TEXT,

  -- Configuración pre-reunión
  objectives TEXT, -- Objetivos declarados de la reunión
  estimated_duration_min INT, -- Duración estimada en minutos
  strategic_context JSONB, -- Respuestas a preguntas estratégicas pre-reunión

  -- Metadata de grabación
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_actual_min INT, -- Duración real calculada
  audio_url TEXT, -- URL en Supabase Storage
  audio_format VARCHAR(20), -- mp3, wav, m4a, etc.
  audio_size_bytes BIGINT,

  -- Transcripción
  transcript TEXT, -- Transcripción completa
  transcript_with_timestamps JSONB, -- Transcripción con timestamps y speakers
  language_detected VARCHAR(10), -- es, en, etc.

  -- Insights generados por IA
  insights JSONB, -- Todos los insights estructurados en JSON
  summary TEXT, -- Resumen ejecutivo
  key_points TEXT[], -- Puntos clave (array)
  ai_confidence_score DECIMAL(3,2), -- Score promedio de confianza (0-1)

  -- Estado del procesamiento
  status VARCHAR(50) NOT NULL DEFAULT 'configuring',
  -- configuring -> recording -> processing_audio -> transcribing ->
  -- analyzing -> reviewing_questions -> reviewing_insights -> completed | failed
  processing_error TEXT, -- Error si falló

  -- Metadata
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Índices para búsquedas rápidas
  CONSTRAINT meetings_status_check CHECK (status IN (
    'configuring', 'recording', 'processing_audio', 'transcribing',
    'analyzing', 'reviewing_questions', 'reviewing_insights', 'completed', 'failed'
  ))
);

-- Índices para meetings
CREATE INDEX idx_meetings_project_id ON meetings(project_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);
CREATE INDEX idx_meetings_meeting_type ON meetings(meeting_type);
CREATE INDEX idx_meetings_started_at ON meetings(started_at DESC);

-- Índice GIN para búsqueda full-text en transcripción
CREATE INDEX idx_meetings_transcript_search ON meetings USING gin(to_tsvector('spanish', transcript));

-- ============================================================================
-- 2. TABLA: meeting_participants
-- Participantes de cada reunión (internos y externos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- Participante interno (miembro del proyecto)
  member_id UUID REFERENCES members(id),

  -- Participante externo (no es miembro)
  is_external BOOLEAN DEFAULT false,
  external_name VARCHAR(255),
  external_email VARCHAR(255),
  external_role VARCHAR(100), -- Cliente, Stakeholder, etc.

  -- Metadata de participación
  attended BOOLEAN DEFAULT true, -- Si realmente asistió
  joined_at TIMESTAMP,
  left_at TIMESTAMP,

  -- Configuración especial
  can_receive_tasks BOOLEAN DEFAULT true, -- Puede recibir tareas aunque no asistió

  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraint: debe ser interno O externo, no ambos
  CONSTRAINT participant_type_check CHECK (
    (member_id IS NOT NULL AND is_external = false) OR
    (member_id IS NULL AND is_external = true)
  )
);

-- Índices para meeting_participants
CREATE INDEX idx_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_participants_member_id ON meeting_participants(member_id);
CREATE UNIQUE INDEX idx_participants_unique ON meeting_participants(meeting_id, member_id)
  WHERE member_id IS NOT NULL;

-- ============================================================================
-- 3. TABLA: meeting_ai_questions
-- Preguntas que la IA hace durante la reunión para clarificación
-- ============================================================================
CREATE TABLE IF NOT EXISTS meeting_ai_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- La pregunta
  question TEXT NOT NULL,
  question_type VARCHAR(50), -- clarification, missing_info, ambiguity, etc.
  context TEXT, -- Por qué la IA hizo esta pregunta
  priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low

  -- Timing
  asked_at TIMESTAMP DEFAULT NOW(), -- Minuto de la reunión donde se hizo
  asked_at_transcript_position INT, -- Posición en la transcripción

  -- Respuesta
  answer TEXT,
  answered_at TIMESTAMP,
  answered_by UUID REFERENCES members(id),
  answer_method VARCHAR(50), -- during_meeting, post_meeting, skipped

  -- Estado
  status VARCHAR(50) DEFAULT 'pending', -- pending, answered, ignored, skipped

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT ai_questions_status_check CHECK (status IN ('pending', 'answered', 'ignored', 'skipped')),
  CONSTRAINT ai_questions_priority_check CHECK (priority IN ('high', 'medium', 'low'))
);

-- Índices para meeting_ai_questions
CREATE INDEX idx_ai_questions_meeting_id ON meeting_ai_questions(meeting_id);
CREATE INDEX idx_ai_questions_status ON meeting_ai_questions(status);
CREATE INDEX idx_ai_questions_priority ON meeting_ai_questions(priority);

-- ============================================================================
-- 4. TABLA: meeting_ai_recommendations
-- Recomendaciones proactivas del AI Facilitador durante la reunión
-- ============================================================================
CREATE TABLE IF NOT EXISTS meeting_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- La recomendación
  recommendation_type VARCHAR(100) NOT NULL,
  -- context_alert, missing_topic, time_management, conflict_detection,
  -- opportunity, risk_alert, performance_concern, etc.

  message TEXT NOT NULL, -- Mensaje mostrado al usuario
  context JSONB, -- Contexto relevante (OBVs, tareas, métricas relacionadas)

  -- Prioridad y timing
  priority VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low
  suggested_timing VARCHAR(50) DEFAULT 'now', -- now, later, end_of_meeting

  -- Acciones sugeridas
  suggested_actions JSONB, -- Array de acciones sugeridas

  -- Timing
  shown_at TIMESTAMP DEFAULT NOW(),
  shown_at_transcript_position INT,

  -- Respuesta del usuario
  user_action VARCHAR(50), -- accepted, ignored, postponed, dismissed
  user_action_at TIMESTAMP,
  user_action_by UUID REFERENCES members(id),
  user_notes TEXT, -- Notas del usuario sobre por qué aceptó/rechazó

  -- Metadata IA
  ai_confidence DECIMAL(3,2), -- Confianza de la IA (0-1)
  ai_reasoning TEXT, -- Por qué la IA hizo esta recomendación

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT recommendations_priority_check CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  CONSTRAINT recommendations_action_check CHECK (user_action IN ('accepted', 'ignored', 'postponed', 'dismissed'))
);

-- Índices para meeting_ai_recommendations
CREATE INDEX idx_ai_recommendations_meeting_id ON meeting_ai_recommendations(meeting_id);
CREATE INDEX idx_ai_recommendations_type ON meeting_ai_recommendations(recommendation_type);
CREATE INDEX idx_ai_recommendations_priority ON meeting_ai_recommendations(priority);
CREATE INDEX idx_ai_recommendations_user_action ON meeting_ai_recommendations(user_action);

-- ============================================================================
-- 5. TABLA: meeting_insights
-- Insights extraídos por la IA (denormalizado para queries rápidos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS meeting_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

  -- Tipo de insight
  insight_type VARCHAR(50) NOT NULL,
  -- task, obv_update, lead, lead_update, decision, risk, metric, blocker

  -- Contenido del insight (estructura varía según tipo)
  content JSONB NOT NULL,

  -- Ejemplo para tipo 'task':
  -- {
  --   "title": "Implementar webhook Stripe",
  --   "description": "...",
  --   "assigned_to_name": "María García",
  --   "assigned_to_id": "uuid",
  --   "priority": "high",
  --   "deadline": "2024-02-23",
  --   "project_area": "Backend",
  --   "linked_obvs": ["obv-uuid-1"],
  --   "mentioned_by": "Juan Pérez",
  --   "context": "Bloqueando el lanzamiento de beta"
  -- }

  -- Metadata de la IA
  ai_confidence DECIMAL(3,2), -- Confianza (0-1)
  ai_reasoning TEXT, -- Por qué la IA extrajo esto
  extracted_from_transcript TEXT, -- Fragmento relevante de la transcripción

  -- Estado de revisión
  review_status VARCHAR(50) DEFAULT 'pending_review',
  -- pending_review, approved, edited, rejected, applied

  reviewed_by UUID REFERENCES members(id),
  reviewed_at TIMESTAMP,

  -- Si el usuario editó el insight
  was_edited BOOLEAN DEFAULT false,
  original_content JSONB, -- Contenido original antes de editar
  edit_notes TEXT, -- Notas sobre qué se editó

  -- Si se aplicó al sistema
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP,
  applied_by UUID REFERENCES members(id),

  -- ID de la entidad creada al aplicar (task_id, obv_id, lead_id, etc.)
  applied_entity_type VARCHAR(50), -- task, obv, lead, decision, metric
  applied_entity_id UUID,

  -- Notificaciones enviadas
  notifications_sent BOOLEAN DEFAULT false,
  notifications_sent_at TIMESTAMP,
  notification_recipients UUID[], -- Array de member_ids notificados

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT insights_type_check CHECK (insight_type IN (
    'task', 'obv_update', 'lead', 'lead_update', 'decision', 'risk', 'metric', 'blocker'
  )),
  CONSTRAINT insights_review_status_check CHECK (review_status IN (
    'pending_review', 'approved', 'edited', 'rejected', 'applied'
  ))
);

-- Índices para meeting_insights
CREATE INDEX idx_insights_meeting_id ON meeting_insights(meeting_id);
CREATE INDEX idx_insights_type ON meeting_insights(insight_type);
CREATE INDEX idx_insights_review_status ON meeting_insights(review_status);
CREATE INDEX idx_insights_applied ON meeting_insights(applied);
CREATE INDEX idx_insights_applied_entity ON meeting_insights(applied_entity_type, applied_entity_id);

-- Índice GIN para búsqueda en contenido JSONB
CREATE INDEX idx_insights_content_search ON meeting_insights USING gin(content);

-- ============================================================================
-- 6. TABLA: meeting_decisions
-- Decisiones clave documentadas en reuniones
-- ============================================================================
CREATE TABLE IF NOT EXISTS meeting_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- La decisión
  decision TEXT NOT NULL,
  context TEXT, -- Contexto de por qué se tomó
  rationale TEXT, -- Razonamiento detrás de la decisión

  -- Responsabilidad
  decided_by UUID REFERENCES members(id), -- Quién tomó la decisión
  owner_id UUID REFERENCES members(id), -- Quién ejecutará

  -- Implementación
  deadline DATE,
  implementation_date DATE, -- Cuándo se implementará

  -- Categorización
  area VARCHAR(100), -- pricing, product, marketing, tech, operations, etc.
  impact_level VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low

  -- Estado
  status VARCHAR(50) DEFAULT 'active',
  -- active, completed, cancelled, deferred, reversed

  completed_at TIMESTAMP,
  completed_by UUID REFERENCES members(id),

  -- Vinculaciones
  linked_obvs UUID[], -- OBVs relacionados
  linked_tasks UUID[], -- Tareas creadas para implementar
  linked_metrics UUID[], -- Métricas que mide

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT decisions_status_check CHECK (status IN (
    'active', 'completed', 'cancelled', 'deferred', 'reversed'
  )),
  CONSTRAINT decisions_impact_check CHECK (impact_level IN ('critical', 'high', 'medium', 'low'))
);

-- Índices para meeting_decisions
CREATE INDEX idx_decisions_meeting_id ON meeting_decisions(meeting_id);
CREATE INDEX idx_decisions_project_id ON meeting_decisions(project_id);
CREATE INDEX idx_decisions_status ON meeting_decisions(status);
CREATE INDEX idx_decisions_decided_by ON meeting_decisions(decided_by);
CREATE INDEX idx_decisions_deadline ON meeting_decisions(deadline);
CREATE INDEX idx_decisions_area ON meeting_decisions(area);

-- Índice para búsqueda full-text en decisiones
CREATE INDEX idx_decisions_search ON meeting_decisions USING gin(
  to_tsvector('spanish', decision || ' ' || COALESCE(context, '') || ' ' || COALESCE(rationale, ''))
);

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON meeting_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON meeting_decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCIONES DE UTILIDAD
-- ============================================================================

-- Función para obtener insights pendientes de revisión de una reunión
CREATE OR REPLACE FUNCTION get_pending_insights(p_meeting_id UUID)
RETURNS TABLE (
  insight_id UUID,
  insight_type VARCHAR,
  content JSONB,
  ai_confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    meeting_insights.insight_type,
    meeting_insights.content,
    ai_confidence
  FROM meeting_insights
  WHERE meeting_id = p_meeting_id
    AND review_status = 'pending_review'
  ORDER BY
    CASE insight_type
      WHEN 'task' THEN 1
      WHEN 'obv_update' THEN 2
      WHEN 'lead' THEN 3
      WHEN 'decision' THEN 4
      WHEN 'risk' THEN 5
      ELSE 6
    END,
    ai_confidence DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar reunión como completada
CREATE OR REPLACE FUNCTION complete_meeting(p_meeting_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE meetings
  SET
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_meeting_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de una reunión
CREATE OR REPLACE FUNCTION get_meeting_stats(p_meeting_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_insights', COUNT(*),
    'insights_by_type', jsonb_object_agg(
      insight_type,
      type_count
    ),
    'applied_count', SUM(CASE WHEN applied THEN 1 ELSE 0 END),
    'pending_count', SUM(CASE WHEN review_status = 'pending_review' THEN 1 ELSE 0 END),
    'avg_confidence', ROUND(AVG(ai_confidence)::numeric, 2)
  ) INTO stats
  FROM (
    SELECT
      insight_type,
      COUNT(*) as type_count,
      applied,
      review_status,
      ai_confidence
    FROM meeting_insights
    WHERE meeting_id = p_meeting_id
    GROUP BY insight_type, applied, review_status, ai_confidence
  ) subquery;

  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_ai_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_decisions ENABLE ROW LEVEL SECURITY;

-- Políticas para meetings (acceso basado en miembro del proyecto)
CREATE POLICY "Users can view meetings from their projects"
  ON meetings FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE member_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert meetings in their projects"
  ON meetings FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE member_id = auth.uid()
    )
  );

CREATE POLICY "Users can update meetings from their projects"
  ON meetings FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE member_id = auth.uid()
    )
  );

-- Políticas para meeting_participants
CREATE POLICY "Users can view participants from meetings they can access"
  ON meeting_participants FOR SELECT
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      INNER JOIN project_members pm ON m.project_id = pm.project_id
      WHERE pm.member_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage participants in their meetings"
  ON meeting_participants FOR ALL
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      INNER JOIN project_members pm ON m.project_id = pm.project_id
      WHERE pm.member_id = auth.uid()
    )
  );

-- Políticas similares para otras tablas (todas basadas en acceso al proyecto)
CREATE POLICY "Users can view AI questions from accessible meetings"
  ON meeting_ai_questions FOR SELECT
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      INNER JOIN project_members pm ON m.project_id = pm.project_id
      WHERE pm.member_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage AI questions in their meetings"
  ON meeting_ai_questions FOR ALL
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      INNER JOIN project_members pm ON m.project_id = pm.project_id
      WHERE pm.member_id = auth.uid()
    )
  );

CREATE POLICY "Users can view AI recommendations from accessible meetings"
  ON meeting_ai_recommendations FOR SELECT
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      INNER JOIN project_members pm ON m.project_id = pm.project_id
      WHERE pm.member_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recommendations in their meetings"
  ON meeting_ai_recommendations FOR ALL
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      INNER JOIN project_members pm ON m.project_id = pm.project_id
      WHERE pm.member_id = auth.uid()
    )
  );

CREATE POLICY "Users can view insights from accessible meetings"
  ON meeting_insights FOR SELECT
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      INNER JOIN project_members pm ON m.project_id = pm.project_id
      WHERE pm.member_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage insights in their meetings"
  ON meeting_insights FOR ALL
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      INNER JOIN project_members pm ON m.project_id = pm.project_id
      WHERE pm.member_id = auth.uid()
    )
  );

CREATE POLICY "Users can view decisions from their projects"
  ON meeting_decisions FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE member_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage decisions in their projects"
  ON meeting_decisions FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE member_id = auth.uid()
    )
  );

-- ============================================================================
-- COMENTARIOS EN TABLAS
-- ============================================================================

COMMENT ON TABLE meetings IS 'Reuniones del sistema Meeting Intelligence con transcripciones e insights';
COMMENT ON TABLE meeting_participants IS 'Participantes de reuniones (internos y externos)';
COMMENT ON TABLE meeting_ai_questions IS 'Preguntas que la IA hace durante reuniones para clarificación';
COMMENT ON TABLE meeting_ai_recommendations IS 'Recomendaciones proactivas del AI Facilitator';
COMMENT ON TABLE meeting_insights IS 'Insights extraídos por IA (tareas, decisiones, leads, etc)';
COMMENT ON TABLE meeting_decisions IS 'Decisiones clave documentadas en reuniones';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- Verificar que todo se creó correctamente
DO $$
BEGIN
  RAISE NOTICE 'Meeting Intelligence schema created successfully!';
  RAISE NOTICE 'Tables created: meetings, meeting_participants, meeting_ai_questions, meeting_ai_recommendations, meeting_insights, meeting_decisions';
  RAISE NOTICE 'Next step: Run this migration in Supabase SQL Editor';
END $$;
