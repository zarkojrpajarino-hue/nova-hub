-- Añadir columnas playbook y metadata a tasks para almacenar los playbooks generados por IA
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS playbook jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tiempo_estimado_horas numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tipo_tarea text DEFAULT NULL;

-- Añadir columna para relacionar con leads
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS relacionada_con_leads uuid[] DEFAULT '{}';

-- Comentarios para documentar
COMMENT ON COLUMN public.tasks.playbook IS 'Playbook profesional generado por IA con pasos, herramientas, recursos y checklist';
COMMENT ON COLUMN public.tasks.metadata IS 'Metadatos adicionales: por_que_esta_tarea, resultado_esperado, como_medir_exito';
COMMENT ON COLUMN public.tasks.tipo_tarea IS 'Tipo: exploracion, validacion, ejecucion, analisis, comunicacion';
COMMENT ON COLUMN public.tasks.tiempo_estimado_horas IS 'Tiempo estimado en horas para completar la tarea';