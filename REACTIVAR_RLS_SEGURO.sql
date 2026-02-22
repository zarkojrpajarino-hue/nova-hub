-- =====================================================
-- REACTIVAR RLS EN MEMBERS DE FORMA SEGURA Y OPTIMIZADA
-- =====================================================
-- Fecha: 2026-01-29
-- Objetivo: Reactivar Row Level Security sin afectar performance
-- =====================================================

-- PASO 1: Crear índice para optimizar queries por auth_id
-- Este índice es CRÍTICO para que las queries sean rápidas
CREATE INDEX IF NOT EXISTS idx_members_auth_id ON public.members(auth_id);

-- PASO 2: Dar permisos explícitos a los roles
-- Asegurar que anon y authenticated pueden hacer SELECT
GRANT SELECT, INSERT, UPDATE ON public.members TO anon;
GRANT SELECT, INSERT, UPDATE ON public.members TO authenticated;

-- PASO 3: Eliminar políticas antiguas que pueden estar causando problemas
DROP POLICY IF EXISTS members_select_all ON public.members;
DROP POLICY IF EXISTS members_insert_own ON public.members;
DROP POLICY IF EXISTS members_update_own ON public.members;

-- PASO 4: Crear políticas nuevas SIMPLES y EFICIENTES
-- Política para SELECT: Todos los usuarios autenticados pueden ver todos los members
-- (esto es necesario para features como rankings, equipo, etc.)
CREATE POLICY members_select_all
ON public.members
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT: Solo pueden insertar su propio registro
CREATE POLICY members_insert_own
ON public.members
FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- Política para UPDATE: Solo pueden actualizar su propio registro
CREATE POLICY members_update_own
ON public.members
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- PASO 5: Reactivar RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICACIÓN (ejecutar después de los pasos anteriores)
-- =====================================================

-- Ver índices creados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'members' AND schemaname = 'public';

-- Ver políticas activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
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

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- idx_members_auth_id: CREADO
-- Policies: 3 (select_all, insert_own, update_own)
-- Permissions: anon y authenticated tienen SELECT, INSERT, UPDATE
-- RLS: ENABLED (rowsecurity = true)
-- =====================================================
