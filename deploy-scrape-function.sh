#!/bin/bash

# 🚀 Script para desplegar scrape-and-extract Edge Function
# Ejecutar: ./deploy-scrape-function.sh

set -e  # Exit on error

echo "======================================"
echo "🚀 Desplegando scrape-and-extract"
echo "======================================"
echo ""

# 1. Verificar que estamos en el directorio correcto
if [ ! -d "supabase/functions/scrape-and-extract" ]; then
  echo "❌ Error: No se encuentra supabase/functions/scrape-and-extract"
  echo "Asegúrate de estar en el directorio raíz del proyecto (nova-hub)"
  exit 1
fi

echo "✅ Directorio encontrado"
echo ""

# 2. Verificar que Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
  echo "❌ Error: Supabase CLI no está instalado"
  echo "Instala con: npm install -g supabase"
  exit 1
fi

echo "✅ Supabase CLI instalado"
echo ""

# 3. Verificar login
echo "🔐 Verificando autenticación..."
if ! supabase projects list &> /dev/null; then
  echo "❌ No estás logueado en Supabase"
  echo "Ejecuta: supabase login"
  exit 1
fi

echo "✅ Autenticado correctamente"
echo ""

# 4. Verificar link con proyecto
echo "🔗 Verificando link con proyecto..."
if [ ! -f ".git/config" ] && [ ! -f "supabase/.temp/project-ref" ]; then
  echo "⚠️  Proyecto no linkeado. Ejecutando link..."
  echo "Ingresa tu project-ref cuando se te pida"
  supabase link
fi

echo "✅ Proyecto linkeado"
echo ""

# 5. Desplegar función
echo "📦 Desplegando función scrape-and-extract..."
supabase functions deploy scrape-and-extract --no-verify-jwt

if [ $? -eq 0 ]; then
  echo ""
  echo "======================================"
  echo "✅ ¡FUNCIÓN DESPLEGADA CON ÉXITO!"
  echo "======================================"
  echo ""
  echo "📝 PRÓXIMOS PASOS:"
  echo ""
  echo "1. Configura tu ANTHROPIC_API_KEY:"
  echo "   supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx"
  echo ""
  echo "2. O desde la UI:"
  echo "   https://supabase.com/dashboard/project/_/settings/functions"
  echo ""
  echo "3. Verifica que funciona:"
  echo "   supabase functions logs scrape-and-extract --follow"
  echo ""
else
  echo ""
  echo "❌ Error al desplegar función"
  echo "Revisa los logs arriba para más detalles"
  exit 1
fi
