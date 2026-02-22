# 🚀 GUÍA RÁPIDA DE TESTING - GENERATIVE ONBOARDING

## ⚡ TEST EN 5 MINUTOS

### PASO 1: Iniciar frontend (30 segundos)

```bash
cd /c/Users/Zarko/nova-hub
npm run dev
```

Abre browser en: http://localhost:5173

---

### PASO 2: Login y navegar (30 segundos)

1. Login con tu usuario
2. Selecciona o crea un proyecto
3. Click en sidebar → "✨ Generative Onboarding"

Deberías ver una card con:
- "Generative Onboarding"
- "De idea a negocio completo en menos de 10 minutos"
- Botón "Comenzar Generative Onboarding"

---

### PASO 3: Probar wizard (2 minutos)

1. Click "Comenzar Generative Onboarding"
2. Modal aparece con título "Generative Onboarding"
3. Añade 3+ intereses:
   - Escribe "fitness" → Click + (o Enter)
   - Escribe "tecnología" → Click + (o Enter)
   - Escribe "sostenibilidad" → Click + (o Enter)
4. Click "Generar ideas de negocio"
5. Espera 10-20 segundos
6. Deberían aparecer 5-10 tarjetas con ideas

**✅ SI FUNCIONA**: Aparecen ideas generadas
**❌ SI FALLA**: Ver sección de errores abajo

---

### PASO 4: Seleccionar idea y generar negocio (1 minuto)

1. Click en cualquier idea (toda la card es clickable)
2. Aparece checkmark verde
3. Espera 30-60 segundos
4. Modal muestra "Generando tu negocio..."
5. Animación con Sparkles
6. Lista de pasos ejecutándose

**✅ SI FUNCIONA**: Modal cambia a "¡Negocio generado!"
**❌ SI FALLA**: Ver sección de errores abajo

---

### PASO 5: Ver opciones de branding (1 minuto)

1. Click "Ver opciones de branding"
2. Modal muestra 3 cards con:
   - Logo (imagen DALL-E)
   - Nombre de empresa
   - Tagline
   - 3 colores
   - Tipografías
3. Click en Opción 2
4. Click "Aplicar Opción 2"
5. Espera 30-60 segundos

**✅ SI FUNCIONA**: Redirige a dashboard con todo el negocio
**❌ SI FALLA**: Ver sección de errores abajo

---

### PASO 6: Verificar dashboard (30 segundos)

Deberías ver:

✅ **Sección Branding**:
- Logo
- 3 colores (primario, secundario, acento)
- Tipografías
- Tono de comunicación

✅ **Sección Productos**:
- 5 productos con nombres creativos
- Precios
- Descripciones
- Features

✅ **Sección Cliente Ideal**:
- Nombre de buyer persona
- Edad, rol
- Presupuesto min/max
- Pain points

✅ **Sección Experimentos de Validación**:
- 3 experimentos
- Hipótesis
- Criterios de éxito

✅ **Botón "Ver Website"** (arriba a la derecha)
- Click → Abre website deployado en Vercel

---

## ❌ ERRORES COMUNES Y SOLUCIONES

### Error 1: "Failed to generate ideas"

**Síntoma**: Click en "Generar ideas" → Toast error rojo

**Causas posibles**:
1. Edge Function no deployada
2. ANTHROPIC_API_KEY no configurada

**Solución**:
```bash
# Verificar si función está deployada
npx supabase functions list

# Si no está, deployar:
npx supabase functions deploy generate-business-ideas

# Verificar secrets
npx supabase secrets list

# Si falta ANTHROPIC_API_KEY:
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
```

---

### Error 2: "Project ID required"

**Síntoma**: Error al abrir wizard

**Causa**: No estás en un proyecto específico

**Solución**: Navega a un proyecto primero (URL debe ser `/proyecto/xxx`)

---

### Error 3: No aparecen logos (logo_url es null)

**Síntoma**: Opciones de branding sin imágenes, solo letra inicial

**Causa**: DALL-E falló (OPENAI_API_KEY no configurada o cuota excedida)

**Solución**:
```bash
npx supabase secrets set OPENAI_API_KEY=sk-xxx
```

**Workaround**: El sistema funciona igual, solo sin logos. Puedes añadirlos después manualmente.

---

### Error 4: Website no se deploya (sin botón "Ver Website")

**Síntoma**: Dashboard muestra todo excepto botón de website

**Causa**: VERCEL_TOKEN no configurado

**Solución (OPCIONAL)**:
```bash
# Obtén token en https://vercel.com/account/tokens
npx supabase secrets set VERCEL_TOKEN=xxx
```

**Nota**: El HTML se genera igual, solo no se deploya. Puedes deployar manualmente desde `company_assets.website_html`

---

### Error 5: "Failed to approve preview"

**Síntoma**: Click en "Aplicar Opción X" → Error

**Causa**: Edge Function approve-generation-preview falló

