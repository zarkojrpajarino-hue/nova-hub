# 🧪 TESTING: Meeting Intelligence System

## ✅ Prerequisitos

Antes de probar, asegúrate de:

1. ✅ **Base de datos creada** - Ejecutaste el SQL en Supabase
2. ✅ **App corriendo** - `npm run dev` en el terminal
3. ✅ **Sesión iniciada** - Estás logueado en la app
4. ✅ **Proyecto seleccionado** - Tienes un proyecto activo

---

## 🚀 Cómo Probar

### Paso 1: Acceder a la Página de Prueba

1. Con la app corriendo, ve a tu navegador
2. Navega a: **http://localhost:5173/test-meeting-intelligence**

Verás una página de prueba con:
- Título "Test: Meeting Intelligence"
- Botón grande "Iniciar Nueva Reunión"
- Lista de reuniones creadas (vacía inicialmente)

---

### Paso 2: Abrir el Modal de Configuración

1. Click en el botón **"Iniciar Nueva Reunión"**
2. Se abrirá el modal en 3 pasos

---

### Paso 3: Probar el PASO 1 - Información Básica

Prueba estas funcionalidades:

#### 📝 Título
- Escribe un título: `Sprint Planning Q1 2024`

#### 🎯 Tipo de Reunión
- Click en el desplegable
- Verás 20+ tipos organizados por categorías:
  - 🎯 Planning & Roadmap
  - 🔄 Seguimiento & Review
  - 💬 Retrospectiva & Mejora
  - 👥 Personas & Team
  - 💼 Cliente & Stakeholders
  - 🚨 Urgente & Crisis
- Selecciona cualquiera, por ejemplo: **"Sprint Planning"**
- O prueba: Selecciona "✏️ Personalizado" y escribe tu propio tipo

#### ⏰ Duración
- Selecciona una duración (por defecto 60 min)

#### 👥 Participantes
- Verás 5 participantes mock:
  - Juan Pérez (Product Manager)
  - María García (CTO)
  - Carlos López (CMO)
  - Ana Martínez (CFO)
  - Pedro Ruiz (Backend Developer)
- Selecciona al menos 2 participantes (por ejemplo: Juan, María, Carlos)

#### 📋 Miembros Asignables
- Los miembros NO seleccionados aparecen en esta sección
- Marca algunos (por ejemplo: Pedro Ruiz)
- Esto significa que pueden recibir tareas aunque no estén en la reunión

#### 🎯 Objetivos
- Escribe algo como: `Definir roadmap Q2 y asignar responsables`

#### ✅ Siguiente
- Click en **"Siguiente"** para pasar al Paso 2
- Si falta algo obligatorio, verás un toast de error

---

### Paso 4: Probar el PASO 2 - Contexto Estratégico

Prueba estas funcionalidades:

#### ⚠️ Decisiones Críticas
- Marca el checkbox "Sí, hay decisiones críticas"
- Escribe: `Decidir si lanzamos beta con features limitados`

#### 🎯 Áreas a Discutir
- Selecciona varias áreas:
  - ✅ Producto/Features
  - ✅ Marketing/Ventas
  - ✅ Tecnología

#### 🚫 Blockers Actuales
- Escribe: `API de pagos Stripe no funciona`

#### 🎯 OBVs a Discutir
- Verás 3 OBVs mock:
  - Lanzar Beta Q1 2024
  - Alcanzar €50K MRR
  - 1000 usuarios activos
- Selecciona algunos

#### 📊 Métricas a Revisar
- Escribe: `MRR, CAC, Churn Rate`

#### ✅ Siguiente
- Click en **"Siguiente"** para el Paso 3

---

### Paso 5: Probar el PASO 3 - Configuración IA

Verás 4 opciones de IA (todas activadas por defecto):

#### ❓ Preguntas de Clarificación
- La IA hará preguntas durante la reunión
- Modo silencioso (solo texto en pantalla)

#### 💡 IA como Guía Proactiva
- La IA sugerirá temas importantes
- Verás un ejemplo de recomendación

#### 🔍 Detección de Contexto
- La IA conectará con OBVs, tareas, métricas del proyecto

#### ⏰ Alertas de Tiempo
- La IA recordará temas pendientes cuando se acabe el tiempo

#### 📋 Resumen Final
- Verás un resumen de toda tu configuración

#### ✅ Iniciar Reunión
- Click en **"Iniciar Reunión"**
- Si todo está bien, se creará la reunión en la BD
- Verás un toast: "¡Reunión creada!"
- El modal se cerrará

---

### Paso 6: Verificar que se Guardó

Después de crear la reunión:

1. Verás la reunión en la lista de "Reuniones Creadas"
2. Debería mostrar:
   - Título que pusiste
   - Tipo de reunión
   - Duración estimada
   - Estado: "configuring"
   - Fecha de creación

---

### Paso 7: Verificar en la Base de Datos

Si quieres ver que realmente se guardó en Supabase:

