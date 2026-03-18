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
Fuente de verdad de fase: `project_phase_state.current_phase` (SMALLINT 1–4), no `projects.fase` (ENUM legacy).
Constantes de UI compartidas: `src/lib/engine.ts`.
Hook principal con phase_state: `useProjects()` en `src/hooks/useNovaDataOptimized.ts` — queryKey `['projects', 'with-phase-state']`.
