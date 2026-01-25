-- =====================================================================
-- RLS Policy Tests
-- =====================================================================
-- Comprehensive tests for Row Level Security policies
-- Run these in Supabase SQL Editor to verify all RLS policies work correctly
--
-- Test Coverage:
-- - Email privacy (profiles/members_public)
-- - Project-based isolation (leads, obvs, tasks)
-- - Financial data protection (obvs.facturacion, obvs.margen)
-- - User-only access (notifications, activity_log)
-- =====================================================================

BEGIN;

-- =====================================================================
-- TEST SETUP: Create Test Data
-- =====================================================================

-- Create test users
DO $$
DECLARE
  user1_auth_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_auth_id UUID := '22222222-2222-2222-2222-222222222222';
  user1_id UUID;
  user2_id UUID;
  project1_id UUID;
  project2_id UUID;
BEGIN
  -- Clean up any existing test data
  DELETE FROM profiles WHERE email LIKE 'test%@test.com';
  DELETE FROM projects WHERE nombre LIKE 'Test Project%';

  -- Insert test profiles
  INSERT INTO profiles (auth_id, email, nombre, color)
  VALUES
    (user1_auth_id, 'test1@test.com', 'Test User 1', '#FF0000'),
    (user2_auth_id, 'test2@test.com', 'Test User 2', '#00FF00')
  RETURNING id INTO user1_id;

  SELECT id INTO user2_id FROM profiles WHERE email = 'test2@test.com';

  -- Create test projects
  INSERT INTO projects (nombre, tipo, fase)
  VALUES
    ('Test Project 1', 'validacion', 'idea'),
    ('Test Project 2', 'operacion', 'crecimiento')
  RETURNING id INTO project1_id;

  SELECT id INTO project2_id FROM projects WHERE nombre = 'Test Project 2';

  -- Add user1 to project1, user2 to project2
  INSERT INTO project_members (project_id, member_id, role, role_accepted)
  VALUES
    (project1_id, user1_id, 'sales', TRUE),
    (project2_id, user2_id, 'finance', TRUE);

  -- Create test leads
  INSERT INTO leads (project_id, empresa, contacto, email, status)
  VALUES
    (project1_id, 'Company A', 'John Doe', 'john@companya.com', 'tibio'),
    (project2_id, 'Company B', 'Jane Smith', 'jane@companyb.com', 'hot');

  -- Create test OBVs with financial data
  INSERT INTO obvs (project_id, titulo, tipo, facturacion, margen, created_by)
  VALUES
    (project1_id, 'OBV Project 1', 'venta', 10000, 5000, user1_id),
    (project2_id, 'OBV Project 2', 'validacion', 20000, 8000, user2_id);

  -- Create test tasks
  INSERT INTO tasks (project_id, title, description, status, assignee_id)
  VALUES
    (project1_id, 'Task Project 1', 'Description 1', 'todo', user1_id),
    (project2_id, 'Task Project 2', 'Description 2', 'doing', user2_id);

  -- Create test notifications
  INSERT INTO notifications (user_id, type, title, message)
  VALUES
    (user1_auth_id, 'info', 'Notification for User 1', 'Message 1'),
    (user2_auth_id, 'info', 'Notification for User 2', 'Message 2');

  RAISE NOTICE 'Test data created successfully';
END $$;


-- =====================================================================
-- TEST 1: Email Privacy (profiles / members_public view)
-- =====================================================================
-- Test that users can only see their own email addresses

DO $$
DECLARE
  user1_auth_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_auth_id UUID := '22222222-2222-2222-2222-222222222222';
  visible_emails_count INT;
BEGIN
  -- Set session as user1
  PERFORM set_config('request.jwt.claim.sub', user1_auth_id::TEXT, TRUE);

  -- User should see their own email
  SELECT COUNT(*) INTO visible_emails_count
  FROM members_public
  WHERE email = 'test1@test.com';

  IF visible_emails_count != 1 THEN
    RAISE EXCEPTION 'TEST FAILED: User should see their own email';
  END IF;

  -- User should NOT see other users'' emails
  SELECT COUNT(*) INTO visible_emails_count
  FROM members_public
  WHERE email = 'test2@test.com';

  IF visible_emails_count != 0 THEN
    RAISE EXCEPTION 'TEST FAILED: User should NOT see other users emails';
  END IF;

  RAISE NOTICE 'TEST PASSED: Email privacy works correctly';
END $$;


-- =====================================================================
-- TEST 2: Project-based Isolation (leads)
-- =====================================================================
-- Test that users can only see leads from their own projects

DO $$
DECLARE
  user1_auth_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_auth_id UUID := '22222222-2222-2222-2222-222222222222';
  visible_leads_count INT;
BEGIN
  -- Set session as user1
  PERFORM set_config('request.jwt.claim.sub', user1_auth_id::TEXT, TRUE);

  -- User1 should see leads from Project 1
  SELECT COUNT(*) INTO visible_leads_count
  FROM leads
  WHERE empresa = 'Company A';

  IF visible_leads_count != 1 THEN
    RAISE EXCEPTION 'TEST FAILED: User should see leads from their project';
  END IF;

  -- User1 should NOT see leads from Project 2
  SELECT COUNT(*) INTO visible_leads_count
  FROM leads
  WHERE empresa = 'Company B';

  IF visible_leads_count != 0 THEN
    RAISE EXCEPTION 'TEST FAILED: User should NOT see leads from other projects';
  END IF;

  RAISE NOTICE 'TEST PASSED: Project-based lead isolation works';
END $$;


-- =====================================================================
-- TEST 3: Financial Data Protection (obvs)
-- =====================================================================
-- Test that users can only see financial data from their own projects

