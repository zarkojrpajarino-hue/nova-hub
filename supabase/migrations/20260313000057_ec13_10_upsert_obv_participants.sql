-- EC13.10 — Upsert participants for an existing OBV (split credit, historial preservado)
--
-- La tabla obv_participantes solo tiene política INSERT (no UPDATE/DELETE).
-- Esta función SECURITY DEFINER reemplaza todos los participantes atómicamente.
-- El caller incluye TODOS los participantes — incluyendo la fila del owner con su %.
-- El owner_id de la tabla obvs nunca se modifica (historial preservado).
--
-- Autorización: solo el owner de la OBV puede llamar esta función.

CREATE OR REPLACE FUNCTION upsert_obv_participants(
  p_obv_id      UUID,
  p_participants JSONB   -- [{member_id: UUID, porcentaje: NUMERIC}]
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Solo el owner de la OBV puede editar participantes
  IF NOT EXISTS (
    SELECT 1 FROM obvs
    WHERE id = p_obv_id
      AND owner_id = public.get_profile_id(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: only the OBV owner can edit participants';
  END IF;

  -- Reemplazar atómicamente (DELETE + INSERT en la misma transacción)
  DELETE FROM obv_participantes WHERE obv_id = p_obv_id;

  INSERT INTO obv_participantes (obv_id, member_id, porcentaje)
  SELECT
    p_obv_id,
    (e->>'member_id')::UUID,
    (e->>'porcentaje')::NUMERIC
  FROM jsonb_array_elements(p_participants) AS e;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_obv_participants(UUID, JSONB) TO authenticated;
