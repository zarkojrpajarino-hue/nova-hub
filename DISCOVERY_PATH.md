# DISCOVERY PATH — T9.8

> 3 herramientas operativas para la fase de descubrimiento.
> Versión: v1.0 · Fecha: 2026-03-12
>
> **Cuándo usar esto:** Phase 1 (Problem Discovery) y Phase 2 (Problem Validation).
> Activación desde BUILD_PLAYBOOKS.md §1 y §2, o desde Project Reset (RESCUE_PLAYBOOKS.md §4).
>
> Regla de tono: estas herramientas son para ejecutar, no para leer.

---

## Artefacto 1 — Interview Template

**Para:** conversación 1:1 con potenciales clientes. 20–30 minutos.
**Regla:** preguntas sobre comportamiento pasado, no opiniones sobre la solución.
**No hacer:** mostrar el producto, hacer pitch, preguntar "¿usarías esto?"

---

### Apertura (2 min)

> "Estoy explorando [espacio del problema] y quiero entender cómo lo vive la gente.
> Hoy no voy a mostrarte nada — solo quiero aprender de tu experiencia."

---

### Sección 1 — Contexto (3 min)

- ¿Cuál es tu rol? ¿Cómo es una semana normal para ti?
- ¿Qué parte de tu trabajo tiene que ver con [espacio del problema]?

*Objetivo: entender si esta persona es realmente el perfil que buscas.*

---

### Sección 2 — Problema reciente (10 min)

- Cuéntame la última vez que tuviste que lidiar con [problema].
- ¿Qué pasó, paso a paso?
- ¿Qué hiciste primero?
- ¿Qué pasó después?

*Escuchar: situación específica, herramientas nombradas, otras personas involucradas, lenguaje emocional.*
*No interrumpir para sugerir soluciones. No confirmar con "sí, exacto".*

---

### Sección 3 — Frecuencia (3 min)

- ¿Con qué frecuencia aparece esto?
- ¿Cuándo fue la última vez antes de esa?
- ¿Es recurrente, puntual, o estacional?

**Red flag:** "de vez en cuando" sin recordar una instancia específica.

---

### Sección 4 — Impacto (5 min)

- ¿Qué pasa cuando no puedes resolverlo rápido?
- ¿Cuánto tiempo te lleva cuando aparece?
- ¿Te ha costado dinero, un cliente, o tiempo de equipo alguna vez?

*Escuchar: costes cuantificables, consecuencias concretas nombradas.*

---

### Sección 5 — Solución actual (5 min)

- ¿Qué haces ahora cuando esto ocurre?
- ¿Has probado otras herramientas o aproximaciones?
- ¿Por qué no usas [alternativa obvia]?
- Del 1 al 10, ¿qué tan satisfecho estás con tu solución actual?

**Red flag:** satisfacción ≥ 8 sin fricción en la descripción previa.

---

### Sección 6 — Disposición a cambiar (3 min)

- ¿Has buscado activamente algo mejor?
- ¿Qué necesitarías ver para cambiar?
- Si existiera una solución mejor, ¿qué sería lo primero que necesitarías para confiar en ella?

*Escuchar: historial de búsqueda activa — buscó y no encontró = señal fuerte.*

---

### Cierre (2 min)

- ¿Hay alguien más con este problema que debería conocer?
- ¿Puedo volver a escribirte si tengo más preguntas?

---

### Red flags de la entrevista (ajustar hipótesis si aparecen 2+)

- No recuerda ninguna instancia reciente específica
- Solución actual ≥ 8 sin fricción en la descripción
- Describe el problema como "estaría bien resolverlo", no como "me genera coste real"
- Propone tu solución antes de que la menciones (están siendo amables)
- Múltiples workarounds activos con los que está contento

---

## Artefacto 2 — Persona Canvas

**Para:** sintetizar el perfil del cliente objetivo tras 3+ entrevistas con patrón consistente.
**Regla:** todos los campos deben venir de evidencia de entrevistas, no de suposiciones.
**Un canvas por segmento observado.** Si hay dos segmentos distintos con el mismo problema, dos canvas.

---

