# BUILD MODE PLAYBOOKS — Nova Hub

> 5 playbooks operacionales para proyectos en Build Mode.
> Versión: v1.0 · Fecha: 2026-03-12
>
> **Build Mode:** `risk_level != 'high'|'critical' AND viability_status != 'critical'`
> Los playbooks se activan según señales del engine — no son contenido educativo.
> Vocabulario: MICROCOPY_SYSTEM.md. Schema de respuesta Optimus: OPTIMUS_PROMPTS.md.

---

## Estructura estándar

Todos los playbooks siguen esta estructura:

```
Name          — nombre del playbook
Phase         — fase del engine en la que aplica
Trigger       — estado del engine que activa el playbook
Context       — qué suele estar pasando en ese momento
Objective     — qué intenta lograr
Steps         — 3–6 pasos concretos
Success Signal — señal del engine que confirma progreso
Failure Signal — señal del engine que indica que no está funcionando
Common Mistakes — errores frecuentes en este playbook
Next Move     — qué playbook sigue
```

---

## Playbook 1 — Problem Discovery

**Phase:** 1

**Trigger:**
```
phase = 1
clarity_block active (phase_score < 35 AND demand_coverage = 'none')
```

**Context:**
El proyecto es una idea. No ha ocurrido ninguna validación con clientes reales. El founder sabe qué quiere construir pero no si alguien lo necesita. La actividad habitual en este momento es planificación, diseño, o construcción prematura — sin señal de demanda externa.

**Objective:**
Identificar un problema real que alguien tenga con suficiente frecuencia y urgencia para justificar una solución.

**Steps:**
1. Escribir la hipótesis de problema en una frase: "X tipo de persona tiene el problema Y cuando Z situación."
2. Identificar 5–10 personas que podrían tener ese problema (sin pedir permiso por email todavía — buscar conversaciones en persona o directas).
3. Hacer entrevistas cortas (20–30 min) centradas en comportamiento pasado, no en opiniones sobre la solución.
4. Anotar patrones repetidos: ¿qué palabras usa la gente para describir el problema? ¿Con qué frecuencia aparece?
5. Si hay patrón → reformular la hipótesis con el lenguaje real de los usuarios.

**Success Signal:**
```
demand_coverage → 'basic'
```
Al menos 3 personas describieron el problema de forma similar sin que se les sugiriera.

**Failure Signal:**
```
3–5 entrevistas completadas sin patrón repetido
demand_coverage = 'none' después de semana 4
```
Las personas entrevistadas describen el problema como "no tan urgente" o lo resuelven actualmente sin fricción.

**Common Mistakes:**
1. **Construir antes de validar.** Empezar a codificar o diseñar mientras se "espera" la validación. La construcción prematura genera sesgo de confirmación.
2. **Entrevistar solo a personas que ya están de acuerdo.** Amigos, familia, o followers que no son el cliente objetivo real.
3. **Hacer preguntas hipotéticas.** "¿Usarías X?" en lugar de "Cuéntame la última vez que tuviste este problema."
4. **Validar el producto en lugar del problema.** Mostrar el pitch deck o wireframes en lugar de explorar la experiencia del usuario.

**Next Move:**
→ Problem Validation Playbook (cuando `demand_coverage = 'basic'`)

---

## Playbook 2 — Problem Validation

**Phase:** 1–2

**Trigger:**
```
demand_coverage = 'basic'
clarity_block inactivo o en retroceso
```

**Context:**
Hay señales tempranas de demanda: algunas personas describieron el problema de forma similar. Pero la frecuencia, urgencia y disposición a cambiar no están confirmadas. El riesgo principal en este momento es confundir "esto es interesante" con "esto es un problema real y frecuente."

**Objective:**
Confirmar que el problema ocurre con suficiente frecuencia y urgencia para justificar una solución de negocio.

**Steps:**
1. Definir el caso concreto: en qué situación específica ocurre el problema, para qué perfil de persona.
2. Encontrar 10–20 personas que coincidan con ese perfil. Ampliar el alcance más allá del círculo inmediato.
3. Verificar frecuencia: ¿cuántas veces por semana/mes ocurre? ¿Cuándo fue la última vez?
4. Medir urgencia: ¿qué hacen actualmente para resolver el problema? ¿Cuánto cuesta esa solución en tiempo o dinero?
5. Validar disposición a cambiar: ¿han buscado alternativas? ¿Por qué no las usan?

**Success Signal:**
```
demand_coverage → 'validated'
```
Múltiples personas confirman el problema como frecuente, urgente, y sin solución satisfactoria actual.

