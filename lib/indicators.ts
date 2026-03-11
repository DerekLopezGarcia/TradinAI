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
/**
 * Calcula el RSI con el método de Wilder (EMA suavizada) — estándar real.
 * Fórmula:
 *   1. Calcular cambios: change[i] = close[i] - close[i-1]
 *   2. Separar ganancias (gain) y pérdidas (loss, valor positivo)
 *   3. Primera media: SMA de los primeros `period` valores
 *   4. Siguientes medias: Wilder smoothing = (prevAvg * (period-1) + current) / period
 *   5. RS = avgGain / avgLoss
 *   6. RSI = 100 - (100 / (1 + RS))
 *
 * @param data   - Array de precios de cierre
 * @param period - Período (default: 14)
 * @returns Array del mismo tamaño que data. Los primeros `period` valores son NaN.
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length <= period) return result;

  // Calcular ganancias y pérdidas
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  // Primera media simple (SMA) de los primeros `period` valores
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // RSI en posición `period` (índice en data = period)
  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0);

  // Suavizado de Wilder para el resto
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    result[i + 1] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
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

