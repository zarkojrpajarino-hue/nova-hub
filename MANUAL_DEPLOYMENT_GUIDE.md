# 📝 GUÍA DE DEPLOYMENT MANUAL

## Desplegar scrape-and-extract desde Supabase UI

### PASO 1: Crear la función

1. Ve a: **Edge Functions** → **Create new edge function**
2. Nombra la función: `scrape-and-extract`
3. En el editor, **borra todo** el código de ejemplo
4. Copia y pega el código del archivo: `supabase/functions/scrape-and-extract/index.ts`

### PASO 2: Agregar archivo compartido

1. Click en **"+ Add File"**
2. Nombre del archivo: `../_shared/anthropic-client.ts`
3. Copia y pega el código del archivo: `supabase/functions/_shared/anthropic-client.ts`

### PASO 3: Desplegar

1. Click en **"Deploy"** (botón superior derecha)
2. Espera confirmación de deployment exitoso

### PASO 4: Configurar Secret

1. Ve a **"Secrets"** en el menú lateral (sección MANAGE)
2. Click en **"New Secret"**
3. Configura:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-tu-api-key-aqui`
4. Click en **"Save"**

### PASO 5: Verificar

1. Ve a **Logs** para ver si la función está corriendo
2. Prueba con curl:

```bash
curl -X POST https://tu-proyecto.supabase.co/functions/v1/scrape-and-extract \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "idea",
    "business_pitch": "Test startup",
    "website_url": "https://example.com"
  }'
```

---

## 🔑 DÓNDE CONSEGUIR API KEYS

### Anthropic API Key:
1. Ve a: https://console.anthropic.com
2. Click en "API Keys"
3. "Create Key"
4. Copia la key (empieza con `sk-ant-`)

### Supabase Anon Key:
1. Ve a: Project Settings → API
2. Copia "anon public"

---

## ✅ LISTO!

Tu función está desplegada y lista para usar.
