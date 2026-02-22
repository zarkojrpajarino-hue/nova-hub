-- =====================================================
-- 2️⃣  NOVA HUB - RLS POLICIES
-- =====================================================
-- Multi-tenant security by project
-- Generated: 2026-02-21
-- =====================================================

-- =============================================
-- Enable RLS on all tables
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_kpi_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE obvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_pipeline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros_parciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE validator_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_mentoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_rotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofounder_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_business_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_onboarding_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_source_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_webhooks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES
-- =============================================
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = auth_id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_id);

-- =============================================
-- USER ROLES
-- =============================================
CREATE POLICY "Roles viewable by authenticated" ON user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can insert roles" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(public.get_profile_id(auth.uid()), 'admin'));
CREATE POLICY "Only admins can update roles" ON user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(public.get_profile_id(auth.uid()), 'admin'));
CREATE POLICY "Only admins can delete roles" ON user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(public.get_profile_id(auth.uid()), 'admin'));

-- =============================================
-- USER SETTINGS
-- =============================================
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (user_id = get_profile_id(auth.uid()));

-- =============================================
-- MEMBER KPI BASE
-- =============================================
CREATE POLICY "Members can view all KPI base" ON member_kpi_base
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can insert own KPI base" ON member_kpi_base
  FOR INSERT TO authenticated WITH CHECK (member_id = get_profile_id(auth.uid()));
CREATE POLICY "Members can update own KPI base" ON member_kpi_base
  FOR UPDATE TO authenticated USING (member_id = get_profile_id(auth.uid()));
CREATE POLICY "Admins can manage all KPI base" ON member_kpi_base
  FOR ALL TO authenticated USING (has_role(get_profile_id(auth.uid()), 'admin'));

-- =============================================
-- OBJECTIVES
-- =============================================
CREATE POLICY "Objectives viewable" ON objectives
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify objectives" ON objectives
  FOR ALL TO authenticated
  USING (public.has_role(public.get_profile_id(auth.uid()), 'admin'));

-- =============================================
-- PROJECTS
-- =============================================
CREATE POLICY "Projects viewable by authenticated" ON projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create projects" ON projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Project members can update" ON projects
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = id
      AND pm.member_id = public.get_profile_id(auth.uid())
    )
  );

-- =============================================
-- PROJECT MEMBERS
-- =============================================
CREATE POLICY "Project members viewable" ON project_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can join projects" ON project_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Members can leave" ON project_members
  FOR DELETE TO authenticated
  USING (member_id = public.get_profile_id(auth.uid()));

-- =============================================
-- OBVs
-- =============================================
CREATE POLICY "OBVs viewable by authenticated" ON obvs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create OBVs" ON obvs
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owner can update OBV" ON obvs
  FOR UPDATE TO authenticated
  USING (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owner can delete OBV" ON obvs
  FOR DELETE TO authenticated
  USING (owner_id = public.get_profile_id(auth.uid()) AND status = 'pending');

-- =============================================
-- OBV VALIDACIONES
-- =============================================
CREATE POLICY "Validaciones viewable" ON obv_validaciones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can validate" ON obv_validaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    validator_id = public.get_profile_id(auth.uid()) AND
    validator_id != (SELECT owner_id FROM obvs WHERE id = obv_id)
  );

-- =============================================
-- OBV PARTICIPANTES
-- =============================================
CREATE POLICY "Participantes viewable" ON obv_participantes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "OBV owner can add participants" ON obv_participantes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM obvs WHERE id = obv_id AND owner_id = public.get_profile_id(auth.uid()))
  );

-- =============================================
-- OBV PIPELINE HISTORY
-- =============================================
CREATE POLICY "Pipeline history viewable" ON obv_pipeline_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert history" ON obv_pipeline_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- COBROS PARCIALES
-- =============================================
CREATE POLICY "All authenticated can view cobros parciales" ON cobros_parciales
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated can create cobros parciales" ON cobros_parciales
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creator can update cobro parcial" ON cobros_parciales
  FOR UPDATE TO authenticated USING (created_by = get_profile_id(auth.uid()));
CREATE POLICY "Creator can delete cobro parcial" ON cobros_parciales
  FOR DELETE TO authenticated USING (created_by = get_profile_id(auth.uid()));

-- =============================================
-- KPIs
-- =============================================
CREATE POLICY "KPIs viewable" ON kpis
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create KPIs" ON kpis
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owner can update KPI" ON kpis
  FOR UPDATE TO authenticated
  USING (owner_id = public.get_profile_id(auth.uid()));

