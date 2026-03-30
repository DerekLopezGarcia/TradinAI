/**
 * Ejemplo de uso del analizador de velas
 * Este archivo muestra diferentes formas de usar el sistema
 */

// ==================== EJEMPLO 1: Usando la API REST ====================

// Con fetch en el navegador
async function analyzeWithAPI() {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      analysisDepth: 'comprehensive',
      tradingStyle: 'swing',
      candles: [
        {
          time: 1704067200000,
          open: 42150.50,
          high: 42300.00,
          low: 42050.25,
          close: 42280.75,
          volume: 1250.5
        },
        {
          time: 1704070800000,
          open: 42280.00,
          high: 42450.00,
          low: 42200.00,
          close: 42400.00,
          volume: 1580.3
        },
        {
          time: 1704074400000,
          open: 42400.00,
          high: 42450.00,
          low: 42150.00,
          close: 42200.00,
          volume: 2100.1
        },
        {
          time: 1704078000000,
          open: 42200.00,
          high: 42250.00,
          low: 41950.00,
          close: 42000.00,
          volume: 1890.2
        },
        {
          time: 1704081600000,
          open: 42000.00,
          high: 42100.00,
          low: 41800.00,
          close: 41850.00,
          volume: 1650.8
        }
      ]
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Análisis completado');
    console.log('Tendencia:', result.data.summary.trend);
    console.log('Probabilidad:', result.data.mainPrediction.probability + '%');
    console.log('Objetivo de precio:', result.data.mainPrediction.targetPrice);
  } else {
    console.error('❌ Error:', result.error);
  }
}

// ==================== EJEMPLO 2: Usando el componente React ====================

import { CandleAnalysisComponent } from '@/components/CandleAnalysisPanel';
import { CandleData } from '@/lib/types';

export function MyTradingDashboard() {
  const [candleData, setCandleData] = React.useState<CandleData[]>([
    { time: 1704067200000, open: 42150.50, high: 42300.00, low: 42050.25, close: 42280.75, volume: 1250.5 },
    { time: 1704070800000, open: 42280.00, high: 42450.00, low: 42200.00, close: 42400.00, volume: 1580.3 },
    { time: 1704074400000, open: 42400.00, high: 42450.00, low: 42150.00, close: 42200.00, volume: 2100.1 },
    { time: 1704078000000, open: 42200.00, high: 42250.00, low: 41950.00, close: 42000.00, volume: 1890.2 },
    { time: 1704081600000, open: 42000.00, high: 42100.00, low: 41800.00, close: 41850.00, volume: 1650.8 },
  ]);

  return (
    <div className="w-full p-4">
      <h1 className="text-2xl font-bold mb-4">Análisis de BTCUSDT</h1>
      
      <CandleAnalysisComponent
        symbol="BTCUSDT"
        timeframe="1h"
        candles={candleData}
        onAnalysisComplete={(analysis) => {
          console.log('✅ Análisis completado:', analysis);
          
          // Puedes hacer algo con el resultado
          if (analysis.mainPrediction.direction === 'bullish') {
            console.log('📈 Predicción alcista con', analysis.mainPrediction.probability + '% de probabilidad');
          }
        }}
      />
    </div>
  );
}

// ==================== EJEMPLO 3: Uso directo del analizador ====================

import { analyzeCandles, CandleAnalysisInput } from '@/lib/services/candleAnalysisService';

function directAnalysis() {
  const input: CandleAnalysisInput = {
    symbol: 'EURUSD',
    timeframe: '15m',
    analysisDepth: 'comprehensive',
    tradingStyle: 'day_trading',
    candles: [
      // Datos de velas aquí
      { time: 1704067200000, open: 1.1050, high: 1.1065, low: 1.1040, close: 1.1060, volume: 5000 },
      { time: 1704067900000, open: 1.1060, high: 1.1075, low: 1.1055, close: 1.1070, volume: 4800 },
      // ... más velas
    ]
  };

  try {
    const analysis = analyzeCandles(input);
    
    console.log('=== ANÁLISIS COMPLETO ===');
    console.log('Símbolo:', analysis.symbol);
    console.log('Temporalidad:', analysis.timeframe);
    console.log('');
    
    console.log('📊 RESUMEN');
    console.log('Tendencia:', analysis.summary.trend);
    console.log('Sesgo:', analysis.summary.bias);
    console.log('Sentimiento:', analysis.summary.overallSentiment);
    console.log('');
    
    console.log('📈 ANÁLISIS DE TENDENCIA');
    console.log('Dirección:', analysis.trendAnalysis.direction);
    console.log('Estructura:', analysis.trendAnalysis.structure);
    console.log('Fuerza:', analysis.trendAnalysis.strength + '/100');
    console.log('ADX:', analysis.trendAnalysis.adx);
    console.log('');
    
    console.log('🎯 PATRONES IDENTIFICADOS');
    analysis.patterns.forEach(pattern => {
      console.log(`- ${pattern.name}: ${pattern.description} (${pattern.reliability}% confiable)`);
    });
    console.log('');
    
    console.log('📊 INDICADORES');
    console.log('RSI:', analysis.indicatorStatus.rsi.value.toFixed(2), '(' + analysis.indicatorStatus.rsi.status + ')');
    console.log('MACD:', analysis.indicatorStatus.macd.value.toFixed(4));
    console.log('Stochastic K:', analysis.indicatorStatus.stochastic.k.toFixed(2));
    console.log('');
    
    console.log('💎 NIVELES CLAVE');
    console.log('Soportes:', analysis.keyLevels.supports.map(s => s.toFixed(4)).join(', '));
    console.log('Resistencias:', analysis.keyLevels.resistances.map(r => r.toFixed(4)).join(', '));
    console.log('');
    
    console.log('🎲 PREDICCIÓN PRINCIPAL');
    console.log('Dirección:', analysis.mainPrediction.direction);
    console.log('Probabilidad:', analysis.mainPrediction.probability + '%');
    console.log('Confianza:', analysis.mainPrediction.confidenceLevel);
    console.log('Objetivos:', analysis.mainPrediction.targetPrice.map(t => t.toFixed(4)).join(', '));
    console.log('Stop Loss:', analysis.mainPrediction.stopLoss.toFixed(4));
    console.log('Riesgo/Beneficio:', analysis.mainPrediction.riskReward.toFixed(2));
    console.log('Horizonte:', analysis.mainPrediction.timeHorizon);
    console.log('');
    
    console.log('⚠️ FACTORES DE RIESGO');
    analysis.riskFactors.forEach(risk => {
      console.log('- ' + risk);
    });
    console.log('');
    
    console.log('📝 ANÁLISIS DETALLADO');
    console.log(analysis.detailedAnalysis);
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
  }
}

