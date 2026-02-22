-- =====================================================
-- EVIDENCE SYSTEM - QUERIES PARA DECISIONES RÁPIDAS
-- =====================================================
-- Ejecutar estas queries en día 5-7 para detectar problemas

-- =====================================================
-- 1. FRICCIÓN: ¿Usuarios huyen a hypothesis?
-- =====================================================

-- Red flag: > 30% cambian a hypothesis = sistema too serious
SELECT
  m.feature,
  COUNT(*)::INTEGER AS total_generations,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM evidence_user_events e
      WHERE e.generation_id = m.id
        AND e.event_type = 'changed_mode'
        AND e.event_data->>'new_mode' = 'hypothesis'
    )
  )::INTEGER AS switched_to_hypothesis,
  (COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM evidence_user_events e
      WHERE e.generation_id = m.id
        AND e.event_type = 'changed_mode'
        AND e.event_data->>'new_mode' = 'hypothesis'
    )
  ) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5,2) AS switched_rate_percent
FROM evidence_generation_metrics m
WHERE m.created_at > NOW() - INTERVAL '7 days'
GROUP BY m.feature
HAVING COUNT(*) > 10  -- Solo features con suficientes datos
ORDER BY switched_rate_percent DESC NULLS LAST;

-- ACCIÓN:
-- Si switched_rate > 30% en tasks → Cambiar default a hypothesis
-- Si switched_rate > 20% en CRM → Reducir minSourcesOverall

-- =====================================================
-- 2. VALOR: ¿Usuarios abren el report?
-- =====================================================

-- Red flag: > 70% ignoran report = sobre-ingenierización
SELECT
  m.feature,
  COUNT(*)::INTEGER AS total_generations,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM evidence_user_events e
      WHERE e.generation_id = m.id
        AND e.event_type = 'opened_report'
    )
  )::INTEGER AS opened_report,
  (COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM evidence_user_events e
      WHERE e.generation_id = m.id
        AND e.event_type = 'opened_report'
    )
  ) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5,2) AS ignored_rate_percent
FROM evidence_generation_metrics m
WHERE m.created_at > NOW() - INTERVAL '7 days'
GROUP BY m.feature
HAVING COUNT(*) > 10
ORDER BY ignored_rate_percent DESC;

-- ACCIÓN:
-- Si ignored_rate > 70% → Simplificar UI del report
-- Si ignored_rate > 85% → Considerar eliminar report, no aporta valor

-- =====================================================
-- 3. PROBLEMA DE PROMPTS: Citation utilization bajo
-- =====================================================

-- Red flag: < 0.25 = model no cita sources (waste)
SELECT
  feature,
  mode,
  COUNT(*)::INTEGER AS total_generations,
  AVG(citation_utilization)::NUMERIC(5,2) AS avg_citation_util,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY citation_utilization)::NUMERIC(5,2) AS p50_citation_util
FROM evidence_generation_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
  AND sources_found > 0  -- Solo cuando hubo sources
GROUP BY feature, mode
HAVING AVG(citation_utilization) < 0.30
ORDER BY avg_citation_util ASC;

-- ACCIÓN:
-- Si avg < 0.25 → Mejorar prompts para forzar citación
-- Si avg < 0.15 → Sources irrelevantes, ajustar queryHints

-- =====================================================
-- 4. PROBLEMA DE RETRIEVAL: Latencia alta o timeouts
-- =====================================================

-- A) Latencia general por feature/mode
SELECT
  feature,
  mode,
  COUNT(*)::INTEGER AS total_generations,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_latency_ms)::INTEGER AS p50_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms)::INTEGER AS p95_latency_ms,
  AVG(retrieval_time_ms)::INTEGER AS avg_retrieval_ms,
  COUNT(*) FILTER (WHERE timeout_occurred = true)::INTEGER AS timeouts
FROM evidence_generation_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY feature, mode
ORDER BY p95_latency_ms DESC;

-- B) ¿Qué tiers están causando timeouts?
SELECT
  m.feature,
  tier AS timed_out_tier,
  COUNT(*)::INTEGER AS timeout_count,
  AVG((tier_durations_ms->>tier)::INTEGER)::INTEGER AS avg_duration_ms
FROM evidence_generation_metrics m,
LATERAL unnest(m.timed_out_tiers) AS tier
WHERE m.created_at > NOW() - INTERVAL '7 days'
  AND m.timed_out_tiers IS NOT NULL
GROUP BY m.feature, tier
ORDER BY timeout_count DESC;

-- ACCIÓN:
-- Si official_apis timeout frecuente → Reducir timeout o eliminar del tierOrder
-- Si web_news timeout frecuente → Eliminar tier (suele ser lento y poco valor)

-- =====================================================
-- 5. SOBRE-INGENIERÍA: Report ignorado + latencia alta
-- =====================================================

-- Features con mala ecuación: lentos Y nadie usa el report
SELECT
  m.feature,
  COUNT(*)::INTEGER AS total_generations,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY m.total_latency_ms)::INTEGER AS p95_latency_ms,
  (COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM evidence_user_events e
      WHERE e.generation_id = m.id
        AND e.event_type = 'opened_report'
    )
  ) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5,2) AS ignored_rate_percent
FROM evidence_generation_metrics m
WHERE m.created_at > NOW() - INTERVAL '7 days'
GROUP BY m.feature
HAVING COUNT(*) > 10
  AND PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY m.total_latency_ms) > 5000  -- > 5s
ORDER BY ignored_rate_percent DESC;

