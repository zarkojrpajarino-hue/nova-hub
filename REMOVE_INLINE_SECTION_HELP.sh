#!/bin/bash

# Lista de archivos a modificar
files=(
  "src/pages/views/DashboardView.tsx"
  "src/pages/views/AnalyticsView.tsx"
  "src/pages/views/CRMView.tsx"
  "src/pages/views/FinancieroView.tsx"
  "src/pages/views/KPIsView.tsx"
  "src/pages/views/MastersView.tsx"
  "src/pages/views/MiDesarrolloView.tsx"
  "src/pages/views/MiEspacioView.tsx"
  "src/pages/views/NotificationsView.tsx"
  "src/pages/views/OBVCenterView.tsx"
  "src/pages/views/ProjectsView.tsx"
  "src/pages/views/RankingsView.tsx"
  "src/pages/views/RolesMeetingView.tsx"
  "src/pages/views/SettingsView.tsx"
  "src/pages/views/ValidacionesView.tsx"
  "src/pages/views/RoleRotationView.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Procesando: $file"
    # Eliminar línea con SectionHelp inline y el comentario anterior
    sed -i '/<!-- Section Help -->/d; /{\/\* Section Help \*\/}/d; /<SectionHelp.*variant="inline"/d' "$file"
  fi
done

echo "Completado"
