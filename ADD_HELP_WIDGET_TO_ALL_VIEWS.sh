#!/bin/bash

# Función para agregar HelpWidget a un archivo si no lo tiene
add_help_widget() {
  local file=$1
  local section=$2
  
  # Verificar si ya tiene HelpWidget importado
  if ! grep -q "import.*HelpWidget" "$file"; then
    # Agregar import después del último import de lucide-react o similares
    sed -i "/import.*from 'lucide-react';/a import { HelpWidget } from '@/components/ui/section-help';" "$file"
  fi
  
  # Verificar si ya tiene HelpWidget en el JSX
  if ! grep -q "<HelpWidget" "$file"; then
    # Agregar HelpWidget antes del cierre del componente principal
    # Esto es más complejo, lo haremos manualmente para cada archivo
    echo "Necesita HelpWidget: $file (sección: $section)"
  fi
}

# Archivos a verificar
add_help_widget "src/pages/views/ExplorationDashboard.tsx" "exploration"
add_help_widget "src/pages/views/TeamPerformanceDashboard.tsx" "team-performance"
add_help_widget "src/pages/PathToMasterPage.tsx" "path-to-master"
add_help_widget "src/pages/IntegrationsView.tsx" "integrations"
add_help_widget "src/pages/views/RoleRotationView.tsx" "rotacion"

