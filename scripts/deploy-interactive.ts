#!/usr/bin/env node

/**
 * scripts/deploy-interactive.ts
 * 
 * Script interactivo para hacer deploy a Railway
 * Guía paso a paso al usuario
 */

import * as fs from 'fs';
import * as path from 'path';

const RAILWAY_SETUP_STEPS = `
╔════════════════════════════════════════════════════════════════╗
║           DEPLOYMENT A RAILWAY - GUÍA PASO A PASO              ║
╚════════════════════════════════════════════════════════════════╝

✅ PASO 1: Instalar Railway CLI
─────────────────────────────────
Si NO la tienes instalada:

  npm install -g @railway/cli

Verificar:
  railway --version

✅ PASO 2: Logearse en Railway
─────────────────────────────────
  railway login

(Se abrirá navegador para confirmar)

✅ PASO 3: Linkar Proyecto
─────────────────────────────────
En el directorio del proyecto:

  railway link

Selecciona tu proyecto: TradingIA (PostgreSQL)

✅ PASO 4: Verificar Conexión
─────────────────────────────────
  railway status

Debería mostrar:
  ✓ Project: TradingIA
  ✓ Environment: production
  ✓ PostgreSQL: connected

✅ PASO 5: Configurar Variables de Entorno
──────────────────────────────────────────
  railway variables set DATABASE_URL="postgresql://postgres:wAMeDwMPKcvSaIuLoyAdugRHYpdWyZnd@mainline.proxy.rlwy.net:19003/railway"
  
  railway variables set NODE_ENV=production

Verificar con:
  railway variables list

✅ PASO 6: DEPLOY
───────────────────
  railway up --detach

o simplemente:

  npm run deploy-railway

✅ PASO 7: VERIFICAR
──────────────────────
Ver logs en tiempo real:
  railway logs --follow

Health check:
  npm run verify-deployment

✅ PASO 8: ACCESO
──────────────────
Tu app estará en:
  https://trading-ia.up.railway.app

═══════════════════════════════════════════════════════════════════

🚀 ¿LISTO? EJECUTA LOS COMANDOS ARRIBA EN ORDEN

═══════════════════════════════════════════════════════════════════
`;

console.log(RAILWAY_SETUP_STEPS);

// Verificar que existen archivos de configuración
const requiredFiles = ['railway.json', 'Procfile', 'package.json'];
const missingFiles: string[] = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error(`\n❌ Archivos faltantes: ${missingFiles.join(', ')}`);
  process.exit(1);
}

console.log('✅ Todos los archivos de configuración existen');
console.log('✅ Proyecto listo para deployment');
console.log('\n📋 Verificación de build:');

const buildDir = path.join(process.cwd(), '.next');
if (fs.existsSync(buildDir)) {
  const files = fs.readdirSync(buildDir);
  console.log(`✅ Build encontrado (${files.length} archivos)`);
} else {
  console.log('⚠️  Ejecuta: npm run build');
}

console.log('\n🟢 LISTO PARA DEPLOYMENT A RAILWAY');

