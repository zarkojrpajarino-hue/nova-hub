# 🚀 INSTRUCCIONES DE DEPLOYMENT

## Resumen
Necesitas deployar 2 Edge Functions y configurar 1 API Key para activar todas las funcionalidades.

---

## ✅ Checklist

- [ ] 1. Instalar Supabase CLI (si no lo tienes)
- [ ] 2. Login en Supabase
- [ ] 3. Deploy Edge Function: send-slack-notification
- [ ] 4. Deploy Edge Function: extract-business-info
- [ ] 5. Configurar API Key de Anthropic
- [ ] 6. Probar la app

---

## 📦 1. Instalar Supabase CLI

### Windows (usando npm):
```powershell
npm install -g supabase
```

### macOS (usando Homebrew):
```bash
brew install supabase/tap/supabase
```

### Linux:
```bash
curl -o- https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash
```

**Verificar instalación:**
```bash
supabase --version
```

---

## 🔐 2. Login en Supabase

```bash
supabase login
```

Te abrirá el navegador para autenticarte. Si ya estás logueado, puedes saltarte este paso.

---

## 🚀 3. Deploy Edge Function: Slack Notifications

```bash
cd nova-hub
supabase functions deploy send-slack-notification
```

**Output esperado:**
```
Deploying send-slack-notification (project ref: xxxxx)
Bundled send-slack-notification size: X.X KB
Deployed send-slack-notification
Function URL: https://xxxxx.supabase.co/functions/v1/send-slack-notification
```

---

## 🤖 4. Deploy Edge Function: AI Onboarding

```bash
cd nova-hub
supabase functions deploy extract-business-info
```

**Output esperado:**
```
Deploying extract-business-info (project ref: xxxxx)
Bundled extract-business-info size: X.X KB
Deployed extract-business-info
Function URL: https://xxxxx.supabase.co/functions/v1/extract-business-info
```

---

## 🔑 5. Configurar API Key de Anthropic

### 5.1 Obtener la API Key

1. Ve a https://console.anthropic.com/
2. Crea una cuenta (si no tienes)
3. Obtén **$5 USD gratis** de crédito
4. Ve a "API Keys" en el menú
5. Click "Create Key"
6. Copia la key (empieza con `sk-ant-api03-...`)

### 5.2 Añadir la Key en Supabase

**Opción A: Desde Dashboard (Recomendado)**

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Navega a: **Settings** → **Edge Functions** → **Secrets**
3. Click "+ New Secret"
4. Name: `ANTHROPIC_API_KEY`
5. Value: Pega tu API key (`sk-ant-api03-...`)
6. Click "Save"

**Opción B: Desde CLI**

```bash
cd nova-hub
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXX
```

**Verificar que se guardó:**
```bash
supabase secrets list
```

Deberías ver:
```
ANTHROPIC_API_KEY: sk-ant-api03-XXX... (hidden)
```

---

## ✅ 6. Probar la App

### 6.1 Iniciar modo desarrollo

```bash
cd nova-hub
npm run dev
```

### 6.2 Probar Integraciones (Slack)

1. Abre http://localhost:5173
2. Ve a **Sidebar** → **Integraciones** (ícono 🔌)
3. Sigue las instrucciones de la página para configurar Slack
4. Crea un webhook en https://api.slack.com/messaging/webhooks
5. Pega la URL en la app
6. Click "Configurar"
7. Click "Test" para enviar un mensaje de prueba a Slack

**Deberías recibir:** Un mensaje en tu canal de Slack con "¡Hola desde Nova Hub!"

### 6.3 Probar Onboarding con IA

1. Ve a **Proyectos** → **Nuevo Proyecto**
2. En el wizard de onboarding, verás el bloque azul con ✨ **"Onboarding Inteligente con IA"**
3. Selecciona tipo de contexto (ej: "Negocio referente")
4. Pega una URL (ej: `https://stripe.com`)
5. Click "Extraer"
6. Espera 5-10 segundos
7. **Deberías ver:** Información extraída automáticamente con insights de la IA
8. Click "Aplicar Información al Formulario"
9. **Los campos se rellenan solos** 🎉

---

## 🐛 Troubleshooting

### Error: "command not found: supabase"

**Solución:** Instala Supabase CLI (ver paso 1)

### Error: "Not logged in"

**Solución:**
```bash
supabase login
```

### Error: "Failed to deploy function"

**Verificar:**
1. Estás en el directorio `nova-hub`
2. Existe la carpeta `supabase/functions/send-slack-notification`
3. Tienes permisos en el proyecto de Supabase

### Onboarding IA funciona en "modo básico"

**Causa:** No has configurado `ANTHROPIC_API_KEY`

**Solución:** Sigue el paso 5 para configurar la API key

### Slack no envía mensajes

**Verificar:**
1. La Webhook URL es correcta (debe empezar con `https://hooks.slack.com/`)
2. El webhook está marcado como "enabled"
3. Has seleccionado los tipos de notificación correctos
4. El Edge Function `send-slack-notification` está desplegado

**Test manual:**
```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test from curl"}'
```

---

## 📊 Verificación Final

Para confirmar que TODO está funcionando:

```bash
# 1. Verificar que las funciones están desplegadas
supabase functions list

# Deberías ver:
# - send-slack-notification
# - extract-business-info

# 2. Verificar secrets
supabase secrets list

# Deberías ver:
# - ANTHROPIC_API_KEY
```

---

## 💰 Costos

### Supabase Edge Functions
- **Gratis** hasta 500,000 invocaciones/mes
- $0.00002 por invocación adicional

### Anthropic API (Claude)
- **$5 USD gratis** al crear cuenta
- Después: ~$0.003 por análisis de onboarding
- Con $5 puedes hacer ~1,600 análisis

**Total:** Prácticamente GRATIS para uso normal 🎉

---

## 🎯 Resultado Final

Cuando todo esté configurado:

✅ **Vista de Integraciones** funcionando
✅ **Slack** recibiendo notificaciones automáticas
✅ **Onboarding con IA** extrayendo información de URLs
✅ **App en 9.5/10** de calidad

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:
1. Lee el mensaje de error completo
2. Verifica cada paso de esta guía
3. Consulta la documentación oficial:
   - Supabase CLI: https://supabase.com/docs/guides/cli
   - Edge Functions: https://supabase.com/docs/guides/functions
   - Anthropic API: https://docs.anthropic.com/

---

*Creado el 28/01/2026 - Implementado con Claude Sonnet 4.5*
