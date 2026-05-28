import { NextRequest, NextResponse } from 'next/server';
import { analyzeCandles, CandleAnalysisInput } from '@/lib/services/candleAnalysisService';

/**
 * POST /api/ai/analyze
 * 
 * Análisis profesional de velas japonesas con sistema completo
 * 
 * Cuerpo esperado:
 * {
 *   "symbol": "BTCUSDT",
 *   "timeframe": "1h",
 *   "candles": [
 *     {"time": 1234567890, "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1000},
 *     ...
 *   ],
 *   "analysisDepth": "comprehensive",  // opcional: "basic" | "standard" | "comprehensive"
 *   "tradingStyle": "swing",            // opcional: "scalping" | "day_trading" | "swing" | "position"
 *   "includeNews": true                 // opcional: incluir análisis de noticias
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { symbol, timeframe, candles, analysisDepth = 'standard', tradingStyle = 'swing', includeNews = false } = body;

    // Validar entrada
    if (!symbol || !timeframe || !Array.isArray(candles) || candles.length === 0) {
      return NextResponse.json(
        {
          error: 'Se requieren: symbol, timeframe y candles (array)',
          required: {
            symbol: 'string (ej: BTCUSDT)',
            timeframe: 'string (ej: 1h)',
            candles: 'array con objects {time, open, high, low, close, volume}'
          }
        },
        { status: 400 }
      );
    }

    // Validar que las velas tengan la estructura correcta
    const validCandles = candles.every(c => 
      typeof c.time === 'number' && typeof c.open === 'number' &&
      typeof c.high === 'number' && typeof c.low === 'number' &&
      typeof c.close === 'number' && typeof c.volume === 'number'
    );

    if (!validCandles) {
      return NextResponse.json(
        {
          error: 'Estructura de velas inválida',
          expected: {
            time: 'number (timestamp)',
            open: 'number',
            high: 'number',
            low: 'number',
            close: 'number',
            volume: 'number'
          },
          example: {
            time: 1704067200000,
            open: 42150.50,
            high: 42300.00,
            low: 42050.25,
            close: 42280.75,
            volume: 1250.5
          }
        },
        { status: 400 }
      );
    }

    // Fetch news if requested
    let relatedNews;
    if (includeNews) {
      const { newsService } = await import('@/lib/services/newsService');
      const isCrypto = symbol.endsWith('USD') || symbol.endsWith('USDT');
      try {
        relatedNews = isCrypto
          ? await newsService.getCryptoNews(symbol, 10)
          : await newsService.getStockNews(symbol, 7);
      } catch (e) {
        console.warn('News fetch failed for analysis:', e);
        relatedNews = [];
      }
    }

    // Ejecutar análisis
    const analysisInput: CandleAnalysisInput = {
      symbol,
      timeframe: timeframe as any,
      candles,
      analysisDepth: analysisDepth as any,
      tradingStyle: tradingStyle as any,
      relatedNews,
    };

    const analysis = await analyzeCandles(analysisInput);

    return NextResponse.json({
      success: true,
      data: analysis,
      processingTime: Date.now() - startTime,
      timestamp: Date.now()
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en análisis de velas:', message);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fallo en el análisis de velas',
        details: message,
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/analyze
 * 
 * Información sobre cómo usar el endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/ai/analyze',
    method: 'POST',
    description: 'Análisis profesional de velas japonesas con múltiples indicadores',
    requiredFields: {
      symbol: 'string - Símbolo del activo (ej: BTCUSDT)',
      timeframe: 'string - Temporalidad (1m, 5m, 15m, 1h, 4h, 1d, 1w)',
      candles: 'array - Datos OHLCV de las velas'
    },
    optionalFields: {
      analysisDepth: 'string - Profundidad: "basic" | "standard" | "comprehensive" (default: standard)',
      tradingStyle: 'string - Estilo: "scalping" | "day_trading" | "swing" | "position" (default: swing)'
    },
    candleStructure: {
      time: 'number - Timestamp en milisegundos',
      open: 'number - Precio de apertura',
      high: 'number - Precio máximo',
      low: 'number - Precio mínimo',
      close: 'number - Precio de cierre',
      volume: 'number - Volumen'
    },
    example: {
      method: 'POST',
      url: '/api/ai/analyze',
      body: {
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
          }
        ]
      }
    },
    responseStructure: {
      success: 'boolean',
      data: {
        symbol: 'string',
        timeframe: 'string',
        timestamp: 'number',
        summary: {
          trend: 'alcista | bajista | lateral',
          bias: 'string con dirección y probabilidad',
          overallSentiment: 'string descriptivo'
        },
        trendAnalysis: {
          direction: 'bullish | bearish | neutral',
          structure: 'descripción de estructura de mercado',
          strength: 'número 0-100',
          adx: 'número',
          sma: 'array de MAs',
          ema: 'array de EMAs'
        },
        patterns: 'array de patrones identificados',
        indicatorStatus: {
          rsi: 'objeto con valor y estado',
          macd: 'objeto con valor, signal, histogram',
          bollingerBands: 'objeto con bandas',
          stochastic: 'objeto con %K y %D',
          atr: 'número',
          volume: 'objeto con estado de volumen'
        },
        keyLevels: {
          supports: 'array de soportes',
          resistances: 'array de resistencias',
          highProbabilityZones: 'array de zonas'
        },
        mainPrediction: {
          direction: 'bullish | bajista | lateral',
          probability: 'número 0-100',
          targetPrice: 'array de precios objetivo',
          stopLoss: 'número',
          riskReward: 'número',
          timeHorizon: 'string estimado',
          confidenceLevel: 'low | medium | high'
        },
        alternativePrediction: 'objeto con escenario alternativo',
        inversePrediction: 'objeto con escenario inverso',
        riskFactors: 'array de factores de riesgo',
        shortAnalysis: 'string 2-3 oraciones',
        detailedAnalysis: 'string con análisis completo',
        warnings: 'array de advertencias'
      },
      processingTime: 'número en ms',
      timestamp: 'número'
    }
  });
}

