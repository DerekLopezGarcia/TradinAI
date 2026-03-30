# 🏗️ ARQUITECTURA REFACTORIZADA - Data Providers

## Cambios Realizados

Se ha refactorizado completamente la arquitectura de obtención de datos para ser **modular, escalable y fácil de mantener**.

---

## 📊 Estructura Anterior (Monolítica)

```
route.ts (491 líneas)
├── detectAssetType()
├── getTwelveDataCandles()
├── getYahooFinanceCandles()
├── getCoinGeckoCandles()
├── getForexCandles()
├── getCommoditiesCandles()
└── GET handler (lógica mezclada)
```

**Problemas:**
- ❌ Difícil agregar nuevos proveedores
- ❌ Código duplicado en cada proveedor
- ❌ Lógica de fallback hardcodeada
- ❌ Difícil de testear
- ❌ Acoplamiento fuerte

---

## 🏗️ Nueva Arquitectura (Modular)

```
dataProviderFactory.ts (IDataProvider interface)
├── AssetType
├── CandleData
├── DataProviderResult
├── DataProviderManager
└── Configuración centralizada

dataProviders.ts (Implementaciones)
├── BinanceProvider
├── TwelveDataProvider
├── YahooFinanceProvider
├── QuandlProvider
├── CoinGeckoProvider
└── registerDefaultProviders()

route.ts (Limpio y simple)
├── Inicializar proveedores
├── Detectar tipo de activo
├── Delegar a DataProviderManager
└── Retornar resultado
```

---

## 🎯 Beneficios

### 1. **Escalabilidad**
✅ Agregar nuevo proveedor = crear una clase que implemente `IDataProvider`
✅ No requiere cambios en `route.ts`
✅ Registración automática en `registerDefaultProviders()`

### 2. **Mantenibilidad**
✅ Cada proveedor es independiente (Single Responsibility)
✅ Configuración centralizada en `dataProviderFactory.ts`
✅ Código limpio y legible en `route.ts`

### 3. **Flexibilidad**
✅ Sistema de prioridades automático
✅ Fallback automático entre proveedores
✅ Timeout centralizado (10 segundos)

### 4. **Debuggabilidad**
✅ Logs claros de qué proveedor se usa
✅ Fácil identificar qué proveedor falla
✅ Mejor trazabilidad de errores

---

## 📝 Cómo Agregar un Nuevo Proveedor

### Ejemplo: Agregar proveedor "Finnhub"

```typescript
// 1. Crear clase en dataProviders.ts
export class FinnhubProvider implements IDataProvider {
  name = 'Finnhub';
  priority = 85;
  supportsTypes: AssetType[] = ['stock'];
  supportsSymbols = SYMBOL_CONFIG.stock;

  private apiKey = process.env.FINNHUB_API_KEY;

  canHandle(symbol: string, type: AssetType): boolean {
    return type === 'stock' && this.apiKey && this.supportsSymbols.has(symbol);
  }

  async fetch(symbol: string, interval: string): Promise<CandleData[]> {
    // Implementación específica de Finnhub
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKey}`
    );
    // ... procesar respuesta
  }
}

// 2. Registrar en registerDefaultProviders()
export function registerDefaultProviders() {
  const { providerManager } = require('./dataProviderFactory');
  
  // ... otros proveedores
  providerManager.register(new FinnhubProvider());
}
```

---

## ⚙️ Flujo de Ejecución

```
GET /api/market/candles?symbol=BTCUSD&interval=1h
  ↓
1. Validar entrada
  ↓
2. Detectar tipo de activo: crypto
  ↓
3. Inicializar proveedores (una sola vez)
  ↓
4. providerManager.fetchFromProviders()
  ├─ Obtener lista de proveedores para (crypto)
  │  └─ [BinanceProvider, CoinGeckoProvider]
  │
  ├─ Intentar BinanceProvider (prioridad 100)
  │  ├─ Timeout: 10 segundos
  │  ├─ ✅ Éxito → retornar resultado
  │  └─ ❌ Fallo → siguiente proveedor
  │
  └─ Intentar CoinGeckoProvider (prioridad 80)
     ├─ Timeout: 10 segundos
     ├─ ✅ Éxito → retornar resultado
     └─ ❌ Fallo → retornar 404

5. Retornar JSON con:
   - candles: []
   - source: "Binance" (qué proveedor lo devolvió)
   - isFallback: false (si fue proveedor principal)
```

---

## 📊 Configuración Centralizada

Todos los mapeos de símbolos están en `SYMBOL_MAPPINGS`:

```typescript
const SYMBOL_MAPPINGS = {
  twelveData: { 'SPX': '^GSPC', ... },
  yahooFinance: { 'SPX': '^GSPC', ... },
  coinGecko: { 'BTCUSD': 'bitcoin', ... },
  quandl: { 'GOLD': 'LBMA/GOLD', ... }
};
```

**Ventajas:**
- ✅ Un único lugar para cambiar mapeos
- ✅ Fácil agregar soporte para nuevos símbolos
- ✅ No hardcodear en cada proveedor

---

## 🔧 Configuración de Prioridades

Cada proveedor tiene una prioridad que determina el orden de intento:

```typescript
BinanceProvider:      priority = 100  // ⭐ Máxima para crypto
TwelveDataProvider:   priority = 90   // ⭐ Máxima para stocks
YahooFinanceProvider: priority = 70   // Fallback
CoinGeckoProvider:    priority = 80   // Fallback crypto
```

Para cambiar prioridades, modificar el valor `priority` en cada clase.

---

## 🧪 Testabilidad

Ahora es fácil testear cada proveedor independientemente:

```typescript
// Test para BinanceProvider
describe('BinanceProvider', () => {
  const provider = new BinanceProvider();
  
  it('should fetch crypto candles', async () => {
    const candles = await provider.fetch('BTCUSD', '1h');
    expect(candles.length).toBeGreaterThan(0);
  });
  
  it('should reject non-crypto symbols', () => {
    expect(provider.canHandle('AAPL', 'stock')).toBe(false);
  });
});
```

---

## 📈 Próximos Pasos

1. **Agregar más proveedores**: Finnhub, Alpha Vantage, etc.
2. **Caching**: Implementar capa de caché entre DataProviderManager y proveedores
3. **Métricas**: Rastrear qué proveedor fue más rápido/confiable
4. **Rate limiting**: Respetar límites de API por proveedor
5. **Health checks**: Monitorear disponibilidad de proveedores

---

## 🚀 Resultado

**Antes:**
- Agregar proveedor = modificar route.ts (491 líneas)
- 200+ líneas de mapeos hardcodeados
- Lógica de fallback acoplada

**Después:**
- Agregar proveedor = crear 1 clase (~40 líneas)
- Mapeos centralizados y fáciles de actualizar
- Fallback automático y configurável
- route.ts: 70 líneas (limpio y legible)

---

## 📞 Soporte

Para problemas o preguntas sobre la nueva arquitectura:
- Revisar `dataProviderFactory.ts` para interfaz
- Revisar `dataProviders.ts` para ejemplos
- Seguir el patrón de un proveedor existente

