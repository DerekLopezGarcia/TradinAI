import { CandleData, NewsItem } from '@/lib/types';

// Mock de noticias financieras
export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Bitcoin alcanza nuevo máximo histórico en 2024',
    description: 'Bitcoin ha alcanzado su precio más alto del año, superando los $42,000 USD. Los analistas atribuyen esto a la anticipación de una aprobación de ETF de Bitcoin al contado.',
    source: 'Bloomberg',
    url: 'https://example.com/news/1',
    timestamp: Date.now() - 3600000,
    sentiment: 'positive',
    relevantAssets: ['BTCUSD'],
    imageUrl: 'https://via.placeholder.com/400x200?text=Bitcoin+News',
  },
  {
    id: '2',
    title: 'Apple reporta ganancias trimestrales que superan expectativas',
    description: 'Apple ha reportado ganancias de $19.9 mil millones en el trimestre fiscal más reciente, superando las previsiones de los analistas.',
    source: 'Reuters',
    url: 'https://example.com/news/2',
    timestamp: Date.now() - 7200000,
    sentiment: 'positive',
    relevantAssets: ['AAPL'],
    imageUrl: 'https://via.placeholder.com/400x200?text=Apple+Earnings',
  },
  {
    id: '3',
    title: 'Ethereum experimenta volatilidad tras actualizaciones de red',
    description: 'Ethereum ha visto una volatilidad significativa después de las últimas actualizaciones de protocolo. Los desarrolladores afirman que las mejoras de escalabilidad están funcionando como se esperaba.',
    source: 'CoinDesk',
    url: 'https://example.com/news/3',
    timestamp: Date.now() - 10800000,
    sentiment: 'neutral',
    relevantAssets: ['ETHUSD'],
    imageUrl: 'https://via.placeholder.com/400x200?text=Ethereum+Update',
  },
  {
    id: '4',
    title: 'Tesla anuncia expansión de gigafábrica en México',
    description: 'Tesla ha anunciado planes para expandir su operación de manufactura en México, con inversiones estimadas en $2 mil millones.',
    source: 'TechCrunch',
    url: 'https://example.com/news/4',
    timestamp: Date.now() - 14400000,
    sentiment: 'positive',
    relevantAssets: ['TSLA'],
    imageUrl: 'https://via.placeholder.com/400x200?text=Tesla+Factory',
  },
  {
    id: '5',
    title: 'Banco Central mantiene tasas de interés sin cambios',
    description: 'En su reunión más reciente, el Banco Central mantuvo las tasas de interés sin cambios, citando presiones inflacionarias persistentes.',
    source: 'Financial Times',
    url: 'https://example.com/news/5',
    timestamp: Date.now() - 18000000,
    sentiment: 'neutral',
    relevantAssets: ['EURUSD', 'GBPUSD'],
    imageUrl: 'https://via.placeholder.com/400x200?text=Central+Bank',
  },
  {
    id: '6',
    title: 'Mercados experimentan corrección de fin de trimestre',
    description: 'Los mercados mundiales experimentan una corrección técnica al cierre del trimestre, con inversores tomando ganancias.',
    source: 'MarketWatch',
    url: 'https://example.com/news/6',
    timestamp: Date.now() - 21600000,
    sentiment: 'negative',
    relevantAssets: ['AAPL', 'GOOGL', 'TSLA'],
    imageUrl: 'https://via.placeholder.com/400x200?text=Market+Correction',
  },
];

// Función para generar datos de velas japonesas - REMOVIDA
// Solo se deben usar datos reales de las APIs
export function generateMockCandleData(symbol: string, interval: string, days: number = 60): CandleData[] {
  // Esta función ya no se utiliza - los datos se obtienen exclusivamente de APIs reales
  return [];
}

// Función para obtener noticias por activo
export function getNewsByAsset(symbol: string): NewsItem[] {
  return MOCK_NEWS.filter(news => news.relevantAssets.includes(symbol));
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

