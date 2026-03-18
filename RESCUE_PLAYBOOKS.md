# RESCUE MODE PLAYBOOKS — Nova Hub

> 5 playbooks operacionales para proyectos en Rescue Mode.
> Versión: v1.0 · Fecha: 2026-03-12
>
> **Rescue Mode:** `risk_level = 'high'|'critical' OR viability_status = 'critical'`
> En Rescue Mode el objetivo no es construir — es evitar que el proyecto muera o se estanque.
> El Focus Recovery Playbook (PB5) puede activarse fuera del Rescue Mode estricto.
>
> Vocabulario: MICROCOPY_SYSTEM.md. Prompts Optimus: OPTIMUS_PROMPTS.md (CASE-06/07).
> Estructura idéntica a BUILD_PLAYBOOKS.md para consistencia del sistema.

---

## Playbook 1 — Cash Survival

**Phase:** Cualquiera

**Trigger:**
```
viability_status = 'critical'
OR t2_cash_flow_active = true
```

**Context:**
El proyecto enfrenta riesgo financiero activo. Los ingresos no cubren el burn rate o el runway está en riesgo directo. Cualquier trabajo que no contribuya directamente a mejorar la situación financiera es ruido en este momento. La tentación típica es seguir ejecutando el roadmap normal "mientras se resuelve el tema financiero" — esa estrategia agota el tiempo disponible.

**Objective:**
Reducir el riesgo de quedarse sin caja y restablecer un runway operativo mínimo.

**Steps:**
1. Listar todos los gastos actuales (fijos y variables) con su coste real mensual. Sin estimaciones.
2. Identificar qué gastos pueden eliminarse o pausarse sin detener las operaciones críticas.
3. Reducir burn rate: ejecutar los cortes identificados en el paso anterior esta semana, no el próximo mes.
4. Priorizar únicamente actividades que generen ingresos directos o reduzcan costes en las próximas 4 semanas.
5. Calcular runway real con el burn rate ajustado. Si < 8 semanas, aplicar criterio de emergencia: cualquier ingreso disponible primero.

**Success Signal:**
```
t2_cash_flow_active = false
viability_status → 'monitoring' o 'healthy'
```

**Failure Signal:**
```
t2_cash_flow_active = true después de 3 semanas de ajustes
viability_status = 'critical' persiste sin mejora
```
Los cortes no son suficientes o no se ejecutaron. El runway sigue reduciéndose.

**Common Mistakes:**
1. **Recortar lo visible en lugar de lo prescindible.** Eliminar herramientas baratas mientras se mantienen costes estructurales grandes.
2. **Esperar a "terminar el sprint" antes de actuar.** El cash survival no respeta calendarios de desarrollo.
3. **No calcular el runway real.** Usar estimaciones optimistas de ingresos futuros para justificar no cortar ahora.
4. **Resolver el síntoma sin revisar el modelo.** Si el cash problem viene de un modelo que no genera ingresos suficientes, reducir costes compra tiempo pero no resuelve el problema.

**Next Move:**
→ Early Traction Playbook (BUILD_PLAYBOOKS.md) cuando `t2_cash_flow_active = false` — el siguiente paso es generar ingresos repetibles, no solo sobrevivir.
→ Project Reset Playbook (este documento) si viability = 'critical' persiste y el modelo de negocio requiere revisión.

---

## Playbook 2 — Traction Recovery

**Phase:** 2–3

**Trigger:**
```
traction_block active
weeks_in_current_phase > 4
risk_level = 'medium' | 'high'
```

**Context:**
El producto existe pero no hay crecimiento. Los clientes actuales (si existen) llegaron manualmente, por referencias, o de forma no repetible. Se han hecho intentos de adquisición pero sin canal claro. El tiempo en esta fase sin avance en traction está acumulando riesgo — cada semana sin canal aumenta la probabilidad de que el proyecto entre en Rescue Mode completo.

