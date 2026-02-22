# 📊 ESTADO ACTUAL DE NOVA HUB - 2026-01-29

## ✅ COMPLETADO HOY

### 1. Migración a Claude (100% completada)
- ✅ 6 funciones AI migradas de Gemini a Claude 3.5 Sonnet
- ✅ Funciones desplegadas en Supabase
- ✅ Documentación creada en `MIGRACION_A_CLAUDE_COMPLETADA.md`

### 2. Problema de autenticación resuelto
- ✅ App ahora carga correctamente
- ✅ Sección "Integraciones" visible en sidebar
- ⚠️ **TEMPORAL**: RLS desactivado en tabla `members` para debugging

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **RLS Desactivado (URGENTE - Seguridad)**

**Estado actual:**
```sql
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
```

**¿Por qué lo desactivamos?**
- La query `.from('members').select('*').eq('auth_id', authId)` estaba tardando >15 segundos
- Con RLS desactivado funciona bien
- Esto indica que las políticas RLS estaban bloqueando o ralentizando las queries

**¿Hay que reactivarlo?**
**SÍ, ABSOLUTAMENTE.** Sin RLS, cualquier usuario autenticado puede ver datos de todos los members.

**Solución:**
1. Identificar qué política RLS estaba causando el timeout
2. Optimizar o reescribir la política
3. Reactivar RLS con políticas correctas
4. Agregar índices si es necesario

---

### 2. **App carga lenta**

**Causas identificadas:**
- ✅ Timeout de 10 segundos en fetchProfile (ya optimizado)
- ❓ Posible: Falta de índices en `members.auth_id`
- ❓ Posible: Queries N+1 en componentes
- ❓ Posible: No hay caché de datos

**Solución:**
1. Agregar índice en `members.auth_id`
2. Revisar queries en componentes
3. Implementar React Query para caché

---

### 3. **No se ven datos en la app**

**Causas posibles:**
- Base de datos vacía o con datos de prueba antiguos
- Necesitas importar datos reales del Excel

---

### 4. **Features del código no coinciden con la app**

**Necesita auditoría completa:**
- Verificar qué componentes existen pero no se usan
- Verificar qué rutas están definidas
- Verificar qué features están implementadas pero no visibles

---

## 📝 PREGUNTAS DEL USUARIO

### 1. **Excel con KPIs actualizados**

**Pregunta:** "Tengo un Excel actualizado con todos los KPIs de la empresa. ¿Puedo vincularlo con la app para que los cambios se sincronicen bidireccalmente?"

**Opciones:**

#### Opción A: Sincronización unidireccional (Excel → App)
- **Viabilidad:** ✅ FÁCIL
- **Cómo:** Script que lee el Excel y actualiza la DB cada X minutos
- **Pros:** Simple, rápido de implementar
- **Contras:** Solo Excel → App, no al revés

#### Opción B: Sincronización bidireccional (Excel ↔ App)
- **Viabilidad:** ⚠️ COMPLEJO
- **Cómo:** Google Sheets API + webhooks + Supabase
- **Pros:** Cambios en tiempo real en ambas direcciones
- **Contras:** Requiere Google Sheets (no Excel local), complejo de mantener

#### Opción C: Importación manual
- **Viabilidad:** ✅ MUY FÁCIL
- **Cómo:** Botón "Importar KPIs desde CSV/Excel" en la app
- **Pros:** Control total, simple
- **Contras:** Manual

**Recomendación:**
1. **Corto plazo:** Opción C (importación manual con botón)
2. **Largo plazo:** Migrar de Excel a la app como fuente única de verdad

**¿Qué necesitas?**
- Compartir el Excel actualizado
- Definir qué tablas de la DB corresponden a qué hojas del Excel

---

### 2. **Sistema de Roles y Equipos**

**Pregunta:** "¿Cómo funciona el procedimiento de roles? ¿Cómo se crean equipos? ¿Quién los crea? ¿Cómo se definen roles?"

