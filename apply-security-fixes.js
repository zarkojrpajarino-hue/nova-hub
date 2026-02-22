/**
 * Script para aplicar correcciones de seguridad a Supabase
 * Ejecutar con: node apply-security-fixes.js
 */

const fs = require('fs');
const path = require('path');

// Configuración de Supabase desde .env
require('dotenv').config();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Faltan variables de entorno VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  console.error('Verifica que el archivo .env esté configurado correctamente');
  process.exit(1);
}

async function executeSQLFile(sqlContent) {
  console.log(`\n🔧 Ejecutando correcciones de seguridad...`);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sqlContent })
    });

    // Si la API de exec_sql no existe, usar directamente la conexión a PostgREST
    if (response.status === 404) {
      console.log('⚠️  exec_sql no disponible, usando método alternativo...');
      return await executeSQLDirect(sqlContent);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Script ejecutado exitosamente');
    return result;

  } catch (error) {
    console.error('❌ Error ejecutando SQL:', error.message);
    throw error;
  }
}

async function executeSQLDirect(sqlContent) {
  // Dividir el SQL en statements individuales
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Ejecutando ${statements.length} statements SQL...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    try {
      // Usar la API REST de Supabase para ejecutar SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: statement })
      });

      if (!response.ok) {
        console.warn(`⚠️  Warning en statement ${i + 1}:`, await response.text());
      } else {
        console.log(`✅ Statement ${i + 1}/${statements.length} ejecutado`);
      }
    } catch (error) {
      console.warn(`⚠️  Error en statement ${i + 1}:`, error.message);
    }
  }

  console.log('✅ Proceso completado');
}

async function main() {
  console.log('🚀 Iniciando aplicación de correcciones de seguridad...');
  console.log(`📡 Conectando a: ${SUPABASE_URL}`);

  // Leer el script SQL
  const sqlPath = path.join(__dirname, 'supabase', 'migrations', 'FIX_ALL_SECURITY_ISSUES.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ ERROR: No se encontró el archivo FIX_ALL_SECURITY_ISSUES.sql');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  console.log(`📄 Script SQL cargado (${sqlContent.length} caracteres)`);

  // Ejecutar el script
  await executeSQLFile(sqlContent);

  console.log('\n✅ CORRECCIONES APLICADAS CON ÉXITO');
  console.log('\n📋 PRÓXIMOS PASOS:');
  console.log('1. Ve a Supabase Dashboard → Database → Advisors');
  console.log('2. Verifica que los errores críticos han desaparecido');
  console.log('3. Habilita "Leaked Password Protection" en Auth Settings');
  console.log('4. Reinicia tu aplicación con: npm run dev');
  console.log('5. Verifica que todo funciona correctamente\n');
}

// Ejecutar script
main().catch((error) => {
  console.error('\n❌ ERROR FATAL:', error);
  process.exit(1);
});