1. Ve a [Supabase Dashboard](https://supabase.com)
2. SQL Editor → New Query
3. Ejecuta:
   ```sql
   SELECT * FROM meetings ORDER BY created_at DESC LIMIT 5;
   ```
4. Verás tu reunión con toda la data

También puedes ver los participantes:
```sql
SELECT
  mp.*,
  m.title as meeting_title
FROM meeting_participants mp
JOIN meetings m ON mp.meeting_id = m.id
ORDER BY mp.created_at DESC
LIMIT 10;
```

---

## 🧪 Checklist de Pruebas

### Funcionalidades Básicas
- [ ] Modal se abre correctamente
- [ ] Progress indicator funciona (3 pasos)
- [ ] Navegación Atrás/Siguiente funciona
- [ ] Botón "Cancelar" cierra el modal

### Paso 1: Información Básica
- [ ] Input de título funciona
- [ ] Desplegable de tipos muestra 20+ opciones organizadas
- [ ] Opción "Personalizado" permite escribir tipo custom
- [ ] Selector de duración funciona
- [ ] Checkboxes de participantes funcionan
- [ ] Sección de "Miembros asignables" se actualiza dinámicamente
- [ ] Textarea de objetivos funciona
- [ ] Validación: sin título → error
- [ ] Validación: sin tipo → error
- [ ] Validación: sin participantes → error

### Paso 2: Contexto Estratégico
- [ ] Checkbox de decisiones críticas funciona
- [ ] Textarea aparece/desaparece según checkbox
- [ ] Áreas de discusión son clickeables (grid de 2 columnas)
- [ ] Se marcan visualmente cuando están seleccionadas
- [ ] Textarea de blockers funciona
- [ ] Lista de OBVs aparece (3 mock)
- [ ] Checkboxes de OBVs funcionan
- [ ] Input de métricas funciona

### Paso 3: Configuración IA
- [ ] Alert informativo se muestra
- [ ] 4 checkboxes de configuración IA visibles
- [ ] Todas están marcadas por defecto
- [ ] Se pueden marcar/desmarcar
- [ ] Ejemplo de recomendación aparece cuando está activo
- [ ] Resumen final muestra la config correctamente

### Integración con BD
- [ ] Reunión se crea en tabla `meetings`
- [ ] Participantes se crean en `meeting_participants`
- [ ] Miembros asignables se crean con `attended: false`
- [ ] `strategic_context` se guarda como JSONB
- [ ] `status` es 'configuring'
- [ ] Toast de éxito aparece
- [ ] Lista de reuniones se actualiza automáticamente

---

## 🐛 Errores Comunes

### Error: "No puedo ver la página de prueba"
- **Solución**: Asegúrate de que la URL es exactamente `/test-meeting-intelligence`
- Verifica que el servidor esté corriendo (`npm run dev`)

### Error: "Por favor selecciona un proyecto primero"
- **Solución**: En el header de la app, usa el selector de proyectos para elegir uno
- Si no tienes proyectos, créa uno primero

### Error: Modal no se abre
- **Solución**: Abre la consola del navegador (F12) y mira si hay errores
- Verifica que los imports estén correctos

### Error: "Error al crear la reunión"
- **Solución**: Verifica que ejecutaste el SQL de migración en Supabase
- Revisa que las tablas existen: `meetings`, `meeting_participants`
- Mira los logs en consola para más detalles

---

## 📸 Screenshots Esperados

Si todo funciona, deberías ver:

### Página de Prueba
```
┌─────────────────────────────────────┐
│  🎙️ Test: Meeting Intelligence     │
│  Página de prueba para el sistema   │
├─────────────────────────────────────┤
│  ✅ Estado: BD creada | Modal impl. │
├─────────────────────────────────────┤
│  [🎙️ Iniciar Nueva Reunión]        │
│  ✓ Funcionalidades a probar (8)     │
├─────────────────────────────────────┤
│  📅 Reuniones Creadas                │
│  (Lista de reuniones o estado vacío)│
└─────────────────────────────────────┘
```

### Modal - Paso 1
```
┌─────────────────────────────────────┐
│  🎙️ Iniciar Reunión Inteligente     │
│  Progress: [1]━━[2]──[3]            │
├─────────────────────────────────────┤
│  Título: [Sprint Planning Q1...]    │
│  Tipo: [Sprint Planning ▼]          │
│  Duración: [60 min ▼]               │
│  👥 Participantes:                   │
│    ☑ Juan Pérez (Product Manager)   │
│    ☑ María García (CTO)             │
│  📋 Miembros asignables:             │
│    ☑ Pedro Ruiz (Backend Dev)       │
│  Objetivos: [Definir roadmap...]    │
├─────────────────────────────────────┤
│  [Cancelar]       [Siguiente →]     │
└─────────────────────────────────────┘
```

---

## ✅ Resultado Esperado

Si todo funciona correctamente:

1. ✅ Modal se abre sin errores
2. ✅ Puedes navegar entre los 3 pasos
3. ✅ Todas las validaciones funcionan
4. ✅ Al crear la reunión, aparece en la lista
5. ✅ Los datos se guardan en Supabase

---

## 🎯 Siguiente Paso

Una vez verificado que todo funciona:
1. **Eliminar página de prueba** (es temporal)
2. **Continuar con Tarea #43**: Sistema de grabación de audio
3. **O implementar navegación real** (Tarea #53): Añadir botón en el UI principal

---

**¿Todo funcionó? ¡Avísame para continuar con el siguiente componente! 🚀**