**Solución**:
```bash
# Redeploy función
npx supabase functions deploy approve-generation-preview

# Ver logs
npx supabase functions logs approve-generation-preview
```

---

## 🔍 DEBUG RÁPIDO

### Ver logs de Edge Functions:

```bash
# Ver logs en tiempo real
npx supabase functions logs --tail

# Ver logs de función específica
npx supabase functions logs generate-complete-business --tail
```

### Ver datos en Supabase:

1. Abre Supabase dashboard
2. Table Editor
3. Verifica tablas:
   - `generated_business_ideas` → Deberían aparecer ideas
   - `generation_previews` → Debería aparecer preview con status 'pending' o 'approved'
   - `brand_guidelines` → Debería aparecer branding aplicado
   - `products` → Deberían aparecer 5 productos

### Ver Network en browser:

1. F12 → Network tab
2. Filter: Fetch/XHR
3. Click "Generar ideas"
4. Busca request a `generate-business-ideas`
5. Click → Response → Deberías ver JSON con ideas

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de reportar un error, verifica:

- [ ] Frontend corriendo (`npm run dev`)
- [ ] Login exitoso
- [ ] Dentro de un proyecto (URL `/proyecto/xxx`)
- [ ] Edge Functions deployadas (`npx supabase functions list`)
- [ ] ANTHROPIC_API_KEY configurada (`npx supabase secrets list`)
- [ ] SQL ejecutado correctamente (tablas existen)
- [ ] Browser console sin errores rojos

---

## 🎯 TEST COMPLETO (10 MINUTOS)

Si quieres hacer un test exhaustivo:

### 1. Test de generación de ideas (2 min)

- [ ] Añadir 3 intereses
- [ ] Generar ideas
- [ ] Verificar que aparecen 5-10 ideas
- [ ] Verificar que cada idea tiene: nombre, descripción, problema, solución, cliente objetivo
- [ ] Verificar que "Por qué es viable" está presente

### 2. Test de selección de idea (1 min)

- [ ] Click en idea
- [ ] Checkmark verde aparece
- [ ] Mensaje "Seleccionando idea..." aparece
- [ ] Auto-avanza a generar negocio

### 3. Test de generación de negocio (2 min)

- [ ] Modal "Generando tu negocio..." aparece
- [ ] Animación de Sparkles
- [ ] 5 pasos mostrados con loaders
- [ ] Después de 30-60 segundos → "¡Negocio generado!"

### 4. Test de selector de branding (2 min)

- [ ] 3 opciones mostradas
- [ ] Cada opción tiene logo (si DALL-E configurado)
- [ ] Cada opción tiene colores diferentes
- [ ] Click en opción → Checkmark verde
- [ ] Click "Aplicar" → Loading 30-60 segundos
- [ ] Toast verde "Negocio aplicado correctamente"

### 5. Test de dashboard (2 min)

- [ ] Sección Branding visible
- [ ] Logo mostrado (si DALL-E funcionó)
- [ ] 3 colores mostrados
- [ ] Tipografías mostradas
- [ ] Sección Productos con 5 items
- [ ] Cada producto tiene precio
- [ ] Buyer Persona mostrado
- [ ] 3 Experimentos de Validación
- [ ] Botón "Ver Website" (si Vercel configurado)

### 6. Test de website deployado (1 min)

- [ ] Click "Ver Website"
- [ ] Abre en nueva pestaña
- [ ] Website muestra branding aplicado
- [ ] Website tiene productos listados
- [ ] Website tiene CTA

---

## 📊 TIEMPOS ESPERADOS

| Acción | Tiempo esperado |
|--------|----------------|
| Generar ideas | 10-20 segundos |
| Seleccionar idea | 1-2 segundos |
| Generar negocio completo | 30-60 segundos |
| Aplicar branding | 30-60 segundos |
| Total end-to-end | 2-3 minutos |

---

## 💰 COSTOS ESPERADOS

| Servicio | Costo por generación |
|----------|---------------------|
| Claude API (16k tokens) | ~$0.40 |
| DALL-E 3 (3 logos) | ~$0.12 |
| Vercel (deployment) | Gratis |
| Resend (emails) | Gratis (100/día) |
| **TOTAL** | **~$0.52** |

---

## 🎉 ÉXITO

Si todo funciona:

✅ Wizard completo
✅ Ideas generadas
✅ Negocio completo creado
✅ Branding seleccionado
✅ Dashboard poblado
✅ Website deployado

**¡Felicidades! Generative Onboarding está 100% funcional.**

Ahora puedes empezar a validar tu idea con clientes reales usando los experimentos sugeridos.

---

## 📞 SOPORTE

Si algo falla después de seguir esta guía:

1. Verifica logs: `npx supabase functions logs --tail`
2. Verifica browser console (F12)
3. Verifica Supabase dashboard (Table Editor)
4. Compara con datos esperados en esta guía

Si persiste el error, reporta con:
- Screenshot del error
- Logs de Edge Function
- Mensaje exacto del error
- Paso donde falló
