-- Ver políticas actuales en members
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'members';

-- Ver permisos de tabla
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'members' AND table_schema = 'public';

-- Ver estado RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'members';
