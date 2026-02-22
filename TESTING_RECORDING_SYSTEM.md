# 🧪 TESTING: Recording System (Task #43)

## ✅ Prerequisitos

Antes de probar:

1. ✅ **Tarea #42 completada** - Modal de configuración funciona
2. ✅ **Storage bucket creado** - Ejecutaste el SQL: `meeting_recordings_storage.sql`
3. ✅ **App corriendo** - `npm run dev`
4. ✅ **Proyecto seleccionado** - Tienes un proyecto activo

---

## 🎯 Qué Estamos Probando

El sistema de grabación de audio/video con dos modos:
- **Grabación en vivo** con MediaRecorder API
- **Upload de archivo** (MP3, WAV, MP4, etc.)

---

## 🚀 Cómo Probar

### Paso 1: Crear una Reunión

1. Ve a: **http://localhost:5173/test-meeting-intelligence**
2. Click en **"Iniciar Nueva Reunión"**
3. Completa el modal de configuración (como en Task #42):
   - Título: `Test Recording System`
   - Tipo: `Sprint Planning`
   - Duración: `30 min`
   - Participantes: Selecciona 2-3
   - Objetivos: `Probar sistema de grabación`
4. Completa los 3 pasos y click en **"Iniciar Reunión"**

### Paso 2: Verás el Recorder

Automáticamente se abrirá la pantalla de grabación con:
- Título de la reunión
- Duración estimada
- Dos botones: **"Grabar en Vivo"** y **"Subir Archivo"**

---

## 🎙️ MODO 1: Grabación en Vivo

### Paso 2.1: Iniciar Grabación

1. El modo **"Grabar en Vivo"** está seleccionado por defecto
2. Click en **"Iniciar Grabación"**
3. Tu navegador pedirá permiso para usar el micrófono
4. **IMPORTANTE**: Click en **"Permitir"**

### Paso 2.2: Durante la Grabación

Verás:
- ✅ **Timer en tiempo real** (00:00, 00:01, 00:02...)
- ✅ **Barra de progreso** vs duración estimada
- ✅ **Indicador rojo "Grabando..."** pulsante
- ✅ **Botones**: "Pausar" y "Finalizar"

Prueba:
- **Pausar**: Click en "Pausar" → El timer se detiene, indicador amarillo "Pausado"
- **Reanudar**: Click en "Reanudar" → El timer continúa, vuelve a "Grabando..."
- **Habla algo** al micrófono (no se mostrará forma de onda aún, eso es Task #47)

### Paso 2.3: Finalizar Grabación

1. Click en **"Finalizar"**
2. Verás:
   - Alert verde: "Grabación finalizada"
   - Mensaje: "Procesando audio..."
   - Barra de progreso de upload (0% → 100%)
3. Cuando llegue a 100%:
   - Toast: "Audio subido correctamente"
   - Volverás a la lista de reuniones

---

## 📁 MODO 2: Upload de Archivo

### Paso 2.1: Preparar Archivo

Necesitas un archivo de audio/video:
- **Formatos válidos**: MP3, WAV, WEBM, OGG, MP4, MOV
- **Tamaño máximo**: 100 MB
- Si no tienes uno, graba un audio rápido en tu teléfono y pásalo a tu PC

### Paso 2.2: Seleccionar Modo Upload

1. Click en el botón **"Subir Archivo"** (en lugar de "Grabar en Vivo")
2. Verás una zona de drop con ícono de upload

### Paso 2.3: Seleccionar Archivo

1. Click en la zona de drop
2. Se abrirá el selector de archivos del sistema
3. Selecciona tu archivo de audio/video
4. Verás un alert azul confirmando:
   - Nombre del archivo
   - Tamaño en MB

### Paso 2.4: Subir Archivo

1. Click en **"Subir y Procesar"**
2. Verás:
   - Botón cambia a "Subiendo..." con spinner
   - Barra de progreso (0% → 100%)
3. Cuando termine:
   - Toast: "Audio subido correctamente"
   - Volverás a la lista de reuniones

---

## ✅ Checklist de Funcionalidades

### Grabación en Vivo
- [ ] Botón "Grabar en Vivo" funciona
- [ ] Click en "Iniciar Grabación" solicita permisos de micrófono
- [ ] Timer inicia y cuenta correctamente (00:00, 00:01, 00:02...)
- [ ] Barra de progreso se actualiza vs duración estimada
- [ ] Indicador rojo "Grabando..." aparece y pulsa
- [ ] Botón "Pausar" funciona
- [ ] Timer se detiene al pausar
- [ ] Indicador amarillo "Pausado" aparece
- [ ] Botón "Reanudar" funciona
- [ ] Timer continúa desde donde se pausó
- [ ] Botón "Finalizar" funciona
- [ ] Alert verde "Grabación finalizada" aparece
- [ ] Barra de upload progresa de 0% a 100%
- [ ] Toast "Audio subido correctamente" aparece
- [ ] Vuelve a la lista de reuniones

### Upload de Archivo
- [ ] Botón "Subir Archivo" funciona
- [ ] Zona de drop aparece con ícono
- [ ] Click abre selector de archivos
- [ ] Archivo seleccionado se muestra en alert azul
- [ ] Nombre y tamaño del archivo correctos
- [ ] Validación de tipo de archivo funciona (rechaza PDFs, etc.)
- [ ] Validación de tamaño funciona (rechaza >100MB)
- [ ] Botón "Subir y Procesar" funciona
- [ ] Botón cambia a "Subiendo..." con spinner
- [ ] Barra de progreso funciona
- [ ] Toast "Audio subido correctamente" aparece
- [ ] Vuelve a la lista de reuniones

### Estados de la Reunión en BD
- [ ] Estado inicial: `configuring`
- [ ] Al iniciar grabación: `recording`
- [ ] Al finalizar: `processing_audio`
- [ ] Al subir audio: `transcribing`
- [ ] Campo `started_at` se guarda
- [ ] Campo `ended_at` se guarda
- [ ] Campo `duration_actual_min` se calcula correctamente
- [ ] Campo `audio_url` se guarda con la URL de Supabase Storage

### Errores y Edge Cases
- [ ] Si deniego permiso de micrófono → toast error claro
- [ ] Si no hay micrófono → toast error claro
- [ ] Si selecciono archivo inválido → toast error
- [ ] Si selecciono archivo muy grande → toast error
- [ ] Si hay error de red → toast error
- [ ] Botón "Cancelar" funciona en cualquier momento
- [ ] Si cancelo, vuelvo a la lista sin crear audio

---

## 🐛 Errores Comunes

### Error: "Permiso de micrófono denegado"
**Solución**:
1. En Chrome: Click en el candado en la barra de direcciones
2. Permisos → Micrófono → Permitir
3. Recarga la página e intenta de nuevo

### Error: "No se encontró ningún micrófono"
**Solución**:
- Conecta un micrófono o auriculares con mic
- Verifica en Configuración del sistema que el mic está habilitado
- Prueba con otro navegador

### Error: "Tipo de archivo no soportado"
**Solución**:
- Solo acepta: MP3, WAV, WEBM, OGG, MP4, MOV
- Convierte tu archivo a uno de estos formatos

### Error: "El archivo es demasiado grande"
**Solución**:
- Máximo 100MB
- Comprime el archivo o usa uno más pequeño

### Error: Upload se queda en 90%
**Solución**:
- Esto es normal, espera 5-10 segundos más
- La barra simula progreso hasta que Supabase confirma

### Error: "Error al subir el audio" en consola
**Solución**:
- Verifica que ejecutaste el SQL: `meeting_recordings_storage.sql`
- Ve a Supabase Dashboard → Storage → Busca bucket "meeting-recordings"
- Si no existe, ejecuta el SQL de nuevo

---

## 📊 Verificar en la Base de Datos

### 1. Ver la Reunión Actualizada

```sql
SELECT
  id,
  title,
  status,
  started_at,
  ended_at,
  duration_actual_min,
  audio_url,
  created_at
FROM meetings
WHERE title = 'Test Recording System'
ORDER BY created_at DESC
LIMIT 1;
```

Deberías ver:
- `status`: `transcribing`
- `started_at`: timestamp de cuando iniciaste
- `ended_at`: timestamp de cuando finalizaste
- `duration_actual_min`: minutos que duró (redondeado)
- `audio_url`: URL pública de Supabase Storage

### 2. Ver el Archivo en Storage

1. Ve a [Supabase Dashboard](https://supabase.com)
2. Storage → meeting-recordings
3. Navega a: `{tu-project-id}/meetings/{meeting-id}/`
4. Verás el archivo: `{timestamp}.webm` o `{timestamp}.mp3`
5. Click en el archivo → "Get URL"
6. Esa URL debe coincidir con `audio_url` en la BD

### 3. Descargar y Reproducir el Audio

```sql
SELECT audio_url FROM meetings WHERE title = 'Test Recording System';
```

Copia la URL y pégala en tu navegador. El audio debería descargarse y poder reproducirse.

---

## 🎯 Resultado Esperado

Si todo funciona:

### Grabación en Vivo
1. ✅ Puedes iniciar grabación con micrófono
2. ✅ Timer funciona correctamente
3. ✅ Puedes pausar y reanudar
4. ✅ Puedes finalizar
5. ✅ Audio se sube a Supabase Storage
6. ✅ Reunión se actualiza con `audio_url` y estado `transcribing`
7. ✅ Vuelves a la lista y ves la reunión con estado actualizado

### Upload de Archivo
1. ✅ Puedes seleccionar archivo
2. ✅ Validaciones funcionan
3. ✅ Archivo se sube correctamente
4. ✅ Reunión se actualiza con `audio_url` y estado `transcribing`
5. ✅ Vuelves a la lista y ves la reunión con estado actualizado

---

## 📸 Screenshots Esperados

### Página de Grabación - En Vivo
```
┌────────────────────────────────────────┐
│  Test Recording System                 │
│  Duración estimada: 30 minutos         │
├────────────────────────────────────────┤
│  [🎙️ Grabar en Vivo] [📁 Subir Archivo]│
├────────────────────────────────────────┤
│  🎙️ Grabación en Vivo                  │
│  ────────────────────────────────────  │
│  🕐 00:42            Estimado: 30:00   │
│  ▓▓▓▓▓░░░░░░░░░░░░░░░░░ 2%            │
│  🔴 Grabando...                        │
│  [⏸ Pausar]  [⏹ Finalizar]            │
└────────────────────────────────────────┘
```

### Página de Upload
```
┌────────────────────────────────────────┐
│  Test Recording System                 │
│  Duración estimada: 30 minutos         │
├────────────────────────────────────────┤
│  [🎙️ Grabar en Vivo] [📁 Subir Archivo]│
├────────────────────────────────────────┤
│  📁 Subir Archivo de Audio/Video       │
│  ────────────────────────────────────  │
│  ┌──────────────────────────────────┐ │
│  │      📤                           │ │
│  │  Click para seleccionar archivo  │ │
│  │  MP3, WAV, WEBM (máx. 100MB)     │ │
│  └──────────────────────────────────┘ │
│  ℹ️ Archivo seleccionado:              │
│     meeting-audio.mp3                 │
│     Tamaño: 5.23 MB                   │
│  [📤 Subir y Procesar]                │
└────────────────────────────────────────┘
```

---

## 🎯 Siguiente Paso

Una vez verificado que todo funciona:

**Tarea #44**: Integrar Whisper API para transcripción
- Crear Supabase Edge Function
- Llamar a OpenAI Whisper con `audio_url`
- Guardar transcript en campo `transcript`
- Actualizar estado a `analyzing`

---

**¿Todo funcionó? ¡Avísame para continuar con Task #44! 🚀**
