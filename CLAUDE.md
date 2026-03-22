# Instrucciones del proyecto — nova-hub

## Forma de trabajar

Estas tres reglas se aplican a todos los mensajes, sin excepciones.

### 1. Cuestionar y opinar — siempre visible

Ante cualquier mensaje del usuario — instrucción, planteamiento o afirmación técnica — evaluar primero si tiene agujeros, riesgos o alternativas mejores. Si los hay, señalarlos antes de ejecutar. Si no los hay, ejecutar directamente. La evaluación siempre es visible en la respuesta: si no se menciona, no ocurrió.

### 2. Buscar agujeros — explícito al cerrar

Al terminar cualquier tarea de implementación, responder explícitamente: ¿qué puede romperse con este cambio? ¿qué caso no está cubierto? Si la respuesta es ninguno, decirlo. El silencio equivale a no haberlo evaluado.

### 3. Verificar con evidencia — sin evidencia, sin afirmación

Toda afirmación sobre el estado del código (qué está hecho, qué está pendiente, qué está roto, qué funciona) debe ir acompañada en el mismo mensaje del Read o grep que la confirma. Los planes en `.claude/plans/` describen intención, no estado — nunca son evidencia suficiente. Sin evidencia visible, no hay afirmación.

### Bloques fijos al final de cada respuesta

Al final de cada respuesta incluir siempre estos dos bloques, en este orden:

**Bloque 1 — Checklist de reglas:**
```
- [ ] 1. Cuestionar/opinar: <qué se evaluó o "nada que cuestionar">
- [ ] 2. Agujeros: <qué puede romperse o "ninguno detectado">
- [ ] 3. Evidencia: <qué Read/grep lo confirma o "no hay afirmaciones de estado">
```
Si una regla no aplica al tipo de mensaje, indicarlo explícitamente.

**Bloque 2 — Fase activa:**

Mostrar siempre la fase del TASK_LIST.md que está en curso, con TODAS sus tareas. Reglas:
- Aparece SIEMPRE al final de cada respuesta.
- Si no hay fase activa, escribir exactamente: `Sin fase activa.`
- La tarea en curso se marca con `[~]` y añade `🔄 N%` al final de la línea.
- Las tareas diferidas incluyen su bloque `> DIFERIDO — motivo` debajo.
- Formato idéntico al de TASK_LIST.md, sin omitir ninguna tarea de la fase.
- Actualizar TASK_LIST.md inmediatamente cuando cambia el estado de cualquier tarea.

```
## FASE N — NOMBRE  done/total (X%)
> Dependencias y notas de la fase.
> **N tareas diferidas** (si las hay).

- [x] **ID** Tarea completada
- [~] **ID** Tarea en curso 🔄 40%
- [!] **ID** Tarea diferida
  > DIFERIDO — motivo breve.
- [ ] **ID** Tarea pendiente
```

Estados: `[x]` hecho · `[~]` en curso · `[!]` diferido · `[ ]` pendiente

### Otras reglas

- Leer archivos antes de modificarlos. Verificar nombres de columnas, enums y escalas en migraciones antes de escribir código.
- **Nunca simplificar una spec en silencio.** Si el usuario especifica N condiciones y se implementan menos de N, señalarlo explícitamente antes de escribir código — no después. Toda omisión o simplificación debe ser una decisión explícita acordada, no una decisión interna.
- **Los agujeros bloquean el avance — sin excepciones.** Al terminar cualquier tarea, si se detecta un agujero real (bug, columna incorrecta, comportamiento incorrecto, caso no cubierto): la tarea NO se marca `[x]` y NO se pasa a la siguiente hasta que el agujero esté resuelto. No existe "lo anoto y sigo". La única excepción es una limitación de diseño consciente que requiere datos o contexto aún no disponible (p.ej. "requiere usuarios reales") — en ese caso, se documenta explícitamente por qué NO puede resolverse ahora y se anota en el **Bloque DEUDA** de la fase. El Bloque DEUDA se resuelve antes de cerrar la fase. Si no se puede justificar por qué no puede resolverse ahora, se resuelve antes de continuar.

### Norma: bases de una fase

**Trigger:** el usuario pide "bases de la fase N", "resumen de la fase N", "qué implementamos en la fase N", o cualquier variante que pregunte por el contenido/lógica de una fase.

**Respuesta obligatoria — documento técnico completo, en este orden:**

#### 1. OBJETIVO DE LA FASE
> 2-3 líneas: qué problema resuelve, qué añade al sistema, por qué existe.

#### 2. ARQUITECTURA Y CAPAS
> Diagrama textual de las capas involucradas (DB → Edge Functions → Services → Hooks → Components → UI).
> Por cada capa: qué archivos la forman, qué responsabilidad tienen.

#### 3. MODELO DE DATOS
> Tablas nuevas o modificadas, con columnas clave, tipos, constraints y RLS.
> Funciones SQL o RPCs añadidas.
> Migraciones (nombre de archivo + propósito).

#### 4. LÓGICA CENTRAL — CON CÓDIGO
> Para cada función/algoritmo crítico de la fase: extracto real del código (no pseudocódigo).
> Explicar entradas, salidas, decisiones de diseño no obvias.

#### 5. COMPONENTES Y HOOKS — CON CÓDIGO
> Por cada componente o hook relevante: props/API pública, flujo interno, código del bloque más importante.
> Si hay estados locales, efectos o mutaciones: mostrarlos.

