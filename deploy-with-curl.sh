#!/bin/bash

# 🚀 Desplegar Edge Function usando SOLO curl
# Sin CLI, sin Node, sin nada - solo curl

# ⚠️ CONFIGURA ESTOS VALORES:
SUPABASE_ACCESS_TOKEN="sbp_xxx"  # Get from: https://supabase.com/dashboard/account/tokens
PROJECT_REF="your-project-ref"   # Get from: Project Settings → General
ANTHROPIC_API_KEY="sk-ant-xxx"   # Tu API key de Anthropic

echo "======================================"
echo "🚀 Desplegando via curl (Management API)"
echo "======================================"
echo ""

# Leer el código de la función
echo "📂 Preparando código..."
FUNCTION_CODE=$(cat supabase/functions/scrape-and-extract/index.ts)
SHARED_CODE=$(cat supabase/functions/_shared/anthropic-client.ts)

# Escapar JSON
FUNCTION_CODE_JSON=$(echo "$FUNCTION_CODE" | jq -Rs .)
SHARED_CODE_JSON=$(echo "$SHARED_CODE" | jq -Rs .)

echo "✅ Código preparado"
echo ""

# Crear/Actualizar función
echo "📦 Desplegando función..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"slug\": \"scrape-and-extract\",
    \"name\": \"scrape-and-extract\",
    \"verify_jwt\": false,
    \"import_map\": false,
    \"entrypoint_path\": \"index.ts\",
    \"body\": {
      \"index.ts\": ${FUNCTION_CODE_JSON},
      \"../_shared/anthropic-client.ts\": ${SHARED_CODE_JSON}
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✅ Función desplegada exitosamente"
  echo ""
else
  echo "❌ Error al desplegar (HTTP $HTTP_CODE):"
  echo "$BODY"
  echo ""
  exit 1
fi

# Configurar secret
echo "🔐 Configurando ANTHROPIC_API_KEY..."
echo ""

SECRET_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "[{
    \"name\": \"ANTHROPIC_API_KEY\",
    \"value\": \"${ANTHROPIC_API_KEY}\"
  }]")

SECRET_HTTP_CODE=$(echo "$SECRET_RESPONSE" | tail -n1)

if [ "$SECRET_HTTP_CODE" -ge 200 ] && [ "$SECRET_HTTP_CODE" -lt 300 ]; then
  echo "✅ API Key configurada"
else
  echo "⚠️  Error configurando secret (HTTP $SECRET_HTTP_CODE)"
fi

echo ""
echo "======================================"
echo "✅ ¡DESPLIEGUE COMPLETO!"
echo "======================================"
echo ""
echo "🔗 Prueba tu función en:"
echo "https://${PROJECT_REF}.supabase.co/functions/v1/scrape-and-extract"
echo ""
