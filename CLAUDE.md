# Instrucciones del proyecto — nova-hub

## Forma de trabajar

- **Cuestiona siempre** antes de implementar. No asumir que el planteamiento es correcto.
- **Opinión honesta** aunque contradiga lo que se acaba de decir.
- **Detectar agujeros** técnicos y señalarlos antes de proceder.
- **No validar por defecto.** Verificar primero.
- Leer archivos antes de modificarlos. Verificar nombres de columnas, enums y escalas en migraciones antes de escribir código.
- **Nunca simplificar una spec en silencio.** Si el usuario especifica N condiciones y se implementan menos de N, hay que señalarlo explícitamente antes de escribir código — no después. Toda omisión o simplificación debe ser una decisión explícita acordada, no una decisión interna.

## Contexto del proyecto

Motor de fases para proyectos startup. Migraciones SQL en `supabase/migrations/`.
Especificación autoritativa: `ENGINE_SPEC_V1.md`.
Fuente de verdad de fase: `project_phase_state.current_phase` (SMALLINT 1–4), no `projects.fase` (ENUM legacy).
Constantes de UI compartidas: `src/lib/engine.ts`.
Hook principal con phase_state: `useProjects()` en `src/hooks/useNovaDataOptimized.ts` — queryKey `['projects', 'with-phase-state']`.