-- =============================================
-- KPI VALIDACIONES
-- =============================================
CREATE POLICY "KPI validaciones viewable" ON kpi_validaciones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can validate KPIs" ON kpi_validaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    validator_id = public.get_profile_id(auth.uid()) AND
    validator_id != (SELECT owner_id FROM kpis WHERE id = kpi_id)
  );

-- =============================================
-- TASKS
-- =============================================
CREATE POLICY "Tasks viewable" ON tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Assignee can update tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (assignee_id = public.get_profile_id(auth.uid()) OR assignee_id IS NULL);
CREATE POLICY "Assignee can delete tasks" ON tasks
  FOR DELETE TO authenticated
  USING (assignee_id = public.get_profile_id(auth.uid()));

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE POLICY "Own notifications viewable" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));

-- =============================================
-- ACTIVITY LOG
-- =============================================
CREATE POLICY "Activity viewable by authenticated" ON activity_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can log activity" ON activity_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- VALIDATION SYSTEM
-- =============================================
CREATE POLICY "Validation order viewable by authenticated" ON validation_order
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Only admins can modify validation order" ON validation_order
  FOR ALL USING (has_role(get_profile_id(auth.uid()), 'admin'::app_role));

CREATE POLICY "Pending validations viewable by authenticated" ON pending_validations
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can manage pending validations" ON pending_validations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Validator stats viewable by authenticated" ON validator_stats
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can manage validator stats" ON validator_stats
  FOR ALL USING (auth.uid() IS NOT NULL);

-- =============================================
-- USER INSIGHTS
-- =============================================
CREATE POLICY "Users can view own insights" ON user_insights
  FOR SELECT USING (user_id = get_profile_id(auth.uid()) OR is_private = false);
CREATE POLICY "Users can create own insights" ON user_insights
  FOR INSERT WITH CHECK (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can update own insights" ON user_insights
  FOR UPDATE USING (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can delete own insights" ON user_insights
  FOR DELETE USING (user_id = get_profile_id(auth.uid()));

-- =============================================
-- USER PLAYBOOKS
-- =============================================
CREATE POLICY "Users can view own playbooks" ON user_playbooks
  FOR SELECT USING (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can create own playbooks" ON user_playbooks
  FOR INSERT WITH CHECK (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can update own playbooks" ON user_playbooks
  FOR UPDATE USING (user_id = get_profile_id(auth.uid()));

-- =============================================
-- ROLE RANKINGS
-- =============================================
CREATE POLICY "Rankings viewable by authenticated" ON role_rankings
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can update rankings" ON role_rankings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "System can modify rankings" ON role_rankings
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =============================================
-- MASTER SYSTEM
-- =============================================
CREATE POLICY "Applications viewable by authenticated" ON master_applications
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create own applications" ON master_applications
  FOR INSERT WITH CHECK (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can update own pending applications" ON master_applications
  FOR UPDATE USING (user_id = get_profile_id(auth.uid()) AND status = 'pending');

CREATE POLICY "Votes viewable by authenticated" ON master_votes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can vote" ON master_votes
  FOR INSERT WITH CHECK (
    voter_id = get_profile_id(auth.uid()) AND
    voter_id != (SELECT user_id FROM master_applications WHERE id = application_id)
  );

CREATE POLICY "Masters viewable by all authenticated" ON team_masters
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can manage masters" ON team_masters
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Challenges viewable by authenticated" ON master_challenges
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create challenges" ON master_challenges
  FOR INSERT WITH CHECK (challenger_id = get_profile_id(auth.uid()));
CREATE POLICY "Participants can update challenges" ON master_challenges
  FOR UPDATE USING (
    challenger_id = get_profile_id(auth.uid()) OR
    EXISTS (SELECT 1 FROM team_masters tm WHERE tm.id = master_id AND tm.user_id = get_profile_id(auth.uid()))
  );

CREATE POLICY "Mentoring viewable by participants" ON master_mentoring
  FOR SELECT USING (
    mentee_id = get_profile_id(auth.uid()) OR
    EXISTS (SELECT 1 FROM team_masters tm WHERE tm.id = master_id AND tm.user_id = get_profile_id(auth.uid()))
  );
CREATE POLICY "Masters can create mentoring" ON master_mentoring
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_masters tm WHERE tm.id = master_id AND tm.user_id = get_profile_id(auth.uid()))
  );

-- =============================================
-- ROLE ROTATION
-- =============================================
CREATE POLICY "Rotation requests viewable by authenticated" ON role_rotation_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create rotation requests" ON role_rotation_requests
  FOR INSERT WITH CHECK (requester_id = get_profile_id(auth.uid()));
CREATE POLICY "Participants can update rotation requests" ON role_rotation_requests
  FOR UPDATE USING (
    requester_id = get_profile_id(auth.uid()) OR
    target_user_id = get_profile_id(auth.uid()) OR
    has_role(get_profile_id(auth.uid()), 'admin')
  );

CREATE POLICY "Role history viewable by authenticated" ON role_history
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert role history" ON role_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- STARTUP OS (Project-based access)
-- =============================================
CREATE POLICY "Users can view their project OKRs" ON okrs
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their project OKRs" ON okrs
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their competitor snapshots" ON competitor_snapshots
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can manage snapshots" ON competitor_snapshots
  FOR ALL USING (true);

CREATE POLICY "Users can view their market intelligence" ON market_intelligence
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can manage market intelligence" ON market_intelligence
  FOR ALL USING (true);

CREATE POLICY "Users can manage their content calendar" ON content_calendars
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their content pieces" ON content_pieces
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their launch checklist" ON launch_checklists
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their beta testers" ON beta_testers
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their financial projections" ON financial_projections
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their key metrics" ON key_metrics
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their metric alerts" ON metric_alerts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can create alerts" ON metric_alerts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can acknowledge alerts" ON metric_alerts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their recommendations" ON ai_recommendations
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can create recommendations" ON ai_recommendations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can dismiss/implement recommendations" ON ai_recommendations
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their weekly insights" ON weekly_insights
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can create insights" ON weekly_insights
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their advisor chats" ON advisor_chats
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- =============================================
-- ONBOARDING
-- =============================================
CREATE POLICY "Users can view their own onboarding sessions" ON onboarding_sessions
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = onboarding_sessions.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can create onboarding sessions" ON onboarding_sessions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = onboarding_sessions.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can update their own onboarding sessions" ON onboarding_sessions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = onboarding_sessions.project_id AND projects.created_by = auth.uid()));

CREATE POLICY "Everyone can read geo cache" ON geo_intelligence_cache
  FOR SELECT USING (true);

CREATE POLICY "Users can view their competitive analysis" ON competitive_analysis
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = competitive_analysis.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can create competitive analysis" ON competitive_analysis
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = competitive_analysis.project_id AND projects.created_by = auth.uid()));

