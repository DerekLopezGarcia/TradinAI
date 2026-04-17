/**
 * scripts/test-railway-connection.js
 * 
 * Script para probar la conexión a Railway PostgreSQL
 * Uso: node scripts/test-railway-connection.js
 */

const { Pool } = require('pg');

// Leer variables de entorno
require('dotenv').config({ path: '.env.local' });

const config = {
  // Opción 1: DATABASE_URL
  connectionString: process.env.DATABASE_URL,
  // Opción 2: Variables individuales
  host: process.env.RAILWAY_DATABASE_HOST || process.env.DB_HOST,
  port: parseInt(process.env.RAILWAY_DATABASE_PORT || process.env.DB_PORT || '5432'),
  database: process.env.RAILWAY_DATABASE_NAME || process.env.DB_NAME,
  user: process.env.RAILWAY_DATABASE_USER || process.env.DB_USER,
  password: process.env.RAILWAY_DATABASE_PASSWORD || process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // Railway usa certs auto-firmados
  },
};

// Usar CONNECTION_STRING si está disponible
const finalConfig = config.connectionString
  ? { connectionString: config.connectionString, ssl: config.ssl }
  : config;

console.log('\n🚂 ===== RAILWAY CONNECTION TEST =====\n');
console.log('📋 Configuración:', {
  host: finalConfig.host || '(from CONNECTION_STRING)',
  port: finalConfig.port || '(from CONNECTION_STRING)',
  database: finalConfig.database || '(from CONNECTION_STRING)',
  user: finalConfig.user || '(from CONNECTION_STRING)',
});

const pool = new Pool(finalConfig);

// Test 1: Conexión básica
async function testConnection() {
  try {
    console.log('\n⏳ Probando conexión...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa!');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

// Test 2: Query simple
async function testQuery() {
  try {
    console.log('\n⏳ Ejecutando query de prueba...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Query exitosa!');
    console.log('   Hora actual:', result.rows[0].current_time);
    console.log('   PostgreSQL:', result.rows[0].db_version.split(',')[0]);
    return true;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    return false;
  }
}

// Test 3: Verificar tablas
async function testTables() {
  try {
    console.log('\n⏳ Verificando tablas creadas...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (result.rows.length === 0) {
      console.warn('⚠️  No se encontraron tablas. Debes ejecutar schema.sql primero');
      console.log('\n📋 Instrucciones:');
      console.log('   1. Ir a Railway Dashboard');
      console.log('   2. Click en proyecto PostgreSQL');
      console.log('   3. Tab "Query Editor"');
      console.log('   4. Copiar contenido de lib/database/schema.sql');
      console.log('   5. Pegar y ejecutar');
      return false;
    }

    console.log(`✅ ${result.rows.length} tablas encontradas:`);
    result.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Error verificando tablas:', error.message);
    return false;
  }
}

// Test 4: Pool stats
async function testPoolStats() {
  try {
    console.log('\n⏳ Verificando pool de conexiones...');
    const stats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
    console.log('✅ Pool stats:');
    console.log(`   Total connections: ${stats.totalCount}`);
    console.log(`   Idle: ${stats.idleCount}`);
    console.log(`   Waiting: ${stats.waitingCount}`);
    return true;
  } catch (error) {
    console.error('❌ Error en pool stats:', error.message);
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  const tests = [
    testConnection,
    testQuery,
    testTables,
    testPoolStats,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      result ? passed++ : failed++;
    } catch (error) {
      console.error(`Error ejecutando test:`, error.message);
      failed++;
    }
  }

  console.log('\n\n📊 ===== RESULTADOS =====');
  console.log(`✅ Pasados: ${passed}`);
  console.log(`❌ Fallidos: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 ¡Todos los tests pasaron! Estás listo para usar Railway.');
  } else {
    console.log('\n⚠️  Hay problemas. Ver instrucciones arriba.');
  }

  await pool.end();
  process.exit(failed === 0 ? 0 : 1);
}

// Ejecutar
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

