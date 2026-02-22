-- Ver la definición de la vista pipeline_global
SELECT 
    table_name,
    view_definition
FROM 
    information_schema.views
WHERE 
    table_schema = 'public'
    AND table_name = 'pipeline_global';

-- También verificar si hay datos en lead_history
SELECT COUNT(*) as lead_history_count FROM lead_history;
