# 🎯 Ultra-Personalized Onboarding - Flujo Correcto

## 📍 Flujo de Usuario Primera Vez

```
1. Usuario se loguea
   ↓
2. RootRedirect detecta: no tiene proyectos
   ↓
3. → /select-onboarding-type
   ↓
   Pantalla: "¡Bienvenido a Optimus-K!"
   
   3 Opciones:
   ┌─────────────────────────────────────────┐
   │ 💡 ¿No tienes idea?                     │
   │ → IA genera 3 business options          │
   │ → Geo-intelligence local                │
   │ → Proyecciones financieras              │
   │                                         │
   │ [Seleccionar] → type=generative         │
   └─────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────┐
   │ 🎯 Tengo una idea                       │
   │ → SWOT matrix vs competidores           │
   │ → Market gaps + strategy                │
   │ → Roadmap de validación                 │
   │                                         │
   │ [Seleccionar] → type=idea               │
   └─────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────┐
   │ 📈 Startup existente                    │
   │ → Growth diagnostic honesto             │
   │ → Benchmarking vs industria             │
   │ → Action plan + quick wins              │
   │                                         │
   │ [Seleccionar] → type=existing           │
   └─────────────────────────────────────────┘
   
   ↓
4. → /create-first-project?type={tipo}
   ↓
   Pantalla: "💡 IA te genera 3 opciones de negocio"
   
   [Comenzar Onboarding]
   ↓
   Crea proyecto mínimo en DB
   ↓
5. → /proyecto/{projectId}/ultra-onboarding
   ↓
   ┌─────────────────────────────────────────┐
   │ EnhancedOnboardingWizard                │
   │                                         │
   │ STEP 1: Type Selection (auto-skip)     │
   │ STEP 2: Essentials (nombre, etc)       │
   │ STEP 3: Location (geo-intelligence)    │
   │ STEP 4: Founder Profile                │
   │ STEP 5: Type-Specific Questions        │
   │ STEP 6: Generate Insights (IA)         │
   │ STEP 7: Results                         │
   │   - GENERATIVO: 3 business options      │
   │   - IDEA: SWOT + strategy               │
   │   - EXISTING: Growth diagnostic         │
   │ STEP 8: Learning Path                   │
   │ STEP 9: Complete                        │
   └─────────────────────────────────────────┘
   ↓
6. → /proyecto/{projectId}
   ↓
   Dashboard del proyecto ✅
```

---

## 🔄 Flujo de Usuario con Proyectos Existentes

```
1. Usuario se loguea
   ↓
2. RootRedirect detecta: tiene proyectos
   ↓
3. Si no tiene proyecto seleccionado:
   → /select-project
   
   Si ya tiene proyecto seleccionado:
   → /proyecto/{projectId}
   ↓
   Dashboard ✅
```

---

## 📁 Archivos Modificados

### 1. SelectOnboardingTypePage.tsx ✅
**Cambios**:
- IDs cambiados: `generacion-ideas` → `generative`
- IDs cambiados: `tengo-idea` → `idea`  
- IDs cambiados: `startup-existente` → `existing`
- Features actualizadas con capas del ultra onboarding

### 2. CreateFirstProjectPage.tsx ✅
**Cambios**:
- typeMapping actualizado para nuevos IDs
- Navegación cambiada: `/generative-onboarding` → `/ultra-onboarding`
- typeContent actualizado con nuevas descripciones

### 3. UltraOnboardingView.tsx ✅
**Cambios**:
- Simplificado para auto-iniciar wizard
- Removido header innecesario
- Loading state limpio

### 4. NovaSidebar.tsx ✅
**Cambios**:
- **ELIMINADO** item "Ultra Onboarding" del sidebar
- No debe estar en navegación normal
- Solo se accede en flujo de primer proyecto

---

## 🎯 Diferencia con Generative Onboarding

### Generative Onboarding (existente)
- **Propósito**: Genera startup completa con branding
- **Output**: Logo, productos, website deployado, buyer personas
- **Uso**: Feature premium separada
- **Acceso**: Desde sidebar o vista de proyectos

### Ultra Onboarding (nuevo)
- **Propósito**: Onboarding inicial personalizado con 10 capas
- **Output**: Business options / SWOT / Growth diagnostic + Learning path
- **Uso**: OBLIGATORIO para primer proyecto
- **Acceso**: Solo en flujo de creación inicial

**Coexisten**: Son diferentes features con propósitos distintos

---

## 🚀 Cómo Testear

### Test Flujo Completo:

1. **Crear usuario nuevo** o **borrar todos los proyectos**
2. **Login** en la app
3. Verificar redirección a `/select-onboarding-type`
4. Ver 3 opciones con features del ultra onboarding
5. Click en "💡 ¿No tienes idea?" (generative)
6. Verificar redirección a `/create-first-project?type=generative`
7. Click "Comenzar Onboarding"
8. Verificar navegación a `/proyecto/{id}/ultra-onboarding`
9. Completar wizard:
   - Essentials
   - Location (Madrid, España)
   - Founder profile
   - Constraints
   - IA genera 3 business options
   - Seleccionar opción
   - Learning path
10. Click "Completar"
11. Verificar redirección a `/proyecto/{id}` (Dashboard)

### Test Tipo IDEA:

1. Repetir pasos 1-3
2. Click en "🎯 Tengo una idea" (idea)
3. Completar wizard
4. Verificar que genere SWOT + market gaps

### Test Tipo EXISTING:

1. Repetir pasos 1-3
2. Click en "📈 Startup existente" (existing)
3. Ingresar métricas (MRR, churn, etc)
4. Verificar que genere growth diagnostic

---

## ✅ Estado Actual

- ✅ Flujo corregido
- ✅ Edge functions deployed
- ✅ Frontend integrado
- ✅ Sidebar limpio (eliminado ultra-onboarding)
- ⏳ Migración DB pendiente (5 min)

---

## 📝 Próximos Pasos

1. **Aplicar migración DB** (ver DEPLOYMENT_COMPLETE.md)
2. **Test end-to-end** de los 3 flujos
3. **Verificar guardado en DB**
4. **Monitorear logs** de edge functions

---

**Última actualización**: 2026-02-05
**Status**: 🟢 FLUJO CORREGIDO
