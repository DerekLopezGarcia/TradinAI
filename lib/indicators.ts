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

/**
 * Calcula el ADX (Average Directional Index)
 * @param candles - Array de velas con OHLCV
 * @param period - Período del ADX (default: 14)
 * @returns Array con los valores de ADX (0-100)
 */
export function calculateADX(
  candles: Array<{ high: number; low: number; close: number }>,
  period: number = 14
): number[] {
  const result: number[] = new Array(candles.length).fill(NaN);
  if (candles.length <= period) return result;

  // Paso 1: Calcular el rango verdadero (True Range - TR)
  const trueRanges: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    let tr: number;
    if (i === 0) {
      tr = candles[i].high - candles[i].low;
    } else {
      const hl = candles[i].high - candles[i].low;
      const hc = Math.abs(candles[i].high - candles[i - 1].close);
      const lc = Math.abs(candles[i].low - candles[i - 1].close);
      tr = Math.max(hl, hc, lc);
    }
    trueRanges.push(tr);
  }

  // Paso 2: Calcular movimientos direccionales (+DM y -DM)
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    let pdm = 0;
    let mdm = 0;

    if (i > 0) {
      const upMove = candles[i].high - candles[i - 1].high;
      const downMove = candles[i - 1].low - candles[i].low;

      if (upMove > 0 && upMove > downMove) {
        pdm = upMove;
      }
      if (downMove > 0 && downMove > upMove) {
        mdm = downMove;
      }
    }

    plusDM.push(pdm);
    minusDM.push(mdm);
  }

  // Paso 3: Suavizar usando el método de Wilder
  let smoothedTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  // Paso 4: Calcular los indicadores direccionales (+DI y -DI)
  const diArray: { plus: number; minus: number }[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    if (i >= period) {
      smoothedTR = smoothedTR - smoothedTR / period + trueRanges[i];
      smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDM[i];
      smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDM[i];
    }

    const plusDI = (smoothedPlusDM / smoothedTR) * 100;
    const minusDI = (smoothedMinusDM / smoothedTR) * 100;

    diArray.push({ plus: plusDI, minus: minusDI });
  }

  // Paso 5: Calcular el índice direccional (DX)
  const dxArray: number[] = [];
  for (let i = 0; i < diArray.length; i++) {
    const di = diArray[i];
    const diSum = di.plus + di.minus;
    const dx = diSum !== 0 ? ((Math.abs(di.plus - di.minus) / diSum) * 100) : 0;
    dxArray.push(dx);
  }

  // Paso 6: Suavizar el DX para obtener ADX
  if (dxArray.length >= period) {
    let adx = dxArray.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result[period + period - 1] = adx;

    for (let i = period; i < dxArray.length; i++) {
      adx = (adx * (period - 1) + dxArray[i]) / period;
      result[i + period] = adx;
    }
  }

  return result;
}

/**
 * Calcula el Indicador Estocástico (Stochastic Oscillator)
 * @param candles - Array de velas con precios OHLC
 * @param kPeriod - Período para %K (default: 14)
 * @param dPeriod - Período para %D media móvil (default: 3)
 * @param smoothK - Períodos de suavizado para %K (default: 3)
 * @returns Objeto con arrays de %K (línea rápida) y %D (línea lenta)
 */
export function calculateStochastic(
  candles: Array<{ high: number; low: number; close: number }>,
  kPeriod: number = 14,
  dPeriod: number = 3,
  smoothK: number = 3
): { 
  k: number[]; 
  d: number[]; 
  kFast?: number[];
  currentK?: number;
  currentD?: number;
} {
  const result: number[] = new Array(candles.length).fill(NaN);
  const kValues: number[] = [];

  if (candles.length < kPeriod) {
    return { k: result, d: result.slice(), kFast: result.slice() };
  }

  // Paso 1: Calcular %K rápido (raw stochastic)
  // %K = (Close - Lowest Low) / (Highest High - Lowest Low) * 100
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const highest = Math.max(...slice.map(c => c.high));
    const lowest = Math.min(...slice.map(c => c.low));
    const range = highest - lowest;

    if (range === 0) {
      kValues.push(50); // Si no hay rango, usar 50
    } else {
      const stoch = ((candles[i].close - lowest) / range) * 100;
      kValues.push(stoch);
    }
  }

  // Paso 2: Suavizar %K (línea rápida)
  const kSmoothed: number[] = calculateSMA(kValues, smoothK);

  // Paso 3: Calcular %D (línea lenta) - Media móvil de %K suavizado
  const dValues: number[] = calculateSMA(kSmoothed, dPeriod);

  // Llenar el resultado con NaN al inicio y luego con los valores calculados
  const offset = kPeriod - 1;
  for (let i = 0; i < kSmoothed.length; i++) {
    result[offset + i] = kSmoothed[i];
  }

  const dResult: number[] = new Array(candles.length).fill(NaN);
  const dOffset = offset + smoothK - 1 + dPeriod - 1;
  for (let i = 0; i < dValues.length; i++) {
    if (dOffset + i < dResult.length) {
      dResult[dOffset + i] = dValues[i];
    }
  }

  // Obtener los valores actuales (últimos valores válidos)
  let currentK: number | undefined;
  let currentD: number | undefined;
  
  for (let i = result.length - 1; i >= 0; i--) {
    if (!isNaN(result[i])) {
      currentK = result[i];
      break;
    }
  }
  
  for (let i = dResult.length - 1; i >= 0; i--) {
    if (!isNaN(dResult[i])) {
      currentD = dResult[i];
      break;
    }
  }

  return {
    k: result,
    d: dResult,
    kFast: kValues, // %K sin suavizar (opcional)
    currentK,
    currentD,
  };
}
