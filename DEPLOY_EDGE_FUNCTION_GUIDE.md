# 🚀 GUÍA DE DEPLOYMENT - Edge Function: calculate-lead-score

## ✅ Qué es esta Edge Function

**Función**: Calcula automáticamente el score de un lead (0-100)

**Input**:
```json
{
  "lead_id": "uuid-del-lead"
}
```

**Output**:
```json
{
  "lead_id": "...",
  "score": 69,
  "classification": "sql",
  "next_action": "💼 Enviar propuesta personalizada...",
  "reasoning": "Score basado en: Recencia (20/25), Valor (25/30)...",
  "score_breakdown": {
    "recency_score": 20,
    "value_score": 25,
    "engagement_score": 14,
    "stage_score": 10
  }
}
```

---

## 📋 OPCIÓN 1: Deployment vía Supabase CLI (Recomendado)

### Paso 1: Instalar Supabase CLI

```bash
# Si no tienes Supabase CLI instalado:
npm install -g supabase
```

### Paso 2: Login en Supabase

```bash
supabase login
```

### Paso 3: Link al proyecto

```bash
# Desde la carpeta nova-hub
cd C:\Users\Zarko\nova-hub
supabase link --project-ref TU_PROJECT_REF
```

**¿Dónde encontrar PROJECT_REF?**
- Ve a: Supabase Dashboard → Settings → General → Reference ID

### Paso 4: Deploy la función

```bash
supabase functions deploy calculate-lead-score
```

### Paso 5: Verificar deployment

```bash
# Ver logs
supabase functions logs calculate-lead-score

# Test
supabase functions invoke calculate-lead-score --data '{"lead_id":"test-uuid"}'
```

---

## 📋 OPCIÓN 2: Deployment Manual (Dashboard)

### Paso 1: Ir a Edge Functions

1. Abre Supabase Dashboard
2. Ve a: **Edge Functions** (en el menú izquierdo)
3. Click: **Create a new function**

### Paso 2: Configurar la función

- **Name**: `calculate-lead-score`
- **Code**: Copia TODO el contenido de:
  ```
  C:\Users\Zarko\nova-hub\supabase\functions\calculate-lead-score\index.ts
  ```

### Paso 3: Deploy

1. Click: **Deploy function**
2. Esperar confirmación ✅

### Paso 4: Configurar Variables de Entorno

La función necesita estas variables (ya deberían estar configuradas):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Verificar**: Edge Functions → Settings → Secrets

Si no están, añadirlas:
- `SUPABASE_URL`: https://tu-proyecto.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: (encontrar en Settings → API → service_role key)

---

## 🧪 TESTING - Verificar que funciona

### Test 1: Desde SQL

```sql
-- Obtener un lead_id real de tu base de datos
SELECT id, empresa, status, valor_potencial
FROM leads
LIMIT 1;

-- Copiar el ID y úsalo abajo
```

### Test 2: Llamar la función vía SQL

```sql
-- Crear función helper en SQL para llamar edge function
CREATE OR REPLACE FUNCTION test_lead_score(p_lead_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Llamar a la edge function via HTTP
  SELECT content::JSONB INTO v_result
  FROM http((
    'POST',
    current_setting('app.supabase_url') || '/functions/v1/calculate-lead-score',
    ARRAY[http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key'))],
    'application/json',
    json_build_object('lead_id', p_lead_id)::TEXT
  )::http_request);

  RETURN v_result;
END;
$$;

-- Probar
SELECT test_lead_score('tu-lead-id-aqui');
```

### Test 3: Desde JavaScript/TypeScript

```typescript
// En tu app frontend
const { data, error } = await supabase.functions.invoke('calculate-lead-score', {
  body: { lead_id: 'uuid-del-lead' }
});

console.log('Score:', data.score);
console.log('Classification:', data.classification);
console.log('Next action:', data.next_action);
```

### Test 4: Desde curl

```bash
curl -X POST 'https://tu-proyecto.supabase.co/functions/v1/calculate-lead-score' \
  -H 'Authorization: Bearer TU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"lead_id":"uuid-del-lead"}'
```

---

## 🔄 INTEGRACIÓN CON LA APP

### Opción A: Auto-calcular cuando se actualiza un lead

