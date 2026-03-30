#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Leer scannerAssets.ts para obtener todas las categorías y símbolos
const scannerAssetsPath = path.join(__dirname, 'lib', 'scannerAssets.ts');
const scannerContent = fs.readFileSync(scannerAssetsPath, 'utf8');

// Extraer todas las categorías y símbolos
const assetsByCategory = {};
const categoryRegex = /'(\w+(?:\s+\w+)*)'\s*:\s*\[([\s\S]*?)\s*\],/g;
let match;

while ((match = categoryRegex.exec(scannerContent)) !== null) {
  const categoryName = match[1];
  const categoryContent = match[2];
  
  // Extraer símbolos
  const symbolRegex = /symbol:\s*'([^']+)'/g;
  const symbols = [];
  let symbolMatch;
  
  while ((symbolMatch = symbolRegex.exec(categoryContent)) !== null) {
    symbols.push(symbolMatch[1]);
  }
  
  if (symbols.length > 0) {
    assetsByCategory[categoryName] = symbols;
  }
}

console.log('='.repeat(80));
console.log('TESTEO DE APIS - TODAS LAS CATEGORÍAS Y VALORES');
console.log('='.repeat(80));
console.log(`\nTotal de categorías: ${Object.keys(assetsByCategory).length}`);
console.log(`Total de valores: ${Object.values(assetsByCategory).reduce((sum, arr) => sum + arr.length, 0)}\n`);

// Determinar el tipo de API por categoría
function getAssetType(category, symbol) {
  if (category === 'Criptomonedas') return 'crypto';
  if (category === 'Forex') return 'forex';
  if (category === 'Índices') return 'index';
  if (category === 'Commodities') return 'commodity';
  return 'stock';
}

// URLs base
const baseUrl = 'http://localhost:3000/api/market/candles';

// Función para testear un símbolo
async function testSymbol(symbol, assetType) {
  try {
    const url = `${baseUrl}?symbol=${symbol}&interval=1h&type=${assetType}`;
    const response = await fetch(url, { timeout: 10000 });
    
    if (!response.ok) {
      return {
        symbol,
        status: response.status,
        ok: false,
        error: `HTTP ${response.status}`
      };
    }
    
    const data = await response.json();
    
    if (data.error) {
      return {
        symbol,
        status: response.status,
        ok: false,
        error: data.error
      };
    }
    
    if (!data.candles || data.candles.length === 0) {
      return {
        symbol,
        status: response.status,
        ok: false,
        error: 'No candle data',
        count: 0
      };
    }
    
    return {
      symbol,
      status: response.status,
      ok: true,
      candleCount: data.candles.length
    };
  } catch (error) {
    return {
      symbol,
      ok: false,
      error: error.message
    };
  }
}

// Testear todas las categorías
async function testAllApis() {
  const results = {};
  let totalTested = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const [category, symbols] of Object.entries(assetsByCategory)) {
    console.log(`\n📊 ${category.toUpperCase()} (${symbols.length} valores)`);
    console.log('-'.repeat(80));
    
    results[category] = { success: [], failed: [] };
    
    for (const symbol of symbols) {
      const assetType = getAssetType(category, symbol);
      const result = await testSymbol(symbol, assetType);
      
      totalTested++;
      
      if (result.ok) {
        console.log(`  ✅ ${symbol.padEnd(15)} → ${result.candleCount} velas`);
        results[category].success.push(symbol);
        totalSuccess++;
      } else {
        console.log(`  ❌ ${symbol.padEnd(15)} → ${result.error}`);
        results[category].failed.push({ symbol, error: result.error });
        totalFailed++;
      }
      
      // Pequeña pausa entre llamadas
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  // Resumen
  console.log('\n' + '='.repeat(80));
  console.log('RESUMEN');
  console.log('='.repeat(80));
  console.log(`Total testeados: ${totalTested}`);
  console.log(`✅ Exitosos: ${totalSuccess} (${((totalSuccess / totalTested) * 100).toFixed(1)}%)`);
  console.log(`❌ Fallidos: ${totalFailed} (${((totalFailed / totalTested) * 100).toFixed(1)}%)`);
  
  // Detalles de fallos por categoría
  if (totalFailed > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('VALORES CON ERRORES (REQUIEREN SOLUCIÓN)');
    console.log('='.repeat(80));
    
    for (const [category, data] of Object.entries(results)) {
      if (data.failed.length > 0) {
        console.log(`\n📌 ${category}:`);
        data.failed.forEach(item => {
          console.log(`   - ${item.symbol}: ${item.error}`);
        });
      }
    }
  }
  
  // Guardar resultados en JSON
  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\n✅ Resultados guardados en test-results.json');
}

// Ejecutar si el servidor está disponible
console.log('\n⏳ Iniciando testeo de APIs (asegúrate de que npm run dev está ejecutándose)...\n');

setTimeout(() => {
  testAllApis().catch(console.error);
}, 1000);

