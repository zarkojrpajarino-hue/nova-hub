# 📝 Guía de Onboarding Editable - Nova Hub

**Fecha:** 27 Enero 2026
**Estado:** ✅ Sistema completo implementado

---

## 🎯 COMPONENTES CREADOS

### 1. Hook para Edición
**Archivo:** `src/hooks/useOnboardingEdit.ts`

**Características:**
- ✅ Actualiza datos de onboarding en la base de datos
- ✅ Gestiona cambios en el equipo (agregar/eliminar miembros)
- ✅ Sincroniza project_members con la selección actual
- ✅ Invalida queries de React Query automáticamente
- ✅ Toast notifications para feedback al usuario

**Uso:**
```typescript
const { saveOnboardingData, isSaving } = useOnboardingEdit({
  projectId: project.id,
  onSuccess: () => console.log('Guardado!'),
});

await saveOnboardingData(onboardingData, selectedMembers);
```

### 2. OnboardingWizard Actualizado
**Archivo:** `src/components/onboarding/OnboardingWizard.tsx`

**Cambios realizados:**
- ✅ Nuevo prop `editMode?: boolean`
- ✅ Carga de miembros existentes en modo edición
- ✅ Botón final cambia de "Completar Onboarding" a "Save Changes"
- ✅ Usa hook `useOnboardingEdit` en modo edición
- ✅ Iconos diferentes: Rocket (inicial) vs Save (edición)

**Props:**
```typescript
interface OnboardingWizardProps {
  project: {
    id: string;
    nombre: string;
    tipo: string;
    color: string;
    icon: string;
    onboarding_data?: OnboardingData | null;
  };
  onComplete?: () => void;
  onCancel?: () => void;
  editMode?: boolean; // NEW
}
```

### 3. EditOnboardingDialog Component
**Archivo:** `src/components/onboarding/EditOnboardingDialog.tsx`

**Características:**
- ✅ Dialog modal que envuelve OnboardingWizard
- ✅ Activado con `editMode={true}`
- ✅ Max width 4xl para visualización cómoda
- ✅ Scroll automático si el contenido es largo
- ✅ Cierra el dialog al guardar cambios

**Uso:**
```typescript
import { EditOnboardingDialog } from '@/components/onboarding/EditOnboardingDialog';

const [editOpen, setEditOpen] = useState(false);

<EditOnboardingDialog
  open={editOpen}
  onOpenChange={setEditOpen}
  project={project}
/>
```

---

## 📚 EJEMPLOS DE INTEGRACIÓN

### Ejemplo 1: Botón en Project Settings

```typescript
// src/pages/ProjectSettings.tsx o similar

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { EditOnboardingDialog } from '@/components/onboarding/EditOnboardingDialog';

export function ProjectSettings({ project }: { project: Project }) {
  const [editOnboardingOpen, setEditOnboardingOpen] = useState(false);

  return (
    <div>
      {/* Other settings */}

      <Card>
        <CardHeader>
          <CardTitle>Configuración del Proyecto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Onboarding Section */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Datos del Onboarding</h4>
              <p className="text-sm text-muted-foreground">
                Edita la información del proyecto y el equipo
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setEditOnboardingOpen(true)}
              disabled={!project.onboarding_completed}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar Onboarding
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditOnboardingDialog
        open={editOnboardingOpen}
        onOpenChange={setEditOnboardingOpen}
        project={project}
      />
    </div>
  );
}
```

### Ejemplo 2: Botón en Project Header

```typescript
// src/components/project/ProjectHeader.tsx

import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditOnboardingDialog } from '@/components/onboarding/EditOnboardingDialog';

export function ProjectHeader({ project }: { project: Project }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1>{project.nombre}</h1>
        <p>{project.tipo}</p>
      </div>

      <div className="flex items-center gap-2">
        {project.onboarding_completed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Editar Info
          </Button>
        )}
      </div>

      <EditOnboardingDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />
    </div>
  );
}
```

### Ejemplo 3: Dropdown Menu Option

