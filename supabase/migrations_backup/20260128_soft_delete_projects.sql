-- ============================================
-- SOFT DELETE PARA PROYECTOS
-- Permite eliminar proyectos sin borrar datos
-- y restaurarlos posteriormente
-- ============================================

-- 1. Añadir campos de soft delete a projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL;

-- 2. Crear índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(deleted_at) WHERE deleted_at IS NULL;

-- 3. Crear vista para proyectos activos (no eliminados)
CREATE OR REPLACE VIEW public.active_projects AS
SELECT *
FROM public.projects
WHERE deleted_at IS NULL;

-- 4. Crear vista para proyectos eliminados
CREATE OR REPLACE VIEW public.deleted_projects AS
SELECT
  p.*,
  deleter.nombre as deleted_by_name,
  deleter.email as deleted_by_email
FROM public.projects p
LEFT JOIN public.profiles deleter ON p.deleted_by = deleter.id
WHERE p.deleted_at IS NOT NULL
ORDER BY p.deleted_at DESC;

-- 5. Función para soft delete de proyecto
CREATE OR REPLACE FUNCTION public.soft_delete_project(
  p_project_id UUID,
  p_deleted_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario es miembro del proyecto
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
    AND member_id = p_deleted_by
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para eliminar este proyecto';
  END IF;

  -- Marcar proyecto como eliminado
  UPDATE public.projects
  SET
    deleted_at = NOW(),
    deleted_by = p_deleted_by,
    deletion_reason = p_reason
  WHERE id = p_project_id
  AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado o ya eliminado';
  END IF;
END;
$$;

-- 6. Función para restaurar proyecto
CREATE OR REPLACE FUNCTION public.restore_project(
  p_project_id UUID,
  p_restored_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario era miembro del proyecto
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
    AND member_id = p_restored_by
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para restaurar este proyecto';
  END IF;

  -- Restaurar proyecto
  UPDATE public.projects
  SET
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL
  WHERE id = p_project_id
  AND deleted_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado o no está eliminado';
  END IF;
END;
$$;

-- 7. RLS policies para vistas
ALTER VIEW public.active_projects SET (security_invoker = true);
ALTER VIEW public.deleted_projects SET (security_invoker = true);

-- 8. Comentarios
COMMENT ON COLUMN public.projects.deleted_at IS 'Timestamp de cuando se eliminó el proyecto (soft delete)';
COMMENT ON COLUMN public.projects.deleted_by IS 'Usuario que eliminó el proyecto';
COMMENT ON COLUMN public.projects.deletion_reason IS 'Razón opcional de la eliminación';
COMMENT ON FUNCTION public.soft_delete_project IS 'Elimina un proyecto de forma suave (soft delete)';
COMMENT ON FUNCTION public.restore_project IS 'Restaura un proyecto eliminado';
