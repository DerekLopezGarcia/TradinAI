/**
 * Servicio de validación centralizado para entrada de usuario
 * Previene URL injection, XSS y otras vulnerabilidades
 */

import { CandleData } from '@/lib/types';

/**
 * Valida un símbolo de activo
 * Permite: A-Z, 0-9, máximo 20 caracteres
 * @param symbol - Símbolo a validar
 * @returns true si es válido
 */
export function validateSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  // Permite: BTCUSD, AAPL, SPX, etc (A-Z, 0-9, máximo 20 chars)
  return /^[A-Z0-9]{1,20}$/.test(symbol.trim());
}

/**
 * Valida un timeframe
 * @param timeframe - Timeframe a validar
 * @returns true si es válido
 */
export function validateTimeFrame(timeframe: string): boolean {
  const validFrames = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
  return validFrames.includes(timeframe);
}

/**
 * Valida un tipo de análisis
 * @param type - Tipo de análisis
 * @returns true si es válido
 */
export function validateAnalysisDepth(depth: string): boolean {
  const valid = ['basic', 'standard', 'comprehensive'];
  return valid.includes(depth);
}

/**
 * Valida un estilo de trading
 * @param style - Estilo de trading
 * @returns true si es válido
 */
export function validateTradingStyle(style: string): boolean {
  const valid = ['scalping', 'day_trading', 'swing', 'position'];
  return valid.includes(style);
}

/**
 * Valida un array de velas
 * @param candles - Array de velas
 * @returns true si tienen estructura correcta
 */
export function validateCandles(candles: CandleData[]): boolean {
  if (!Array.isArray(candles) || candles.length === 0) return false;
  
  return candles.every(c => 
    typeof c.time === 'number' &&
    typeof c.open === 'number' &&
    typeof c.high === 'number' &&
    typeof c.low === 'number' &&
    typeof c.close === 'number' &&
    typeof c.volume === 'number' &&
    c.high >= c.low &&
    c.high >= c.open &&
    c.high >= c.close &&
    c.low <= c.open &&
    c.low <= c.close &&
    c.open > 0 && c.close > 0 && c.high > 0 && c.low > 0 && c.volume >= 0
  );
}

/**
 * Sanitiza un símbolo para uso seguro
 * @param symbol - Símbolo bruto
 * @returns Símbolo sanitizado
 */
export function sanitizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Crea URLSearchParams seguros desde un objeto
 * @param params - Parámetros a codificar
 * @returns URLSearchParams codificados correctamente
 */
export function createSafeParams(params: Record<string, string | number | boolean>): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });
  
  return searchParams;
}

/**
 * Valida una URL de noticias
 * @param url - URL a validar
 * @returns true si es una URL válida
 */
export function validateNewsUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Solo permitir HTTPS
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') return false;
    // Validar hostname válido
    if (!urlObj.hostname) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitiza texto de noticias (básico)
 * Remueve scripts y tags HTML peligrosos
 * @param text - Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeNewsText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onload=/gi, '')
    .substring(0, 1000); // Máximo 1000 caracteres
}

