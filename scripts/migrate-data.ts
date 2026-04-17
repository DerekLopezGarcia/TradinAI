#!/usr/bin/env ts-node

/**
 * scripts/migrate-data.ts
 *
 * Script para migrar datos de un archivo JSON a PostgreSQL
 * Uso: ts-node scripts/migrate-data.ts --file=data.json
 *      ts-node scripts/migrate-data.ts --demo
 */

import { migrationService } from '../lib/services/migrationService';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const isDemoMode = args.includes('--demo');
const fileArg = args.find((arg) => arg.startsWith('--file='));
const filePath = fileArg ? fileArg.split('=')[1] : null;

async function main() {
  try {
    console.log('🚀 Iniciando migración de datos...\n');

    if (isDemoMode) {
      console.log('📝 Creando usuario de demostración...');
      const userId = await migrationService.createDemoUser();
      console.log(`✅ Usuario demo creado: ${userId}`);
      console.log(`   Email: demo@tradingIA.com`);
      process.exit(0);
    }

    if (!filePath) {
      console.error('❌ Error: Especifica --file=path/to/data.json o --demo');
      console.error('   Uso: ts-node scripts/migrate-data.ts --file=data.json');
      console.error('   Uso: ts-node scripts/migrate-data.ts --demo');
      process.exit(1);
    }

    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Archivo no encontrado: ${fullPath}`);
      process.exit(1);
    }

    console.log(`📖 Leyendo archivo: ${fullPath}`);
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const migrationData = JSON.parse(fileContent);

    console.log('🔍 Validando datos...\n');
    const result = await migrationService.migrateUserData(migrationData);

    console.log('\n📊 Resultados de migración:');
    console.log(`   Usuario ID: ${result.userId}`);
    console.log(`   Watchlists migradas: ${result.watchlistsCount}`);
    console.log(`   Alertas migradas: ${result.alertsCount}`);

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Advertencias:');
      result.warnings.forEach((w) => console.log(`   - ${w}`));
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errores:');
      result.errors.forEach((e) => console.log(`   - ${e}`));
      process.exit(1);
    }

    if (result.success) {
      console.log('\n✅ Migración completada exitosamente');
      process.exit(0);
    } else {
      console.log('\n❌ Migración falló');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error fatal:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

