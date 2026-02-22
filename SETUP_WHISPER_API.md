# 🎙️ SETUP: Whisper API Integration

## 📋 Prerequisitos

Antes de configurar:

1. ✅ **Task #43 completada** - Sistema de grabación funciona
2. ✅ **Cuenta de OpenAI** - Necesitas una API key
3. ✅ **Supabase CLI instalado** - Para deployar Edge Functions
4. ✅ **Créditos en OpenAI** - Whisper cuesta $0.006 por minuto de audio

---

## 🔑 Paso 1: Obtener OpenAI API Key

### 1.1. Crear Cuenta en OpenAI (si no tienes)

1. Ve a: https://platform.openai.com/signup
2. Crea tu cuenta con email o Google
3. Verifica tu email

### 1.2. Obtener API Key

1. Ve a: https://platform.openai.com/api-keys
2. Click en **"Create new secret key"**
3. Dale un nombre: `Nova Hub - Whisper API`
4. **IMPORTANTE**: Copia la key inmediatamente (solo se muestra una vez)
5. Guárdala en un lugar seguro (ej: gestor de contraseñas)

Formato de la key: `sk-proj-...` (empieza con `sk-`)

### 1.3. Añadir Créditos (si es necesario)

1. Ve a: https://platform.openai.com/settings/organization/billing
2. Add payment method
3. Añade al menos $5 para empezar

**Costos de Whisper**:
- $0.006 por minuto de audio
- Reunión de 30 min = $0.18
- Reunión de 60 min = $0.36
- $5 = ~833 minutos (~13 horas de reuniones)

---

## 🚀 Paso 2: Configurar Supabase Edge Function

### 2.1. Instalar Supabase CLI (si no lo tienes)

```bash
# Windows (PowerShell)
scoop install supabase

# O con NPM (multiplataforma)
npm install -g supabase
```

### 2.2. Login en Supabase CLI

```bash
supabase login
```

Esto abrirá tu navegador para autenticar.

### 2.3. Link al Proyecto de Supabase

```bash
cd C:\Users\Zarko\nova-hub
supabase link --project-ref TU_PROJECT_ID
```

Para obtener tu `PROJECT_ID`:
1. Ve a: https://supabase.com/dashboard/project/_/settings/general
2. Copia el "Reference ID"

### 2.4. Configurar OpenAI API Key como Secret

```bash
# Configura la API key como variable de entorno en Supabase
supabase secrets set OPENAI_API_KEY=sk-proj-TU_KEY_AQUI
```

**IMPORTANTE**: Reemplaza `sk-proj-TU_KEY_AQUI` con tu API key real.

### 2.5. Deploy de la Edge Function

```bash
# Deploy de la función transcribe-meeting
supabase functions deploy transcribe-meeting
```

Verás output como:
```
Deploying function transcribe-meeting...
Function deployed: https://TU_PROJECT.supabase.co/functions/v1/transcribe-meeting
```

### 2.6. Verificar que la Función Está Deployed

```bash
supabase functions list
```

Deberías ver:
```
transcribe-meeting  deployed  2024-xx-xx
```

---

## ✅ Paso 3: Verificar Configuración

### 3.1. Test Manual con cURL (Opcional)

```bash
curl -X POST 'https://TU_PROJECT.supabase.co/functions/v1/transcribe-meeting' \
  -H 'Authorization: Bearer TU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"meetingId": "un-meeting-id-valido"}'
```

Si funciona, verás:
```json
{
  "success": true,
  "meetingId": "...",
  "transcriptLength": 1234,
  "status": "analyzing"
}
```

---

## 🧪 Paso 4: Probar en la App

### 4.1. Iniciar App

```bash
npm run dev
```

### 4.2. Crear y Grabar Reunión

1. Ve a: http://localhost:5173/test-meeting-intelligence
2. Click en **"Iniciar Nueva Reunión"**
3. Completa la configuración
4. **GRABAR** o **SUBIR** un audio

### 4.3. Observar el Proceso

1. Verás: "Subiendo audio..." (0% → 100%)
2. Luego: "Transcribiendo con Whisper AI..."
3. Después de 30-90 segundos: Toast "Transcripción completada correctamente"

### 4.4. Verificar en la Base de Datos

```sql
SELECT
  id,
  title,
  status,
  audio_url,
  LENGTH(transcript) as transcript_length,
  created_at
FROM meetings
ORDER BY created_at DESC
LIMIT 1;
```

Deberías ver:
- `status`: `analyzing` (cambió de `transcribing`)
- `transcript`: Texto largo con la transcripción
- `transcript_length`: Número de caracteres (ej: 5000+)

### 4.5. Ver la Transcripción Completa

```sql
SELECT
  title,
  transcript
FROM meetings
WHERE id = 'TU_MEETING_ID';
```

Deberías ver el texto completo de lo que se habló en la reunión.