```sql
-- Trigger para auto-calcular score cuando cambia un lead
CREATE OR REPLACE FUNCTION trigger_calculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar edge function de manera asíncrona
  PERFORM pg_notify(
    'calculate_score',
    json_build_object('lead_id', NEW.id)::TEXT
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS auto_calculate_lead_score ON leads;
CREATE TRIGGER auto_calculate_lead_score
AFTER INSERT OR UPDATE OF status, valor_potencial, last_contact_date
ON leads
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_lead_score();
```

### Opción B: Botón manual en UI

```tsx
// En tu componente de CRM
const calculateScore = async (leadId: string) => {
  const { data, error } = await supabase.functions.invoke('calculate-lead-score', {
    body: { lead_id: leadId }
  });

  if (error) {
    toast.error('Error calculando score');
    return;
  }

  toast.success(`Score: ${data.score}/100 - ${data.classification.toUpperCase()}`);

  // Actualizar UI con el score
  setLeadScore(data);
};

// Botón
<Button onClick={() => calculateScore(lead.id)}>
  🎯 Calcular Score
</Button>
```

### Opción C: Batch scoring (todos los leads)

```typescript
// Función para calcular score de todos los leads
const scoreAllLeads = async () => {
  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .in('status', ['prospecto', 'contactado', 'cualificado', 'propuesta', 'en_negociacion']);

  for (const lead of leads) {
    await supabase.functions.invoke('calculate-lead-score', {
      body: { lead_id: lead.id }
    });

    // Pequeño delay para no saturar
    await new Promise(r => setTimeout(r, 100));
  }
};
```

---

## 📊 MONITOREO Y LOGS

### Ver logs de la función

```bash
# Con Supabase CLI
supabase functions logs calculate-lead-score --tail
```

O desde Dashboard:
- Edge Functions → calculate-lead-score → Logs

### Métricas a monitorear

- **Invocations**: Cuántas veces se llama
- **Errors**: Tasa de error
- **Duration**: Tiempo de ejecución promedio
- **Success rate**: % de ejecuciones exitosas

---

## 🛠️ TROUBLESHOOTING

### Error: "Lead not found"
- **Causa**: lead_id no existe en la tabla leads
- **Solución**: Verificar que el UUID es correcto

### Error: "SUPABASE_URL is not defined"
- **Causa**: Variables de entorno no configuradas
- **Solución**: Configurar en Edge Functions → Settings → Secrets

### Error: "Permission denied"
- **Causa**: RLS blocking el acceso
- **Solución**: La función usa `SUPABASE_SERVICE_ROLE_KEY` que bypasses RLS

### La función no se ejecuta
- **Verificar**: Edge Functions → Status debe ser "Active"
- **Logs**: Revisar errores en logs
- **Test manual**: Probar con curl primero

---

## 📈 OPTIMIZACIONES FUTURAS

1. **Caching**: Cachear scores por 1 hora para reducir cómputo
2. **Batch processing**: Procesar múltiples leads en una sola llamada
3. **ML Model**: Entrenar modelo ML con datos históricos
4. **Webhooks**: Notificar cuando un lead cambia de clasificación
5. **A/B Testing**: Probar diferentes fórmulas de scoring

---

## ✅ CHECKLIST DE DEPLOYMENT

- [ ] Edge function deployed correctamente
- [ ] Variables de entorno configuradas
- [ ] Test manual con lead_id real → funciona ✅
- [ ] Integrado en UI (botón o auto-trigger)
- [ ] Logs monitoreados sin errores
- [ ] Score se guarda en `leads.metadata.auto_score`
- [ ] Classification visible en CRM
- [ ] Next action se muestra al usuario

---

## 🎯 VALOR AGREGADO

Una vez deployado, tendrás:

✅ **Scoring automático** de leads 0-100
✅ **Clasificación inteligente**: Hot/SQL/MQL/Warm/Cold
✅ **Acciones recomendadas** por IA
✅ **Priorización automática** de pipeline
✅ **Insights de engagement** y recency
✅ **Data-driven sales** process

---

**¿Necesitas ayuda con el deployment?**
- Supabase Docs: https://supabase.com/docs/guides/functions
- CLI Reference: https://supabase.com/docs/reference/cli/usage

**Próximo paso**: Configurar scheduled jobs para scoring automático diario