#### 6. FLUJOS END-TO-END
> Al menos 1 flujo completo narrado: usuario hace X → hook lee Y → función Z computa → UI muestra W.
> Si hay tracking/analytics: cuándo y qué se dispara.

#### 7. AGUJEROS Y LIMITACIONES CONOCIDAS
> Qué no cubre esta fase, qué puede romperse, qué está diferido y por qué.

**Reglas de esta norma:**
- Leer los archivos relevantes antes de responder — sin evidencia, no hay afirmación.
- Incluir fragmentos de código reales (extraídos con Read), no inventados.
- No omitir ninguna tarea de la fase — si algo quedó diferido, explicarlo.
- Profundidad equivalente a una revisión de arquitectura interna, no a un README de usuario.

### Norma: recuérdame

**Trigger:** el usuario envía "recuérdame" (o variantes: "dame contexto", "dónde estábamos")

**Respuesta obligatoria — formato fijo, en este orden:**

#### CONTEXTO DE SESIÓN
> Proyecto · Stack · Última actualización TASK_LIST

#### ¿QUÉ ES ESTO Y POR QUÉ EXISTE?
> 2-3 líneas: qué es el sistema, cuál es el objetivo del trabajo actual

#### ÚLTIMA SESIÓN — LO QUE SE HIZO
> Lista de máximo 6 ítems con: qué · por qué · estado (✅ completo · ⚠️ sin commitear · 🔴 incompleto)

#### ESTADO ACTUAL — AGUJEROS ABIERTOS
> Qué quedó pendiente, roto o sin commitear de la última sesión

#### FASE ACTIVA — PROGRESO
> Bloque completo de TASK_LIST con [x]/[~]/[!]/[ ]

#### PRÓXIMOS PASOS (en orden, con motivo)
> 1. Paso → por qué es el primero
> 2. Paso → desbloquea qué

**Reglas de esta norma:**
- Lee TASK_LIST.md + `git log --oneline -10` + `git status --short | head -20` antes de responder
- Máximo 1 pantalla de texto; priorizar lo más reciente
- Incluye siempre el estado de commits (archivos sin commitear clave)

---

## Contexto del proyecto

Motor de fases para proyectos startup. Migraciones SQL en `supabase/migrations/`.
Especificación autoritativa: `ENGINE_SPEC_V1.md`.
Fuente de verdad de fase: `project_phase_state.current_phase` (SMALLINT 0–4), no `projects.fase` (ENUM legacy).
Phase 0 = Exploración (pre-idea). Campos adicionales: `entry_mode`, `graduated`, `graduation_eligible_since`.
Constantes de UI compartidas: `src/lib/engine.ts`.
Hook principal con phase_state: `useProjects()` en `src/hooks/useNovaDataOptimized.ts` — queryKey `['projects', 'with-phase-state']`.

### Norma: súper análisis y plan

**Trigger:** el usuario dice "súper análisis y plan" (o variantes: "análisis completo", "los agentes", "análisis profundo").

**Protocolo completo en:** `.claude/projects/C--Users-Zarko/memory/feedback_super_analysis_protocol.md`

**Resumen ejecutivo del protocolo (v3, 22-25 agentes, 6 fases):**

1. **FASE 1 — PRODUCTO** (6 agentes en paralelo, se lanzan PRIMERO):
   Product Strategy (PM YC), UX Flows (Figma), AI/LLM (Anthropic), Data Model (Stripe), Competitive (CB Insights), Monetización (Superhuman).

2. **FASE 2 — CÓDIGO** (6 agentes en paralelo):
   SQL/BD (DBA), Edge Functions (Security), Frontend (Lead), Hooks/Queries (React Query), Tests/Types (QA), Arquitectura (Staff Engineer).

3. **FASE 3 — OPERACIONAL** (6 agentes):
   Deploys, Git Hygiene, Memory accuracy, Bundle Size, Specs/Docs, Supabase Types.

4. **FASE 4 — DATOS EXTERNOS** (automático, sin agente):
   `npm audit`, `npm run build`, `git log --since 30d`, `vitest run`, archivos grandes.

5. **FASE 4.5 — VERIFICACIÓN** (4 agentes):
   Devil's Advocate (cuestiona TOP 10), User Simulator (3 founders), ROI Calculator (prioriza por retorno), Future-Proofing (escalabilidad).

6. **FASE 5 — CONSOLIDACIÓN:**
   Plan fusionado en 10 bloques con ICE scores. Scorecard de salud 10 dimensiones. Kill list. 3 A/B tests. Mapa de dependencias. Riesgos de negocio. Guardar en `.claude/plans/`.

**Reglas de cada agente:**
- Evidencia obligatoria (archivo + línea). Sin evidencia = no existe.
- Nivel de confianza: ALTA / MEDIA / BAJA.
- ICE Score: Impact × Confidence × Ease.
- No halagar. Kill list obligatoria.
- Comparar con ejecución anterior (scorecard delta).

**13 entregables:** Mapa de bugs, diagnóstico producto, fricción UX, plan monetización, datos sin explotar, optimización IA, plan ejecución, scorecard salud, dependencias, riesgos negocio, kill list, experimentos, user journeys.

**Historial:**
| Fecha | Agentes | Items | Scorecard |
|---|---|---|---|
| 2026-03-22 (v1) | 18 | 57 | 4.9/10 |
| 2026-03-22 (v3) | 15 | 72 (fusionado) | 5.4/10 |
