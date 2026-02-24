-- Permitir que role sea NULL (sin rol asignado hasta que la IA lo asigne tras onboarding)
ALTER TABLE public.project_members 
ALTER COLUMN role DROP NOT NULL;

-- Añadir comentario explicativo
COMMENT ON COLUMN public.project_members.role IS 'Rol asignado por IA tras completar onboarding. NULL = pendiente de asignación';