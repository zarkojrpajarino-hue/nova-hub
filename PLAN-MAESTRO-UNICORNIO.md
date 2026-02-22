# 🦄 PLAN MAESTRO - NOVA HUB UNICORNIO

## LA VISIÓN COMPLETA

**Nova Hub** no es un gestor de tareas. Es **LA PLATAFORMA QUE CONVIERTE PERSONAS EN EMPRENDEDORES EXITOSOS**.

### Journey del usuario:

```
Persona sin idea
    ↓ (IA genera 5-10 ideas personalizadas)
Idea generada
    ↓ (IA crea plan de validación Lean Startup)
Idea validada
    ↓ (IA ayuda a construir MVP)
MVP lanzado
    ↓ (IA ejecuta tareas de growth: leads, emails, ads)
Primeros clientes
    ↓ (IA optimiza y escala: branding, web, automatizaciones)
Startup en tracción
    ↓ (IA aplica Scaling Up: procesos, partnerships, expansión)
Empresa consolidada 🚀
```

---

## 📋 PLAN DE IMPLEMENTACIÓN - PASO A PASO

### ✅ FASE 1: FUNDACIONES (Ya completadas)

- [x] Sistema de límites globales (5 tareas/día, 35/semana)
- [x] AI Workers especializados (10 tipos)
- [x] Task routing inteligente (NLP)
- [x] Project Intelligence System (contexto rico)
- [x] Auto-sync finances (Stripe, Holded, QB, Xero, PayPal)

### 🔥 FASE 2: ONBOARDING COMPLETO (EJECUTAR AHORA)

#### PASO 1: Ejecutar SQL ⭐ HAZ ESTO PRIMERO
```bash
# En Supabase SQL Editor:
C:\Users\Zarko\nova-hub\phase-G-onboarding-completo.sql
```

**Crea:**
- ✅ 3 flujos de onboarding según stage del usuario
- ✅ `user_interests` - Hobbies, skills, preferencias
- ✅ `generated_business_ideas` - Ideas generadas por IA
- ✅ `company_assets` - Web, redes, email, branding
- ✅ `validation_experiments` - Experimentos Lean Startup
- ✅ `user_stage` y `methodology` en projects

**Confirma cuando ejecutes** ✅

#### PASO 2: Deploy Edge Function - Generate Business Ideas
```bash
cd /c/Users/Zarko/nova-hub
npx supabase functions deploy generate-business-ideas
```

**Esta función:**
- Toma hobbies, skills, recursos del usuario
- Genera 5-10 ideas de negocio VIABLES y PERSONALIZADAS
- Cada idea incluye: problema, solución, primeros pasos, modelo negocio
- **Killer feature: De "no sé qué hacer" → 5 ideas en 2 minutos**

**Confirma cuando despliegues** ✅

---

### 🚀 FASE 3: EMAIL REAL (Siguiente)

**Problema actual**: IA genera emails pero NO los envía

**Solución**: Integración con Resend (más simple que SendGrid)

#### PASO 3: Setup Resend

1. **Crear cuenta Resend**: https://resend.com (gratis 100 emails/día)
2. **Obtener API Key**
3. **Configurar dominio** (o usar `onboarding@resend.dev` para testing)

#### PASO 4: Ejecutar SQL - Email Integration
```sql
-- Añadir a company_assets
ALTER TABLE company_assets ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
ALTER TABLE company_assets ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE company_assets ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Tabla de emails enviados
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID REFERENCES ai_task_executions(id),
  lead_id UUID REFERENCES leads(id),

  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),

  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  external_id TEXT, -- Resend message ID
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sent_emails_lead ON sent_emails(lead_id, created_at DESC);
CREATE INDEX idx_sent_emails_status ON sent_emails(status);
```

#### PASO 5: Edge Function - Send Email (Real)
```typescript
// supabase/functions/send-email-real/index.ts
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Enviar email REAL
const { data, error } = await resend.emails.send({
  from: 'tu-nombre@tu-dominio.com',
  to: lead.email,
  subject: emailSubject,
  html: emailBodyHtml,
});
```

**Confirma cuando completes** ✅

---

### 🎨 FASE 4: WORKERS PREMIUM (Siguiente)

Actualmente tienes workers básicos. Necesitas workers que generen outputs COMPLETOS.

