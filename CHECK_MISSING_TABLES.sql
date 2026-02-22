-- Verificar qué tablas existen y cuáles faltan
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obvs') 
    THEN '✅ obvs existe'
    ELSE '❌ obvs NO existe'
  END as obvs_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kpis') 
    THEN '✅ kpis existe'
    ELSE '❌ kpis NO existe'
  END as kpis_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') 
    THEN '✅ tasks existe'
    ELSE '❌ tasks NO existe'
  END as tasks_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obvs_public') 
    THEN '✅ obvs_public existe'
    ELSE '❌ obvs_public NO existe'
  END as obvs_public_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_validations') 
    THEN '✅ pending_validations existe'
    ELSE '❌ pending_validations NO existe'
  END as pending_validations_status;
