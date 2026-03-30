/**
 * Script de prueba para auditar el flujo de datos de la API
 * Prueba que todos los endpoints devuelven datos correctamente
 */

const BASE_URL = 'http://localhost:3000';

// Testear diferentes símbolos por tipo
const TEST_SYMBOLS = {
  crypto: 'BTCUSD',
  stock: 'AAPL',
  index: 'SPX',
  forex: 'EURUSD',
  commodity: 'GOLD'
};

async function testCandlesEndpoint(symbol, assetType) {
  try {
    const url = `${BASE_URL}/api/market/candles?symbol=${symbol}&interval=1h&type=${assetType}`;
    console.log(`\n📊 Probando: ${symbol} (${assetType})`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📦 Velas recibidas: ${data.count || data.candles?.length || 0}`);
      if (data.candles && data.candles.length > 0) {
        const last = data.candles[data.candles.length - 1];
        console.log(`   💰 Último cierre: ${last.close}`);
        console.log(`   📅 Timestamp: ${new Date(last.time).toISOString()}`);
        
        // Validar estructura
        const isValid = 
          typeof last.open === 'number' &&
          typeof last.high === 'number' &&
          typeof last.low === 'number' &&
          typeof last.close === 'number' &&
          typeof last.volume === 'number';
        
        console.log(`   ✅ Estructura válida: ${isValid}`);
      }
    } else {
      console.log(`   ❌ Error ${response.status}: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
  }
}

async function testPriceEndpoint(symbol) {
  try {
    const url = `${BASE_URL}/api/market?symbol=${symbol}&type=price`;
    console.log(`\n💵 Probando precio: ${symbol}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Precio: ${data.price}`);
      console.log(`   📊 Cambio: ${data.change} (${data.changePercent}%)`);
    } else {
      console.log(`   ❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🧪 AUDITORÍA DE FLUJO DE DATOS DE API');
  console.log('=====================================\n');
  
  // Probar candles para cada tipo de activo
  console.log('📈 PRUEBAS DE VELAS (Candlesticks)');
  for (const [type, symbol] of Object.entries(TEST_SYMBOLS)) {
    await testCandlesEndpoint(symbol, type);
  }
  
  // Probar precios
  console.log('\n\n💵 PRUEBAS DE PRECIOS');
  for (const symbol of Object.values(TEST_SYMBOLS)) {
    await testPriceEndpoint(symbol);
  }
  
  console.log('\n\n✅ Auditoría completada');
}

// Ejecutar
runAllTests().catch(console.error);

