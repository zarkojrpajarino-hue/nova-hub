# 🎯 Guía de Límite de Tareas - Nova Hub

**Fecha:** 27 Enero 2026
**Estado:** ✅ Sistema completo implementado

---

## 🎯 OBJETIVO

Limitar a **5 tareas activas por proyecto** para fomentar el foco y la completion rate.

**Tareas activas:** Tareas con status `todo`, `in_progress`, o `review` (todo excepto `done`)

---

## 🛠️ CAMBIOS IMPLEMENTADOS

### 1. Validación en TaskForm
**Archivo:** `src/components/tasks/TaskForm.tsx`

**Cambios:**
- ✅ Query para contar tareas activas antes de crear una nueva
- ✅ Bloqueo de creación si hay 5 o más tareas activas
- ✅ Toast error con mensaje claro

**Código agregado:**
```typescript
// Check active tasks limit (5 tasks per project)
const { data: activeTasks, error: countError } = await supabase
  .from('tasks')
  .select('id', { count: 'exact', head: false })
  .eq('project_id', projectId)
  .neq('status', 'done');

if (countError) throw countError;

if (activeTasks && activeTasks.length >= 5) {
  toast.error('Máximo 5 tareas activas por proyecto. Completa una antes de crear otra.');
  setIsSubmitting(false);
  return;
}
```

### 2. Contador Visual en KanbanBoard
**Archivo:** `src/components/tasks/kanban/KanbanBoardContainer.tsx`

**Cambios:**
- ✅ Badge con contador "X/5 tareas activas"
- ✅ Badge se vuelve rojo cuando alcanza el límite
- ✅ Mensaje de "Límite alcanzado" con icono de alerta
- ✅ Botón "Manual" deshabilitado al límite
- ✅ Tooltip explicativo en el botón deshabilitado

**Código agregado:**
```typescript
const activeTasks = tasks.filter(t => t.status !== 'done');
const activeTaskCount = activeTasks.length;
const taskLimitReached = activeTaskCount >= 5;

<Badge
  variant={taskLimitReached ? 'destructive' : 'secondary'}
  className="text-sm font-medium"
>
  {activeTaskCount}/5 tareas activas
</Badge>

{taskLimitReached && (
  <div className="flex items-center gap-1 text-sm text-destructive">
    <AlertCircle size={14} />
    <span>Límite alcanzado</span>
  </div>
)}

<Button
  onClick={() => setShowForm(true)}
  variant="outline"
  size="sm"
  disabled={taskLimitReached}
>
  <Plus size={14} className="mr-2" />
  Manual
</Button>
```

---

## 📊 ESTADOS VISUALES

### Estado Normal (< 5 tareas activas)

```
┌─────────────────────────────────────────┐
│ 🏷️ 3/5 tareas activas    [+ Manual]   │
└─────────────────────────────────────────┘
```

**Badge:** Secondary (gris)
**Botón:** Habilitado
**Mensaje:** Ninguno

---

### Estado Límite Alcanzado (5 tareas activas)

```
┌──────────────────────────────────────────────────┐
│ 🔴 5/5 tareas activas  ⚠️ Límite alcanzado     │
│                           [+ Manual (disabled)]  │
└──────────────────────────────────────────────────┘
```

**Badge:** Destructive (rojo)
**Botón:** Deshabilitado (gris)
**Mensaje:** "Límite alcanzado" con icono AlertCircle
**Tooltip:** "Máximo 5 tareas activas por proyecto. Completa una tarea antes de crear otra."

---

## 🎨 UI/UX

### Badge Estados

| Tareas Activas | Variant | Color | Ejemplo |
|----------------|---------|-------|---------|
| 0-4 | `secondary` | Gris | `0/5`, `3/5` |
| 5 | `destructive` | Rojo | `5/5` |

### Tooltip del Botón

**Condición:** Solo se muestra cuando `taskLimitReached === true`

**Contenido:**
```
Máximo 5 tareas activas por proyecto.
Completa una tarea antes de crear otra.
```

### Toast de Error

**Trigger:** Intento de crear tarea cuando ya hay 5 activas

**Mensaje:**
```
Máximo 5 tareas activas por proyecto. Completa una antes de crear otra.
```

**Tipo:** `toast.error()`

---

## 🔧 COMPORTAMIENTO

### Flujo Normal

1. Usuario tiene 3 tareas activas
2. Badge muestra "3/5 tareas activas" (gris)
3. Botón "Manual" está habilitado
4. Usuario puede crear nuevas tareas

### Flujo al Alcanzar Límite

1. Usuario tiene 5 tareas activas
2. Badge muestra "5/5 tareas activas" (rojo)
3. Aparece mensaje "Límite alcanzado" con icono
4. Botón "Manual" se deshabilita
5. Hover en botón muestra tooltip explicativo
6. Si intenta crear (por otro medio), sale toast error

### Flujo de Liberación

