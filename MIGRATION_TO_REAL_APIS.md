# Guía: Reemplazar Datos Mock con APIs Reales

## 📋 Resumen

Esta guía te muestra cómo actualizar tus componentes existentes para usar datos reales de las APIs en lugar de datos simulados.

---

## 🎯 Componentes a Actualizar

### 1. Header.tsx - Selector de Activos con Precios Reales

**Antes (con datos mock):**
```typescript
export function Header() {
  const { selectedAsset, setSelectedAsset } = useMarketStore();

  return (
    <header>
      <div>
        <span>{selectedAsset.symbol}</span>
        <span>${selectedAsset.price.toFixed(2)}</span>
      </div>
    </header>
  );
}
```

**Después (con API real):**
```typescript
'use client';

import { useStockQuote, useCoinPrice } from '@/app/hooks/useMarketAPI';
import { useMarketStore } from '@/lib/store';

export function Header() {
  const { selectedAsset, setSelectedAsset } = useMarketStore();

  // Detectar si es crypto o stock
  const isCrypto = selectedAsset.type === 'crypto';
  
  // Obtener datos reales
  const { data: cryptoPrice } = useCoinPrice(
    isCrypto ? selectedAsset.symbol.toLowerCase() : null,
    isCrypto
  );
  
  const { data: stockQuote } = useStockQuote(
    !isCrypto ? selectedAsset.symbol : null,
    !isCrypto
  );

  // Usar datos reales o fallback a store
  const price = isCrypto ? cryptoPrice?.price : stockQuote?.price;
  const change = isCrypto ? cryptoPrice?.priceChangePercentage24h : stockQuote?.changePercent;

  return (
    <header className="glass sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">{selectedAsset.symbol}</h1>
            <p className="text-xs text-muted-foreground">{selectedAsset.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Precio Actual</p>
            <p className="text-2xl font-bold">
              ${price ? price.toFixed(2) : 'Cargando...'}
            </p>
          </div>
          
          {change !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Cambio 24h</p>
              <p className={`text-2xl font-bold ${change >= 0 ? 'text-primary' : 'text-secondary'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

---

### 2. Charts.tsx - Gráficos con Datos Reales

**Antes (con datos mock):**
```typescript
export function PriceChart() {
  const { selectedAsset, selectedTimeframe } = useMarketStore();
  const { data, loading } = useMarketData(selectedAsset.symbol, selectedTimeframe);

  return <Chart data={data} />;
}
```

**Después (con API real):**
```typescript
'use client';

import { useStockCandles } from '@/app/hooks/useMarketAPI';
import { useMarketStore } from '@/lib/store';

export function PriceChart() {
  const { selectedAsset, selectedTimeframe } = useMarketStore();
  const isCrypto = selectedAsset.type === 'crypto';

  // Calcular timestamps
  const now = Math.floor(Date.now() / 1000);
  const timeframeSeconds = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
    '1w': 604800,
  };

  const duration = timeframeSeconds[selectedTimeframe] * 60; // 60 barras
  const from = now - duration;

  // Obtener datos reales de stocks
  const { data: candleData, loading, error } = useStockCandles(
    selectedAsset.symbol,
    selectedTimeframe,
    from,
    now,
    !isCrypto // Habilitado solo para stocks
  );

  if (loading) {
    return <div className="card-glass h-96 flex items-center justify-center">
      <Loader className="animate-spin" />
    </div>;
  }

  if (error) {
    return <div className="card-glass p-4 text-secondary">Error: {error}</div>;
  }

  return (
    <div className="card-glass">
      <PriceChart data={candleData || []} symbol={selectedAsset.symbol} />
    </div>
  );
}
```

---

### 3. NewsFeed.tsx - Noticias Reales

**Antes (con datos mock):**
```typescript
export function NewsFeed({ symbol }) {
  const news = symbol ? getNewsByAsset(symbol) : MOCK_NEWS;

  return (
    <div>
      {news.map(article => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

**Después (con API real):**
```typescript
'use client';

import { useNews } from '@/app/hooks/useMarketAPI';

export function NewsFeed({ symbol }) {
  const { data: news, loading, error } = useNews(symbol || 'Bitcoin', 10, !!symbol);

  if (loading) {
    return <div className="card-glass">Cargando noticias...</div>;
  }

  if (error) {
    return <div className="card-glass text-secondary">Error: {error}</div>;
  }

  if (!news || news.length === 0) {
    return <div className="card-glass text-muted-foreground">Sin noticias disponibles</div>;
  }

  return (
    <div className="card-glass">
      <h2 className="text-lg font-bold mb-4">Noticias de {symbol}</h2>
      <div className="space-y-3">
        {news.map(article => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-muted/10 hover:bg-muted/20 rounded-lg transition-colors"
          >
            <h3 className="font-semibold text-sm">{article.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{article.description}</p>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-muted-foreground">{article.source}</span>
              <span className={`px-2 py-1 rounded font-semibold ${
                article.sentiment === 'positive' ? 'bg-primary/20 text-primary' :
                article.sentiment === 'negative' ? 'bg-secondary/20 text-secondary' :
                'bg-muted/20 text-muted-foreground'
              }`}>
                {article.sentiment}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

---

### 4. AIChat.tsx - Análisis con Datos Reales

**Antes (con datos simulados):**
```typescript
export function AnalysisCard({ symbol, timeframe }) {
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    // Analizar datos mock
    const mockAnalysis = generateMockAIAnalysis(symbol, 'bullish');
    setAnalysis(mockAnalysis);
  };

  return (
    <div>
      <button onClick={handleAnalyze}>Analizar Gráfico</button>
      {analysis && <AnalysisResult data={analysis} />}
    </div>
  );
}
```

**Después (con datos reales):**
```typescript
'use client';

import { useStockCandles, useTechnicalIndicator } from '@/app/hooks/useMarketAPI';
import { marketService } from '@/lib/services/marketService';

export function AnalysisCard({ symbol, timeframe }) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Obtener datos reales
  const now = Math.floor(Date.now() / 1000);
  const from = now - (86400 * 30); // 30 días
  
  const { data: candles } = useStockCandles(symbol, timeframe, from, now);
  const { data: rsi } = useTechnicalIndicator(symbol, 'RSI', timeframe);

  const handleAnalyze = async () => {
    if (!candles || candles.length === 0) {
      toast.error('No hay datos del gráfico');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Enviar datos reales a la API de análisis
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          chartData: candles,
          indicators: [
            {
              type: 'RSI',
              values: Object.values(rsi || {}),
            },
          ],
        }),
      });

      const data = await response.json();
      setAnalysis(data);
      toast.success('Análisis completado');
    } catch (error) {
      toast.error('Error en el análisis');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="card-glass">
      <h2 className="text-lg font-bold mb-4">{symbol} - Análisis de IA</h2>
      
      {analysis ? (
        <AnalysisResult data={analysis} />
      ) : (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="btn-primary w-full"
        >
          {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
        </button>
      )}
    </div>
  );
}
```

---

### 5. Sidebar - Lista de Activos con Precios Reales

**Antes (con datos mock):**
```typescript
export function Sidebar() {
  const { assets } = useMarketStore();

  return (
    <aside>
      {assets.map(asset => (
        <div key={asset.id}>
          <p>{asset.symbol}</p>
          <p>${asset.price.toFixed(2)}</p>
          <p>{asset.changePercent.toFixed(2)}%</p>
        </div>
      ))}
    </aside>
  );
}
```

**Después (con APIs reales):**
```typescript
'use client';

import { useCoinPrices } from '@/app/hooks/useMarketAPI';
import { useMarketStore } from '@/lib/store';

export function Sidebar() {
  const { assets, selectedAsset, setSelectedAsset } = useMarketStore();
  
  // Separar criptos y stocks
  const cryptoAssets = assets.filter(a => a.type === 'crypto');
  const stockAssets = assets.filter(a => a.type === 'stock');

  // Obtener precios de criptos
  const { data: cryptoPrices } = useCoinPrices(
    cryptoAssets.map(a => a.symbol.toLowerCase()),
    cryptoAssets.length > 0
  );

  // Mapear precios a activos
  const priceMap = new Map(
    cryptoPrices.map(price => [price.symbol, price])
  );

  return (
    <aside className="w-64 border-r border-muted/30">
      <div className="p-6">
        {/* Favoritos */}
        <h3 className="font-bold text-sm mb-4">Favoritos</h3>
        <div className="space-y-2 mb-6">
          {assets.filter(a => a.isFavorite).map(asset => {
            const realPrice = priceMap.get(asset.symbol.toLowerCase());
            
            return (
              <AssetButton
                key={asset.id}
                asset={asset}
                realPrice={realPrice}
                isSelected={selectedAsset?.id === asset.id}
                onClick={() => setSelectedAsset(asset)}
              />
            );
          })}
        </div>

        {/* Todos los activos */}
        <h3 className="font-bold text-sm mb-4">Todos</h3>
        <div className="space-y-2">
          {assets.map(asset => {
            const realPrice = priceMap.get(asset.symbol.toLowerCase());
            
            return (
              <AssetButton
                key={asset.id}
                asset={asset}
                realPrice={realPrice}
                isSelected={selectedAsset?.id === asset.id}
                onClick={() => setSelectedAsset(asset)}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function AssetButton({ asset, realPrice, isSelected, onClick }) {
  const price = realPrice?.price || asset.price;
  const changePercent = realPrice?.priceChangePercentage24h || asset.changePercent;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
        isSelected ? 'bg-primary/20 border border-primary' : 'hover:bg-muted/10'
      }`}
    >
      <div className="flex justify-between">
        <span className="font-semibold text-sm">{asset.symbol}</span>
        <span className={changePercent >= 0 ? 'text-primary' : 'text-secondary'}>
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground">${price.toFixed(2)}</p>
    </button>
  );
}
```

---

## 📋 Checklist de Actualización

- [ ] Actualiza `Header.tsx` con datos reales de precios
- [ ] Actualiza `Charts.tsx` con datos de Finnhub
- [ ] Actualiza `NewsFeed.tsx` con datos de NewsAPI
- [ ] Actualiza `AnalysisCard.tsx` con análisis real
- [ ] Actualiza `Sidebar.tsx` con precios en tiempo real
- [ ] Configura variables de entorno (`.env.local`)
- [ ] Prueba cada componente
- [ ] Verifica que no hay errores en consola
- [ ] Compila el proyecto (`npm run build`)
- [ ] Despliega a producción

---

## ⚙️ Configuración Recomendada

### `.env.local`
```env
# APIs
NEXT_PUBLIC_FINNHUB_KEY=tu_key
NEXT_PUBLIC_NEWSAPI_KEY=tu_key
NEXT_PUBLIC_ALPHAVANTAGE_KEY=tu_key

# Habilitar/Deshabilitar
NEXT_PUBLIC_COINGECKO_ENABLED=true
NEXT_PUBLIC_FINNHUB_ENABLED=true
NEXT_PUBLIC_NEWSAPI_ENABLED=true
NEXT_PUBLIC_ALPHAVANTAGE_ENABLED=true

# Cache TTL (en milisegundos)
NEXT_PUBLIC_API_CACHE_TTL=60000
```

---

## 🧪 Testing

### Verificar que funciona

```typescript
// En tu componente de prueba
useEffect(() => {
  const test = async () => {
    try {
      // Test CoinGecko
      const btc = await marketService.getCoinPrice('bitcoin');
      console.log('✓ Bitcoin:', btc.price);

      // Test Finnhub
      const aapl = await marketService.getStockQuote('AAPL');
      console.log('✓ AAPL:', aapl.price);

      // Test NewsAPI
      const news = await marketService.getNews('Bitcoin', 1);
      console.log('✓ News:', news.length);
    } catch (error) {
      console.error('✗ Error:', error.message);
    }
  };

  test();
}, []);
```

---

## 🚀 Deployment

### Antes de desplegar

1. ✅ Verifica que todos los datos se cargan correctamente
2. ✅ Compila sin errores: `npm run build`
3. ✅ Prueba en modo producción: `npm start`
4. ✅ Añade variables de entorno al servidor
5. ✅ Monitorea la consola del navegador

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| "API Key is invalid" | Verifica la key en `.env.local` |
| "Data is undefined" | Espera a que `loading` sea false |
| "Rate limit exceeded" | Aumenta el TTL de cache |
| "CORS error" | Usa Server Components |
| "Precios no actualizan" | Revisa que el hook se está ejecutando |

---

## 📚 Recursos

- Documentación: `API_INTEGRATION_GUIDE.md`
- Configuración: `API_CONFIGURATION.md`
- Componentes demo: `components/APIDemo.tsx`

---

¡Felicidades! Tu aplicación ahora está usando **datos reales de APIs financieras.** 🎉