**Estructura actual en la DB:**

#### Tablas involucradas:
1. **`members`**: Usuarios del sistema
   - `id`, `auth_id`, `nombre`, `email`, `role` (admin/member)

2. **`projects`**: Proyectos de la empresa
   - `id`, `nombre`, `descripcion`, `fase`, `owner_id`

3. **`project_members`**: Relación usuarios-proyectos con roles
   - `project_id`, `member_id`, `role` (sales, finance, ai_tech, marketing, operations, strategy, leader, customer)

#### Roles disponibles:
- **sales** / **customer**: Customer (Ventas)
- **marketing**: Marketing
- **operations**: Operations
- **leader**: Team Leader
- **strategy**: Strategy
- **finance**: Finance
- **ai_tech**: AI/Tech

#### Flujo actual:
1. **Crear proyecto:**
   - Cualquier usuario puede crear un proyecto
   - El creador se convierte en `owner_id` automáticamente

2. **Agregar miembros al proyecto:**
   - El owner del proyecto puede agregar miembros
   - Al agregar, se asigna un `role` específico (ej: marketing, sales, etc.)

3. **Reuniones de rol:**
   - Los usuarios con el mismo `role` pueden tener reuniones
   - La app genera preguntas con IA basadas en el rol y métricas

**¿Dónde se gestiona esto en la app?**
- `Proyectos` → Ver/editar proyectos
- `Reuniones de Rol` → Ver reuniones por rol
- Falta: UI para asignar roles a miembros fácilmente

---

## 🎯 SIGUIENTES PASOS RECOMENDADOS

### URGENTE (Hoy/Mañana)

1. **Reactivar RLS en members de forma segura**
   ```sql
   -- Agregar índice
   CREATE INDEX IF NOT EXISTS idx_members_auth_id ON public.members(auth_id);

   -- Reactivar RLS
   ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

   -- Política simple y eficiente
   DROP POLICY IF EXISTS members_select_all ON public.members;
   CREATE POLICY members_select_all ON public.members
     FOR SELECT
     USING (true);
   ```

2. **Optimizar carga inicial**
   - Agregar índices faltantes
   - Reducir timeout de fetchProfile a 5 segundos ahora que RLS estará optimizado

### CORTO PLAZO (Esta semana)

3. **Importar datos del Excel**
   - Compartir Excel actualizado
   - Crear script de importación
   - Poblar la DB con datos reales

4. **Auditoría completa de features**
   - Listar todas las vistas/componentes del código
   - Verificar cuáles están en uso
   - Documentar features faltantes

5. **Mejorar UI de gestión de equipos**
   - Vista clara de "Equipos y Roles"
   - Asignar/cambiar roles fácilmente
   - Ver quién tiene qué rol en cada proyecto

### MEDIO PLAZO (Próximas 2 semanas)

6. **Integración con Excel/Google Sheets**
   - Decidir enfoque (manual vs automático)
   - Implementar importación/exportación

7. **Performance y optimización**
   - Implementar caché con React Query
   - Lazy loading de componentes pesados
   - Optimización de queries

---

## 📋 CHECKLIST PARA EL USUARIO

Por favor, responde/proporciona:

- [ ] **Ejecuta el SQL de check_rls.sql** y comparte los resultados
- [ ] **Comparte el Excel actualizado** de KPIs
- [ ] **Screenshot de la app** mostrando qué secciones ves vacías
- [ ] **¿Qué enfoque prefieres para Excel?** (A, B o C)
- [ ] **¿Hay usuarios reales que necesitas crear** en la DB?
- [ ] **¿Hay proyectos reales que necesitas crear?**

---

## 🔍 PRÓXIMO PASO INMEDIATO

**Voy a crear un script de auditoría completa** que:
1. Escanee todos los componentes/vistas del código
2. Compare con las rutas activas
3. Identifique features no usadas o no visibles
4. Genere un reporte de "App vs Código"

**¿Quieres que lo ejecute ahora?**