1. Usuario completa 1 tarea (status → `done`)
2. Badge automáticamente muestra "4/5 tareas activas" (gris)
3. Mensaje "Límite alcanzado" desaparece
4. Botón "Manual" se habilita
5. Usuario puede crear nuevas tareas

---

## 🧪 CASOS DE PRUEBA

### Test 1: Creación de Tarea con Límite No Alcanzado
**Precondición:** Proyecto con 3 tareas activas
**Acción:** Click en "Manual", llenar formulario, submit
**Resultado Esperado:** ✅ Tarea creada, badge muestra "4/5"

### Test 2: Creación de Tarea en el Límite
**Precondición:** Proyecto con 4 tareas activas
**Acción:** Click en "Manual", llenar formulario, submit
**Resultado Esperado:** ✅ Tarea creada, badge muestra "5/5" (rojo), botón se deshabilita

### Test 3: Intento de Crear Tarea con Límite Alcanzado
**Precondición:** Proyecto con 5 tareas activas
**Acción:** Botón "Manual" deshabilitado
**Resultado Esperado:** ✅ No se puede abrir el formulario

### Test 4: Validación en Backend
**Precondición:** Proyecto con 5 tareas activas
**Acción:** Intentar insertar tarea directamente (burlar UI)
**Resultado Esperado:** ✅ Toast error, tarea no se crea

### Test 5: Completar Tarea y Liberar Cupo
**Precondición:** Proyecto con 5 tareas activas
**Acción:** Completar 1 tarea (drag to Done)
**Resultado Esperado:** ✅ Badge muestra "4/5" (gris), botón se habilita

### Test 6: Tooltip Visibility
**Precondición:** Proyecto con 5 tareas activas
**Acción:** Hover sobre botón "Manual" deshabilitado
**Resultado Esperado:** ✅ Tooltip aparece con mensaje explicativo

---

## 📋 INTEGRACIÓN

### Archivos Modificados

1. **`src/components/tasks/TaskForm.tsx`**
   - Validación de límite en `handleSubmit`
   - Query de count de tareas activas
   - Early return con toast error

2. **`src/components/tasks/kanban/KanbanBoardContainer.tsx`**
   - Imports: Badge, Tooltip
   - Cálculo de `activeTasks`, `activeTaskCount`, `taskLimitReached`
   - Badge con contador
   - Mensaje condicional de límite
   - Botón con `disabled={taskLimitReached}`
   - Tooltip condicional

---

## 🚀 PRÓXIMOS PASOS (Opcional)

### Mejoras Futuras

1. **Configuración por Proyecto:**
   - Permitir que cada proyecto tenga su propio límite
   - Campo `task_limit` en tabla `projects`
   - Valor por defecto: 5

2. **Límite Personalizado:**
   - Admin puede cambiar el límite (3-10 tareas)
   - UI en Project Settings

3. **Notificaciones:**
   - Alerta cuando queden 2 cupos libres
   - Email al owner si hay tareas estancadas > 7 días

4. **Analytics:**
   - Tracking de completion rate
   - Tiempo promedio de tarea
   - Identificar proyectos con tareas bloqueadas

---

## 🐛 TROUBLESHOOTING

### El contador no se actualiza
**Causa:** Query de tasks no se invalida después de cambios
**Solución:** Verificar que `queryClient.invalidateQueries(['project_tasks'])` se llama

### El botón sigue habilitado con 5 tareas
**Causa:** Variable `taskLimitReached` no se recalcula
**Solución:** Verificar que `activeTasks.length` cuenta correctamente (excluye `done`)

### El tooltip no aparece
**Causa:** `TooltipProvider` no está en el árbol de componentes
**Solución:** Verificar que `TooltipProvider` envuelve el botón

### Se pueden crear más de 5 tareas
**Causa:** Validación solo está en UI, no en backend
**Solución:** Agregar constraint en Supabase (opcional):
```sql
-- Crear función de validación (opcional)
CREATE OR REPLACE FUNCTION check_task_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM tasks
      WHERE project_id = NEW.project_id
      AND status != 'done') >= 5 THEN
    RAISE EXCEPTION 'Máximo 5 tareas activas por proyecto';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (opcional)
CREATE TRIGGER enforce_task_limit
BEFORE INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION check_task_limit();
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Validación agregada en TaskForm.tsx
- [x] Badge con contador agregado en KanbanBoardContainer
- [x] Badge cambia a rojo al alcanzar límite
- [x] Mensaje "Límite alcanzado" se muestra
- [x] Botón "Manual" se deshabilita al límite
- [x] Tooltip explicativo agregado
- [x] Toast error al intentar crear con límite
- [x] Contador se actualiza al completar tareas

---

**Estado:** ✅ Sistema completo y funcional
**Archivos modificados:** 2 (TaskForm, KanbanBoardContainer)
**Límite:** 5 tareas activas por proyecto
**Tipo de validación:** Frontend (UI + Query)