---

## 🐛 Troubleshooting

### Error: "OpenAI API key not configured"

**Causa**: No se configuró la API key en Supabase.

**Solución**:
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-TU_KEY
```

### Error: "You exceeded your current quota"

**Causa**: No tienes créditos en OpenAI o alcanzaste el límite.

**Solución**:
1. Ve a: https://platform.openai.com/settings/organization/billing
2. Add payment method
3. Añade créditos ($5 mínimo)

### Error: "Incorrect API key provided"

**Causa**: La API key es inválida o está mal escrita.

**Solución**:
1. Verifica que la key empieza con `sk-`
2. Genera una nueva key en: https://platform.openai.com/api-keys
3. Configúrala de nuevo: `supabase secrets set OPENAI_API_KEY=sk-...`

### Error: "Failed to download audio"

**Causa**: La URL del audio no es accesible o el bucket no existe.

**Solución**:
1. Verifica que ejecutaste: `meeting_recordings_storage.sql`
2. Ve a Supabase Dashboard → Storage → Verifica que existe "meeting-recordings"
3. Verifica que el audio se subió correctamente

### Error: "Whisper API failed"

**Causa**: El audio tiene un formato no soportado o está corrupto.

**Solución**:
1. Whisper soporta: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM
2. Máximo 25 MB por archivo
3. Si tu audio es más grande, necesitas comprimirlo

### La transcripción tarda mucho (>5 minutos)

**Normal**: Whisper puede tardar 1-3 minutos para audios largos.

**Si tarda más de 5 minutos**:
1. Ve a Supabase Dashboard → Edge Functions → Logs
2. Busca la función `transcribe-meeting`
3. Revisa los logs para ver errores

### La transcripción está en inglés pero hablé español

**Causa**: El parámetro `language` no está configurado correctamente.

**Solución**: Ya está configurado como `'es'` en línea 68 de la Edge Function. Si necesitas otro idioma:
```typescript
formData.append('language', 'en'); // inglés
formData.append('language', 'fr'); // francés
// etc.
```

---

## 💰 Costos Estimados

### Whisper API Pricing

- **$0.006 por minuto** de audio
- Facturación por segundo (redondeado a segundo más cercano)

### Ejemplos de Costos

| Duración Reunión | Costo Whisper |
|-----------------|---------------|
| 10 minutos      | $0.06         |
| 30 minutos      | $0.18         |
| 60 minutos      | $0.36         |
| 90 minutos      | $0.54         |

### Presupuesto Recomendado

- **Startup pequeño** (10 reuniones/mes de 30 min): ~$2/mes
- **Equipo mediano** (50 reuniones/mes de 45 min): ~$13/mes
- **Empresa grande** (200 reuniones/mes de 60 min): ~$72/mes

**Nota**: Estos son solo costos de Whisper. GPT-4 (Task #45) tendrá costos adicionales.

---

## 📊 Monitorear Uso

### Ver Uso en OpenAI Dashboard

1. Ve a: https://platform.openai.com/usage
2. Filtra por modelo: "Whisper"
3. Verás:
   - Requests totales
   - Minutes processed
   - Costo total
   - Gráficos de uso

### Configurar Límites de Gasto

1. Ve a: https://platform.openai.com/settings/organization/limits
2. Set hard limit: ej. $50/mes
3. Set soft limit: ej. $30/mes (te envía email de alerta)

---

## 🎯 Resultado Esperado

Si todo está configurado correctamente:

1. ✅ Edge Function deployada en Supabase
2. ✅ OpenAI API key configurada como secret
3. ✅ Puedes grabar o subir audio
4. ✅ Audio se transcribe automáticamente después de subir
5. ✅ Transcript se guarda en la BD
6. ✅ Estado cambia a `analyzing`
7. ✅ Puedes ver la transcripción completa en SQL

---

## 📸 Logs Esperados

### En Consola del Navegador

```
🎙️ Starting transcription for meeting: abc-123
✅ Transcription completed: {success: true, meetingId: "abc-123", ...}
```

### En Supabase Edge Function Logs

```
🎙️ Starting transcription for meeting: abc-123
📥 Downloading audio from: https://...
✅ Audio downloaded, size: 1234567 bytes
🤖 Calling Whisper API...
✅ Transcription received, length: 5432
✅ Meeting updated with transcript
```

---

## 🎯 Siguiente Paso

Una vez verificado que funciona:

**Task #45**: Integrar GPT-4 para análisis y extracción de insights
- Crear Edge Function para análisis
- Prompt engineering para extraer:
  - Tareas con asignados
  - Decisiones tomadas
  - Leads identificados
  - OBVs mencionados
  - Métricas discutidas
- Guardar insights en `meeting_insights`

---

**¿Transcripción funciona? ¡Avísame para continuar con Task #45! 🚀**