#### PASO 6: Workers Premium - SQL
```sql
-- Actualizar ai_workers con nuevos tipos

INSERT INTO ai_workers (worker_type, display_name, description, capabilities, avg_execution_time_seconds) VALUES

-- Web completa
('full_website_generator', 'Full Website Generator', 'Genera sitio web completo con HTML/CSS/JS + hosting en Vercel',
'["web_design", "html_css_js", "responsive", "auto_deploy"]'::jsonb, 180),

-- Branding completo
('complete_branding_generator', 'Complete Branding Generator', 'Genera: logo, colores, tipografía, guía de marca, aplicaciones',
'["logo_design", "color_palette", "typography", "brand_guidelines", "mockups"]'::jsonb, 240),

-- Landing page con analytics
('landing_page_with_analytics', 'Landing Page + Analytics', 'Landing page optimizada con Google Analytics y Facebook Pixel',
'["landing_design", "copywriting", "analytics_setup", "ab_testing"]'::jsonb, 120),

-- Email sequence automática
('email_automation_sequence', 'Email Automation Sequence', 'Secuencia de 5-10 emails con triggers automáticos',
'["email_writing", "automation_logic", "segmentation", "ab_testing"]'::jsonb, 150),

-- Social media content (mes completo)
('social_media_month', 'Social Media Month', 'Genera 30 posts (Instagram/LinkedIn/TikTok) con calendario',
'["content_writing", "image_generation", "hashtag_research", "scheduling"]'::jsonb, 300)

ON CONFLICT (worker_type) DO NOTHING;
```

#### PASO 7: Implementar Workers Premium (Código)

Cada worker necesita su implementación. Te daré el código para cada uno.

**Confirma cuando quieras que implemente estos workers** ✅

---

### 🎯 FASE 5: ALINEACIÓN CON FASE DEL PROYECTO

**Problema**: Tareas no están alineadas con el stage real del proyecto

**Solución**: Generar tareas según `user_stage` del proyecto

#### PASO 8: Actualizar `generate-tasks-v2`

Modificar el prompt según stage:

```typescript
function getTasksByStage(stage: string, context: any) {
  switch(stage) {
    case 'sin_idea':
      return `
        Usuario AÚN NO TIENE IDEA de negocio.
        Genera tareas para:
        1. Explorar intereses y oportunidades
        2. Investigar problemas en su entorno
        3. Hablar con gente para detectar pains
        NO generar tareas de: ventas, producto, desarrollo
      `;

    case 'idea_generada':
    case 'idea_propia':
      return `
        Usuario TIENE IDEA pero SIN VALIDAR.
        Metodología: LEAN STARTUP
        Genera tareas para:
        1. Entrevistas con clientes potenciales (mínimo 20)
        2. Landing page para captar emails
        3. Encuestas de validación
        4. Tests de precio (willingness to pay)
        NO generar tareas de: contratar equipo, escalar, campañas grandes
      `;

    case 'validando':
      return `
        Usuario VALIDANDO IDEA (1-10 clientes, €0-1k/mes).
        Genera tareas para:
        1. MVP mínimo (no perfecto, funcional)
        2. Beta testers (primeros 10 clientes)
        3. Iteración basada en feedback
        4. Mejorar onboarding y UX
        NO generar tareas de: escalar sin PMF, contratar big team
      `;

    case 'traccion':
      return `
        Usuario CON TRACCIÓN (10-100 clientes, €1-10k/mes).
        Genera tareas para:
        1. Optimizar CAC (ads, SEO, content)
        2. Mejorar LTV (upsell, retención)
        3. Automatizar procesos
        4. Contratar roles críticos
        5. Preparar fundraising si aplica
      `;

    case 'escalando':
    case 'consolidado':
      return `
        Usuario ESCALANDO/CONSOLIDADO (€10k+/mes).
        Metodología: SCALING UP
        Genera tareas para:
        1. Expansión a nuevos mercados
        2. Partnerships estratégicos
        3. Liderazgo senior (VP Sales, VP Eng)
        4. Procesos y gobernanza (OKRs)
        5. Defensibilidad y moats
      `;
  }
}
```

**Confirma cuando quieras implementar esto** ✅

---

### 📊 FASE 6: FRONTEND UPDATES

Actualizar UI para mostrar todo esto:

#### PASO 9: Onboarding Adaptive

```tsx
// Detectar stage del usuario
if (!userHasIdea) {
  showOnboarding('sin_idea');
  // Preguntar: hobbies, intereses, recursos
  // Botón: "Generar ideas de negocio con IA"
}

else if (userHasIdea && !validated) {
  showOnboarding('idea_propia');
  // Preguntar: problema, solución, target
  // Botón: "Crear plan de validación Lean Startup"
}

else if (userHasProject) {
  showOnboarding('validando');
  // Preguntar: métricas, clientes, revenue
  // Botón: "Generar roadmap de growth"
}
```