**Failure Signal:**
```
demand_coverage = 'basic' después de 3–4 semanas de entrevistas
```
Los usuarios describen el problema como "menor" o "conveniente tener solución" — no urgente. La mayoría ya tiene una alternativa con la que está satisfecha.

**Common Mistakes:**
1. **Confundir "es interesante" con "es un problema."** La aprobación de la idea no es evidencia de demanda.
2. **No medir frecuencia.** Validar que el problema existe sin confirmar cuántas veces ocurre. Un problema que ocurre una vez al año no es base de negocio.
3. **Saltar a la solución.** Empezar a hablar de la solución en la misma conversación donde se valida el problema — contamina las respuestas.
4. **No entender los workarounds actuales.** La solución más cercana ya existe: saber qué es (y por qué no es suficiente) es más valioso que cualquier MVP.

**Next Move:**
→ Solution Prototype Playbook (cuando `demand_coverage = 'validated'`)

---

## Playbook 3 — Solution Prototype

**Phase:** 2

**Trigger:**
```
demand_coverage = 'validated'
delivery_coverage IN ('none', 'basic')
```

**Context:**
El problema es real y frecuente. Ahora la pregunta es si este enfoque de solución funciona. Este es el momento de mayor riesgo de sobre-construcción: el founder tiene evidencia de que el problema existe y quiere demostrar que puede resolverlo. La presión de construir es máxima. El objetivo no es construir bien — es aprender rápido.

**Objective:**
Construir la versión mínima posible que permita probar si el enfoque de solución funciona.

**Steps:**
1. Definir exactamente qué debe ser verdad para considerar que el prototipo "funciona." (Acordar antes de construir, no después.)
2. Eliminar todo lo que no sea necesario para probar esa hipótesis específica. No añadir features "mientras se está."
3. Construir el prototipo más rápido posible: mockup interactivo, proceso manual, o código mínimo — lo que tome menos tiempo.
4. Mostrar el prototipo a 3–5 usuarios del Playbook 2. Observar el comportamiento, no solo escuchar las opiniones.
5. Medir si cambian su comportamiento actual para usar la solución, o si solo la aprueban verbalmente.

**Success Signal:**
```
delivery_coverage → 'basic' o 'working'
```
Al menos 2–3 usuarios del segmento objetivo usaron el prototipo sin que se les pidiera explícitamente que lo hicieran.

**Failure Signal:**
```
delivery_coverage = 'none' después de múltiples iteraciones
```
Los usuarios reaccionan positivamente en la conversación pero no adoptan el prototipo en su comportamiento real. "Me parece bien" sin cambio de comportamiento.

**Common Mistakes:**
1. **Construir demasiado.** Sprint de 3 meses en lugar de prototipo de 1 semana. El objetivo es aprender, no lanzar.
2. **Medir entusiasmo en lugar de comportamiento.** "¡Esto es increíble!" no es success signal. El uso real sí lo es.
3. **No definir qué significa "adopción" antes de mostrar el prototipo.** Sin criterio previo, cualquier reacción positiva parece suficiente.
4. **Iterar el diseño en lugar de la hipótesis.** Cambiar colores o flujos cuando la señal indica que el problema de fondo no está resuelto.

**Next Move:**
→ Early Traction Playbook (cuando `delivery_coverage` avanza a 'working')

---

## Playbook 4 — Early Traction

**Phase:** 3

**Trigger:**
```
delivery_coverage = 'working'
traction_block active (demand_coverage <= 'basic' OR acquisition_channels_count = 0)
```

**Context:**
Algo funciona: hay usuarios que adoptan el producto. Pero no existe una forma repetible de encontrar nuevos clientes. Cada adquisición es manual, lenta, o accidental. El crecimiento depende de esfuerzo individual, no de un canal. Sin un canal, el proyecto no puede escalar — y tampoco puede generar aprendizaje sistemático sobre qué funciona.

**Objective:**
Identificar un canal de adquisición que genere clientes de forma suficientemente repetible para doblar en él.

**Steps:**
1. Listar los 3–5 canales más probables para el segmento objetivo (basado en dónde están esas personas, no en lo que el founder prefiere hacer).
2. Diseñar un experimento mínimo por canal: una semana, un mensaje, una métrica de éxito.
3. Ejecutar los experimentos en paralelo — no de forma secuencial.
4. Medir coste de adquisición real: tiempo + dinero por cliente conseguido.
5. Comparar resultados. Doblar en el canal con mejor señal aunque no sea el favorito.

**Success Signal:**
```
acquisition_channels_count > 0
demand_coverage → 'strong'
```
Un canal produce clientes de forma repetible con un CAC medible.

**Failure Signal:**
```
acquisition_channels_count = 0 después de 4+ semanas de experimentos
probability_trend = 'declining' o 'stable' con probability_score < 30
```
Múltiples experimentos en canales distintos sin ningún resultado reproducible. Coste de adquisición indefinible.

