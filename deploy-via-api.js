/**
 * 🚀 Desplegar Edge Function via Management API
 * Sin necesidad de CLI
 *
 * Ejecutar: node deploy-via-api.js
 */

const fs = require('fs');
const path = require('path');

// ⚠️ CONFIGURA ESTOS VALORES:
const CONFIG = {
  SUPABASE_ACCESS_TOKEN: 'sbp_xxx', // Get from: https://supabase.com/dashboard/account/tokens
  PROJECT_REF: 'your-project-ref',   // Get from: https://supabase.com/dashboard/project/_/settings/general
  ANTHROPIC_API_KEY: 'sk-ant-xxx',   // Tu API key de Anthropic
};

async function deployFunction() {
  console.log('====================================');
  console.log('🚀 Desplegando via Management API');
  console.log('====================================\n');

  // 1. Leer el código de la función
  console.log('📂 Leyendo función scrape-and-extract...');
  const functionPath = path.join(__dirname, 'supabase', 'functions', 'scrape-and-extract', 'index.ts');
  const sharedPath = path.join(__dirname, 'supabase', 'functions', '_shared', 'anthropic-client.ts');

  if (!fs.existsSync(functionPath)) {
    console.error('❌ No se encuentra:', functionPath);
    process.exit(1);
  }

  const functionCode = fs.readFileSync(functionPath, 'utf-8');
  const sharedCode = fs.existsSync(sharedPath) ? fs.readFileSync(sharedPath, 'utf-8') : '';

  console.log('✅ Función leída\n');

  // 2. Crear slug del código
  const slug = 'scrape-and-extract';

  // 3. Desplegar función
  console.log('📦 Desplegando función...');

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${CONFIG.PROJECT_REF}/functions/${slug}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CONFIG.SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: slug,
          name: slug,
          verify_jwt: false,
          import_map: false,
          entrypoint_path: 'index.ts',
          // El código se sube como un objeto con archivos
          body: {
            'index.ts': functionCode,
            '../_shared/anthropic-client.ts': sharedCode,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error al desplegar:', response.status, error);

      // Si la función no existe, créala primero
      if (response.status === 404) {
        console.log('📝 Función no existe, creándola...');
        await createFunction(slug, functionCode, sharedCode);
        return;
      }

      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Función desplegada:', result);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  // 4. Configurar secrets
  console.log('\n🔐 Configurando ANTHROPIC_API_KEY...');

  try {
    const secretsResponse = await fetch(
      `https://api.supabase.com/v1/projects/${CONFIG.PROJECT_REF}/secrets`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            name: 'ANTHROPIC_API_KEY',
            value: CONFIG.ANTHROPIC_API_KEY,
          }
        ])
      }
    );

    if (!secretsResponse.ok) {
      const error = await secretsResponse.text();
      console.error('⚠️  Error configurando secret:', error);
    } else {
      console.log('✅ API Key configurada');
    }

  } catch (error) {
    console.error('⚠️  Error configurando secret:', error.message);
  }

  console.log('\n====================================');
  console.log('✅ ¡DESPLIEGUE COMPLETO!');
  console.log('====================================\n');
  console.log('🔗 Prueba tu función en:');
  console.log(`https://${CONFIG.PROJECT_REF}.supabase.co/functions/v1/scrape-and-extract\n`);
}

async function createFunction(slug, functionCode, sharedCode) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${CONFIG.PROJECT_REF}/functions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: slug,
        name: slug,
        verify_jwt: false,
        import_map: false,
        entrypoint_path: 'index.ts',
        body: {
          'index.ts': functionCode,
          '../_shared/anthropic-client.ts': sharedCode,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Error al crear función:', error);
    process.exit(1);
  }

  console.log('✅ Función creada');
}

// Ejecutar
deployFunction().catch(console.error);