DO $$
DECLARE
  user1_auth_id UUID := '11111111-1111-1111-1111-111111111111';
  visible_obvs_count INT;
  visible_facturacion DECIMAL;
BEGIN
  -- Set session as user1
  PERFORM set_config('request.jwt.claim.sub', user1_auth_id::TEXT, TRUE);

  -- User1 should see OBVs from Project 1
  SELECT COUNT(*), SUM(facturacion) INTO visible_obvs_count, visible_facturacion
  FROM obvs
  WHERE titulo = 'OBV Project 1';

  IF visible_obvs_count != 1 OR visible_facturacion != 10000 THEN
    RAISE EXCEPTION 'TEST FAILED: User should see financial data from their project';
  END IF;

  -- User1 should NOT see OBVs from Project 2
  SELECT COUNT(*) INTO visible_obvs_count
  FROM obvs
  WHERE titulo = 'OBV Project 2';

  IF visible_obvs_count != 0 THEN
    RAISE EXCEPTION 'TEST FAILED: User should NOT see financial data from other projects';
  END IF;

  RAISE NOTICE 'TEST PASSED: Financial data protection works';
END $$;


-- =====================================================================
-- TEST 4: Project-based Isolation (tasks)
-- =====================================================================
-- Test that users can only see tasks from their own projects

DO $$
DECLARE
  user1_auth_id UUID := '11111111-1111-1111-1111-111111111111';
  visible_tasks_count INT;
BEGIN
  -- Set session as user1
  PERFORM set_config('request.jwt.claim.sub', user1_auth_id::TEXT, TRUE);

  -- User1 should see tasks from Project 1
  SELECT COUNT(*) INTO visible_tasks_count
  FROM tasks
  WHERE title = 'Task Project 1';

  IF visible_tasks_count != 1 THEN
    RAISE EXCEPTION 'TEST FAILED: User should see tasks from their project';
  END IF;

  -- User1 should NOT see tasks from Project 2
  SELECT COUNT(*) INTO visible_tasks_count
  FROM tasks
  WHERE title = 'Task Project 2';

  IF visible_tasks_count != 0 THEN
    RAISE EXCEPTION 'TEST FAILED: User should NOT see tasks from other projects';
  END IF;

  RAISE NOTICE 'TEST PASSED: Project-based task isolation works';
END $$;


-- =====================================================================
-- TEST 5: User-only Access (notifications)
-- =====================================================================
-- Test that users can only see their own notifications

DO $$
DECLARE
  user1_auth_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_auth_id UUID := '22222222-2222-2222-2222-222222222222';
  visible_notifications_count INT;
BEGIN
  -- Set session as user1
  PERFORM set_config('request.jwt.claim.sub', user1_auth_id::TEXT, TRUE);

  -- User1 should see their own notifications
  SELECT COUNT(*) INTO visible_notifications_count
  FROM notifications
  WHERE title = 'Notification for User 1';

  IF visible_notifications_count != 1 THEN
    RAISE EXCEPTION 'TEST FAILED: User should see their own notifications';
  END IF;

  -- User1 should NOT see other users'' notifications
  SELECT COUNT(*) INTO visible_notifications_count
  FROM notifications
  WHERE title = 'Notification for User 2';

  IF visible_notifications_count != 0 THEN
    RAISE EXCEPTION 'TEST FAILED: User should NOT see other users notifications';
  END IF;

  RAISE NOTICE 'TEST PASSED: User-only notification access works';
END $$;


-- =====================================================================
-- TEST 6: Project Members Visibility
-- =====================================================================
-- Test that users can see members of projects they belong to

DO $$
DECLARE
  user1_auth_id UUID := '11111111-1111-1111-1111-111111111111';
  user1_id UUID;
  project1_id UUID;
  visible_members_count INT;
BEGIN
  -- Set session as user1
  PERFORM set_config('request.jwt.claim.sub', user1_auth_id::TEXT, TRUE);

  -- Get user1 ID and project1 ID
  SELECT id INTO user1_id FROM profiles WHERE auth_id = user1_auth_id;
  SELECT id INTO project1_id FROM projects WHERE nombre = 'Test Project 1';

  -- User1 should see themselves as project member
  SELECT COUNT(*) INTO visible_members_count
  FROM project_members
  WHERE project_id = project1_id AND member_id = user1_id;

  IF visible_members_count != 1 THEN
    RAISE EXCEPTION 'TEST FAILED: User should see themselves as project member';
  END IF;

  RAISE NOTICE 'TEST PASSED: Project members visibility works';
END $$;


-- =====================================================================
-- TEST CLEANUP: Remove Test Data
-- =====================================================================

DO $$
BEGIN
  DELETE FROM notifications WHERE title LIKE 'Notification for User%';
  DELETE FROM tasks WHERE title LIKE 'Task Project%';
  DELETE FROM obvs WHERE titulo LIKE 'OBV Project%';
  DELETE FROM leads WHERE empresa LIKE 'Company%';
  DELETE FROM project_members WHERE project_id IN (
    SELECT id FROM projects WHERE nombre LIKE 'Test Project%'
  );
  DELETE FROM projects WHERE nombre LIKE 'Test Project%';
  DELETE FROM profiles WHERE email LIKE 'test%@test.com';

  RAISE NOTICE 'Test data cleaned up successfully';
END $$;

COMMIT;

-- =====================================================================
-- Test Summary
-- =====================================================================
-- If all tests pass, you should see:
-- - "Test data created successfully"
-- - "TEST PASSED" messages for each test
-- - "Test data cleaned up successfully"
--
-- If any test fails, you'll see "TEST FAILED" with details
-- =====================================================================
