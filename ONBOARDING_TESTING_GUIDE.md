# 🧪 GUÍA DE TESTING - ONBOARDING MEJORADO

## PRE-REQUISITOS

Antes de empezar el testing, asegúrate de:
- ✅ Edge functions deployadas
- ✅ Migration aplicada (tabla `ai_generations_log`)
- ✅ Variables de entorno configuradas:
  - `ANTHROPIC_API_KEY` en Supabase
  - `OPENAI_API_KEY` (si usas DALL-E para logos)

---

## TEST 1: FUNCIONES IA INDIVIDUALES

### Test `suggest-buyer-persona`

```bash
# Desde la consola del navegador o Postman
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/suggest-buyer-persona', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    idea: 'Una app para que diseñadores freelance encuentren clientes locales usando geolocalización',
    industry: 'Design Services',
    problemStatement: 'Diseñadores pierden 20h/semana buscando clientes en plataformas saturadas'
  })
});

const data = await response.json();
console.log(data);
```

**Resultado esperado**:
```json
{
  "success": true,
  "suggestions": [
    "Diseñadores gráficos freelance de 25-35 años con 2-5 años de experiencia que dependen de Fiverr/Upwork (comisiones 20%) y buscan clientes locales para relaciones a largo plazo",
    "Diseñadores UX/UI de 28-40 años trabajando remotamente para startups internacionales que quieren diversificar ingresos con clientes locales (50-100 km radio)",
    "Estudiantes de diseño en último año (22-26 años) que necesitan primeros clientes para portfolio pero Upwork está saturado con competencia internacional más barata"
  ]
}
```

### Test `validate-monetization`

```bash
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/validate-monetization', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'Freemium con plan Premium $29/mes',
    idea: 'App de gestión de proyectos para equipos remotos',
    targetCustomer: 'Startups de 5-20 personas'
  })
});

const data = await response.json();
console.log(data);
```

**Resultado esperado**: JSON con `viability`, `pros`, `cons`, `examples`, `recommendations`

### Test `analyze-competitors`

```bash
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/analyze-competitors', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    startupUrl: 'https://notion.so',
    industry: 'Productivity SaaS'
  })
});

const data = await response.json();
console.log(data);
```

**Resultado esperado**: JSON con `competitors[]`, `marketGaps[]`, `positioningRecommendations[]`

### Test `analyze-competitor-urls`

```bash
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/analyze-competitor-urls', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    urls: [
      'https://www.notion.so',
      'https://www.airtable.com',
      'https://clickup.com'
    ],
    myIdea: 'Una herramienta de gestión de proyectos ultra simple para equipos pequeños'
  })
});

const data = await response.json();
console.log(data);
```

**Resultado esperado**: JSON con análisis de cada URL + estrategias de diferenciación + pricing insights

---

## TEST 2: FLUJO COMPLETO DE ONBOARDING

### Onboarding "Sin Idea"

1. Login a la app
2. Navega a `/select-onboarding-type`
3. Click en **"¿Quieres emprender pero no tienes idea?"**
4. Verifica:
   - ✅ Sidebar de progreso visible a la izquierda
   - ✅ Paso actual destacado
   - ✅ Steps futuros en gris

5. Completa paso 1 (Situación actual):
   - Escribe: "Soy desarrollador web con 5 años de experiencia trabajando en startups"
   - Click "Siguiente"
   - ✅ Verificar: Step 1 ahora tiene checkmark verde ✅

6. Completa paso 2 (Frustraciones):
   - Añade 3 frustraciones:
     - "Es difícil encontrar proyectos freelance bien pagados"
     - "Las plataformas como Upwork cobran 20% de comisión"
     - "Pierdo mucho tiempo en propuestas que no convierten"
   - Click "Siguiente"
   - ✅ Verificar: Steps 1 y 2 con checkmark verde

7. Completa pasos 3-5:
   - Tiempo: "Part-time (15-25 horas/semana)"
   - Capital: "Menos de 1,000€"
   - Tipo: Seleccionar "App / Software" y "Servicio"

8. Click "Generar ideas de negocio"
   - ✅ Verificar: Loading state se muestra
   - ✅ Verificar: Se genera lista de 5-10 ideas
   - ✅ Verificar: Puedes seleccionar una idea

9. Seleccionar idea → "Generar negocio completo"
   - ✅ Verificar: Progress muestra "Generando negocio..."
   - ✅ Verificar: Se genera branding, productos, etc.

### Onboarding "Tengo Idea"

1. Navega a `/select-onboarding-type`
2. Click en **"Tengo una idea y quiero emprenderla"**
3. Completa:
   - Paso 1: "Una app para gestionar gastos compartidos en viajes grupales"
   - Paso 2 (Target): Click "Generar con IA" 🤖
     - ✅ Verificar: Se generan 3-5 buyer personas
     - ✅ Verificar: Puedes seleccionar uno
   - Paso 3 (Monetización): Seleccionar "Freemium"
     - ✅ Verificar: Mensaje de validación aparece
   - Paso 4 (Built): Poner URL de website si existe
   - Paso 5 (Competitors): Pegar URLs de competidores
     - ✅ Verificar: Análisis visual se genera
   - Paso 6 (Resources): Budget, horas, skills

4. Click "Generar negocio completo"
   - ✅ Verificar: Todo el flujo funciona end-to-end

### Onboarding "Startup Funcionando"

1. Click en **"Tengo una startup existente"**
2. Completa:
   - Paso 1: URL de tu startup
     - ✅ Verificar: Click en botón ✨ extrae datos automáticamente
   - Paso 2: URLs de redes sociales
   - Paso 3: Herramientas que usas
   - Paso 4: Métricas (MRR, CAC, etc.)
   - Paso 5: Desafío principal

