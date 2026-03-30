# AGENTS.md - Trading IA Codebase Guide (v2.0 - Arquitectura Escalable)

AI agents working on this codebase should understand the **professional scalable architecture**, data flows, patterns, and key workflows.

## 🏗️ Architecture Overview (v2.0)

**TradingIA v2.0** is a Next.js 16 + React 19 real-time financial market analysis platform with **professional scalable architecture** ready to grow from 10 to millions of users.

### Core Tech Stack
- **Frontend**: Next.js (App Router), React 19, TypeScript 5.5 (strict mode)
- **State**: Zustand (persistent) + React hooks (local)
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components (CVA)
- **Charts**: Lightweight-charts + Recharts
- **Data Sources**: Binance, Twelve Data, Yahoo Finance, CoinGecko, Quandl
- **AI**: Custom technical analysis engine (candleAnalysisService)
- **Architecture**: Factory Pattern, Strategy Pattern, Repository Pattern, Observer Pattern

### Layered Architecture (Scalable)

```
LAYER 5: Pages & Routes
├── app/page.tsx          # Main dashboard
├── app/api/*/route.ts    # Endpoints (no business logic)
└── components/           # UI only (no business logic)
                ↓
LAYER 4: React Hooks (Reutilizables)
├── useAsync()            # Genérico para operaciones async
├── useLocalStorage()     # Persistencia en localStorage
├── useMarketData()       # Datos de mercado (usa useAsync)
├── useAutoAnalysis()     # Análisis (usa useAsync)
└── useScannerPrice...()  # Actualizaciones de precios
                ↓
LAYER 3: Services (Heredan de BaseService)
├── BinanceProvider       # Proveedor de datos Binance
├── TwelveDataProvider    # Proveedor de stocks
├── YahooFinanceProvider  # Fallback para stocks/índices
├── QuandlProvider        # Proveedor de commodities
├── CoinGeckoProvider     # Fallback para crypto
├── candleAnalysisService # Análisis técnico
└── assetScannerService   # Scanner de activos
                ↓
LAYER 2: Core Services (Base Classes)
├── BaseService           # Clase base con logger, cache, retry
├── MemoryCacheService    # Cache en memoria con TTL
├── SimpleStateManager    # Gestor de estado local
├── SimpleEventBus        # Bus de eventos
├── InMemoryRepository    # Repositorio genérico
└── ConsoleLogger         # Logger centralizado
                ↓
LAYER 1: Core Abstraction (Interfaces & Patterns)
├── architecture.ts       # Interfaces, tipos, patrones
├── config.ts             # Configuración centralizada
└── services.ts           # Implementaciones base
```

### Directory Structure (Actualizada)

```
lib/
├── core/                           🆕 NUEVA CAPA BASE
│   ├── architecture.ts            # Interfaces, patrones, funciones helper
│   ├── config.ts                  # Configuración centralizada del proyecto
│   └── services.ts                # Servicios base implementados
│
├── services/                      # Servicios específicos (heredan de BaseService)
│   ├── dataProviders.ts           # Implementaciones de proveedores
│   ├── dataProviderFactory.ts     # Factory para proveedores
│   ├── candleAnalysisService.ts   # Análisis técnico
│   ├── assetScannerService.ts     # Scanner de activos
│   ├── binanceService.ts          # Integración Binance
│   ├── marketService.ts           # Datos de mercado
│   ├── validationService.ts       # Validación de entrada
│   ├── newsService.ts             # Feed de noticias
│   ├── priceCache.ts              # Caché de precios
│   └── market*Service.ts          # Otros servicios
│
├── store.ts                       # Zustand store (estado global)
├── types.ts                       # Tipos e interfaces
├── indicators.ts                  # Indicadores técnicos
└── mockData.ts                    # Datos mock

app/
├── hooks/                         # Hooks React (reutilizables)
│   ├── useAsync.ts               # 🆕 Hook genérico para async
│   ├── useMarketData.ts          # (usa useAsync internamente)
│   ├── useAutoAnalysis.ts        # (usa useAsync internamente)
│   ├── useDailyRecommendations.ts # (usa useAsync internamente)
│   └── useScannerPriceRefresh.ts  # (usa useAsync internamente)
│
├── api/
│   ├── market/route.ts
│   ├── market/candles/route.ts    # 🔄 Refactorizado con Data Provider Factory
│   └── ai/route.ts
│
├── page.tsx                       # Dashboard principal
└── layout.tsx                     # Layout raíz
```