```
PERSONA CANVAS                                   Fecha: __________
Entrevistas que lo sustentan: __ (mínimo 3)

QUIÉN ES
Rol + contexto en una línea (no demografía):
→

QUÉ INTENTA LOGRAR
Job-to-be-done — qué tarea intenta completar, no qué quiere sentir:
→

PRINCIPAL DOLOR
El problema específico, en sus propias palabras si es posible:
→

MOMENTO EN QUE APARECE
Situación trigger — cuándo/dónde/qué estaba haciendo cuando el problema aparece:
→

ALTERNATIVA ACTUAL
Qué usa ahora (herramienta, proceso, workaround):
→  Satisfacción: __ / 10

OBJECIONES
Por qué no cambiaría aunque tu solución fuera mejor:
→

SEÑAL DE URGENCIA
Comportamiento observable que indica que está activamente buscando solución:
→

VALIDACIÓN
demand_coverage actual:  [ ] none  [ ] basic  [ ] validated
```

---

**Umbrales de validación:**

| Entrevistas con patrón consistente | Estado |
|---|---|
| 0–2 | Solo hipótesis — no llenar canvas todavía |
| 3 | Llenar canvas. `demand_coverage → 'basic'` |
| 5+ | Canvas validado. `demand_coverage → 'validated'` |

---

## Artefacto 3 — Guía de 7 días

**Para:** sprint de descubrimiento de problema — de idea a hipótesis validada (o descartada) en una semana.
**Requisito:** mínimo 15–20 horas de foco distribuidas en los 7 días. Este ritmo es presupuesto de tiempo, no de calendario — si el foco no está disponible, extender la guía a 2 semanas antes que ejecutarla diluida.
**Output final:** un Persona Canvas completo + una decisión.

---

### Día 1 — Definir hipótesis
**Tiempo estimado:** 2 horas

**Tarea:** escribir la hipótesis de problema en una frase:
> "**[tipo de persona X]** tiene el problema **[Y]** cuando **[situación Z]**."

Ejemplo: "Los directores de ventas en empresas de 10–50 personas pierden visibilidad sobre el estado de sus deals cuando trabajan con equipos distribuidos."

**Reglas de la hipótesis:**
- Sin mención de solución
- X debe ser lo suficientemente específico para poder encontrar personas reales hoy
- Y debe ser un comportamiento o consecuencia concreta, no una incomodidad vaga
- Z debe ser una situación que pueda triggear

**Output esperado:** 1 frase escrita + lista de 10 nombres o lugares donde existe X.

**Failure signal:** No puedes escribir Z sin hablar primero con gente → la hipótesis es prematura. Observa antes de formularla.

---

### Día 2 — Identificar personas + preparar
**Tiempo estimado:** 2–3 horas

**Tareas:**
1. Confirmar lista de 10 personas que coincidan con X del Día 1. No warm introductions — personas a las que puedas llegar hoy.
2. Escribir el mensaje de 2 líneas para pedir la conversación. Sin pitch. Sin producto. Solo: "quiero aprender de tu experiencia con [problema]".
3. Enviar los 10 mensajes.
4. Preparar el Interview Template — marcar las 3 preguntas más críticas para tu hipótesis específica.

**Output esperado:** 10 mensajes enviados. 3–5 confirmaciones esperadas.

**Failure signal:** No encuentras 10 personas reales que coincidan con X → el segmento es demasiado estrecho o el canal de acceso es incorrecto. Revisar X antes de enviar.

---

### Días 3–4 — Ejecutar entrevistas
**Tiempo estimado:** 4–6 horas (3–5 entrevistas de 20–30 min)

**Tarea:** ejecutar las entrevistas siguiendo el template. Notas durante o inmediatamente después.
Foco en Secciones 2, 3 y 4 (Problema, Frecuencia, Impacto) — ahí está toda la decisión.

**Después de cada entrevista**, anotar:
- 1 frase: cuál fue el problema principal que describió
- 1 número: con qué frecuencia ocurre (por semana / mes)
- 1 calificación: satisfacción con su solución actual (alta / media / baja)

**Output esperado:** 3–5 entrevistas completadas con notas.

**Failure signal:** Nadie tiene un ejemplo reciente específico → el problema no ocurre con frecuencia suficiente, o estás hablando con las personas equivocadas.

---

### Día 5 — Sintetizar patrones
**Tiempo estimado:** 2–3 horas

**Tareas:**
1. Leer todas las notas de entrevista.
2. Identificar qué describieron 2+ personas sin que se los sugerizara.
3. Llenar el Persona Canvas con evidencia de las entrevistas.
4. Responder: ¿3+ personas describieron el mismo problema, en términos similares, con frecuencia similar?

