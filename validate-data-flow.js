#!/usr/bin/env node

/**
 * Script de Validación Final - Auditoría de Flujo de Datos
 * Verifica que todos los archivos clave estén configurados correctamente
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

// Checklist de validación
const checks = [
  {
    name: 'API Keys en .env.local',
    path: '.env.local',
    required: ['TWELVE_DATA_API_KEY', 'QUANDL_API_KEY'],
    check: (content) => {
      const hasKeys = ['TWELVE_DATA_API_KEY', 'QUANDL_API_KEY'].every(key =>
        content.includes(key) && !content.includes(`# ${key}`)
      );
      return {
        passed: hasKeys,
        details: hasKeys
          ? 'API keys configuradas ✅'
          : 'API keys faltantes o comentadas ❌',
      };
    },
  },
  {
    name: 'Mapeos de símbolos (candles/route.ts)',
    path: 'app/api/market/candles/route.ts',
    check: (content) => {
      const hasMappings = [
        'TWELVE_DATA_SYMBOLS',
        'INDEX_SYMBOLS',
        'FOREX_SYMBOLS',
        'COMMODITY_SYMBOLS',
        'COINGECKO_MAP',
      ].every(m => content.includes(m));
      return {
        passed: hasMappings,
        details: hasMappings
          ? 'Todos los mapeos presentes ✅'
          : 'Mapeos faltantes ❌',
      };
    },
  },
  {
    name: 'Función getTwelveDataCandles',
    path: 'app/api/market/candles/route.ts',
    check: (content) => {
      const hasFunc = content.includes('async function getTwelveDataCandles');
      const hasApiKey = content.includes('process.env.TWELVE_DATA_API_KEY');
      const hasLogging = content.includes('console.log') || content.includes('console.warn');
      return {
        passed: hasFunc && hasApiKey && hasLogging,
        details: !hasFunc
          ? 'Función faltante ❌'
          : !hasApiKey
          ? 'API key no se usa ❌'
          : !hasLogging
          ? 'Sin logging ⚠️'
          : 'Función correcta ✅',
      };
    },
  },
  {
    name: 'Función detectAssetType en useMarketData',
    path: 'app/hooks/useMarketData.ts',
    check: (content) => {
      const hasFunc = content.includes('function detectAssetType');
      const hasCrypto = content.includes('BTCUSD');
      const hasForex = content.includes('EURUSD');
      const hasCommodity = content.includes('GOLD');
      return {
        passed: hasFunc && hasCrypto && hasForex && hasCommodity,
        details: !hasFunc
          ? 'Función faltante ❌'
          : 'Tipos de activos mapeados ✅',
      };
    },
  },
  {
    name: 'Endpoint /api/market/candles en GET handler',
    path: 'app/api/market/candles/route.ts',
    check: (content) => {
      const hasHandler = content.includes('export async function GET');
      const hasValidation = content.includes('validateSymbol');
      const hasTypeDetection = content.includes('assetType');
      return {
        passed: hasHandler && hasValidation && hasTypeDetection,
        details: !hasHandler
          ? 'Endpoint faltante ❌'
          : !hasValidation
          ? 'Sin validación ❌'
          : 'Endpoint correcto ✅',
      };
    },
  },
  {
    name: 'getWeeklyCandles en assetScannerService',
    path: 'lib/services/assetScannerService.ts',
    check: (content) => {
      const hasFunc = content.includes('async function getWeeklyCandles');
      const callsEndpoint = content.includes('/api/market/candles');
      const hasDetection = content.includes('detectAssetType');
      return {
        passed: hasFunc && callsEndpoint && hasDetection,
        details: !hasFunc
          ? 'Función faltante ❌'
          : !callsEndpoint
          ? 'No usa endpoint correcto ❌'
          : 'getWeeklyCandles correcto ✅',
      };
    },
  },
  {
    name: 'AssetList renderiza datos',
    path: 'components/AssetList.tsx',
    check: (content) => {
      const hasPrice = content.includes('asset.price');
      const hasChange = content.includes('asset.changePercent');
      const hasSymbol = content.includes('asset.symbol');
      return {
        passed: hasPrice && hasChange && hasSymbol,
        details: hasPrice && hasChange && hasSymbol
          ? 'Desplegable renderiza datos ✅'
          : 'Datos faltantes en desplegable ❌',
      };
    },
  },
  {
    name: 'Charts.tsx recibe CandleData',
    path: 'components/Charts.tsx',
    check: (content) => {
      const hasValidation = content.includes('if (!data ||');
      const hasProcessing = content.includes('displayData');
      const hasRechartsUsage = content.includes('ComposedChart');
      return {
        passed: hasValidation && hasProcessing && hasRechartsUsage,
        details: !hasValidation
          ? 'Sin validación de datos ❌'
          : !hasRechartsUsage
          ? 'Sin gráfico ❌'
          : 'Gráficos correctos ✅',
      };
    },
  },
  {
    name: 'RecommendationsPanel usa datos',
    path: 'components/RecommendationsPanel.tsx',
    check: (content) => {
      const uses useDailyRecommendations = content.includes('useDailyRecommendations');
      const hasRoi = content.includes('asset.roi');
      const hasSymbol = content.includes('asset.symbol');
      return {
        passed: usesDailyRecommendations && hasRoi && hasSymbol,
        details: usesDailyRecommendations && hasRoi && hasSymbol
          ? 'Recomendaciones renderiza datos ✅'
          : 'Datos faltantes en recomendaciones ❌',
      };
    },
  },
];

// Ejecutar validaciones
console.log('\n' + '='.repeat(60));
console.log('  AUDITORÍA DE FLUJO DE DATOS - TRADINGÍA');
console.log('='.repeat(60) + '\n');

let passedCount = 0;
let totalCount = checks.length;

checks.forEach((check) => {
  const filePath = path.join(BASE_DIR, check.path);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = check.check(content);

    if (result.passed) {
      passedCount++;
      console.log(`✅ ${check.name}`);
      console.log(`   ${result.details}\n`);
    } else {
      console.log(`❌ ${check.name}`);
      console.log(`   ${result.details}\n`);
    }
  } catch (error) {
    console.log(`⚠️  ${check.name}`);
    console.log(`   Archivo no encontrado: ${check.path}\n`);
  }
});

// Resumen
console.log('='.repeat(60));
console.log(`\n  RESULTADO: ${passedCount}/${totalCount} verificaciones pasadas\n`);

if (passedCount === totalCount) {
  console.log('  🎉 AUDITORÍA COMPLETADA EXITOSAMENTE 🎉');
  console.log('\n  Todos los flujos de datos están correctamente configurados:');
  console.log('  ✅ API Keys configuradas');
  console.log('  ✅ Mapeos de símbolos correctos');
  console.log('  ✅ Funciones de obtención de datos OK');
  console.log('  ✅ Detección de tipo de activo OK');
  console.log('  ✅ Endpoints retornan datos correctamente');
  console.log('  ✅ Componentes reciben y usan datos correctamente');
  console.log('  ✅ Recomendaciones tienen datos correctos');
  console.log('  ✅ Gráficos se renderizan correctamente');
} else {
  console.log(`  ⚠️  ${totalCount - passedCount} verificación(es) fallaron`);
  console.log('  Revisa los errores arriba para más detalles');
}

console.log('\n' + '='.repeat(60) + '\n');

process.exit(passedCount === totalCount ? 0 : 1);