## 🎯 Patrones de Arquitectura Implementados

### 1. Factory Pattern (Data Providers)
Permite agregar nuevos proveedores sin modificar código existente:
```typescript
// lib/services/dataProviderFactory.ts
interface IDataProvider {
  name: string;
  priority: number;
  canHandle(symbol, type): boolean;
  fetch(symbol, interval): Promise<CandleData[]>;
}

// lib/services/dataProviders.ts
class BinanceProvider implements IDataProvider { ... }
class TwelveDataProvider implements IDataProvider { ... }
class YahooFinanceProvider implements IDataProvider { ... }
```
**Ventaja**: Agregar proveedor = 5 minutos, sin refactorizar nada

### 2. Strategy Pattern (Services)
Cada servicio implementa su estrategia específica:
```typescript
// lib/core/services.ts
export abstract class BaseService {
  protected executeWithRetry() { ... }
  protected getCachedOrExecute() { ... }
  protected formatResponse() { ... }
}

// lib/services/candleAnalysisService.ts
export class CandleAnalysisService extends BaseService { ... }
```
**Ventaja**: Logger, cache, retry automáticos

### 3. Repository Pattern
Acceso a datos genérico y testeable:
```typescript
interface Repository<T, ID> {
  getById(id: ID): Promise<T | null>;
  getAll(): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: ID, updates: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  query(predicate: (item: T) => boolean): Promise<T[]>;
}
```

### 4. Observer Pattern (Event Bus)
Comunicación reactiva entre módulos:
```typescript
const eventBus = new SimpleEventBus();
eventBus.subscribe('market:price', (data) => console.log(data));
eventBus.publish('market:price', { symbol: 'BTCUSD', price: 42000 });
```

### 5. Hook Patterns (React)
Hooks reutilizables que manejan todo automáticamente:
```typescript
// useAsync: Hook genérico para cualquier operación async
const { data, loading, error, execute } = useAsync(
  () => myService.fetch(),
  { retry: 3, onSuccess: (data) => console.log(data) }
);

// useLocalStorage: Sincronización automática
const [value, setValue] = useLocalStorage('key', defaultValue);

// useDebounce: Debounce automático
const debouncedValue = useDebounce(searchQuery, 300);
```

## 🔄 Key Data Flows (Actualizados)

### 1. Manual Analysis Flow (Refactorizado con Hooks Base)
```
User clicks "⚡ Ejecutar Análisis"
↓
useAutoAnalysis() hook (usa useAsync internamente)
↓
analyzeCandles() [candleAnalysisService extends BaseService]
  ├─ executeWithRetry() - Automático retry con backoff
  ├─ getCachedOrExecute() - Automático caching con TTL
  ├─ Logger centralizado automático
  └─ Análisis técnico completo
↓
AutoAnalysisDisplay renderiza resultados
```

### 2. Market Data Flow (Con Factory Pattern)
```
useMarketData hook
  ↓
/api/market/candles endpoint
  ↓
providerManager.fetchFromProviders()
  ├─ Obtener lista de proveedores para symbol+type
  ├─ Intentar TwelveDataProvider (priority 90)
  ├─ Si falla → Intentar YahooFinanceProvider (priority 70)
  ├─ Si falla → Intentar CoinGeckoProvider (priority 80)
  └─ Si falla → Retorna 404
```

### 3. Asset Scanning Flow (Con Caché + Retry)
```
useDailyRecommendations hook (usa useAsync)
  ↓
assetScannerService (extends BaseService)
  ├─ getCachedOrExecute() - Caché 4 horas
  ├─ executeWithRetry() - 3 intentos automáticos
  └─ Analiza 256+ activos
```

## 🎯 Critical Patterns & Conventions

### Crear Nuevo Servicio (5 minutos)
```typescript
// lib/services/myService.ts
import { BaseService } from '@/lib/core/services';

export class MyService extends BaseService {
  constructor() {
    super('myModule');  // Logger + cache automáticos
  }

  async fetchData() {
    // executeWithRetry + getCachedOrExecute automáticos
    return this.getCachedOrExecute(
      'key',
      () => this.executeWithRetry(() => api.call(), 'fetch')
    );
  }
}
```
**Automático:**
- ✅ Logger (ConsoleLogger)
- ✅ Retry (3 intentos con backoff exponencial)
- ✅ Cache (TTL configurable)

