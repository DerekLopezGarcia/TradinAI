/**
 * Funciones para calcular indicadores técnicos
 * SMA, EMA, RSI, MACD, Bollinger Bands, etc.
 */

/**
 * Calcula la Media Móvil Simple (SMA)
 * @param data - Array de precios
 * @param period - Período de la media móvil
 * @returns Array con los valores de SMA
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Calcula la Media Móvil Exponencial (EMA)
 * @param data - Array de precios
 * @param period - Período de la media móvil
 * @returns Array con los valores de EMA
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let ema = data[0];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(ema);
    } else {
      ema = data[i] * k + ema * (1 - k);
      result.push(ema);
    }
  }
  return result;
}

/**
 * Calcula el Índice de Fuerza Relativa (RSI)
 * @param data - Array de precios
 * @param period - Período del RSI (default: 14)
 * @returns Array con los valores de RSI (0-100)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const changes = [];

  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }

  for (let i = 0; i < changes.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const gains = changes.slice(i - period + 1, i + 1).filter(c => c > 0).reduce((a, b) => a + b, 0);
      const losses = Math.abs(changes.slice(i - period + 1, i + 1).filter(c => c < 0).reduce((a, b) => a + b, 0));

      const rs = gains / (losses || 1);
      const rsi = 100 - (100 / (1 + rs));
      result.push(rsi);
    }
  }
  return result;
}

/**
 * Calcula las Bandas de Bollinger
 * @param data - Array de precios
 * @param period - Período de la SMA (default: 20)
 * @param stdDev - Desviaciones estándar (default: 2)
 * @returns Objeto con arrays de upper, middle, lower bands
 */
export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(0);
      lower.push(0);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);

      upper.push(mean + stdDev * standardDeviation);
      lower.push(mean - stdDev * standardDeviation);
    }
  }

  return { upper, middle, lower };
}

/**
 * Calcula el MACD (Moving Average Convergence Divergence)
 * @param data - Array de precios
 * @param fastPeriod - Período EMA rápida (default: 12)
 * @param slowPeriod - Período EMA lenta (default: 26)
 * @param signalPeriod - Período línea de señal (default: 9)
 * @returns Objeto con arrays de MACD, signal, histogram
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  const macd = fastEMA.map((fast, i) => fast - slowEMA[i]);
  const signal = calculateEMA(macd, signalPeriod);
  const histogram = macd.map((m, i) => m - signal[i]);

  return { macd, signal, histogram };
}

