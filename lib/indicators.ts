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
 * Calcula el ATR (Average True Range)
 * @param highs - Array de precios máximos
 * @param lows - Array de precios mínimos  
 * @param closes - Array de precios de cierre
 * @param period - Período del ATR (default: 14)
 * @returns Array con los valores de ATR
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const result: number[] = new Array(highs.length).fill(NaN);
  
  if (highs.length < period) return result;

  // Calcular True Range (TR) para cada período
  const trueRanges: number[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    let tr: number;
    
    if (i === 0) {
      tr = highs[i] - lows[i];
    } else {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      tr = Math.max(hl, hc, lc);
    }
    
    trueRanges.push(tr);
  }

  // Primera ATR es SMA del primer período
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = atr;

  // Suavizamiento de Wilder para el resto
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result[i] = atr;
  }

  return result;
}

/**
 * Calcula ADX (Average Directional Index) - versión mejorada
 * @param highs - Array de precios máximos
 * @param lows - Array de precios mínimos
 * @param closes - Array de precios de cierre
 * @param period - Período del ADX (default: 14)
 * @returns Array con los valores de ADX (0-100)
 */
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const result: number[] = new Array(highs.length).fill(NaN);
  
  if (highs.length <= period) return result;

  // Paso 1: Calcular el rango verdadero (True Range - TR)
  const trueRanges: number[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    let tr: number;
    
    if (i === 0) {
      tr = highs[i] - lows[i];
    } else {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      tr = Math.max(hl, hc, lc);
    }
    
    trueRanges.push(tr);
  }

  // Paso 2: Calcular movimientos direccionales (+DM y -DM)
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 0; i < highs.length; i++) {
    let pdm = 0;
    let mdm = 0;

    if (i > 0) {
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];

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

  // Paso 4: Calcular el ADX
  const dxArray: number[] = [];

  for (let i = period - 1; i < highs.length; i++) {
    if (i >= period) {
      smoothedTR = smoothedTR - smoothedTR / period + trueRanges[i];
      smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDM[i];
      smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDM[i];
    }

    const plusDI = (smoothedPlusDM / smoothedTR) * 100;
    const minusDI = (smoothedMinusDM / smoothedTR) * 100;

    const diSum = plusDI + minusDI;
    const dx = diSum !== 0 ? ((Math.abs(plusDI - minusDI) / diSum) * 100) : 0;
    
    dxArray.push(dx);
  }

  // Calcular ADX como EMA del DX
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
 * Calcula el Estocástico (Stochastic Oscillator)
 * @param highs - Array de precios máximos
 * @param lows - Array de precios mínimos
 * @param closes - Array de precios de cierre
 * @param period - Período para %K (default: 14)
 * @param smoothK - Períodos de suavizado para %K (default: 3)
 * @returns Objeto con arrays de %K y %D
 */
export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14,
  smoothK: number = 3
): { k: number[]; d: number[] } {
  const result: number[] = new Array(highs.length).fill(NaN);
  const dResult: number[] = new Array(highs.length).fill(NaN);

  if (highs.length < period) {
    return { k: result, d: dResult };
  }

  // Calcular %K rápido (raw stochastic)
  const kValues: number[] = [];

  for (let i = period - 1; i < highs.length; i++) {
    const slice = { 
      highs: highs.slice(i - period + 1, i + 1),
      lows: lows.slice(i - period + 1, i + 1)
    };
    
    const highest = Math.max(...slice.highs);
    const lowest = Math.min(...slice.lows);
    const range = highest - lowest;

    const stoch = range === 0 ? 50 : ((closes[i] - lowest) / range) * 100;
    kValues.push(stoch);
  }

  // Suavizar %K
  const kSmoothed = calculateSMA(kValues, smoothK);

  // Calcular %D (SMA de %K suavizado)
  const dValues = calculateSMA(kSmoothed, 3);

  // Llenar resultados
  const offset = period - 1;
  for (let i = 0; i < kSmoothed.length; i++) {
    result[offset + i] = kSmoothed[i];
  }

  const dOffset = offset + smoothK - 1 + 2;
  for (let i = 0; i < dValues.length; i++) {
    if (dOffset + i < dResult.length) {
      dResult[dOffset + i] = dValues[i];
    }
  }

  return { k: result, d: dResult };
}
