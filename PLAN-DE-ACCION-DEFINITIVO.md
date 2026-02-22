# 🎯 PLAN DE ACCIÓN DEFINITIVO - NOVA HUB

**Objetivo**: Implementar sistema completo de ejecución de tareas con IA

**Duración estimada**: 2-3 horas

---

## 📋 CHECKLIST RÁPIDO

- [ ] **PASO 1**: Ejecutar SQL consolidado (TÚ)
- [ ] **PASO 2**: Configurar Resend para emails (TÚ)
- [ ] **PASO 3**: Desplegar 4 Edge Functions (YO - automático)
- [ ] **PASO 4**: Actualizar generate-tasks-v2 (YO - código)
- [ ] **PASO 5**: Testing completo (JUNTOS)

---

## 🚀 PASO 1: EJECUTAR SQL CONSOLIDADO (TÚ)

### Qué hace este SQL:
- ✅ Sistema de ejecución IA (límites 5/día, 35/semana)
- ✅ 10 AI Workers especializados
- ✅ Project Intelligence (buyer personas, value prop, brand, competidores)
- ✅ Onboarding completo (3 flujos según stage)
- ✅ Company assets (web, redes, email, branding)
- ✅ Validation experiments (Lean Startup)
- ✅ Email tracking (sent_emails)

### Cómo ejecutar:

1. Abre Supabase → SQL Editor
2. Copia TODO el contenido de: `C:\Users\Zarko\nova-hub\EJECUTAR-TODO.sql`
3. Pega en SQL Editor
4. Click "Run"
5. Espera ~30 segundos
6. Verás mensajes:
   ```
   ✅ PASO 1 COMPLETADO: Sistema de ejecución IA simplificado
   ✅ PASO 2 COMPLETADO: Project Intelligence System
   ✅ PASO 3 COMPLETADO: Onboarding completo + Company Assets
   ✅ PASO 4 COMPLETADO: Email Integration + Tracking
   🎉 CONSOLIDACIÓN COMPLETA - TODO EJECUTADO
   ```

**CONFIRMA AQUÍ CUANDO TERMINES** ✅

---

## 📧 PASO 2: CONFIGURAR RESEND (TÚ)

### Para que los emails se envíen REALMENTE:

#### 2.1 Crear cuenta Resend

1. Ve a https://resend.com
2. Sign up (gratis 100 emails/día, 3,000/mes)
3. Verifica email

#### 2.2 Obtener API Key

1. En Resend dashboard → API Keys
2. Click "Create API Key"
3. Nombre: "Nova Hub Production"
4. Permissions: "Sending access"
5. **Copia la API Key** (empieza con `re_...`)

#### 2.3 Configurar en Supabase

Opción A: Añadir como Secret (RECOMENDADO)

```bash
# En terminal:
cd /c/Users/Zarko/nova-hub
npx supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui
```

Opción B: Añadir manualmente en Supabase Dashboard

1. Project Settings → Edge Functions → Secrets
2. Add new secret:
   - Name: `RESEND_API_KEY`
   - Value: `re_tu_api_key_aqui`

#### 2.4 Configurar sender email

**Opción 1: Testing (sin dominio propio)**
```
Sender: onboarding@resend.dev
```
Listo - funciona inmediatamente para testing

**Opción 2: Producción (con tu dominio)**

1. En Resend → Domains → Add Domain
2. Añade tu dominio (ej: `novahub.com`)
3. Añade los DNS records que te da Resend
4. Espera verificación (~5 mins)
5. Sender: `noreply@tu-dominio.com`

**CONFIRMA AQUÍ CUANDO TERMINES** ✅

---

## 🤖 PASO 3: DESPLEGAR EDGE FUNCTIONS (YO)

### Funciones a desplegar:

1. **ai-task-router** (clasifica tareas y route a worker correcto)
2. **ai-task-executor** (ejecuta tareas automáticamente)
3. **auto-sync-finances** (universal: Stripe, Holded, QB, Xero, PayPal)
4. **generate-business-ideas** (genera 5-10 ideas de negocio para usuario sin idea)

### Comandos:

```bash
cd /c/Users/Zarko/nova-hub

# Actualizar router a versión simple
cp supabase/functions/ai-task-router/index-simple.ts supabase/functions/ai-task-router/index.ts

# Deploy
npx supabase functions deploy ai-task-router
npx supabase functions deploy ai-task-executor
npx supabase functions deploy auto-sync-finances
npx supabase functions deploy generate-business-ideas
```

**YO EJECUTO ESTO** - Solo confirma cuando te diga "listo" ✅

---

## 🔧 PASO 4: ACTUALIZAR GENERATE-TASKS-V2 (YO)

### Qué actualizar:

1. **Integrar verificación de límites**
   ```typescript
   // Al inicio, antes de generar tareas
   const { data: canCreate } = await supabase.rpc('can_execute_task', {
     p_user_id: authUserId,
     p_is_ai_execution: false
   });

   if (!canCreate.can_execute) {
     return errorResponse(429, canCreate.reason, canCreate.limits);
   }
   ```

2. **Usar Project Intelligence para contexto**
   ```typescript
   // Obtener contexto rico
   const { data: intelligence } = await supabase.rpc('get_project_intelligence', {
     p_project_id: projectId
   });

   // Añadir al prompt de IA
   const enrichedContext = {
     ...baseContext,
     buyer_persona: intelligence.buyer_personas?.[0],
     value_prop: intelligence.value_proposition,
     brand: intelligence.brand,
     successful_patterns: intelligence.knowledge?.successful_patterns
   };
   ```

3. **Alinear tareas con user_stage**
   ```typescript
   const stageInstructions = getInstructionsByStage(project.user_stage);
   ```