**Common Mistakes:**
1. **Probar 3 canales en paralelo con atención dividida.** Un canal probado bien da más señal que tres probados superficialmente.
2. **Optimizar prematuramente.** Gasto en ads o automatización antes de validar que el canal funciona de forma orgánica.
3. **Medir vanity metrics.** Clicks, registros o seguidores en lugar de clientes reales que pagan o comprometen.
4. **Escalar el producto en lugar del canal.** Añadir features mientras el canal no está validado no resuelve el traction_block.

**Next Move:**
→ Early Growth Playbook (cuando `traction_block = false` y canal activo confirmado)

---

## Playbook 5 — Early Growth

**Phase:** 4

**Trigger:**
```
traction_block = false
delivery_coverage = 'working'
acquisition_channels_count > 0
```

**Context:**
Un canal funciona y produce clientes. La tracción inicial existe. El riesgo ahora es diferente: no es encontrar un canal, sino no romper lo que ya funciona mientras se intenta escalar. La presión de crecer rápido puede llevar a escalar antes de que la economía unitaria sea positiva, o a añadir canales antes de que el primero sea estable.

**Objective:**
Convertir la tracción inicial en crecimiento estable y medible semana a semana.

**Steps:**
1. Identificar el canal con mejor señal y documentar exactamente qué mensaje, audiencia y formato funciona.
2. Estandarizar el proceso de adquisición: mismo mensaje, mismas métricas, mismo ciclo semanal.
3. Mejorar la conversión en el canal principal antes de añadir nuevos canales. Una mejora del 20% en conversión equivale a 20% más clientes sin coste adicional.
4. Identificar y automatizar el primer proceso repetitivo que esté limitando la escala (no todo — el primero que más frena).
5. Establecer revisión semanal de 3 métricas clave: nuevos clientes, coste de adquisición, retención a 4 semanas.

**Success Signal:**
```
probability_trend = 'growing'
probability_score mejora sostenida durante 3+ semanas
```
Crecimiento semanal medible y consistente sin aumento proporcional en coste o esfuerzo.

**Failure Signal:**
```
probability_trend = 'stable' o 'declining' después de 4+ semanas
```
Spike inicial seguido de estancamiento. CAC aumenta sin mejora en conversión. Clientes nuevos no retienen.

**Common Mistakes:**
1. **Escalar pérdidas.** Doblar el gasto en adquisición antes de que la economía unitaria sea positiva. Escala los problemas, no el crecimiento.
2. **Añadir canales antes de estabilizar el primero.** Diversificación prematura diluye el aprendizaje de qué funciona.
3. **Optimizar conversión sin medir retención.** Conseguir clientes que no vuelven degrada la probabilidad aunque el número de nuevos clientes suba.
4. **No documentar qué funciona.** El conocimiento sobre el canal queda en la cabeza de una persona — frágil cuando el equipo crece.

**Next Move:**
→ Scale experiments (Fase 4 sostenida: repetir ciclo con validación de nuevos canales y segmentos)

---

## Encadenamiento de Playbooks

```
Problem Discovery     → clarity_block activo, demand='none'
       ↓ demand_coverage → 'basic'
Problem Validation    → demand='basic', confirmar frecuencia/urgencia
       ↓ demand_coverage → 'validated'
Solution Prototype    → delivery='none'|'basic', aprender si la solución funciona
       ↓ delivery_coverage → 'working'
Early Traction        → traction_block activo, buscar canal
       ↓ acquisition_channels_count > 0
Early Growth          → canal validado, convertir en crecimiento estable
       ↓ probability_trend → 'growing'
Scale experiments
```

---

## Notas de implementación

**Activación automática:**
Los triggers están en campos de `get_optimus_context()`. El sistema puede activar el playbook relevante sin intervención manual.

**Relación con Optimus:**
Cada playbook corresponde aproximadamente a un CASE de OPTIMUS_PROMPTS.md:
- Problem Discovery → CASE-01 (clarity_block, exploración)
- Problem Validation → CASE-02 (traction_block, exploración)
- Early Traction → CASE-03 (traction_block, estándar)
- Early Growth → CASE-05 (no_block, estándar)

**Relación con Microcopy:**
Los Success/Failure signals usan los `state_id` de MICROCOPY_SYSTEM.md como fuente de vocabulario.

---

*v1.0 — 2026-03-12*
*Para playbooks de Rescue Mode → RESCUE_PLAYBOOKS.md (T9.3).*
*Para prompts de Optimus → OPTIMUS_PROMPTS.md.*
*Para vocabulario del sistema → MICROCOPY_SYSTEM.md.*