#### PASO 10: Dashboard de Ideas Generadas

```tsx
// Mostrar las 5-10 ideas generadas por IA
<IdeaCard
  title={idea.idea_name}
  tagline={idea.tagline}
  difficulty={idea.estimated_difficulty}
  timeToRevenue={idea.time_to_first_revenue}
  opportunityScore={idea.opportunity_score}
  fitScore={idea.fit_score}
  onSelect={() => selectIdea(idea.id)}
  onReject={() => rejectIdea(idea.id)}
/>
```

#### PASO 11: Validation Experiments Tracker

```tsx
// Mostrar experimentos Lean Startup
<ExperimentCard
  name={exp.experiment_name}
  hypothesis={exp.hypothesis}
  successCriteria={exp.success_criteria}
  status={exp.status}
  results={exp.results}
  validated={exp.validated}
/>
```

**Confirma cuando quieras el código frontend** ✅

---

### 🔥 FASE 7: INTEGRATIONS

#### PASO 12: Google Analytics Auto-Setup

Cuando usuario valida idea → Auto-crear:
- Google Analytics property
- Facebook Pixel
- Hotjar (heatmaps)

#### PASO 13: Vercel Auto-Deploy

Cuando IA genera web completa:
- Auto-deploy a Vercel
- Conectar dominio custom
- SSL automático

#### PASO 14: Stripe Auto-Setup

Cuando listo para monetizar:
- Crear cuenta Stripe Connect
- Setup pricing
- Checkout automático

**Confirma cuando quieras estos** ✅

---

## 📝 ORDEN DE EJECUCIÓN RECOMENDADO

### YA (Alta prioridad):

1. ✅ **PASO 1**: Ejecutar `phase-G-onboarding-completo.sql`
2. ✅ **PASO 2**: Deploy `generate-business-ideas`
3. ✅ **PASO 4**: SQL - Email integration
4. ✅ **PASO 5**: Edge function - Send Email Real (Resend)

### DESPUÉS (Media prioridad):

5. ✅ **PASO 6**: SQL - Workers Premium
6. ✅ **PASO 7**: Implementar workers premium (código)
7. ✅ **PASO 8**: Actualizar `generate-tasks-v2` con alignment por stage

### LUEGO (Cuando front esté listo):

8. ✅ **PASO 9-11**: Frontend updates
9. ✅ **PASO 12-14**: Integrations automáticas

---

## 🎯 ESTADO ACTUAL VS OBJETIVO

### ✅ YA TENEMOS:
- Límites globales (5 tareas/día, 35/semana)
- 10 AI Workers básicos
- Task routing (NLP)
- Project Intelligence (contexto rico)
- Auto-sync finances (universal)

### 🚧 FALTA IMPLEMENTAR:
- [ ] Onboarding completo (3 flujos)
- [ ] Generación de ideas de negocio
- [ ] Envío real de emails (Resend)
- [ ] Workers premium (web completa, branding, etc.)
- [ ] Alineación de tareas con stage
- [ ] Frontend adaptive onboarding
- [ ] Validation experiments tracker
- [ ] Auto-integrations (GA, Vercel, Stripe)

---

## 🦄 POR QUÉ ESTO ES UNICORNIO

### Competencia actual:

| Producto | Qué hace |
|----------|----------|
| ClickUp, Asana, Monday | Gestionan tareas |
| Notion AI, ChatGPT | Ayudan con tareas |
| Y Combinator | Aceleran startups (humanos) |
| Lean Startup book | Metodología (manual) |

### Nova Hub:

**"IA que convierte personas en emprendedores"**

- Toma persona sin idea → Genera 5 ideas viables
- Acompaña todo el journey (idea → consolidado)
- EJECUTA tareas (no solo sugiere)
- Envía emails reales
- Genera webs completas
- Aplica metodologías (Lean Startup, Scaling Up) automáticamente

**Mercado potencial:**
- 300M+ personas quieren emprender pero no saben qué
- 50M+ startups en fase temprana buscando crecer
- TAM: $50B+ (software + education + acceleration)

---

## ✅ QUÉ HACER AHORA

**Ejecuta en orden:**

1. **PASO 1** (SQL Onboarding) ← EMPEZAR AQUÍ
2. **PASO 2** (Deploy generate-business-ideas)
3. **PASO 4** (SQL Email integration)
4. Confirmame y sigo con PASO 5

**Vamos paso a paso. Confirma cuando ejecutes cada uno** 👍
