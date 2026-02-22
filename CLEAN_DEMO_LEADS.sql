-- Limpiar los 3 leads de demostración
DELETE FROM leads;

-- Verificar que se limpiaron
SELECT COUNT(*) as leads_count FROM leads;
SELECT COUNT(*) as pipeline_count FROM pipeline_global;
