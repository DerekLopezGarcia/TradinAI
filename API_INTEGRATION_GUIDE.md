# Guía de Integración de APIs en TradingIA

## 📋 Resumen de la Integración

Se ha integrado un **servicio centralizado de mercado** que soporta 4 APIs de datos en tiempo real:

### ✅ APIs Integradas

| API | Tipo | Plan | Rate Limit | Estado |
|-----|------|------|-----------|--------|
| **CoinGecko** | Criptomonedas | Gratis | Ilimitado | ✅ Implementado |
| **Finnhub** | Acciones | Gratis | 60 calls/min | ✅ Implementado |
| **NewsAPI** | Noticias | Gratis | 100 req/día | ✅ Implementado |
| **Alpha Vantage** | Indicadores | Gratis | 5 calls/min | ✅ Implementado |

---

## 📁 Archivos Nuevos Creados

### 1. **lib/services/marketService.ts** (800+ líneas)
Servicio centralizado con soporte para todas las APIs:

```typescript
// Principales clases
├── CoinGeckoService    // Criptomonedas
├── FinnhubService      // Acciones + WebSocket
├── NewsAPIService      // Noticias con sentimiento
├── AlphaVantageService // Indicadores técnicos
├── CacheManager        // Caché inteligente
└── MarketService       // Orquestador principal
```

**Características:**
- ✅ Caching automático con TTL configurable
- ✅ Fallback entre APIs
- ✅ Tipado TypeScript completo
- ✅ Manejo de errores robusto
- ✅ WebSocket para datos en vivo

### 2. **app/hooks/useMarketAPI.ts** (500+ líneas)
Hooks React para usar las APIs fácilmente:

```typescript
// Hooks disponibles
├── useCoinPrice()          // Precio de una cripto
├── useCoinPrices()         // Múltiples criptos
├── useTrendingCoins()      // Monedas trending
├── useCoinHistory()        // Historial de precios
├── useStockQuote()         // Cotización de acción
├── useStockCandles()       // Velas de acción
├── useStockSubscription()  // WebSocket tiempo real
├── useNews()               // Noticias
├── useHeadlines()          // Titulares
├── useCandles()            // Datos históricos
├── useTechnicalIndicator() // Indicadores técnicos
└── useMarketError()        // Manejo de errores
```

### 3. **components/APIDemo.tsx** (600+ líneas)
Componente de ejemplo totalmente funcional con 4 tabs:

- 📊 **Crypto Tab**: Datos de Bitcoin con sparkline
- 📈 **Stocks Tab**: Cotización de acciones
- 📰 **News Tab**: Feed de noticias con sentimiento
- 🔥 **Trending Tab**: Monedas en trending

### 4. **API_CONFIGURATION.md** (300+ líneas)
Guía completa de configuración:
- Cómo obtener API Keys
- Configurar variables de entorno
- Ejemplos de uso
- Troubleshooting

---

## 🚀 Cómo Usar

### Paso 1: Configurar Variables de Entorno

Crea archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_FINNHUB_KEY=your_key_here
NEXT_PUBLIC_NEWSAPI_KEY=your_key_here
NEXT_PUBLIC_ALPHAVANTAGE_KEY=your_key_here

NEXT_PUBLIC_COINGECKO_ENABLED=true
NEXT_PUBLIC_FINNHUB_ENABLED=true
NEXT_PUBLIC_NEWSAPI_ENABLED=true
NEXT_PUBLIC_ALPHAVANTAGE_ENABLED=true
```

### Paso 2: Usar en Componentes

```typescript
'use client';

import { useCoinPrice, useStockQuote, useNews } from '@/app/hooks/useMarketAPI';