**Objective:**
Identificar y activar un canal de adquisición que produzca resultados medibles en menos de 4 semanas.

**Steps:**
1. Revisar hipótesis de canal actual: ¿qué se ha probado? ¿Qué resultado produjo cada intento?
2. Definir 3 canales alternativos concretos, no genéricos. ("LinkedIn outreach a directores de operaciones en empresas de 50–200 personas", no "redes sociales").
3. Ejecutar experimentos paralelos de 1 semana cada uno: mismo mensaje, métricas de éxito definidas antes de empezar.
4. Medir adquisición real: solo cuenta cliente real o lead cualificado, no clicks ni seguidores.
5. Identificar el canal con mejor señal y doblar en él. Cortar los otros.

**Success Signal:**
```
acquisition_channels_count > 0
demand_coverage → 'validated' o 'strong'
```

**Failure Signal:**
```
acquisition_channels_count = 0 después de 4+ semanas de experimentos
probability_trend = 'declining' con probability_score < 30
```
Múltiples canales probados sin ningún resultado reproducible. Cada adquisición sigue siendo manual y no repetible.

**Common Mistakes:**
1. **Probar canales en los que el founder se siente cómodo, no donde están los clientes.** Preferencia personal ≠ canal correcto.
2. **Medir en las métricas equivocadas.** Reach, impresiones, o registros sin conversión real no son señal de canal.
3. **Cambiar el canal cada semana sin datos.** Un experimento de 3 días no es suficiente para descartar un canal.
4. **Seguir construyendo producto mientras el canal no funciona.** Más features no resuelven un problema de adquisición.

**Next Move:**
→ Early Traction Playbook (BUILD_PLAYBOOKS.md) si se identifica canal viable — continuar desde allí.
→ Project Reset Playbook (este documento) si múltiples rondas sin señal — puede ser que el segmento o la propuesta de valor requieran revisión.

---

## Playbook 3 — Structural Fix

**Phase:** Cualquiera

**Trigger:**
```
structural_block active
(t2_cash_flow_active = true OR strategic_blocks(function_no_owner|execution_drop) activos)
```

**Context:**
Hay un cuello de botella organizacional activo. Una función crítica no tiene dueño, la ejecución ha caído de forma sostenida, o hay un problema de caja activo (ya cubierto en Playbook 1 si es el trigger principal). En este estado, el resto del trabajo se construye sobre una base inestable. Añadir carga sin resolver el cuello estructural amplifica el problema.

**Objective:**
Eliminar el bloqueo estructural específico que impide que el proyecto avance.

**Steps:**
1. Identificar la función o rol bloqueado con precisión. ("No hay dueño de ventas" es accionable. "Necesitamos más recursos" no lo es.)
2. Definir un responsable temporal si no hay contratación posible ahora. Alguien asume la función — aunque sea parcialmente — hasta tener solución permanente.
3. Establecer entregables concretos para la función bloqueada: qué debe producir esa función en las próximas 2 semanas.
4. Revisar progreso semanal: ¿el bloqueo se ha reducido o persiste?
5. Ajustar responsabilidades según lo que se aprendió en la semana anterior. No esperar 4 semanas para cambiar si el approach no funciona.

**Success Signal:**
```
structural_block inactive
strategic_blocks(function_no_owner|execution_drop) resueltos
```

**Failure Signal:**
```
structural_block activo después de semana 3 sin cambio
bottleneck_role sin cambio durante 3+ semanas
```
El responsable definido no produjo los entregables acordados. El bloqueo persiste con la misma causa.

**Common Mistakes:**
1. **Asignar responsabilidad sin autoridad.** Una persona "responsable" de ventas que no puede tomar decisiones de pricing, mensaje, o proceso de seguimiento.
2. **Resolver el síntoma (cubrir el rol) sin entender la causa (por qué no había dueño).**
3. **Añadir nuevas responsabilidades a quien ya está sobrecargado.** Esto mueve el cuello estructural sin eliminarlo.
4. **No reducir el scope del trabajo durante el bloqueo.** Si una función crítica está bloqueada, las otras áreas deben ralentizarse, no acelerar.

