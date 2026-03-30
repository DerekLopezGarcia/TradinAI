import { CandleData, NewsItem } from '@/lib/types';

/**
 * ARCHIVO DEPRECADO - NO USAR DATOS MOCK
 * 
 * Este archivo contenía noticias simuladas (MOCK_NEWS) que han sido removidas.
 * 
 * Las noticias DEBEN ser cargadas desde:
 * - APIs reales de noticias financieras
 * - Newsroom de empresas
 * - Fuentes autorizadas
 * 
 * NO se deben usar datos simulados para decisiones financieras
 */

// ❌ REMOVIDO: export const MOCK_NEWS = [...]
// Los datos de noticias deben venir de APIs reales

/**
 * Función para obtener noticias por activo
 * @deprecated Usa newsService.ts en su lugar para obtener noticias reales
 */
export function getNewsByAsset(symbol: string): NewsItem[] {
  // Retorna array vacío - las noticias deben venir de APIs reales
  return [];
}

// Función para calcular indicadores técnicos
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

// Simulación de análisis de IA - REMOVIDA
// Solo se deben usar análisis reales de la IA
export function generateMockAIAnalysis(symbol: string, trend: 'bullish' | 'bearish' | 'neutral') {
  return {
    analysis: `Por favor obtén análisis real del activo ${symbol} desde la API de IA`,
    recommendation: 'Usa la API de IA para obtener análisis actual',
  };
}

// Función de respuestas de chat - REMOVIDA
// Solo se deben usar respuestas reales de la IA desde la API
export function generateMockAIChatResponse(message: string, symbol?: string): string {
  return `Por favor usa la API de IA en lugar de respuestas simuladas para obtener análisis real sobre: "${message}"`;
}

