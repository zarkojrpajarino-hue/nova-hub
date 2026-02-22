# 👥 CREAR LOS 9 USUARIOS DEL EQUIPO NOVA

## 📋 INSTRUCCIONES:

### PASO 1: Crear usuarios en Authentication (Dashboard de Supabase)

Ve a: https://supabase.com/dashboard/project/aguuckggskweobxeosrq/auth/users

Para **CADA usuario**:

1. Click en **"Add user"** (botón verde arriba derecha)
2. Click en **"Create new user"**
3. Rellena:
   - **Email:** (email del miembro)
   - **Password:** (contraseña temporal, ej: NovaHub2026)
   - ✅ **MARCA** "Auto Confirm User" ⚠️ IMPORTANTE
4. Click en **"Create user"**
5. **Copia el UUID** que aparece
6. Guárdalo junto con el nombre del usuario

---

## 👤 LISTA DE LOS 9 USUARIOS:

**Formato:** Nombre | Email | UUID (lo copias después de crear)

1. **Zarko** | zarkojr.nova@gmail.com | `___________________`
2. **Usuario 2** | email2@gmail.com | `___________________`
3. **Usuario 3** | email3@gmail.com | `___________________`
4. **Usuario 4** | email4@gmail.com | `___________________`
5. **Usuario 5** | email5@gmail.com | `___________________`
6. **Usuario 6** | email6@gmail.com | `___________________`
7. **Usuario 7** | email7@gmail.com | `___________________`
8. **Usuario 8** | email8@gmail.com | `___________________`
9. **Usuario 9** | email9@gmail.com | `___________________`

---

## 🎨 COLORES PARA CADA USUARIO:

```
Usuario 1: #F472B6  (Rosa)
Usuario 2: #3B82F6  (Azul)
Usuario 3: #10B981  (Verde)
Usuario 4: #F59E0B  (Naranja)
Usuario 5: #8B5CF6  (Púrpura)
Usuario 6: #EC4899  (Rosa fuerte)
Usuario 7: #06B6D4  (Cyan)
Usuario 8: #F97316  (Naranja oscuro)
Usuario 9: #6366F1  (Índigo)
```

---

## PASO 2: Insertar en tabla `members`

**Después de crear los 9 usuarios en Authentication**, ejecuta este SQL:

```sql
-- REEMPLAZA los UUIDs con los que copiaste de Supabase

INSERT INTO public.members (auth_id, email, nombre, color, especialization) VALUES
  ('UUID_USUARIO_1', 'zarkojr.nova@gmail.com', 'Zarko', '#F472B6', 'ai_tech'),
  ('UUID_USUARIO_2', 'email2@gmail.com', 'Nombre 2', '#3B82F6', 'marketing'),
  ('UUID_USUARIO_3', 'email3@gmail.com', 'Nombre 3', '#10B981', 'sales'),
  ('UUID_USUARIO_4', 'email4@gmail.com', 'Nombre 4', '#F59E0B', 'finance'),
  ('UUID_USUARIO_5', 'email5@gmail.com', 'Nombre 5', '#8B5CF6', 'operations'),
  ('UUID_USUARIO_6', 'email6@gmail.com', 'Nombre 6', '#EC4899', 'strategy'),
  ('UUID_USUARIO_7', 'email7@gmail.com', 'Nombre 7', '#06B6D4', 'ai_tech'),
  ('UUID_USUARIO_8', 'email8@gmail.com', 'Nombre 8', '#F97316', 'marketing'),
  ('UUID_USUARIO_9', 'email9@gmail.com', 'Nombre 9', '#6366F1', 'customer');
```

---

## 🎯 ESPECIALIZACIONES DISPONIBLES:

- `sales` - Ventas
- `finance` - Finanzas
- `ai_tech` - AI/Tech
- `marketing` - Marketing
- `operations` - Operaciones
- `strategy` - Estrategia
- `customer` - Customer/Ventas

---

## ✅ PROCESO RESUMIDO:

1. **Crea los 9 usuarios** en Supabase Authentication
2. **Copia cada UUID** y apúntalo
3. **Edita el SQL de arriba** con los UUIDs, nombres, emails y especializaciones reales
4. **Ejecuta el SQL** en Supabase SQL Editor
5. **Listo** - Los usuarios pueden hacer login

---

## 🔑 CONTRASEÑAS:

**Recomendación:** Usa la misma contraseña temporal para todos (ej: `NovaHub2026`)

Luego cada usuario puede cambiarla desde la app si implementas esa función.

---

## 📧 IMPORTANTE:

Al marcar **"Auto Confirm User"**, los usuarios NO necesitan verificar su email.
Pueden hacer login inmediatamente.

---

¿Necesitas ayuda con los nombres, emails o roles de los 9 usuarios?