### Crear Nuevo Hook (3 minutos)
```typescript
// app/hooks/useMyFeature.ts
import { useAsync } from './useAsync';

export function useMyFeature() {
  return useAsync(
    () => myService.fetch(),
    { retry: 3, onSuccess: (data) => console.log(data) }
  );
}
```
**Automático:**
- ✅ Estado (data, loading, error, isSuccess)
- ✅ Retry con backoff
- ✅ Manejo de errores

### Configuración Centralizada
```typescript
// lib/core/config.ts
MODULE_CONFIGS['myModule'] = {
  enabled: true,
  timeout: 10000,
  retries: 3,
  cache: { ttl: 60000, key: 'mymodule' }
};

// Obtener en cualquier lugar
const config = getModuleConfig('myModule');
```

### Data Validation (Obligatorio)
```typescript
import { validateSymbol } from '@/lib/services/validationService';

// ❌ WRONG
const data = await fetch(`/api/market?symbol=${userInput}`);

// ✅ CORRECT
if (!validateSymbol(userInput)) throw new Error('Invalid symbol');
const params = createSafeParams({ symbol: userInput });
const data = await fetch(`/api/market?${params.toString()}`);
```

### Zustand Store Pattern
Global state in `lib/store.ts`:
```typescript
const { selectedAsset, selectedTimeframe, setSelectedTimeframe, updateAssetPrice } = useMarketStore();

// Store is persistent (localStorage) for selected asset/timeframe
// Updates trigger React re-renders automatically
```

### Indicator Calculations (Immutable)
In `lib/indicators.ts`, all functions return NEW arrays (immutable):
```typescript
calculateSMA(prices, 50)    // Returns number[]
calculateRSI(closes, 14)    // Returns number[] with NaN for period < 14
calculateMACD(closes)       // Returns { macd, signal, histogram }
```
**Key**: RSI uses Wilder smoothing (standard), first `period` values are NaN.

### API Rate Limiting Strategy
- Binance: 1200 requests/min (managed via PriceCache batch system)
- Request batching in `priceCache.ts`: queue symbols, process 10/batch every 500ms
- Caching: 60s TTL for market data, 4h for recommendations

### Component Hydration
Use `suppressHydrationWarning` on `<html>` due to theme provider (SSR mismatch):
```typescript
<html lang="es" suppressHydrationWarning>
```

## 📋 Essential Files to Understand

### Core Abstraction Layer (NUEVA - v2.0)
| File | Lines | Purpose |
|------|-------|---------|
| `lib/core/architecture.ts` | 500+ | Interfaces, patrones base, funciones helper |
| `lib/core/config.ts` | 350+ | Configuración centralizada del proyecto |
| `lib/core/services.ts` | 440+ | BaseService, Logger, Cache, Repository |

### React Hooks Layer (NUEVA - v2.0)
| File | Lines | Purpose |
|------|-------|---------|
| `app/hooks/useAsync.ts` | 440+ | 12+ hooks reutilizables para async |

### Services Layer
| File | Lines | Purpose |
|------|-------|---------|
| `lib/services/dataProviders.ts` | 200+ | 5 proveedores (Binance, Twelve Data, Yahoo, Quandl, CoinGecko) |
| `lib/services/dataProviderFactory.ts` | 150+ | Factory + Manager para proveedores |
| `lib/services/candleAnalysisService.ts` | 900+ | Análisis técnico completo |
| `lib/services/binanceService.ts` | 200+ | Integración Binance con caching |
| `lib/services/validationService.ts` | 100+ | Validación de entrada, XSS prevention |
| `lib/services/assetScannerService.ts` | 300+ | Scanner y ROI calculation |

### UI Layer
| File | Lines | Purpose |
|------|-------|---------|
| `lib/store.ts` | 543 | Zustand store, MOCK_ASSETS (256+ activos) |
| `lib/types.ts` | 194 | Interfaces de datos |
| `lib/indicators.ts` | 500+ | Indicadores técnicos (SMA, RSI, MACD, BB, ATR, ADX, Stochastic) |
| `app/page.tsx` | 183 | Dashboard principal |
| `components/AutoAnalysisDisplay.tsx` | - | Renderiza resultados análisis |

## 🔨 Developer Workflows

### Running Locally
```bash
npm run dev                # Start dev server on http://localhost:3000
npm run build              # Production build
npm run start              # Run production build locally
npm run lint               # Run ESLint
```

### Adding a New Service (5 minutos)
1. Crear clase que extienda `BaseService` en `lib/services/myService.ts`
2. Usar `executeWithRetry()` para operaciones
3. Usar `getCachedOrExecute()` para caché
4. Logger, retry y caché automáticos ✅