// ==================== EJEMPLO 4: Obtener datos de Binance y analizar ====================

async function analyzeFromBinance() {
  try {
    // Simulación - En producción usarías la API de Binance
    const symbol = 'BTCUSDT';
    const interval = '1h';
    
    // const response = await fetch(
    //   `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`
    // );
    // const data = await response.json();

    // Datos de ejemplo
    const candleDataFromBinance = [
      [1704067200000, "42150.50", "42300.00", "42050.25", "42280.75", "1250.5", ...],
      [1704070800000, "42280.00", "42450.00", "42200.00", "42400.00", "1580.3", ...],
      // ... más velas
    ];

    // Transformar al formato esperado
    const candles = candleDataFromBinance.map(candle => ({
      time: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[7])
    }));

    // Analizar
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: 'BTCUSDT',
        timeframe: '1h',
        candles: candles
      })
    });

    const analysis = await response.json();
    console.log('✅ Análisis de Binance:', analysis.data.summary);

  } catch (error) {
    console.error('Error:', error);
  }
}

// ==================== EJEMPLO 5: Monitoreo continuo ====================

async function continuousMonitoring() {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  const timeframe = '1h';

  // Analizar cada símbolo cada 5 minutos
  setInterval(async () => {
    for (const symbol of symbols) {
      try {
        // Obtener candles (simulado)
        const candles = await getCandles(symbol, timeframe, 50);

        // Analizar
        const analysis = analyzeCandles({
          symbol,
          timeframe: timeframe as any,
          candles,
          analysisDepth: 'standard'
        });

        // Guardar o procesar resultados
        processAnalysisResult({
          symbol,
          timestamp: Date.now(),
          trend: analysis.summary.trend,
          probability: analysis.mainPrediction.probability,
          targetPrice: analysis.mainPrediction.targetPrice[0]
        });

      } catch (error) {
        console.error(`Error analizando ${symbol}:`, error);
      }
    }
  }, 5 * 60 * 1000); // Cada 5 minutos
}

// ==================== EJEMPLO 6: Generar alertas ====================

async function generateAlerts() {
  const analysis = analyzeCandles({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    candles: [...] // Tu data
  });

  // Alerta RSI sobrecompra
  if (analysis.indicatorStatus.rsi.status === 'overbought') {
    sendNotification('⚠️ BTC RSI en sobrecompra. Cuidado con reversión.');
  }

  // Alerta patrón alcista fuerte
  const strongBullish = analysis.patterns.find(
    p => p.type === 'bullish_reversal' && p.reliability > 70
  );
  
  if (strongBullish) {
    sendNotification(`🎯 ${strongBullish.name} identificado en BTC. Señal alcista.`);
  }

  // Alerta probabilidad alta
  if (analysis.mainPrediction.probability > 75) {
    sendNotification(
      `📊 Alta probabilidad de movimiento ${analysis.mainPrediction.direction} en BTC. ` +
      `Objetivo: ${analysis.mainPrediction.targetPrice[0]}`
    );
  }
}

// ==================== Funciones auxiliares ====================

async function getCandles(symbol: string, timeframe: string, limit: number = 50) {
  // Implementar obtención de candles desde tu fuente de datos
  // (Binance, TradingView, etc.)
  return [];
}

function processAnalysisResult(data: any) {
  console.log('Guardando resultado:', data);
  // Guardar en base de datos, almacenamiento local, etc.
}

function sendNotification(message: string) {
  console.log(message);
  // Enviar email, SMS, push notification, Discord webhook, etc.
}

// ==================== EJECUTAR EJEMPLOS ====================

// Descomenta la función que quieras ejecutar:

// analyzeWithAPI();
// directAnalysis();
// analyzeFromBinance();
// continuousMonitoring();
// generateAlerts();

