/**
 * scripts/verify-deployment.ts
 *
 * Script para verificar que el deployment a Railway es exitoso
 * Verifica: conexión a BD, endpoints disponibles, health checks
 * 
 * Uso: npx ts-node scripts/verify-deployment.ts
 */

async function verifyDeployment() {
  const railwayURL = process.env.RAILWAY_URL || 'https://gleaming-serenity.up.railway.app';
  
  console.log('🔍 Verificando deployment...\n');
  console.log(`URL: ${railwayURL}\n`);

  const checks = [
    {
      name: 'Health Check - GET /',
      url: '/',
      method: 'GET',
    },
    {
      name: 'API Health - GET /api/market',
      url: '/api/market',
      method: 'GET',
    },
    {
      name: 'DB Endpoint - GET /api/db/users',
      url: '/api/db/users',
      method: 'GET',
    },
    {
      name: 'Alert Endpoint - GET /api/db/alerts',
      url: '/api/db/alerts?user_id=test&limit=1',
      method: 'GET',
    },
    {
      name: 'Migration Endpoint - POST /api/db/migrate',
      url: '/api/db/migrate',
      method: 'POST',
      body: { action: 'create-demo' },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const options: any = {
        method: check.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (check.body) {
        options.body = JSON.stringify(check.body);
      }

      const response = await fetch(`${railwayURL}${check.url}`, options);

      if (response.ok || response.status === 400 || response.status === 401) {
        console.log(`✅ ${check.name}`);
        passed++;
      } else {
        console.log(
          `❌ ${check.name} - Status: ${response.status}`
        );
        failed++;
      }
    } catch (error) {
      console.log(
        `❌ ${check.name} - Error: ${error instanceof Error ? error.message : 'Unknown'}`
      );
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Resultados: ${passed} ✅ / ${failed} ❌`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 ¡Deployment exitoso!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed} check(s) fallido(s)`);
    process.exit(1);
  }
}

verifyDeployment().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});

