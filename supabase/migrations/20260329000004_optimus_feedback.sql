-- P8.V2.3 — Optimus feedback events table
-- Thumbs up/down + category on each Optimus response.

CREATE TABLE IF NOT EXISTS optimus_feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  response_id TEXT,
  phase SMALLINT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down')),
  category TEXT CHECK (category IN ('irrelevant', 'wrong', 'bad_timing', 'too_obvious', 'helpful', 'insightful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE optimus_feedback_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can insert feedback" ON optimus_feedback_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = optimus_feedback_events.project_id AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  );

CREATE POLICY "Members can read feedback" ON optimus_feedback_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = optimus_feedback_events.project_id AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  );

CREATE INDEX idx_optimus_feedback_project ON optimus_feedback_events(project_id, created_at DESC);