**Next Move:**
→ Early Traction Playbook o Early Growth Playbook (BUILD_PLAYBOOKS.md) cuando el bloqueo esté resuelto — el proyecto puede volver al modo construcción.
→ Project Reset Playbook si el bloqueo persiste más de 4 semanas — puede indicar un problema más profundo de modelo o equipo.

---

## Playbook 4 — Project Reset

**Phase:** Cualquiera

**Trigger:**
```
phase_regressed = true
OR (probability_trend = 'declining' AND probability_score < 30)
OR viability_status = 'critical' (sin mejora tras Cash Survival)
```

**Context:**
El proyecto perdió tracción o una hipótesis clave resultó inválida. Puede ser una regresión de fase (el engine detectó que los indicadores retrocedieron), una caída sostenida en probabilidad, o viabilidad crítica que no mejoró con acciones financieras. En este estado, continuar ejecutando el plan actual es el error más costoso — si la hipótesis es incorrecta, la ejecución eficiente solo acerca más rápido al fracaso.

**Objective:**
Reevaluar el enfoque del proyecto desde la evidencia disponible y redefinir la hipótesis de forma que sea testeable.

**Steps:**
1. Revisar la hipótesis original: problema, segmento, solución. ¿Qué asumía cada uno? ¿Qué se ha comprobado?
2. Analizar el feedback real de los últimos 30–60 días: qué dijeron los clientes/usuarios, qué no usaron, qué pidieron.
3. Identificar qué específicamente falló: ¿la definición del problema, el segmento, la solución, o el canal?
4. Redefinir la hipótesis con el aprendizaje disponible. La nueva hipótesis debe ser falseable en menos de 4 semanas.
5. Validar el nuevo enfoque: no construir todavía — ejecutar las conversaciones mínimas para confirmar si la nueva hipótesis tiene tracción.

**Success Signal:**
```
probability_trend = 'stable' o 'growing'
phase_score mejora o se estabiliza
```

**Failure Signal:**
```
probability_trend = 'declining' o 'stable' con probability_score < 30 después de 4+ semanas
demand_coverage = 'none' tras nueva hipótesis
```
La nueva hipótesis tampoco muestra señal en el tiempo acordado. El patrón de fallo se repite con distinto framing.

**Common Mistakes:**
1. **Cambiar el framing sin cambiar la hipótesis.** Renombrar el producto o el segmento sin cambiar la apuesta fundamental no es un reset.
2. **No definir cuándo se descarta la nueva hipótesis.** Sin criterio de falsación explícito, el reset se convierte en loop de pivotes.
3. **Pivotear en pánico sin analizar el feedback real.** El reset debe venir de evidencia, no de emoción.
4. **Hacer el reset en solitario.** Si hay equipo o inversores, el reset sin alineación crea problemas de confianza más graves que el problema original.

**Next Move:**
→ Problem Discovery o Problem Validation Playbook (BUILD_PLAYBOOKS.md) según la nueva hipótesis — volver al inicio del ciclo de construcción.
→ Strategic Reset Ritual (T9.5) para estructurar la revisión si hay equipo involucrado.

---

## Playbook 5 — Focus Recovery

**Phase:** Cualquiera (puede activarse fuera de Rescue Mode estricto)

**Trigger:**
```
weeks_in_current_phase > 6
AND active_blocks = []
AND phase_score delta < 5 pts en las últimas 2 semanas
```

**Context:**
El proyecto no está en crisis: no hay viabilidad crítica, no hay blocks estructurales detectados, no hay regresión de fase. Pero tampoco está avanzando. La ejecución ocurre — hay actividad — pero sin movimiento en los indicadores del engine. Esta es la situación más difícil de diagnosticar porque todo "parece estar bien" mientras el tiempo pasa. El riesgo es que el engine no detecte un block porque el problema no es estructural sino de foco y priorización.