```typescript
// En cualquier dropdown de acciones del proyecto

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit2, MoreVertical } from 'lucide-react';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="w-4 h-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => setEditOnboardingOpen(true)}>
      <Edit2 className="w-4 h-4 mr-2" />
      Editar Onboarding
    </DropdownMenuItem>
    {/* Other options */}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 🔧 CÓMO FUNCIONA

### Flujo Inicial (Primera vez)

1. Usuario completa el onboarding wizard
2. Se crea `onboarding_data` en la tabla `projects`
3. Se guardan los miembros en `project_members`
4. Se marca `onboarding_completed = true`
5. Se generan roles con IA (flujo original)

### Flujo de Edición (Edit Mode)

1. Usuario hace clic en "Editar Onboarding"
2. Se abre `EditOnboardingDialog` con `editMode={true}`
3. `OnboardingWizard` carga datos existentes:
   - `onboarding_data` → formulario
   - `project_members` → selección de equipo
4. Usuario modifica los campos o el equipo
5. Click en "Save Changes"
6. Hook `useOnboardingEdit`:
   - Actualiza `onboarding_data`
   - Calcula diff de miembros (agregar/eliminar)
   - Actualiza `project_members`
   - Invalida queries
7. Dialog se cierra, cambios guardados

---

## 📋 DIFERENCIAS MODO INICIAL VS MODO EDICIÓN

| Característica | Modo Inicial | Modo Edición |
|----------------|--------------|--------------|
| **Prop editMode** | `false` (default) | `true` |
| **Botón final** | "Completar Onboarding" 🚀 | "Save Changes" 💾 |
| **Color botón** | Verde (`bg-green-600`) | Predeterminado (primary) |
| **Mensaje toast** | "¡Equipo configurado! Generando roles con IA..." | "Cambios guardados correctamente" |
| **Carga inicial** | Defaults o draft | Datos existentes + miembros actuales |
| **Callback** | Genera roles con IA | Solo invalida queries |

---

## 🎨 UI/UX

### Estados visuales:

**Botón deshabilitado:**
- Si no se completó el onboarding originalmente
- Tooltip: "Completa el onboarding inicial primero"

**Botón habilitado:**
- Solo si `project.onboarding_completed === true`
- Texto claro: "Editar Onboarding" o "Editar Info"

**Durante el guardado:**
- Botón muestra loading spinner
- Texto: "Guardando..."
- Botón deshabilitado

**Después de guardar:**
- Toast de éxito
- Dialog se cierra automáticamente
- Datos se refrescan en la UI

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Completado ✅
- [x] Crear hook `useOnboardingEdit`
- [x] Modificar `OnboardingWizard` con prop `editMode`
- [x] Crear `EditOnboardingDialog` component
- [x] Cargar miembros existentes en modo edición
- [x] Cambiar texto y estilo del botón final
- [x] Usar hook de edición en validateAndSubmit

### Pendiente ⏳
- [ ] Integrar botón en Project Settings
- [ ] Integrar botón en Project Header
- [ ] Probar edición completa end-to-end
- [ ] Validar que diff de miembros funciona correctamente

---

## 🐛 TROUBLESHOOTING

### El botón "Editar Onboarding" no aparece
**Causa:** `project.onboarding_completed` es `false`
**Solución:** Solo aparece si el onboarding ya fue completado

### Al editar, no se cargan los miembros actuales
**Causa:** Query de `project_members` falla
**Solución:** Verificar que hay miembros en la tabla y que el `project_id` es correcto

### Los cambios no se guardan
**Causa:** Hook `useOnboardingEdit` tiene error
**Solución:** Revisar console.error y verificar permisos en Supabase

### El dialog no se cierra después de guardar
**Causa:** `onSuccess` callback no se está llamando
**Solución:** Verificar que `onOpenChange(false)` se llama en `handleComplete`

---

## 📊 DATOS EDITABLES

### Proyectos tipo "Validación":
- **Step 0:** Equipo (miembros)
- **Step 1:** Problema
- **Step 2:** Cliente
- **Step 3:** Solución
- **Step 4:** Hipótesis
- **Step 5:** Corea/España
- **Step 6:** Métricas
- **Step 7:** Recursos

### Proyectos tipo "Operación":
- **Step 0:** Equipo (miembros)
- **Step 1:** Canvas (parte 1)
- **Step 2:** Canvas (parte 2)
- **Step 3:** Finanzas
- **Step 4:** Clientes
- **Step 5:** Objetivos

---

## 🚀 PRÓXIMOS PASOS

1. **Integrar en la UI:**
   - Agregar botón en Project Settings
   - Agregar opción en dropdown de proyecto

2. **Testing:**
   - Probar edición completa
   - Verificar cambios en equipo
   - Validar que se guardan todos los campos

3. **Mejoras futuras (opcional):**
   - Historial de cambios en onboarding
   - Notificar a miembros removidos
   - Preview de cambios antes de guardar

---

**Estado:** ✅ Sistema completo y listo para integración
**Archivos creados:** 3 (hook, dialog, docs)
**Archivos modificados:** 1 (OnboardingWizard)