export function MiComponente() {
  const { data: bitcoin, loading, error } = useCoinPrice('bitcoin');
  const { data: quote } = useStockQuote('AAPL');
  const { data: news } = useNews('Bitcoin');

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Bitcoin: ${bitcoin.price}</h2>
      <p>Apple: ${quote.price}</p>
      <ul>
        {news.map(article => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Paso 3: Usar el Servicio Directamente (Server Components)

```typescript
// En un Server Component o API Route
import { marketService } from '@/lib/services/marketService';

export async function getServerSideProps() {
  try {
    const btc = await marketService.getCoinPrice('bitcoin');
    const aapl = await marketService.getStockQuote('AAPL');
    const news = await marketService.getNews('Bitcoin', 5);
    
    return {
      props: { btc, aapl, news },
      revalidate: 30, // Revalidar cada 30 segundos
    };
  } catch (error) {
    return {
      props: { error: error.message },
      revalidate: 10,
    };
  }
}
```

---

## 📊 Ejemplos de Uso por API

### CoinGecko - Criptomonedas

```typescript
// Precio actual
const btc = await marketService.getCoinPrice('bitcoin');
console.log(btc.price); // $42,350.50

// Múltiples monedas
const prices = await marketService.getCoinPrices(['bitcoin', 'ethereum', 'cardano']);

// Monedas trending
const trending = await marketService.getTrendingCoins();

// Historial (últimos 30 días)
const history = await marketService.getCoinHistory('bitcoin', 30);
```

### Finnhub - Acciones

```typescript
// Cotización actual
const quote = await marketService.getStockQuote('AAPL');
console.log(quote.price); // $192.35

// Velas históricas
const candles = await marketService.getStockCandles(
  'AAPL',
  '60',        // 1 hora
  1704067200,  // desde
  1704153600   // hasta
);

// WebSocket en tiempo real
const unsubscribe = marketService.subscribeToStock('AAPL', (quote) => {
  console.log('Nuevo precio:', quote.price);
});
```

### NewsAPI - Noticias

```typescript
// Buscar noticias
const news = await marketService.getNews('Bitcoin', 10);

// Obtener titulares
const headlines = await marketService.getHeadlines('business', 5);

// Cada noticia incluye
news[0].title        // "Bitcoin alcanza máximo"
news[0].sentiment    // "positive", "negative", "neutral"
news[0].source       // "Bloomberg"
news[0].url          // Link a la noticia
```

### Alpha Vantage - Indicadores

```typescript
// Datos históricos
const candles = await marketService.getCandles('AAPL', 'daily', 100);

// Indicadores técnicos
const rsi = await marketService.getTechnicalIndicator('AAPL', 'RSI', '60min', 14);
const macd = await marketService.getTechnicalIndicator('AAPL', 'MACD');
const bbands = await marketService.getTechnicalIndicator('AAPL', 'BBANDS');
```

---

## 💾 Sistema de Caché

El servicio implementa un sistema de caché inteligente:

```typescript
// Cache automático con TTL
const price = await marketService.getCoinPrice('bitcoin');
// Se cachea por 30 segundos automáticamente

// Acceso manual al caché
const cached = marketService.getCachedData<CoinPrice>('key');
marketService.setCachedData('key', data, 60000); // 60 segundos
marketService.deleteCachedData('key');
marketService.clearCache(); // Limpiar todo
```

**TTL Predeterminados:**
- Precios: 30 segundos
- Histórico: 10 minutos
- Noticias: 5 minutos
- Trending: 5 minutos

---

## 🎯 Casos de Uso Reales

### Caso 1: Dashboard de Criptomonedas

```typescript
export function CryptoDashboard() {
  const { data: btc } = useCoinPrice('bitcoin');
  const { data: eth } = useCoinPrice('ethereum');
  const { data: trending } = useTrendingCoins();
  const { data: btcNews } = useNews('Bitcoin');

  return (
    <div>
      <PriceCard coin={btc} />
      <PriceCard coin={eth} />
      <TrendingList coins={trending} />
      <NewsList articles={btcNews} />
    </div>
  );
}
```

### Caso 2: Monitor de Acciones

```typescript
export function StockMonitor() {
  const { data: apple } = useStockQuote('AAPL');
  const { data: candles } = useStockCandles('AAPL', '60', from, to);
  const { data, connected } = useStockSubscription('AAPL');

  return (
    <div>
      <PriceDisplay price={apple.price} />
      <Chart candles={candles} />
      <RealTimeIndicator connected={connected} latestPrice={data?.price} />
    </div>
  );
}
```

### Caso 3: Análisis con IA

```typescript
export function AIAnalysis() {
  const { data: btc } = useCoinPrice('bitcoin');
  const { data: history } = useCoinHistory('bitcoin');
  const { data: rsi } = useTechnicalIndicator('BITCOIN', 'RSI');
  const { data: news } = useNews('Bitcoin');

  // Enviar a IA para análisis
  const analysis = await analyzeWithAI({
    price: btc.price,
    history,
    rsi,
    news,
  });

  return <AnalysisResult data={analysis} />;
}
```

---

## 🔒 Seguridad

### Consideraciones

```typescript
// ✅ Seguro: Variables de entorno
NEXT_PUBLIC_FINNHUB_KEY=xxx

// ❌ Inseguro: Hardcodeado en código
const apiKey = 'xxx'; // Nunca hagas esto

// ✅ Recomendado: API Key en backend
// app/api/market/route.ts
const apiKey = process.env.FINNHUB_KEY; // No NEXT_PUBLIC_

// Limitar rate limit en cliente
const fetchQuote = debounce(() => {
  marketService.getStockQuote('AAPL');
}, 5000);
```

---

## 🧪 Testing

### Test Rápido

```typescript
// En el componente
useEffect(() => {
  const test = async () => {
    console.log('Testing APIs...');
    
    try {
      const btc = await marketService.getCoinPrice('bitcoin');
      console.log('✓ CoinGecko OK:', btc.price);
    } catch (e) {
      console.error('✗ CoinGecko ERROR:', e.message);
    }

    try {
      const quote = await marketService.getStockQuote('AAPL');
      console.log('✓ Finnhub OK:', quote.price);
    } catch (e) {
      console.error('✗ Finnhub ERROR:', e.message);
    }

    // ... test other APIs
  };

  test();
}, []);
```

---

## 🐛 Troubleshooting Común

| Problema | Solución |
|----------|----------|
| "API Key is invalid" | Verifica la key en `.env.local` |
| "Rate limit exceeded" | El caché está habilitado automáticamente |
| "401 Unauthorized" | La API Key no está activa en el dashboard |
| "Network error" | Verifica tu conexión a internet |
| "CORS error" | Usa Server Components en lugar de Client |

---

## 📈 Performance

### Optimizaciones Incluidas

```typescript
// ✅ Caché automático
// ✅ Request deduplication
// ✅ Lazy loading de componentes
// ✅ Polling inteligente (30s por defecto)
// ✅ WebSocket para tiempo real
// ✅ Error recovery automático
```

### Recomendaciones

1. **Usa Server Components cuando sea posible**
   ```typescript
   // app/api/market/route.ts
   export async function GET(request: Request) {
     const data = await marketService.getCoinPrice('bitcoin');
     return Response.json(data);
   }
   ```

2. **Implementa React Query o SWR para sincronización**
   ```typescript
   const { data } = useSWR('btc-price', () => 
     marketService.getCoinPrice('bitcoin'),
     { refreshInterval: 30000 }
   );
   ```

3. **Cachea en localStorage**
   ```typescript
   const cached = localStorage.getItem('btc-price');
   if (!cached) {
     const data = await marketService.getCoinPrice('bitcoin');
     localStorage.setItem('btc-price', JSON.stringify(data));
   }
   ```

---

## 🎓 Próximos Pasos

1. ✅ Obtén tus API Keys
2. ✅ Configura `.env.local`
3. ✅ Importa `APIDemo.tsx` en tu página
4. ✅ Comienza a experimentar
5. ✅ Reemplaza datos mock con datos reales

---

## 📚 Recursos

- [CoinGecko API Docs](https://www.coingecko.com/en/api)
- [Finnhub API Docs](https://finnhub.io/docs/api)
- [NewsAPI Docs](https://newsapi.org/docs)
- [Alpha Vantage Docs](https://www.alphavantage.co/documentation/)

---

**¡Tu aplicación TradingIA ahora está conectada a APIs reales de datos financieros!** 🚀

Siguiente paso: Actualiza tus componentes existentes para usar los datos reales en lugar de datos mock.

