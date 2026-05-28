import { calculateSMA, calculateEMA, calculateRSI, calculateATR, calculateADX, calculateStochastic } from '@/lib/indicators';

describe('calculateSMA', () => {
  it('returns correct SMA values', () => {
    const data = [1, 2, 3, 4, 5, 6];
    const result = calculateSMA(data, 3);
    expect(result[2]).toBeCloseTo(2, 5);
    expect(result[3]).toBeCloseTo(3, 5);
    expect(result[4]).toBeCloseTo(4, 5);
    expect(result[5]).toBeCloseTo(5, 5);
  });

  it('pads with zeros for first period-1 entries', () => {
    const data = [10, 20, 30];
    const result = calculateSMA(data, 3);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(20);
  });

  it('returns empty array for empty input', () => {
    expect(calculateSMA([], 5)).toEqual([]);
  });

  it('handles period larger than data length', () => {
    const result = calculateSMA([1, 2], 5);
    expect(result).toEqual([0, 0]);
  });
});

describe('calculateEMA', () => {
  it('returns correct EMA values', () => {
    const data = [10, 11, 12, 13, 14, 15];
    const result = calculateEMA(data, 3);
    expect(result[0]).toBe(10);
    expect(result[1]).toBeGreaterThan(10);
    expect(result[2]).toBeGreaterThan(result[1]);
  });

  it('starts with first data point', () => {
    const data = [25, 30, 35];
    const result = calculateEMA(data, 3);
    expect(result[0]).toBe(25);
  });
});

describe('calculateRSI', () => {
  it('returns NaN for insufficient data', () => {
    const data = [10, 11, 12];
    const result = calculateRSI(data, 14);
    expect(result[0]).toBeNaN();
  });

  it('handles alternating gains/losses', () => {
    const data = Array.from({ length: 20 }, (_, i) => 100 + (i % 2 === 0 ? 1 : -1));
    const result = calculateRSI(data, 14);
    const lastVal = result[result.length - 1];
    expect(lastVal).not.toBeNaN();
    expect(lastVal).toBeGreaterThan(0);
    expect(lastVal).toBeLessThan(100);
  });

  it('returns > 70 for strong uptrend', () => {
    const data = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = calculateRSI(data, 14);
    expect(result[19]).toBeGreaterThan(70);
  });

  it('returns < 30 for strong downtrend', () => {
    const data = Array.from({ length: 20 }, (_, i) => 100 - i);
    const result = calculateRSI(data, 14);
    expect(result[19]).toBeLessThan(30);
  });
});

describe('calculateATR', () => {
  const highs = [10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  const lows = [9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  const closes = [9.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5, 18.5, 19.5, 20.5, 21.5, 22.5, 23.5, 24.5];

  it('returns NaN for insufficient data', () => {
    const result = calculateATR(highs.slice(0, 5), lows.slice(0, 5), closes.slice(0, 5), 14);
    expect(result[0]).toBeNaN();
  });

  it('returns positive values for valid data', () => {
    const result = calculateATR(highs, lows, closes, 14);
    const lastValue = result[result.length - 1];
    expect(lastValue).toBeGreaterThan(0);
    expect(lastValue).not.toBeNaN();
  });
});

describe('calculateADX', () => {
  it('returns NaN for insufficient data', () => {
    const result = calculateADX([10, 11], [9, 10], [9.5, 10.5], 14);
    expect(result[result.length - 1]).toBeNaN();
  });

  it('returns values between 0 and 100 for valid data', () => {
    const highs = Array.from({ length: 30 }, (_, i) => 100 + i + Math.random());
    const lows = Array.from({ length: 30 }, (_, i) => 99 + i + Math.random());
    const closes = Array.from({ length: 30 }, (_, i) => 99.5 + i + Math.random());
    const result = calculateADX(highs, lows, closes, 14);
    const lastValue = result[result.length - 1];
    if (!isNaN(lastValue)) {
      expect(lastValue).toBeGreaterThanOrEqual(0);
      expect(lastValue).toBeLessThanOrEqual(100);
    }
  });
});

describe('calculateStochastic', () => {
  it('returns NaN for insufficient data', () => {
    const result = calculateStochastic([10, 11], [9, 10], [9.5, 10.5], 14);
    expect(result.k[result.k.length - 1]).toBeNaN();
    expect(result.d[result.d.length - 1]).toBeNaN();
  });

  it('returns K and D values between 0 and 100 for valid data', () => {
    const highs = Array.from({ length: 20 }, (_, i) => 100 + i + Math.random() * 5);
    const lows = Array.from({ length: 20 }, (_, i) => 95 + i + Math.random() * 5);
    const closes = Array.from({ length: 20 }, (_, i) => 97 + i + Math.random() * 5);
    const result = calculateStochastic(highs, lows, closes, 14);
    const lastK = result.k[result.k.length - 1];
    const lastD = result.d[result.d.length - 1];
    if (!isNaN(lastK)) {
      expect(lastK).toBeGreaterThanOrEqual(0);
      expect(lastK).toBeLessThanOrEqual(100);
    }
    if (!isNaN(lastD)) {
      expect(lastD).toBeGreaterThanOrEqual(0);
      expect(lastD).toBeLessThanOrEqual(100);
    }
  });
});
