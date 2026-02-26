# Configuración de APIs de Datos en Tiempo Real - TradingIA

## Obtener API Keys

### 1. CoinGecko (GRATIS - Sin API Key requerida)
```
✅ Completamente gratuito
✅ Sin registro requerido
✅ Sin límite de rate limit para uso básico
✅ URL: https://www.coingecko.com/en/api
```

### 2. Finnhub (Plan Gratuito)
```
API Key:  Obtén en https://finnhub.io/register
Plan:     Free - 60 API calls / minuto
Datos:    Stock quotes, candles, news
WebSocket: Incluido
```

**Pasos:**
1. Ve a https://finnhub.io/register
2. Regístrate gratuitamente
3. Obtén tu API Key en el dashboard
4. Copia tu API Key

### 3. NewsAPI (Plan Gratuito)
```
API Key:  Obtén en https://newsapi.org/
Plan:     Free - 100 requests / día
Datos:    Noticias en tiempo real
Idiomas:  Múltiples
```

**Pasos:**
1. Ve a https://newsapi.org/
2. Regístrate gratuitamente
3. Obtén tu API Key
4. Copia tu API Key

### 4. Alpha Vantage (Plan Gratuito)
```
API Key:  Obtén en https://www.alphavantage.co/
Plan:     Free - 5 API calls / minuto
Datos:    Stock data, technical indicators
Histórico: Completo
```

**Pasos:**
1. Ve a https://www.alphavantage.co/
2. Regístrate gratuitamente
3. Obtén tu API Key
4. Copia tu API Key

---

## Configurar Variables de Entorno

### Crear archivo `.env.local`

En la raíz del proyecto `C:\Users\Derek López\WebstormProjects\TradingIA\`, crea un archivo `.env.local`:

```env
# CoinGecko - GRATIS, sin API key necesaria
NEXT_PUBLIC_COINGECKO_ENABLED=true

# Finnhub - Plan gratuito
NEXT_PUBLIC_FINNHUB_KEY=tu_api_key_aqui
NEXT_PUBLIC_FINNHUB_ENABLED=true

# NewsAPI - Plan gratuito
NEXT_PUBLIC_NEWSAPI_KEY=tu_api_key_aqui
NEXT_PUBLIC_NEWSAPI_ENABLED=true

# Alpha Vantage - Plan gratuito
NEXT_PUBLIC_ALPHAVANTAGE_KEY=tu_api_key_aqui
NEXT_PUBLIC_ALPHAVANTAGE_ENABLED=true

# Configuración de la aplicación
NEXT_PUBLIC_API_CACHE_TTL=60000
NODE_ENV=development
```

### Actualizar `.env.example`

```env
# APIs Keys - Obtén tus keys en:
# - Finnhub: https://finnhub.io/register
# - NewsAPI: https://newsapi.org/
# - Alpha Vantage: https://www.alphavantage.co/

NEXT_PUBLIC_FINNHUB_KEY=your_finnhub_key_here
NEXT_PUBLIC_NEWSAPI_KEY=your_newsapi_key_here
NEXT_PUBLIC_ALPHAVANTAGE_KEY=your_alphavantage_key_here

# Banderas de habilitar/deshabilitar APIs
NEXT_PUBLIC_COINGECKO_ENABLED=true
NEXT_PUBLIC_FINNHUB_ENABLED=true
NEXT_PUBLIC_NEWSAPI_ENABLED=true
NEXT_PUBLIC_ALPHAVANTAGE_ENABLED=true

# Cache TTL en milisegundos
NEXT_PUBLIC_API_CACHE_TTL=60000

NODE_ENV=development
```

---

## Cómo Usar el Servicio

### Ejemplo 1: Obtener precio de Bitcoin

```typescript
import { marketService } from '@/lib/services/marketService';

// Obtener precio actual
const bitcoinPrice = await marketService.getCoinPrice('bitcoin');
console.log(bitcoinPrice.price); // $42,350.50

// Obtener múltiples monedas a la vez
const prices = await marketService.getCoinPrices(['bitcoin', 'ethereum', 'cardano']);
```

### Ejemplo 2: Obtener datos de acciones

```typescript
// Obtener cotización actual
const quote = await marketService.getStockQuote('AAPL');
console.log(quote.price); // Precio actual

// Obtener velas históricas
const candles = await marketService.getStockCandles(
  'AAPL',
  '60',        // resolución: 1, 5, 15, 60, 240
  1704067200,  // desde (timestamp)
  1704153600   // hasta (timestamp)
);

// Suscribirse a actualizaciones en tiempo real (WebSocket)
const unsubscribe = marketService.subscribeToStock('AAPL', (quote) => {
  console.log('Nuevo precio:', quote.price);
});

// Desuscribirse cuando termines
unsubscribe();
```

### Ejemplo 3: Obtener noticias

```typescript
// Obtener noticias sobre Bitcoin
const news = await marketService.getNews('Bitcoin', 10);
news.forEach(article => {
  console.log(article.title);
  console.log(article.sentiment); // positive, negative, neutral
});

// Obtener titulares de negocios
const headlines = await marketService.getHeadlines('business', 5);
```

### Ejemplo 4: Indicadores técnicos

```typescript
// Obtener datos históricos
const candles = await marketService.getCandles('AAPL', 'daily', 100);