### Adding a New Hook (3 minutos)
1. Crear función que use `useAsync()` en `app/hooks/useMyFeature.ts`
2. Pasar opciones: `retry`, `onSuccess`, `onError`
3. Estado, loading, error manejados automáticamente ✅

### Adding a New Data Provider (15 minutos)
1. Crear clase que implemente `IDataProvider`
2. Registrar en `registerDefaultProviders()`
3. Sin modificar route.ts ✅

### Adding a New Asset
1. Add entry to `MOCK_ASSETS` in `lib/store.ts` with proper structure
2. Add to `ASSETS_BY_CATEGORY` in `lib/scannerAssets.ts` (determines scan order)
3. Ensure Binance has data for that symbol (normalize USD→USDT in binanceService)
4. Test in AssetList component filter/search

### Modifying AI Analysis
1. Edit `SYSTEM_PROMPT` in `app/api/ai/route.ts` (Claude behavior)
2. Adjust `candleAnalysisService.analyzeCandles()` for pattern detection rules
3. Change confidence thresholds in pattern reliability scores
4. Test via "⚡ Ejecutar Análisis" button on main dashboard

### Debugging Price Issues
Check `marketHoursService.getMarketHours()`:
- 24/7 markets (crypto): Use midnight (00:00 UTC) as open price
- Stock markets: Use session open (9:30 ET) as reference
- Forex markets: Define session hours per pair

## 🚀 Extending the System

### Adding a New Technical Indicator
1. Implement function in `lib/indicators.ts`
2. Add to `IndicatorStatus` interface in `lib/types.ts`
3. Call in `candleAnalysisService.analyzeCandles()`
4. Add status interpretation (overbought/oversold/neutral)

### Custom Analysis Rules
Edit `candleAnalysisService.ts`:
- Pattern detection: Modify `identifyPatterns()` function
- Trend determination: Adjust `analyzeTrend()` logic
- Prediction generation: Tweak probability calculations

### Integration with External APIs
- Add service file in `lib/services/`
- Extend `BaseService` para automatizar logger, cache, retry
- Add validation in `validationService.ts`
- Wrap API calls in try-catch con AppError personalizado

### Adding a New Feature Flag
1. Add to `FEATURE_FLAGS` en `lib/core/config.ts`
2. Usar `isFeatureEnabled(featureName, userId)` para verificar
3. Rollout progresivo con porcentaje o lista de usuarios

## 📝 Notes for Agents

- **Spanish UI/Docs**: All user-facing text is Spanish; code comments mix Spanish/English
- **Responsive Design**: Tailwind mobile-first approach; test on all breakpoints
- **Dark Mode**: Mandatory support; use CSS variables from `globals.css`
- **Type Safety**: Strict TypeScript required; no `any` types allowed
- **Testing**: Focus on critical paths (analysis correctness, price accuracy)
- **Performance**: Optimize candle analysis for 500+ assets scanning (debounce, parallel if possible)
- **Architecture**: Always use BaseService para servicios nuevos, useAsync para hooks nuevos
- **Configuración**: NUNCA hardcodear valores, usar lib/core/config.ts
- **Logging**: Automático via BaseService, no necesita console.log manual
- **Caching**: Automático via getCachedOrExecute(), no necesita implementar manualmente
- **Retry**: Automático via executeWithRetry(), no necesita try-catch

---

## 🎓 Architecture Decision: Why This Design?

### Scalability (De 10 a Millones de Usuarios)
✅ **Modular architecture** - Agregar features sin refactorizar  
✅ **Configurable everything** - cambios sin deploy (feature flags)  
✅ **Automated patterns** - Logger, cache, retry automáticos  

### Maintainability
✅ **Single Responsibility** - cada archivo hace UNA cosa  
✅ **Minimal Coupling** - servicios independientes  
✅ **Type Safety** - TypeScript strict mode previene bugs  

### Developer Experience
✅ **Fast Development** - 5 min servicio, 3 min hook  
✅ **Clear Patterns** - siempre extend BaseService, usa useAsync  
✅ **Self-Documenting Code** - tipos e interfaces claros  

---

**Para más detalles, ver:**
- `ARQUITECTURA_COMPLETA.md` - Guía técnica completa
- `REFACTORIZACION_FINAL_COMPLETA.md` - Resumen ejecutivo
- `LISTADO_ARCHIVOS_CREADOS.md` - Lista detallada de cambios