**Objective:**
Recuperar el foco operativo y conectar el trabajo semanal con las métricas que el engine mide.

**Steps:**
1. Revisar qué tareas se han ejecutado en las últimas 2 semanas. Listarlas.
2. Para cada tarea: ¿impacta directamente en alguna señal del engine (demand_coverage, acquisition_channels, delivery, probability)? Si no, es trabajo secundario.
3. Eliminar o pausar las tareas que no impactan en señales del engine en este momento.
4. Definir una única meta semanal que mueva un indicador concreto. Una sola.
5. Al final de la semana: ¿el indicador se movió? Si sí, repetir. Si no, revisar qué bloqueó el movimiento.

**Success Signal:**
```
phase_score delta > 5 pts en 2 semanas
OR probability_trend = 'growing'
```

**Failure Signal:**
```
phase_score sin cambio durante 3+ semanas tras aplicar el playbook
probability_trend = 'stable' o 'declining'
```
El trabajo semanal se conectó con métricas del engine pero los indicadores no se movieron. Puede indicar que hay un block que el engine no detecta todavía (candidato a behavioral_block post-lanzamiento).

**Common Mistakes:**
1. **Confundir actividad con avance.** Muchas tareas completadas ≠ indicadores del engine moviéndose.
2. **Tener 3 metas semanales en lugar de 1.** La dispersión es el problema original — más metas no lo resuelven.
3. **Medir outputs (tareas completadas) en lugar de outcomes (señales del engine).** El engine mide outcomes, no esfuerzo.
4. **No revisitar la priorización cuando el indicador no se mueve.** Si la meta era correcta pero el indicador no se movió, hay un bloqueo que necesita ser identificado.

**Next Move:**
→ Strategic Reset Ritual (T9.5) si el foco no mejora después de 3 semanas — puede indicar que la priorización requiere revisión estructurada.
→ Problem Re-entry: si la falta de movimiento en indicadores sugiere que la hipótesis de fase es incorrecta, volver a Problem Validation Playbook (BUILD_PLAYBOOKS.md).

---

## Relación con Build Mode

Los Rescue Mode playbooks se activan cuando los Build Mode playbooks han fallado o cuando el contexto externo ha deteriorado los indicadores. El encadenamiento típico:

```
Build Mode stall
       ↓ risk_level escalates o viability deteriorates
Rescue Mode activo
       ↓ según señal principal
Cash Survival         → t2_cash_flow_active = true
Traction Recovery     → traction_block + time > 4 weeks
Structural Fix        → structural_block activo
Project Reset         → phase_regressed o probability declining
Focus Recovery        → active_blocks = [] pero sin avance
       ↓ success signal
Vuelta a Build Mode playbooks
```

## Notas de implementación

**Optimus en Rescue Mode:**
- Cash Survival / Structural Fix con viability=critical → CASE-06 o CASE-07 (modo Estricto)
- Traction Recovery → CASE-03 o CASE-04 (modo Estándar con urgencia elevada)
- Project Reset → CASE-07 (modo Estricto, decisión estratégica)
- Focus Recovery → CASE-05 (modo Estándar, confidence=medium)

**Sobre behavioral_block:**
El Failure Signal de Focus Recovery ("trabajo ejecutado pero indicadores sin movimiento") es la señal de entrada para behavioral_block (P8.6, diferido). Cuando existan datos reales, este failure signal debería conectarse con la detección automática.

---

*v1.0 — 2026-03-12*
*Para playbooks de Build Mode → BUILD_PLAYBOOKS.md.*
*Para prompts de Optimus → OPTIMUS_PROMPTS.md (CASE-06/07 para modo Estricto).*
*Para vocabulario del sistema → MICROCOPY_SYSTEM.md.*