-- ACCIÓN:
-- Si p95 > 5s Y ignored > 70% → Apagar evidence system para esa feature
-- Costo alto, valor bajo = mala inversión

-- =====================================================
-- 6. WASTE RATE por feature
-- =====================================================

SELECT
  feature,
  mode,
  COUNT(*)::INTEGER AS total_generations,
  COUNT(*) FILTER (WHERE waste_flag = true)::INTEGER AS waste_count,
  (COUNT(*) FILTER (WHERE waste_flag = true) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5,2) AS waste_rate_percent
FROM evidence_generation_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY feature, mode
HAVING waste_rate_percent > 20
ORDER BY waste_rate_percent DESC;

-- ACCIÓN:
-- Si waste_rate > 40% → BLOCKER, apagar retrieval para esa feature
-- Si waste_rate 20-40% → Revisar prompts y queryHints

-- =====================================================
-- 7. DEFAULTS MAL CALIBRADOS: Regeneración frecuente
-- =====================================================

SELECT
  m.feature,
  COUNT(*)::INTEGER AS total_generations,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM evidence_user_events e
      WHERE e.generation_id = m.id
        AND e.event_type = 'regenerated'
    )
  )::INTEGER AS regenerated_count,
  (COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM evidence_user_events e
      WHERE e.generation_id = m.id
        AND e.event_type = 'regenerated'
    )
  ) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5,2) AS regen_rate_percent
FROM evidence_generation_metrics m
WHERE m.created_at > NOW() - INTERVAL '7 days'
GROUP BY m.feature
HAVING COUNT(*) > 10
ORDER BY regen_rate_percent DESC;

-- ACCIÓN:
-- Si regen_rate > 20% → Evidencia insuficiente frecuentemente
-- → Bajar minSourcesOverall o mejorar retrieval

-- =====================================================
-- 8. TIER PERFORMANCE: ¿Cuál tier es más lento?
-- =====================================================

SELECT
  tier_name,
  COUNT(*)::INTEGER AS usage_count,
  AVG(duration_ms)::INTEGER AS avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::INTEGER AS p95_duration_ms
FROM (
  SELECT
    key AS tier_name,
    value::TEXT::INTEGER AS duration_ms
  FROM evidence_generation_metrics,
  LATERAL jsonb_each_text(tier_durations_ms)
  WHERE created_at > NOW() - INTERVAL '7 days'
    AND tier_durations_ms IS NOT NULL
) AS tier_data
GROUP BY tier_name
ORDER BY avg_duration_ms DESC;

-- ACCIÓN:
-- Si tier p95 > soft cap → Reducir timeout de ese tier
-- Si tier avg alto pero poco valor → Eliminar del tierOrder

-- =====================================================
-- 9. RESUMEN EJECUTIVO (Dashboard)
-- =====================================================

SELECT
  feature,
  mode,
  COUNT(*)::INTEGER AS total_gens,

  -- Performance
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_latency_ms)::INTEGER AS p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms)::INTEGER AS p95_ms,

  -- Retrieval
  AVG(sources_found)::NUMERIC(5,2) AS avg_sources,
  AVG(NULLIF(citation_utilization, 0))::NUMERIC(5,2) AS avg_citation_util,

  -- Waste
  (COUNT(*) FILTER (WHERE waste_flag = true) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5,2) AS waste_rate,

  -- Timeouts
  COUNT(*) FILTER (WHERE timeout_occurred = true)::INTEGER AS timeouts,

  -- Evidence quality
  COUNT(*) FILTER (WHERE evidence_status = 'verified')::INTEGER AS verified_count,
  COUNT(*) FILTER (WHERE evidence_status = 'partial')::INTEGER AS partial_count,
  COUNT(*) FILTER (WHERE evidence_status = 'no_evidence')::INTEGER AS no_evidence_count

FROM evidence_generation_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY feature, mode
ORDER BY total_gens DESC;

-- =====================================================
-- 10. RED FLAGS AUTOMÁTICOS (Query diaria)
-- =====================================================

WITH metrics AS (
  SELECT
    feature,
    mode,
    COUNT(*)::INTEGER AS total_gens,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms) AS p95_ms,
    AVG(NULLIF(citation_utilization, 0)) AS avg_citation_util,
    COUNT(*) FILTER (WHERE waste_flag = true) * 100.0 / NULLIF(COUNT(*), 0) AS waste_rate
  FROM evidence_generation_metrics
  WHERE created_at > NOW() - INTERVAL '1 day'
  GROUP BY feature, mode
  HAVING COUNT(*) > 5
)
SELECT
  feature,
  mode,
  CASE
    WHEN p95_ms > 7000 THEN 'RED: p95 > 7s (too slow)'
    WHEN avg_citation_util < 0.20 THEN 'RED: citation_util < 0.20 (waste)'
    WHEN waste_rate > 40 THEN 'RED: waste_rate > 40% (blocker)'
    WHEN p95_ms > 5000 THEN 'YELLOW: p95 > 5s (review)'
    WHEN waste_rate > 25 THEN 'YELLOW: waste_rate > 25% (review)'
    ELSE 'GREEN: OK'
  END AS status,
  total_gens,
  p95_ms::INTEGER,
  avg_citation_util::NUMERIC(5,2),
  waste_rate::NUMERIC(5,2)
FROM metrics
WHERE p95_ms > 5000 OR avg_citation_util < 0.25 OR waste_rate > 25
ORDER BY
  CASE
    WHEN p95_ms > 7000 OR avg_citation_util < 0.20 OR waste_rate > 40 THEN 1
    ELSE 2
  END,
  p95_ms DESC;
