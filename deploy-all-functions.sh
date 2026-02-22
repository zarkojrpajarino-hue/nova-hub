#!/bin/bash

echo "========================================="
echo "  Desplegando Edge Functions a Supabase"
echo "========================================="
echo ""

# Verificar si supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado"
    echo ""
    echo "Instálalo con:"
    echo "npm install -g supabase"
    exit 1
fi

# Login a Supabase
echo "📝 Verificando login a Supabase..."
supabase link --project-ref nxtexsytgccbzakjzbyh

# Desplegar todas las funciones
echo ""
echo "🚀 Desplegando funciones..."
echo ""

FUNCTIONS=(
    "export-excel"
    "generate-playbook"
    "generate-project-roles"
    "generate-role-questions"
    "generate-role-questions-v2"
    "generate-task-completion-questions"
    "generate-tasks-v2"
    "seed-users"
)

for func in "${FUNCTIONS[@]}"; do
    echo "📦 Desplegando: $func"
    supabase functions deploy "$func" --project-ref nxtexsytgccbzakjzbyh
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Desplegado exitosamente"
    else
        echo "   ❌ Error al desplegar"
    fi
    echo ""
done

echo "========================================="
echo "✅ Proceso completado"
echo "========================================="
