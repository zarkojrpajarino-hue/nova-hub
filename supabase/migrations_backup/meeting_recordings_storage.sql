-- ==========================================
-- 🎙️ MEETING RECORDINGS - SUPABASE STORAGE
-- ==========================================
-- Crea el bucket de Supabase Storage para guardar grabaciones de reuniones
-- Incluye políticas de acceso (RLS)

-- 1. Crear bucket para grabaciones de reuniones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-recordings',
  'meeting-recordings',
  true, -- Público para facilitar acceso (URLs públicas)
  104857600, -- 100 MB máximo por archivo
  ARRAY[
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/x-m4a',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Storage (RLS)

-- Permitir a usuarios autenticados SUBIR archivos a sus propios proyectos
CREATE POLICY "Users can upload meeting recordings to their projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meeting-recordings' AND
  -- Validar que el usuario tiene acceso al proyecto
  -- Path format: {project_id}/meetings/{meeting_id}/{timestamp}.{ext}
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);

-- Permitir a usuarios autenticados VER sus propias grabaciones
CREATE POLICY "Users can view their own meeting recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'meeting-recordings' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);

-- Permitir a usuarios autenticados ACTUALIZAR sus propias grabaciones
CREATE POLICY "Users can update their own meeting recordings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meeting-recordings' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);

-- Permitir a usuarios autenticados ELIMINAR sus propias grabaciones
CREATE POLICY "Users can delete their own meeting recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'meeting-recordings' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);

-- ==========================================
-- ✅ LISTO
-- ==========================================
-- El bucket 'meeting-recordings' está creado y configurado
-- Los usuarios solo pueden subir/ver/actualizar/eliminar grabaciones de sus propios proyectos
