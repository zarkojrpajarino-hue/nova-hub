# ✅ TU CHECKLIST - QUÉ HACER AHORA

## 🎯 RESUMEN

He actualizado **TODO el código al 100%** con la feature de Generative Onboarding.

**Nuevas funcionalidades**:
- Usuario sin idea → IA genera 5-10 ideas → Usuario elige → IA genera negocio completo
- Branding (3 opciones con logos DALL-E)
- 5 productos con pricing
- Website deployed a Vercel
- Emails REALES vía Resend
- Límites globales (5 tareas/día, 35/semana)
- Tareas alineadas con user_stage

---

## 📋 TUS TAREAS (15-20 minutos)

### ✅ PASO 1: Ejecutar SQL (5 minutos)

1. Abre Supabase → SQL Editor
2. Copia TODO el contenido de: `C:\Users\Zarko\nova-hub\EJECUTAR-TODO.sql`
3. Pega en SQL Editor
4. Click "Run"
5. Espera ~30 segundos
6. Verás mensajes de éxito:

```
✅ PASO 1: Sistema ejecución IA
✅ PASO 2: Project Intelligence
✅ PASO 3: Onboarding completo
✅ PASO 4: Email integration
✅ PASO 5: Generative Onboarding
🎉 CONSOLIDACIÓN COMPLETA - TODO EJECUTADO
```

**CONFIRMA AQUÍ CUANDO TERMINES** ✅

---

### ✅ PASO 2: Configurar Resend (10 minutos)

#### 2.1 Crear cuenta Resend

1. Ve a https://resend.com
2. Sign up (gratis 100 emails/día, 3,000/mes)
3. Verifica tu email

#### 2.2 Obtener API Key

1. En Resend dashboard → API Keys
2. Click "Create API Key"
3. Nombre: "Nova Hub Production"
4. Permissions: "Sending access"
5. **Copia la API Key** (empieza con `re_...`)

#### 2.3 Configurar en Supabase

**Opción A: Via terminal (RECOMENDADO)**

```bash
cd /c/Users/Zarko/nova-hub
npx supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui
```

**Opción B: Via Supabase Dashboard**

1. Project Settings → Edge Functions → Secrets
2. Add new secret:
   - Name: `RESEND_API_KEY`
   - Value: `re_tu_api_key_aqui`

**CONFIRMA AQUÍ CUANDO TERMINES** ✅

---

### ✅ PASO 3: Configurar Vercel (5 minutos - OPCIONAL)

Solo si quieres que websites se deploya automáticamente.

#### 3.1 Obtener Vercel Token

1. Ve a https://vercel.com/account/tokens
2. Create Token
3. Name: "Nova Hub Deployments"
4. Scope: "Full Account"
5. **Copia el token**

#### 3.2 Configurar en Supabase

```bash
cd /c/Users/Zarko/nova-hub
npx supabase secrets set VERCEL_TOKEN=tu_vercel_token_aqui
```

Si usas Team account:

```bash
npx supabase secrets set VERCEL_TEAM_ID=team_xxx
```

**CONFIRMA AQUÍ SI LO HICISTE** ✅ (o escribe "SKIP" si no lo quieres ahora)

---

## 🚀 MIS TAREAS (30 minutos)

Una vez confirmes los pasos 1-3, YO haré:

### ✅ PASO 4: Deploy Edge Functions

```bash
# Deploy 5 nuevas funciones:
npx supabase functions deploy generate-complete-business
npx supabase functions deploy approve-generation-preview
npx supabase functions deploy deploy-to-vercel
npx supabase functions deploy send-email-real
npx supabase functions deploy enrich-project-intelligence

# Redeploy funciones actualizadas:
npx supabase functions deploy generate-tasks-v2
```

### ✅ PASO 5: Testing end-to-end

Probaré:
1. Generar negocio completo con IA
2. Aprobar preview
3. Verificar que se guardó en todas las tablas
4. Verificar deployment a Vercel
5. Enviar email real vía Resend
6. Verificar límites de tareas

---

## 📊 ESTADO ACTUAL

### Archivos actualizados:

✅ **EJECUTAR-TODO.sql** - SQL consolidado completo (Paso 1-5)
- Sistema de límites globales
- Project Intelligence
- Onboarding completo
- Email integration
- **NUEVO**: Products table
- **NUEVO**: Generation previews table

✅ **generate-tasks-v2/index.ts** - Actualizado
- Verifica límites ANTES de generar
- Usa Project Intelligence para contexto rico
- Tareas alineadas con user_stage

✅ **5 Edge Functions nuevas** - Listas para deploy
- `generate-complete-business` - Genera negocio completo
- `approve-generation-preview` - Aplica preview a DB
- `deploy-to-vercel` - Auto-deployment
- `send-email-real` - Resend integration
- `enrich-project-intelligence` - AI-assisted enrichment

✅ **README-GENERATIVE-ONBOARDING.md** - Documentación completa
- Explicación detallada de todo
- Ejemplos de input/output
- FAQ
- Testing instructions

---

## 🎯 SIGUIENTE NIVEL (Después de testing)

Una vez funcione todo:

### Frontend updates necesarios:

1. **Onboarding adaptativo**
   - 3 flujos según user_stage
   - Botón: "Generar ideas con IA"
   - Botón: "Generar negocio completo"

2. **Preview de generaciones**
   - Mostrar 3 opciones de branding
   - Selector visual
   - Botón: "Aplicar esta opción"

3. **Business Dashboard**
   - Mostrar branding aplicado
   - Productos con pricing
   - Buyer persona
   - Link a website deployed
   - Validation experiments tracker

---

## ❓ PREGUNTAS FRECUENTES

### P: ¿Puedo testear antes de configurar Resend?

**R**: Sí, ejecuta PASO 1 (SQL) y yo puedo deployar las funciones. Solo las que usan Resend darán error hasta que configures la API Key.

### P: ¿Qué pasa si no configuro Vercel?

**R**: El website HTML se generará igual, pero no se deployará automáticamente. Lo tendrás en `company_assets.website_html` para deployment manual.

### P: ¿Necesito OpenAI API Key para los logos?

**R**: Yo la configuraré. Si ya la tienes, añádela:

```bash
npx supabase secrets set OPENAI_API_KEY=sk-xxx
```

### P: ¿Cuánto cuesta por generación?

**R**: ~$0.50-1.00:
- Claude (16k tokens): ~$0.40
- DALL-E 3 (3 logos): ~$0.12
- Vercel: Gratis
- Resend: Gratis (100/día)

---

## ✅ CONFIRMA AQUÍ

**PASO 1 (SQL)**: [ ] EJECUTADO

**PASO 2 (Resend)**: [ ] CONFIGURADO

**PASO 3 (Vercel)**: [ ] CONFIGURADO / [ ] SKIP POR AHORA

Una vez confirmes, sigo con deployment y testing. 🚀