**YO HAGO ESTO** - Te muestro el código final ✅

---

## ✅ PASO 5: TESTING COMPLETO (JUNTOS)

### Test 1: Verificar límites

```bash
# En psql o Supabase SQL Editor:
SELECT * FROM user_usage_dashboard WHERE user_id = 'tu_user_id';

# Debería mostrar:
# tasks_today: 0
# daily_task_limit: 5
# tasks_remaining_today: 5
```

### Test 2: Crear tarea y verificar límite

```typescript
// Crear 6 tareas en el frontend
// La 6ta debería dar error: "Límite diario alcanzado"
```

### Test 3: Generar ideas de negocio

```bash
# Llamar a edge function:
curl -X POST https://tu-proyecto.supabase.co/functions/v1/generate-business-ideas \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "xxx"}'

# Debería devolver 5-10 ideas personalizadas
```

### Test 4: Sincronizar finanzas

```bash
# Llamar a edge function:
curl -X POST https://tu-proyecto.supabase.co/functions/v1/auto-sync-finances \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "xxx", "provider": "stripe"}'
```

### Test 5: Enviar email REAL

```bash
# Crear tarea: "Enviar email a juan@empresa.com sobre producto X"
# IA debería:
# 1. Generar email personalizado
# 2. Enviarlo VIA RESEND
# 3. Guardar en sent_emails con status='sent'
```

---

## 📊 RESULTADO ESPERADO

Después de completar TODOS los pasos:

### ✅ Backend completamente funcional:
- Límites de uso (5/día, 35/semana) funcionando
- 10 AI Workers disponibles
- Project Intelligence poblado (manual o IA asistida)
- Emails se envían REALMENTE vía Resend
- Finanzas sincronizadas de cualquier fuente

### ✅ Flujo completo de usuario:

```
1. Usuario sin idea
   → Completa onboarding (hobbies, intereses)
   → IA genera 5-10 ideas de negocio
   → Usuario elige una

2. Usuario con idea
   → Completa onboarding (idea, target, problema)
   → IA enriquece Project Intelligence
   → IA genera plan de validación Lean Startup

3. Usuario crea tarea "Conseguir 5 clientes restaurantes Madrid"
   → ai-task-router clasifica: lead_scraper
   → ai-task-executor ejecuta:
     - Scrapea 5 restaurantes
     - Extrae emails
     - Genera 5 pitches personalizados
     - ENVÍA los 5 emails vía Resend
   → Output: "5 campañas enviadas. Revisar respuestas en 24-48h"

4. Usuario solo: Monitorea respuestas en sent_emails
```

---

## 🔥 SIGUIENTE NIVEL (Después de testing)

Una vez funcione todo lo anterior:

### FASE SIGUIENTE: Workers Premium

1. **Full Website Generator**
   - Genera sitio web completo
   - Auto-deploy a Vercel
   - Conecta dominio

2. **Complete Branding Generator**
   - Logo, colores, tipografía
   - Guía de marca completa
   - Aplicaciones (tarjetas, flyers, etc.)

3. **Social Media Month**
   - 30 posts (Instagram/LinkedIn/TikTok)
   - Calendario completo
   - Hashtags optimizados

**Pero PRIMERO terminamos lo básico** ✅

---

## ❓ PREGUNTAS FRECUENTES

### P: ¿Cómo se pueblan los datos de Project Intelligence?

**R**: 3 formas:

1. **Manual**: Usuario completa formularios en frontend
2. **IA Asistida**: Usuario da info básica → IA completa el resto (recomendado)
3. **Auto-learning**: IA aprende de conversaciones reales con leads

Vamos a implementar opción 2 (IA Asistida) con edge function `enrich-project-intelligence`.

### P: ¿Los emails se envían REALMENTE?

**R**: SÍ, vía Resend. Necesitas:
- API Key de Resend (PASO 2)
- Sender email configurado en `company_assets`
- Edge function `send-email-real` (la creo yo)

### P: ¿Puedo cambiar los límites globales?

**R**: SÍ, ejecuta:
```sql
UPDATE system_limits
SET setting_value = '{
  "max_tasks_per_day": 10,
  "max_tasks_per_week": 70
}'::jsonb
WHERE setting_name = 'task_limits';
```

### P: ¿Qué pasa si alcanza el límite?

**R**: Al intentar crear tarea #6:
```json
{
  "error": "Límite diario alcanzado (5/5)",
  "limits": {
    "daily": {"tasks_used": 5, "tasks_limit": 5},
    "weekly": {"tasks_used": 12, "tasks_limit": 35}
  }
}
```

Usuario debe esperar hasta mañana o ajustamos límite.

---

## 🎯 RESUMEN ACCIÓN INMEDIATA

### TÚ HACES (15 minutos):

1. ✅ Ejecutar `EJECUTAR-TODO.sql` en Supabase
2. ✅ Crear cuenta Resend + obtener API Key
3. ✅ Añadir `RESEND_API_KEY` como secret en Supabase

### YO HAGO (30 minutos):

1. ✅ Desplegar 4 edge functions
2. ✅ Actualizar `generate-tasks-v2` con límites + contexto rico
3. ✅ Crear `send-email-real` edge function
4. ✅ Crear `enrich-project-intelligence` edge function

### JUNTOS HACEMOS (30 minutos):

1. ✅ Testing completo
2. ✅ Ajustes finales

---

## ✅ EMPIEZA AQUÍ

**EJECUTA PASO 1 AHORA** y confirma cuando termines 👇

```
Copia y pega en Supabase SQL Editor:
C:\Users\Zarko\nova-hub\EJECUTAR-TODO.sql
```

**Dime "PASO 1 EJECUTADO" cuando termine** ✅
