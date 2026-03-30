# 🔧 EJEMPLO PRÁCTICO: Agregar Finnhub como Proveedor

Este archivo muestra paso a paso cómo agregar un nuevo proveedor de datos.

## Escenario

Queremos agregar **Finnhub** como proveedor alternativo para stocks, con prioridad 85 (entre Twelve Data 90 y Yahoo Finance 70).

---

## Paso 1: Crear Clase Proveedor

En `lib/services/dataProviders.ts`, agregamos al final:

```typescript
// ============================================================================
// PROVEEDOR: FINNHUB (Stocks alternativo)
// ============================================================================

export class FinnhubProvider implements IDataProvider {
  name = 'Finnhub';
  priority = 85; // Entre Twelve Data (90) y Yahoo Finance (70)
  supportsTypes: AssetType[] = ['stock'];
  supportsSymbols = SYMBOL_CONFIG.stock;

  private apiKey = process.env.FINNHUB_API_KEY;

  canHandle(symbol: string, type: AssetType): boolean {
    return !!(this.apiKey && type === 'stock' && this.supportsSymbols.has(symbol));
  }

  async fetch(symbol: string, _interval: string): Promise<CandleData[]> {
    if (!this.apiKey) return [];

    try {
      // Usar API de candles de Finnhub
      // https://finnhub.io/docs/api/quote
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );

      if (!response.ok) {
        console.warn(`⚠️ Finnhub HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();

      // Finnhub devuelve precio actual, pero podemos obtener candles históricos
      // con otro endpoint si es necesario
      if (!data.c || isNaN(data.c)) {
        console.warn(`⚠️ Finnhub: invalid price data`);
        return [];
      }

      // Para este ejemplo, creamos una vela con los datos actuales
      // En producción, usarías el endpoint de candles históricos
      const now = Date.now();
      const candle: CandleData = {
        time: now,
        open: data.o || data.c, // open
        high: data.h || data.c, // high
        low: data.l || data.c,  // low
        close: data.c,          // close
        volume: data.v || 0     // volume
      };

      return [candle];
    } catch (error) {
      console.error(`❌ Finnhub error: ${error}`);
      return [];
    }
  }
}
```

---

## Paso 2: Registrar el Proveedor

En `lib/services/dataProviders.ts`, modificar `registerDefaultProviders()`:

```typescript
export function registerDefaultProviders() {
  const { providerManager } = require('./dataProviderFactory');
  
  // Proveedores existentes
  providerManager.register(new BinanceProvider());
  providerManager.register(new TwelveDataProvider());
  
  // ← AGREGAR AQUÍ
  providerManager.register(new FinnhubProvider());
  
  // Más proveedores
  providerManager.register(new YahooFinanceProvider());
  providerManager.register(new QuandlProvider());
  providerManager.register(new CoinGeckoProvider());

  console.log('✅ Data providers registered');
}
```

---

## Paso 3: Configurar Variables de Entorno

En `.env.local`:

```
FINNHUB_API_KEY=your_finnhub_api_key_here
```

---

## Paso 4: Testear

1. **Compilar:**
```bash
npm run build
```

2. **Probar en desarrollo:**
```bash
npm run dev
```

3. **Hacer petición:**
```bash
curl "http://localhost:3000/api/market/candles?symbol=AAPL&interval=1h"
```

4. **Logs esperados:**
```
📊 /api/market/candles: AAPL (stock) [1h]
✅ Data providers registered
🔄 Attempting Twelve Data for AAPL...
⚠️ Twelve Data: sin vales para AAPL
🔄 Attempting Finnhub for AAPL...
✅ Finnhub: 1 candles for AAPL
✅ AAPL: 1 candles from Finnhub
```

---

## Paso 5: Optimizaciones (Opcional)

### Agregar soporte para históricos completos

```typescript
async fetch(symbol: string, interval: string): Promise<CandleData[]> {
  if (!this.apiKey) return [];

  try {
    // Para históricos completos, usar endpoint de candles
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${this._mapInterval(interval)}&from=${Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60}&to=${Math.floor(Date.now() / 1000)}&token=${this.apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) return [];
    const data = await response.json();

    if (!data.c || !Array.isArray(data.c)) return [];

    // Combinar arrays de OHLCV
    return data.t.map((time: number, idx: number) => ({
      time: time * 1000,
      open: data.o?.[idx] || 0,
      high: data.h?.[idx] || 0,
      low: data.l?.[idx] || 0,
      close: data.c?.[idx] || 0,
      volume: data.v?.[idx] || 0
    })).filter((c: any) => !isNaN(c.close) && c.close > 0);
  } catch (error) {
    console.error(`❌ Finnhub error: ${error}`);
    return [];
  }
}

private _mapInterval(interval: string): string {
  const map: Record<string, string> = {
    '1m': '1', '5m': '5', '15m': '15', '1h': '60', '4h': '240', '1d': 'D', '1w': 'W'
  };
  return map[interval] || 'D';
}
```

---

## Paso 6: Cambiar Prioridades

Si queremos que Finnhub se intente **antes** que Twelve Data:

```typescript
export class FinnhubProvider implements IDataProvider {
  name = 'Finnhub';
  priority = 95; // ← Cambiar de 85 a 95
  // ... resto igual
}
```

Ahora el orden será:
1. Twelve Data (90)
2. Finnhub (95) ← Primero
3. Yahoo Finance (70)

---

## 📊 Resultado

Después de estos 6 pasos, Finnhub está completamente integrado:

```
GET /api/market/candles?symbol=AAPL

┌──────────────────────────────────────┐
│   DataProviderManager                │
│   ├─ Twelve Data (90)                │
│   ├─ Finnhub (85) ← NUEVO            │
│   └─ Yahoo Finance (70)              │
└──────────────────────────────────────┘
```

El endpoint usará automáticamente Finnhub como fallback si Twelve Data falla.

---

## ✅ Checklist

- [ ] Crear clase que implemente `IDataProvider`
- [ ] Implementar `canHandle()`
- [ ] Implementar `fetch()`
- [ ] Establecer `priority` apropiadamente
- [ ] Registrar en `registerDefaultProviders()`
- [ ] Agregar variable de entorno en `.env.local`
- [ ] Compilar y testear
- [ ] Verificar logs de depuración

---

## 🐛 Debugging

Si el proveedor no se está usando:

1. **Verificar que está registrado:**
```typescript
// En route.ts, agregar:
console.log(providerManager.getProviders('AAPL', 'stock'));
// Debe incluir FinnhubProvider
```

2. **Verificar canHandle():**
```typescript
const provider = new FinnhubProvider();
console.log(provider.canHandle('AAPL', 'stock')); // ¿True?
```

3. **Verificar apiKey:**
```typescript
console.log(process.env.FINNHUB_API_KEY); // ¿Existe?
```

4. **Revisar timeout:**
```typescript
// Si el timeout es muy bajo, puede fallar
signal: AbortSignal.timeout(8000) // 8 segundos
```

---

## 📚 Más Ejemplos

Para más ejemplos de proveedores, ver:
- `BinanceProvider` - Crypto
- `TwelveDataProvider` - Stocks
- `QuandlProvider` - Commodities
- `CoinGeckoProvider` - Crypto fallback

Cada uno implementa `IDataProvider` de manera diferente según su API.

---

## 🎓 Conclusión

Con esta arquitectura, agregar Finnhub fue tan simple como:
1. Crear 1 clase (30 líneas)
2. Registrarla (1 línea)
3. Sin modificar route.ts ❌
4. Sin tocar otros proveedores ❌
5. Sin duplicar código ❌

**Eso es escalabilidad.** 🚀