// Obtener indicador técnico (SMA, RSI, MACD, etc.)
const rsi = await marketService.getTechnicalIndicator(
  'AAPL',
  'RSI',           // Indicador
  '60min',         // Intervalo
  14               // Periodo
);
```

### Ejemplo 5: Uso de Cache

```typescript
// Guardar datos en cache
marketService.setCachedData('my_key', { data: 'value' }, 30000); // 30 segundos

// Obtener datos del cache
const cached = marketService.getCachedData('my_key');

// Limpiar cache específico
marketService.deleteCachedData('my_key');

// Limpiar todo el cache
marketService.clearCache();
```

---

## Límites de Rate Limit

| API | Plan Gratuito | Mejoras |
|-----|---------------|---------|
| CoinGecko | Ilimitado | - |
| Finnhub | 60 calls/min | Upgrade a Pro |
| NewsAPI | 100 requests/día | Upgrade a Premium |
| Alpha Vantage | 5 calls/min | Upgrade a Premium |

**Estrategia de caching incluida para respetar límites:**
- Datos actualizados se cachean automáticamente
- TTL configurables por tipo de dato
- Fallback a datos cacheados cuando sea posible

---

## Monedas Soportadas en CoinGecko

```
bitcoin, ethereum, cardano, solana, ripple,
dogecoin, litecoin, polygon, polkadot, 
avalanche-2, uniswap, chainlink, stellar
```

**Completa lista en:** https://api.coingecko.com/api/v3/coins/list

---

## Resoluciones de Candles en Finnhub

```
1       = 1 minuto
5       = 5 minutos
15      = 15 minutos
30      = 30 minutos
60      = 1 hora
D       = Diario
W       = Semanal
M       = Mensual
```

---

## Indicadores Técnicos en Alpha Vantage

```
SMA     = Simple Moving Average
EMA     = Exponential Moving Average
WMA     = Weighted Moving Average
DEMA    = Double Exponential Moving Average
TEMA    = Triple Exponential Moving Average
TRIMA   = Triangular Moving Average
KAMA    = Kaufman Adaptive Moving Average
T3      = T3 Moving Average
MACD    = Moving Average Convergence Divergence
STOCH   = Stochastic Oscillator
RSI     = Relative Strength Index
BBANDS  = Bollinger Bands
AD      = Accumulation/Distribution
OBV     = On-Balance Volume
ATR     = Average True Range
```

**Uso:**
```typescript
const rsi = await marketService.getTechnicalIndicator('AAPL', 'RSI');
const macd = await marketService.getTechnicalIndicator('AAPL', 'MACD');
const bbands = await marketService.getTechnicalIndicator('AAPL', 'BBANDS');
```

---

## Manejo de Errores

```typescript
try {
  const price = await marketService.getCoinPrice('bitcoin');
  console.log(price);
} catch (error) {
  if (error.message.includes('Rate limit')) {
    console.error('Límite de rate alcanzado');
  } else if (error.message.includes('not found')) {
    console.error('Moneda/activo no encontrado');
  } else {
    console.error('Error:', error.message);
  }
}
```

---

## Testing en Desarrollo

### Test de Conexión

```typescript
// En app/page.tsx o un componente de prueba

useEffect(() => {
  const test = async () => {
    try {
      // Test CoinGecko
      const btc = await marketService.getCoinPrice('bitcoin');
      console.log('✓ CoinGecko:', btc.price);

      // Test Finnhub
      const aapl = await marketService.getStockQuote('AAPL');
      console.log('✓ Finnhub:', aapl.price);

      // Test NewsAPI
      const news = await marketService.getNews('Bitcoin', 1);
      console.log('✓ NewsAPI:', news.length, 'noticias');

      // Test Alpha Vantage
      const candles = await marketService.getCandles('AAPL', 'daily', 1);
      console.log('✓ Alpha Vantage:', candles.length, 'velas');
    } catch (error) {
      console.error('✗ Error:', error.message);
    }
  };

  test();
}, []);
```

---

## Troubleshooting

### Error: "API Key is invalid"
- Verifica que tu API Key sea correcta
- Asegúrate de que esté en `.env.local`
- Reinicia el servidor de desarrollo

### Error: "Rate limit exceeded"
- El servicio cachea automáticamente
- Aumenta el TTL de cache
- Espera unos segundos antes de reintentar

### Error: "401 Unauthorized"
- Verifica que la API Key sea válida
- Que esté activa en el dashboard de la API

### Las APIs no se cargan
- Verifica que `.env.local` exista
- Que tengas las API Keys correctas
- Revisa la consola del navegador (F12)

---

## Próximos Pasos

1. ✅ Crea el archivo `.env.local` con tus API Keys
2. ✅ Importa `marketService` en tus componentes
3. ✅ Comienza a usar las APIs
4. ✅ Actualiza los datos en la aplicación en tiempo real

---

## Recursos Útiles

- CoinGecko API: https://www.coingecko.com/en/api/documentation
- Finnhub API: https://finnhub.io/docs/api
- NewsAPI: https://newsapi.org/docs
- Alpha Vantage: https://www.alphavantage.co/documentation/

---

**¡Felicidades! Ahora tu aplicación TradingIA puede conectarse a APIs reales de datos financieros.** 🚀