3. Click "Analizar y optimizar"
   - ✅ Verificar: Análisis completo se genera

---

## TEST 3: LOGGING & ANALYTICS

### Verificar que se loguean las llamadas

1. Completa cualquier onboarding que use funciones IA
2. En Supabase Dashboard, ir a **SQL Editor**
3. Ejecutar:

```sql
-- Ver últimos 10 logs
SELECT
  created_at,
  function_name,
  success,
  execution_time_ms,
  tokens_used,
  cost_usd
FROM ai_generations_log
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado**: Ver las llamadas que acabas de hacer

### Ver analytics agregados

```sql
SELECT * FROM ai_generations_analytics
ORDER BY date DESC, function_name;
```

**Resultado esperado**:
```
function_name              | total_calls | successful_calls | avg_execution_time_ms | total_cost_usd
---------------------------+-------------+------------------+-----------------------+----------------
suggest-buyer-persona      | 5           | 5                | 2341.20               | 0.0234
validate-monetization      | 3           | 3                | 1823.67               | 0.0156
analyze-competitors        | 2           | 2                | 4521.50               | 0.0421
analyze-competitor-urls    | 1           | 1                | 6234.00               | 0.0587
```

---

## TEST 4: SIDEBAR DE PROGRESO

### Verificar visualización

1. En cualquier onboarding, verifica:
   - ✅ Sidebar se ve en desktop (ancho > 768px)
   - ✅ Se oculta en mobile (responsive)
   - ✅ Todos los steps del tipo de onboarding se muestran
   - ✅ Step actual tiene borde azul y ícono pulsante
   - ✅ Steps completados tienen checkmark verde
   - ✅ Steps futuros tienen número gris
   - ✅ Barra de progreso animada se llena según avanzas
   - ✅ Contador "X de Y pasos completados" actualiza

---

## TEST 5: CASOS EDGE

### Error handling

1. **Sin API key**:
   - Remover temporalmente `ANTHROPIC_API_KEY` de Supabase
   - Intentar generar buyer personas
   - ✅ Verificar: Error claro se muestra al usuario

2. **URL inválida**:
   - En "analyze-competitor-urls", poner URL inválida: `httx://bad-url`
   - ✅ Verificar: Error se maneja gracefully

3. **Network timeout**:
   - Simular timeout (desconectar internet por 5 segundos)
   - ✅ Verificar: Error se muestra, usuario puede reintentar

### Progreso guardado

1. Llena mitad del onboarding
2. Cierra el wizard (sin completar)
3. Reabrir wizard
   - ✅ Verificar: Banner de "progreso guardado" aparece
   - ✅ Verificar: Puede restaurar o empezar de nuevo

---

## ✅ CHECKLIST FINAL

Antes de considerar el onboarding "perfecto", verifica:

**Funcionalidad**:
- [ ] Las 4 funciones IA funcionan sin errores
- [ ] Sidebar de progreso se muestra correctamente
- [ ] Logging se registra en base de datos
- [ ] Todos los 3 tipos de onboarding completan end-to-end
- [ ] Error handling funciona para casos edge

**UX**:
- [ ] Usuario SIEMPRE sabe en qué paso está
- [ ] Loading states se muestran durante generación IA
- [ ] Outputs IA son útiles (no genéricos)
- [ ] Validaciones impiden avanzar con datos incompletos
- [ ] Auto-save funciona (no pierde progreso)

**Performance**:
- [ ] Tiempos de respuesta < 5 segundos (promedio)
- [ ] No hay memory leaks (abrir/cerrar wizard múltiples veces)
- [ ] Responsive en mobile (aunque sidebar se oculte)

**Analytics**:
- [ ] Todas las llamadas IA se loguean
- [ ] Costos se calculan correctamente
- [ ] Vista `ai_generations_analytics` funciona

---

## 🐛 TROUBLESHOOTING

### "Error: ANTHROPIC_API_KEY not configured"
- Ir a Supabase Dashboard → Project Settings → Edge Functions
- Añadir secret: `ANTHROPIC_API_KEY=your_key_here`

### "Función devuelve 404"
- Verificar deployment: `supabase functions list`
- Re-deploy si necesario: `supabase functions deploy function-name`

### "Sidebar no se muestra"
- Verificar ancho de pantalla > 768px
- Inspeccionar con DevTools: clase `hidden md:flex` debe aplicarse

### "Logging no funciona"
- Verificar migration aplicada: `supabase db diff`
- Verificar policies RLS en tabla `ai_generations_log`

---

## 📊 MÉTRICAS A TRACKEAR (Post-Launch)

Después de 1 semana con usuarios reales:

1. **Completion Rate**:
   ```sql
   SELECT
     COUNT(DISTINCT project_id) as total_started,
     COUNT(DISTINCT project_id) FILTER (WHERE function_name = 'generate-complete-business') as total_completed
   FROM ai_generations_log
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

2. **Average Time to Complete**:
   Calcular: tiempo desde primer step hasta último

3. **Function Success Rate**:
   ```sql
   SELECT
     function_name,
     COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*) as success_rate
   FROM ai_generations_log
   GROUP BY function_name;
   ```

4. **User Satisfaction** (cuando implementes rating):
   ```sql
   SELECT AVG(user_rating) as avg_rating
   FROM ai_generations_log
   WHERE user_rating IS NOT NULL;
   ```

---

¡Listo para testear! 🚀
