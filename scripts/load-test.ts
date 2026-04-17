/**
 * scripts/load-test.ts
 *
 * Load test: Simular 100 usuarios simultáneos
 * Uso: ts-node scripts/load-test.ts
 */

const API_BASE = 'http://localhost:3000/api/db';

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorsPerType: Record<string, number>;
}

async function makeRequest(
  method: string,
  endpoint: string,
  body?: any
): Promise<{ statusCode: number; responseTime: number; error?: string }> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseTime = Date.now() - startTime;

    return {
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      statusCode: 500,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function simulateUserSession(userId: number): Promise<any[]> {
  const results: any[] = [];
  const userEmail = `load-test-${Date.now()}-${userId}@example.com`;

  try {
    // 1. Create user
    results.push(
      await makeRequest('POST', '/users', {
        email: userEmail,
        name: `Load Test User ${userId}`,
        theme: 'dark',
      })
    );

    // 2. Get all users (light query)
    results.push(
      await makeRequest('GET', '/users', undefined)
    );

    // 3. Create watchlist
    results.push(
      await makeRequest('POST', '/watchlists', {
        user_id: userId,
        name: `Watchlist ${userId}`,
      })
    );

    // 4. Create alert
    results.push(
      await makeRequest('POST', '/alerts', {
        user_id: userId,
        symbol: `SYMBOL${userId}`,
        asset_type: 'crypto',
        condition_type: 'price_above',
        target_price: 50000,
      })
    );

    return results;
  } catch (error) {
    console.error(`Error in user session ${userId}:`, error);
    return results;
  }
}

async function runLoadTest() {
  console.log('🚀 Iniciando load test...\n');
  console.log('📊 Configuración:');
  console.log('   - Usuarios simulados: 100');
  console.log('   - Operaciones por usuario: 4 (POST user, GET users, POST watchlist, POST alert)');
  console.log('   - Total de requests: 400\n');

  const startTime = Date.now();
  const results: any[] = [];
  const errors: Record<string, number> = {};

  // Simulate 100 users making requests concurrently
  const promises: Promise<any[]>[] = [];
  for (let i = 1; i <= 100; i++) {
    promises.push(simulateUserSession(i));
  }

  // Wait for all users to complete their sessions
  const userResults = await Promise.all(promises);

  // Flatten results
  for (const userResult of userResults) {
    results.push(...userResult);
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Calculate statistics
  const successfulRequests = results.filter(
    (r) => r.statusCode >= 200 && r.statusCode < 300
  ).length;
  const failedRequests = results.filter(
    (r) => r.statusCode >= 400
  ).length;

  const responseTimes = results
    .filter((r) => r.responseTime)
    .map((r) => r.responseTime);
  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  // Count errors by type
  for (const result of results) {
    if (result.statusCode >= 400) {
      const key = `${result.statusCode}`;
      errors[key] = (errors[key] || 0) + 1;
    }
  }

  // Results
  console.log('='.repeat(60));
  console.log('📈 LOAD TEST RESULTS');
  console.log('='.repeat(60));

  const testResult: LoadTestResult = {
    totalRequests: results.length,
    successfulRequests,
    failedRequests,
    averageResponseTime: Math.round(averageResponseTime),
    minResponseTime,
    maxResponseTime,
    errorsPerType: errors,
  };

  console.log(`\n✅ Solicitudes Exitosas: ${testResult.successfulRequests}`);
  console.log(`❌ Solicitudes Fallidas: ${testResult.failedRequests}`);
  console.log(`📊 Total de Solicitudes: ${testResult.totalRequests}`);

  console.log(`\n⏱️  Tiempos de Respuesta:`);
  console.log(
    `   - Promedio: ${testResult.averageResponseTime}ms`
  );
  console.log(`   - Mínimo: ${testResult.minResponseTime}ms`);
  console.log(`   - Máximo: ${testResult.maxResponseTime}ms`);

  if (Object.keys(testResult.errorsPerType).length > 0) {
    console.log(`\n⚠️  Errores:`);
    for (const [code, count] of Object.entries(testResult.errorsPerType)) {
      console.log(`   - HTTP ${code}: ${count} requests`);
    }
  }

  console.log(`\n⏳ Tiempo Total: ${totalTime}ms`);

  console.log('\n' + '='.repeat(60));

  // Success criteria
  const successRate = (testResult.successfulRequests / testResult.totalRequests) * 100;
  const avgResponseTimeOk = testResult.averageResponseTime < 1000; // < 1 second

  if (successRate >= 95 && avgResponseTimeOk) {
    console.log('🎉 LOAD TEST PASSED');
    console.log(`   ✅ Success rate: ${successRate.toFixed(2)}%`);
    console.log(`   ✅ Average response time: ${testResult.averageResponseTime}ms`);
    process.exit(0);
  } else {
    console.log('❌ LOAD TEST FAILED');
    if (successRate < 95) {
      console.log(`   ❌ Success rate too low: ${successRate.toFixed(2)}%`);
    }
    if (!avgResponseTimeOk) {
      console.log(
        `   ❌ Average response time too high: ${testResult.averageResponseTime}ms`
      );
    }
    process.exit(1);
  }
}

runLoadTest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