CREATE POLICY "Users can view their learning paths" ON learning_paths
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = learning_paths.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can update their learning paths" ON learning_paths
  FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = learning_paths.project_id AND projects.created_by = auth.uid()));

CREATE POLICY "Users can view their cofounder alignment" ON cofounder_alignment
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = cofounder_alignment.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can view their generated business options" ON generated_business_options
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_business_options.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can view their validation roadmaps" ON validation_roadmaps
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = validation_roadmaps.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can view their growth playbooks" ON growth_playbooks
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = growth_playbooks.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can view their voice transcripts" ON voice_onboarding_transcripts
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = voice_onboarding_transcripts.project_id AND projects.created_by = auth.uid()));

-- =============================================
-- AI EVIDENCE SYSTEM
-- =============================================
CREATE POLICY "Users can view their project documents" ON project_documents
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_documents.project_id AND p.created_by = auth.uid()));
CREATE POLICY "Users can insert their project documents" ON project_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their project documents" ON project_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their project documents" ON project_documents
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their source policies" ON user_source_policies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their source policies" ON user_source_policies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their generation logs" ON ai_generation_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert generation logs" ON ai_generation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- INTEGRATIONS
-- =============================================
CREATE POLICY "Slack webhooks viewable by authenticated" ON slack_webhooks
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Slack webhooks manageable by authenticated" ON slack_webhooks
  FOR ALL USING (auth.uid() IS NOT NULL);

-- =============================================
-- STORAGE BUCKETS POLICIES
-- =============================================

-- Avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Meeting recordings bucket
CREATE POLICY "Users can upload meeting recordings to their projects" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'meeting-recordings' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE created_by = auth.uid())
  );
CREATE POLICY "Users can view their own meeting recordings" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'meeting-recordings' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE created_by = auth.uid())
  );
CREATE POLICY "Users can update their own meeting recordings" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'meeting-recordings' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE created_by = auth.uid())
  );
CREATE POLICY "Users can delete their own meeting recordings" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'meeting-recordings' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE created_by = auth.uid())
  );

-- =============================================
-- END OF RLS POLICIES
-- =============================================
