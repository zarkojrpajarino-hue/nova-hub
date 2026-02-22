#!/bin/bash

# Script para agregar React.memo a los componentes de tabs restantes

# ProjectFinancialTab
sed -i "1s/^/import { memo } from 'react';\n/" "src/components/project/ProjectFinancialTab.tsx"
sed -i "s/export function ProjectFinancialTab/function ProjectFinancialTabComponent/" "src/components/project/ProjectFinancialTab.tsx"
echo -e "\n// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios\nexport const ProjectFinancialTab = memo(ProjectFinancialTabComponent);" >> "src/components/project/ProjectFinancialTab.tsx"

# ProjectTasksTab
sed -i "1s/^/import { memo } from 'react';\n/" "src/components/project/ProjectTasksTab.tsx"
sed -i "s/export function ProjectTasksTab/function ProjectTasksTabComponent/" "src/components/project/ProjectTasksTab.tsx"
echo -e "\n// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios\nexport const ProjectTasksTab = memo(ProjectTasksTabComponent);" >> "src/components/project/ProjectTasksTab.tsx"

# ProjectOBVsTab
sed -i "1s/^/import { memo } from 'react';\n/" "src/components/project/ProjectOBVsTab.tsx"
sed -i "s/export function ProjectOBVsTab/function ProjectOBVsTabComponent/" "src/components/project/ProjectOBVsTab.tsx"
echo -e "\n// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios\nexport const ProjectOBVsTab = memo(ProjectOBVsTabComponent);" >> "src/components/project/ProjectOBVsTab.tsx"

# ProjectOnboardingTab
sed -i "s/import { useState } from 'react';/import { useState, memo } from 'react';/" "src/components/project/ProjectOnboardingTab.tsx"
sed -i "s/export function ProjectOnboardingTab/function ProjectOnboardingTabComponent/" "src/components/project/ProjectOnboardingTab.tsx"
echo -e "\n// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios\nexport const ProjectOnboardingTab = memo(ProjectOnboardingTabComponent);" >> "src/components/project/ProjectOnboardingTab.tsx"

echo "✅ Todos los componentes de tabs optimizados con React.memo"
