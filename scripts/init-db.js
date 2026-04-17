/**
 * scripts/init-db.js
 * 
 * Ejecutar schema.sql en Railway
 * Uso: node scripts/init-db.js
 * 
 * Esto ejecuta el SQL directamente sin necesidad de Query Editor
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: '.env.local' });

const config = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.RAILWAY_DATABASE_HOST || process.env.DB_HOST,
  port: parseInt(process.env.RAILWAY_DATABASE_PORT || process.env.DB_PORT || '5432'),
  database: process.env.RAILWAY_DATABASE_NAME || process.env.DB_NAME,
  user: process.env.RAILWAY_DATABASE_USER || process.env.DB_USER,
  password: process.env.RAILWAY_DATABASE_PASSWORD || process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
};

const finalConfig = config.connectionString
  ? { connectionString: config.connectionString, ssl: config.ssl }
  : config;

const pool = new Pool(finalConfig);

async function initDatabase() {
  let client;
  try {
    console.log('\n🚂 ===== INITIALIZE DATABASE =====\n');

    // Leer schema.sql
    const schemaPath = path.join(__dirname, '..', 'lib', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('📖 Schema cargado:', `${schema.length} caracteres`);

    // Conectar
    client = await pool.connect();
    console.log('✅ Conectado a Railway\n');

    // Ejecutar schema
    console.log('⏳ Ejecutando schema...');
    console.log('---');
    await client.query(schema);
    console.log('---');
    console.log('✅ Schema ejecutado exitosamente!\n');

    // Verificar tablas creadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`📊 Tablas creadas: ${result.rows.length}`);
    result.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });

    console.log('\n🎉 ¡Base de datos inicializada correctamente!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Confirmar antes de ejecutar
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('⚠️  ¿Estás seguro de que quieres inicializar la BD? (s/n) ', async (answer) => {
  rl.close();

  if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
    await initDatabase();
  } else {
    console.log('Cancelado.');
    process.exit(0);
  }
});

