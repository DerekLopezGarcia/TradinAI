/**
 * Web Worker para cálculo de indicadores técnicos
 * Se ejecuta en thread separado sin bloquear el main thread
 * 
 * T1.1 Fase 2: Web Workers para paralelización real
 */

import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateStochastic,
} from '@/lib/indicators';

export interface IndicatorWorkerInput {
  id: string;
  type: 'rsi' | 'macd' | 'bollingerBands' | 'atr' | 'stochastic';
  closes?: number[];
  highs?: number[];
  lows?: number[];
  volumes?: number[];
}

export interface IndicatorWorkerOutput {
  id: string;
  type: string;
  result: any;
}

/**
 * Maneja mensajes del main thread y ejecuta cálculos en paralelo
 */
self.onmessage = (event: MessageEvent<IndicatorWorkerInput>) => {
  const { id, type, closes, highs, lows, volumes } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'rsi':
        result = closes ? calculateRSI(closes, 14) : null;
        break;

      case 'macd':
        result = closes ? calculateMACD(closes) : null;
        break;

      case 'bollingerBands':
        result = closes ? calculateBollingerBands(closes, 20, 2) : null;
        break;

      case 'atr':
        result =
          highs && lows && closes ? calculateATR(highs, lows, closes, 14) : null;
        break;

      case 'stochastic':
        result =
          highs && lows && closes
            ? calculateStochastic(highs, lows, closes, 14, 3)
            : null;
        break;

      default:
        throw new Error(`Unknown indicator type: ${type}`);
    }

    // Enviar resultado de vuelta al main thread
    self.postMessage({
      id,
      type,
      result,
    } as IndicatorWorkerOutput);
  } catch (error) {
    // Enviar error de vuelta al main thread
    self.postMessage({
      id,
      type,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