**Si sí:** `demand_coverage → 'basic'`. Continuar al Día 6.
**Si no:** el patrón no está confirmado. Opciones: (a) hacer 2–3 entrevistas más antes del Día 6, (b) revisar la hipótesis del Día 1 antes de continuar.

**Output esperado:** Persona Canvas completo (o decisión de hacer más entrevistas).

---

### Día 6 — Reformular hipótesis
**Tiempo estimado:** 1–2 horas

**Tareas:**
1. Reescribir la hipótesis del Día 1 usando el lenguaje real de las entrevistas.
2. Identificar qué estaba equivocado en la hipótesis original: ¿el segmento era demasiado amplio? ¿El problema no era específico? ¿La situación Z era incorrecta?
3. Escribir la hipótesis actualizada en el mismo formato de una frase.

**Regla:** si la nueva hipótesis es casi idéntica a la original, o las entrevistas la confirmaron exactamente, o las preguntas no profundizaron lo suficiente. Decidir cuál es.

**Output esperado:** hipótesis actualizada + 1 línea de nota sobre qué cambió y por qué.

---

### Día 7 — Decisión
**Tiempo estimado:** 1 hora

**Tarea:** responder estas 3 preguntas con evidencia de la semana:

| Pregunta | Respuesta |
|---|---|
| ¿3+ personas describieron este problema sin que se los sugirieras? | Sí / No |
| ¿El problema ocurre al menos [una vez por semana / mes según tu modelo]? | Sí / No |
| ¿Su solución actual es genuinamente insatisfactoria (puntuación < 7)? | Sí / No |

**Tabla de decisión:**

| Q1 | Q2 | Q3 | Decisión |
|---|---|---|---|
| Sí | Sí | Sí | ✅ Avanzar — `demand_coverage → 'basic'`. Ir a Problem Validation Playbook. |
| Sí | Sí | No | ⚠️ El problema existe pero la urgencia es baja. Sondear más antes de avanzar. |
| Sí | No | Cualquiera | ⚠️ Problema demasiado infrecuente. Sin alta disposición a pagar, no hay negocio. |
| No | Cualquiera | Cualquiera | ❌ Patrón no encontrado. Revisar hipótesis o cambiar segmento. |

**Output esperado:** tabla de decisión completada + próxima acción nombrada.

---

### Conexión con el engine

| Día | Señal del engine |
|---|---|
| Días 1–2 | Sin señal (preparación) |
| Día 5 | `demand_coverage → 'basic'` si 3+ entrevistas con patrón confirmado |
| Día 7 | `demand_coverage → 'validated'` si las 3 preguntas de decisión son Sí |

Condición de avance a Phase 2: `demand_coverage = 'basic'` (mínimo) desde los criterios de Phase 1 del engine.

---

### Common Mistakes (los 3 artefactos)

1. **Entrevistar a personas que ya conocen tu idea.** Serán amables. Busca desconocidos.
2. **Llenar el Persona Canvas con suposiciones.** Cada campo necesita evidencia de entrevista.
3. **Saltarse el Día 6.** Reformular la hipótesis es el paso más difícil y más valioso de la semana.
4. **Tratar el Día 7 como formalidad.** Si la decisión es ❌ o ⚠️, la acción correcta es pausar, no avanzar esperando que mejore.
5. **Ejecutar la guía en 3 semanas de forma parcial.** La guía funciona como sprint. Diluida, la señal se deteriora.

---

## Relación con el sistema

| Artefacto | Cuándo usarlo | Playbook que lo activa |
|---|---|---|
| Interview Template | Phase 1 y 2 | Problem Discovery (BUILD §1), Problem Validation (BUILD §2) |
| Persona Canvas | Tras 3+ entrevistas con patrón | Problem Discovery (BUILD §1) |
| 7-Day Guide | Al iniciar Phase 1 o tras Project Reset | Problem Discovery (BUILD §1), Project Reset (RESCUE §4) |

**Benchmarks de referencia** (BENCHMARKS_V1.md — Process Benchmarks Phase 1):
- Low: 0–2 entrevistas
- Expected: 3–10 entrevistas
- Strong: 10+ entrevistas

---

*v1.0 — 2026-03-12*
*Para los playbooks que referencian este path → BUILD_PLAYBOOKS.md (§1, §2).*
*Para benchmarks de entrevistas esperadas → BENCHMARKS_V1.md (Phase 1, Process Benchmarks).*
*Para criterios de avance de fase → ENGINE_SPEC_V1.md (Phase 1 thresholds).*
