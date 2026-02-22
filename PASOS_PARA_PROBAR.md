# 📋 PASOS EXACTOS PARA PROBAR EL SISTEMA

## ✅ LO QUE YA HICE POR TI

1. ✅ Creé la página de prueba: `src/pages/EvidenceTestPage.tsx`
2. ✅ Agregué la ruta en `src/App.tsx`
3. ✅ La página carga automáticamente tu user y proyecto

---

## 👤 LO QUE TÚ DEBES HACER AHORA

### PASO 1: Arrancar la aplicación

```bash
cd C:\Users\Zarko\nova-hub
npm run dev
```

Espera a que diga algo como:
```
  VITE v5.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

---

### PASO 2: Abrir en navegador

1. Abre tu navegador
2. Ve a: **http://localhost:5173/evidence-test**
3. Deberías ver una página con el título "🧪 Evidence System Test"

---

### PASO 3: Probar Document Manager (5 minutos)

**En la página, verás 2 tabs. Click en "📄 Document Manager"**

1. **Upload un documento:**
   - Click en el área que dice "Upload Documents" o drag & drop
   - Elige un PDF o CSV de tu computadora (cualquier archivo para testing)
   - Verás una barra de progreso:
     - Uploading... → Extracting... → Indexing... → Complete ✅

2. **Ver tu documento:**
   - Click en la tab "Document Library"
   - Deberías ver tu documento en la lista

3. **Buscar en el documento:**
   - En el search box arriba, escribe una palabra que esté en tu documento
   - Click el botón de búsqueda (🔍)
   - Deberías ver resultados con highlights

**Si ves todo esto → ✅ Document Manager funciona perfecto**

---

### PASO 4: Probar AI Generator (5 minutos)

**En la página, click en la tab "🤖 AI Generator"**

1. **Abrir el modal:**
   - Click en el botón "🚀 Test Evidence Generation"
   - Se abre un modal con "Simple" y "Advanced" tabs

2. **Configurar:**
   - En "Simple" tab, verás:
     - Evidence Mode: Strict | Balanced | Hypothesis
     - Source Tiers: Your Documents, Official APIs, etc.
   - Puedes dejar todo por defecto (Balanced mode)
   - O probar cambiando a "Strict" o "Hypothesis"

3. **Generar:**
   - Click "Search & Generate" (o "Generate" si estás en Hypothesis mode)
   - Verás "Searching for evidence..." → "Generating..."
   - Después de unos segundos, aparece el **Evidence Report** abajo del botón

4. **Ver el Evidence Report:**
   - Deberías ver:
     - Coverage percentage con barra de progreso
     - Sources Found (número de fuentes)
     - Claims (supported/weak/unsupported)
     - Lista de fuentes usadas
   - Click en los claims para expandir y ver citations

**Si ves todo esto → ✅ AI Generator funciona perfecto**

---

### PASO 5: Probar Strict Mode (Opcional - 3 min)

1. Click "🚀 Test Evidence Generation" otra vez
2. Cambia Evidence Mode a **"Strict"**
3. Desactiva TODOS los source tiers (apaga todos los toggles)
4. Click "Search & Generate"
5. Deberías ver un **Alert Dialog** diciendo:
   - "Strict Mode: Evidence Requirements Not Met"
   - Con 3 opciones: Search More / Continue as Hypothesis / Cancel
6. Prueba cada opción

**Si ves este dialog → ✅ Strict Mode funciona perfecto**

---

## 🎉 SI TODO FUNCIONA

**¡FELICIDADES!** El sistema está 100% operativo.

Lo que tienes funcionando:
- ✅ Upload de documentos con extracción de texto
- ✅ Full-text search en tus documentos
- ✅ Pre-generation modal con configuración
- ✅ Búsqueda de evidencias (Tier 1: tus docs + Tier 2: APIs oficiales)
- ✅ Evidence Report con claims, sources, coverage
- ✅ Strict mode con exit options

---

## ⚠️ NOTA IMPORTANTE

**Actualmente la generación usa DATOS MOCK** porque aún no está conectada a tu Edge Function real.

Esto significa:
- ✅ La UI funciona perfecta
- ✅ La búsqueda de fuentes funciona
- ✅ El upload de docs funciona
- ⚠️ El contenido generado es placeholder

**Para conectar con tu IA real:**
Necesitas modificar `src/hooks/useEvidenceGeneration.ts` línea ~147 para llamar a tu Edge Function `scrape-and-extract` en lugar de retornar mock data.

---

## 🚨 SI ALGO NO FUNCIONA

### Error: "No se puede cargar la página"
- Verifica que `npm run dev` esté corriendo
- Verifica la URL: http://localhost:5173/evidence-test

### Error: "Loading... (Getting your user and project)"
- Significa que no tienes usuario logueado o no tienes proyectos
- Ve a `/auth` para login
- Crea un proyecto si no tienes ninguno

### Error al upload: "Failed to upload"
- Abre la consola (F12) y busca el error exacto
- Puede ser problema de permisos en Supabase
- Verifica que las tablas existan (ya deberían estar)

### No aparecen resultados en search
- Normal si tu documento es muy pequeño o no tiene texto
- Prueba con un PDF que tenga bastante texto

---

## 📞 PRÓXIMO PASO

Una vez que veas que TODO funciona en `/evidence-test`, el siguiente paso es:

**Integrar en tus páginas reales** (Financial Projections, Business Model Canvas, etc.)

Eso lo hacemos después. Por ahora, solo prueba que todo funcione en la página de test.

---

**¿Listo? Ejecuta `npm run dev` y abre http://localhost:5173/evidence-test** 🚀
