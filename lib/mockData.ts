import { CandleData, NewsItem, Sentiment } from '@/lib/types';
import { eachMinuteOfInterval, eachHourOfInterval, eachDayOfInterval, eachWeekOfInterval, subDays, subWeeks, subMonths, getUnixTime } from 'date-fns';

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

// Función para generar datos de velas japonesas simuladas
export function generateMockCandleData(symbol: string, interval: string, days: number = 60): CandleData[] {
  const now = Date.now() / 1000;
  const data: CandleData[] = [];

  const getStartPrice = (sym: string): number => {
    const prices: Record<string, number> = {
      'BTCUSD': 42350,
      'ETHUSD': 2250,
      'AAPL': 192,
      'GOOGL': 138,
      'TSLA': 242,
      'EURUSD': 1.0945,
      'GBPUSD': 1.2685,
    };
    return prices[sym] || 100;
  };

  const getVolatility = (sym: string): number => {
    const volatilities: Record<string, number> = {
      'BTCUSD': 0.04,
      'ETHUSD': 0.05,
      'AAPL': 0.01,
      'GOOGL': 0.01,
      'TSLA': 0.02,
      'EURUSD': 0.002,
      'GBPUSD': 0.002,
    };
    return volatilities[sym] || 0.01;
  };

  let basePrice = getStartPrice(symbol);
  const volatility = getVolatility(symbol);

  // Generar datos dependiendo del intervalo
  let intervals: Date[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  if (interval === '1m') {
    intervals = eachMinuteOfInterval({ start: startDate, end: new Date() }).slice(-days * 24 * 60);
  } else if (interval === '5m') {
    intervals = eachMinuteOfInterval({ start: startDate, end: new Date() })
      .filter((_, i) => i % 5 === 0)
      .slice(-days * 24 * 12);
  } else if (interval === '15m') {
    intervals = eachMinuteOfInterval({ start: startDate, end: new Date() })
      .filter((_, i) => i % 15 === 0)
      .slice(-days * 24 * 4);
  } else if (interval === '1h') {
    intervals = eachHourOfInterval({ start: startDate, end: new Date() }).slice(-days * 24);
  } else if (interval === '4h') {
    intervals = eachHourOfInterval({ start: startDate, end: new Date() })
      .filter((_, i) => i % 4 === 0)
      .slice(-days * 6);
  } else if (interval === '1d') {
    intervals = eachDayOfInterval({ start: startDate, end: new Date() }).slice(-days);
  } else if (interval === '1w') {
    intervals = eachWeekOfInterval({ start: startDate, end: new Date() }).slice(-Math.ceil(days / 7));
  }

  for (const date of intervals) {
    const timestamp = getUnixTime(date) * 1000;

    // Generar cambios aleatorios con tendencia
    const trend = Math.random() > 0.5 ? 1 : -1;
    const change = (Math.random() - 0.5) * volatility * basePrice * trend;

    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = Math.floor(Math.random() * 1000000000) + 100000000;

    data.push({
      time: timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    basePrice = close;
  }

  return data;
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

// Simulación de análisis de IA
export function generateMockAIAnalysis(symbol: string, trend: 'bullish' | 'bearish' | 'neutral') {
  const analyses: Record<string, Record<string, { analysis: string; recommendation: string }>> = {
    'bullish': {
      'BTCUSD': {
        analysis: 'Bitcoin mantiene una estructura alcista bien definida. El precio se encuentra por encima de su media móvil de 50 períodos. El RSI está en zona neutra (45-55), sugiriendo espacio para continuar al alza.',
        recommendation: 'Mantener posiciones largas. Objetivo técnico: $44,000 USD. Soporte dinámico en $41,000 USD.',
      },
      'ETHUSD': {
        analysis: 'Ethereum muestra una recuperación sostenida. El precio ha roto por encima de la resistencia en $2,200. Las bandas de Bollinger están expandiéndose, indicando aumento de volatilidad alcista.',
        recommendation: 'Buscar entrada en retrocesos. Objetivo: $2,500 USD. Stop loss en $2,100 USD.',
      },
      'AAPL': {
        analysis: 'Apple presenta una tendencia alcista clara con máximos crecientes. El MACD está en zona positiva con divergencia alcista. El volumen acompaña el movimiento al alza.',
        recommendation: 'Posiciones largas. Próxima resistencia en $195 USD. Soporte en $190 USD.',
      },
    },
    'bearish': {
      'BTCUSD': {
        analysis: 'Bitcoin está perdiendo momentum. El precio ha caído por debajo de la media móvil de 200 períodos. El RSI muestra divergencia bajista con máximos decrecientes.',
        recommendation: 'Evitar compras. Esperar señal de reversión. Soporte crítico en $40,000 USD.',
      },
      'ETHUSD': {
        analysis: 'Ethereum está en una corrección. Las bandas de Bollinger se están estrechando, sugiriendo menor volatilidad. El MACD está cruzando hacia la baja.',
        recommendation: 'Posiciones cortas cautelosas. Objetivo: $2,000 USD. Resistencia en $2,300 USD.',
      },
      'AAPL': {
        analysis: 'Apple ha formado una cabeza y hombro bajista. El volumen aumentó en la ruptura bajista. Las medias móviles apuntan hacia abajo.',
        recommendation: 'Vender en rebotes. Stop loss en $195 USD. Objetivo bajista: $180 USD.',
      },
    },
    'neutral': {
      'BTCUSD': {
        analysis: 'Bitcoin está consolidando en un rango. El precio oscila entre $41,000 y $43,000 USD. El RSI está en el centro (40-60), sin direccionalidad clara.',
        recommendation: 'Operar el rango. Comprar en soporte, vender en resistencia. Esperar ruptura del rango para tendencia clara.',
      },
      'ETHUSD': {
        analysis: 'Ethereum está en fase de acumulación. Las bandas de Bollinger se están estrechando. Esperar una ruptura significativa.',
        recommendation: 'Esperar oportunidad de entrada con confirmación de ruptura. Mantener vigilancia en niveles clave.',
      },
      'AAPL': {
        analysis: 'Apple está en consolidación lateral. El precio está cerca de su media móvil de 50 períodos. Sin señales claras de dirección.',
        recommendation: 'Esperar confirmación de ruptura. Trading de corto plazo en el rango. Mantener stops estrictos.',
      },
    },
  };

  const symbolAnalyses = analyses[trend];
  if (!symbolAnalyses || !symbolAnalyses[symbol]) {
    return {
      analysis: `El precio de ${symbol} está siendo analizado. Se necesita más contexto para un análisis preciso.`,
      recommendation: 'Monitorear los niveles de soporte y resistencia principales.',
    };
  }

  return symbolAnalyses[symbol];
}

export function generateMockAIChatResponse(message: string, symbol?: string): string {
  const responses: Record<string, string[]> = {
    'default': [
      'Basándome en el análisis técnico actual, el mercado muestra señales mixtas. ¿Podrías ser más específico sobre qué aspecto te interesa?',
      'Los datos históricos sugieren que este activo ha tenido períodos de volatilidad. Te recomendaría usar órdenes de stop loss.',
      'La correlación entre activos en este momento es interesante. ¿Quieres que profundice en algún par específico?',
    ],
    'price': [
      'El precio actual refleja el balance entre oferta y demanda. Los niveles clave están alrededor de los puntos que ves en el gráfico.',
      'El movimiento de precio hoy ha sido significativo. ¿Te interesa conocer los catalizadores detrás de este movimiento?',
    ],
    'trend': [
      'La tendencia general es alcista a largo plazo, aunque vemos correcciones en el corto plazo. Mantén vigilancia en los soportes dinámicos.',
      'El análisis de tendencia sugiere que estamos en una fase de consolidación antes de la próxima directriz clara.',
    ],
    'buy': [
      'Antes de comprar, asegúrate de esperar confirmación de la ruptura. El MACD y RSI están dando señales positivas.',
      'Un buen punto de entrada sería en el soporte dinámico. Mantén tu relación riesgo-recompensa en 1:3 mínimo.',
    ],
    'sell': [
      'Si estás considerando vender, espera a un cierre por debajo del soporte. Los vendedores están ganando control.',
      'Una salida ordenada sería en la próxima resistencia. No persegugas el precio.',
    ],
  };

  const messageLower = message.toLowerCase();
  let responseArray = responses['default'];

  if (messageLower.includes('precio') || messageLower.includes('price')) {
    responseArray = responses['price'];
  } else if (messageLower.includes('tendencia') || messageLower.includes('trend')) {
    responseArray = responses['trend'];
  } else if (messageLower.includes('comprar') || messageLower.includes('buy')) {
    responseArray = responses['buy'];
  } else if (messageLower.includes('vender') || messageLower.includes('sell')) {
    responseArray = responses['sell'];
  }

  return responseArray[Math.floor(Math.random() * responseArray.length)];
}

