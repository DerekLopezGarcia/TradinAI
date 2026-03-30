# Trading IA v2.0 - Análisis Profesional de Mercados

**Plataforma profesional de análisis técnico con arquitectura escalable** para trading inteligente. Diseñada para crecer de 10 a millones de usuarios sin refactorización.

## 🎯 Características Principales

### 📊 Análisis Técnico Profesional
- **Análisis Manual con IA**: Presiona "⚡ Ejecutar Análisis" para análisis técnico detallado en tiempo real
- **12+ Indicadores Técnicos**: RSI, MACD, Bollinger Bands, Stochastic, ATR, ADX, SMA, EMA y más
- **Detección de Patrones**: Identifica automáticamente formaciones de velas (Doji, Engulfing, etc.)
- **Predicciones Inteligentes**: Objetivos de precio, stop loss, relación riesgo/beneficio
- **Análisis Profundo**: Tendencia, estructura de mercado, niveles clave, divergencias

### 🤖 Recomendaciones Automáticas  
- **Escaneo de 256+ Activos**: Analiza todas las categorías en tiempo real
- **ROI Inteligente**: Solo recomendaciones con ROI esperado ≥ 10%
- **Histórico de Semana**: Análisis basado en datos de 7 días
- **Clasificación por Categoría**: Organiza por cripto, forex, índices, commodities, acciones, etc.

### 🔄 Datos en Tiempo Real
- **Múltiples Proveedores**: Binance, Twelve Data, Yahoo Finance, CoinGecko, Quandl
- **Fallback Inteligente**: Usa automáticamente el siguiente proveedor si uno falla
- **Caché Optimizado**: 60s para datos de mercado, 4h para recomendaciones
- **Rate Limiting**: Sistema de cola batch para respetar límites de APIs

### 🏗️ Arquitectura Escalable (v2.0)
- **Factory Pattern**: Agregar nuevos proveedores sin modificar código existente
- **Strategy Pattern**: Cada servicio independiente con lógica específica
- **Repository Pattern**: Acceso genérico a datos testeable
- **Observer Pattern**: Bus de eventos para comunicación reactiva
- **Patrones React**: useAsync, useLocalStorage, useDebounce automáticos

## 📖 Cómo Usar

### Análisis Individual
1. Selecciona un activo (BTCUSD, EURUSD, AAPL, etc.)
2. Selecciona un timeframe (1h, 4h, 1d, etc.)
3. Espera a que cargue el gráfico
4. Haz clic en el botón **"⚡ Ejecutar Análisis"**
5. Ve los resultados con explicaciones detalladas en español

### Recomendaciones Diarias
1. Haz clic en el botón **"✨ Recomendaciones"** en la barra superior
2. Presiona **"Obtener Recomendaciones"**
3. El sistema escanea automáticamente:
   - **256+ activos en total** en 13 categorías
   - 40+ criptomonedas, 25+ forex, 15+ índices, 18+ commodities, 50+ acciones, etc.
4. Recibe los mejores activos con ROI esperado ≥ 10%

## 🎯 Patrones de Arquitectura Implementados

### 1. Factory Pattern (Data Providers)
Agregar nuevos proveedores sin modificar código existente:
```typescript
interface IDataProvider {
  name: string;
  priority: number;
  canHandle(symbol, type): boolean;
  fetch(symbol, interval): Promise<CandleData[]>;
}
```
**Ventaja**: Agregar proveedor = 15 minutos, sin refactorizar nada

### 2. Strategy Pattern (Services)
Cada servicio implementa su estrategia:
```typescript
export abstract class BaseService {
  protected executeWithRetry() { ... }      // Retry automático
  protected getCachedOrExecute() { ... }    // Caché automático
}
```
**Ventaja**: Logger, cache, retry automáticos en todos los servicios

### 3. Repository Pattern
Acceso a datos genérico y testeable:
```typescript
interface Repository<T> {
  getById(id: ID): Promise<T>;
  getAll(): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: ID, updates: Partial<T>): Promise<T>;
}
```

### 4. Observer Pattern (Event Bus)
Comunicación reactiva entre módulos:
```typescript
eventBus.subscribe('market:price', (data) => console.log(data));
eventBus.publish('market:price', { symbol: 'BTCUSD', price: 42000 });
```

### 5. React Hooks Pattern
Reutilizables y automáticos:
```typescript
const { data, loading, error } = useAsync(
  () => myService.fetch(),
  { retry: 3, onSuccess: (data) => console.log(data) }
);
```

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

### Modifying AI Analysis
1. Edit `SYSTEM_PROMPT` in `app/api/ai/route.ts` (Claude behavior)
2. Adjust `candleAnalysisService.analyzeCandles()` for pattern detection
3. Change confidence thresholds in pattern reliability scores
4. Test via "⚡ Ejecutar Análisis" button

## 🚀 Extensiones Avanzadas

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

## 📦 Versiones Instaladas

```
Node.js:  v20.11.1 LTS (o superior)
npm:      10.x.x (o superior)
React:    18.x
Next.js:  14.x
TypeScript: 5.x
Tailwind: 3.x
```

## 📦 Stack Técnico

**Frontend**:
- Next.js 16 (App Router) - Framework React profesional
- React 19 - Última versión estable
- TypeScript 5.5 (strict mode) - Type safety garantizado
- Zustand - State management persistente
- Tailwind CSS 3.4 + shadcn/ui - Componentes modernos

**Gráficos & Datos**:
- Lightweight-charts - Gráficos profesionales TradingView
- Recharts - Gráficos estadísticos
- Múltiples APIs: Binance, Twelve Data, Yahoo Finance, CoinGecko, Quandl

**Arquitectura**:
- Factory Pattern - Proveedores de datos escalables
- Strategy Pattern - Servicios independientes
- Repository Pattern - Acceso genérico a datos
- Observer Pattern - Bus de eventos

**Herramientas**:
- ESLint - Validación de código
- Tailwind CSS - Diseño responsive
- Lucide Icons - Iconos modernos

## 🏗️ Arquitectura de Capas (v2.0)

```
LAYER 5: Pages & Routes
├── app/page.tsx              # Dashboard (análisis individual)
├── app/recommendations/      # Recomendaciones diarias
├── app/api/*/route.ts        # Endpoints (sin lógica de negocio)
└── components/               # UI componentes (sin lógica de negocio)
                ↓
LAYER 4: React Hooks (Reutilizables)
├── useAsync()                # Genérico para operaciones async
├── useMarketData()           # Datos de mercado
├── useAutoAnalysis()         # Análisis técnico
├── useDailyRecommendations() # Recomendaciones
└── useScannerPrice...()      # Actualizaciones de precios
                ↓
LAYER 3: Services (Heredan de BaseService)
├── BinanceProvider           # Proveedor Binance
├── TwelveDataProvider        # Proveedor Stocks
├── YahooFinanceProvider      # Fallback stocks
├── CoinGeckoProvider         # Fallback crypto
├── candleAnalysisService     # Análisis técnico
├── assetScannerService       # Scanner de activos
└── marketHoursService        # Horarios de mercado
                ↓
LAYER 2: Core Services (Base Classes)
├── BaseService               # Clase base con logger, cache, retry
├── MemoryCacheService        # Cache en memoria con TTL
├── SimpleEventBus            # Bus de eventos
└── InMemoryRepository        # Repositorio genérico
                ↓
LAYER 1: Core Abstraction (Interfaces & Patterns)
├── architecture.ts           # Interfaces y patrones
├── config.ts                 # Configuración centralizada
└── services.ts               # Implementaciones base
```

## 📁 Estructura del Proyecto

```
TradingIA/
├── lib/core/                           # CAPA 1: Core Abstraction
│   ├── architecture.ts                 # Interfaces, patrones, helpers
│   ├── config.ts                       # Configuración centralizada
│   └── services.ts                     # BaseService, Logger, Cache
│
├── lib/services/                       # CAPA 3: Services Específicos
│   ├── dataProviders.ts                # 5 Proveedores de datos
│   ├── dataProviderFactory.ts          # Factory para proveedores
│   ├── candleAnalysisService.ts        # Análisis técnico (900+ líneas)
│   ├── assetScannerService.ts          # Scanner de 256+ activos
│   ├── binanceService.ts               # Integración Binance
│   ├── validationService.ts            # Validación XSS, seguridad
│   ├── priceCache.ts                   # Caché inteligente
│   └── marketHoursService.ts           # Horarios de mercado 24/5
│
├── app/hooks/                          # CAPA 4: React Hooks
│   ├── useAsync.ts                     # Hook genérico async (440+ líneas)
│   ├── useMarketData.ts                # Datos de mercado
│   ├── useAutoAnalysis.ts              # Análisis manual
│   ├── useDailyRecommendations.ts      # Recomendaciones
│   └── useScannerPriceRefresh.ts       # Actualizaciones de precios
│
├── app/                                # CAPA 5: Pages & Routes
│   ├── page.tsx                        # Dashboard principal
│   ├── api/ai/route.ts                 # API análisis
│   ├── api/market/candles/route.ts     # API datos (con Factory)
│   └── recommendations/page.tsx        # Recomendaciones
│
├── components/                         # CAPA 5: UI Components
│   ├── AutoAnalysisDisplay.tsx         # Panel de análisis
│   ├── RecommendationsPanel.tsx        # Panel de recomendaciones
│   ├── Charts.tsx                      # Gráficos
│   └── ...
│
├── lib/
│   ├── store.ts                        # Zustand (estado global)
│   ├── types.ts                        # Interfaces de datos
│   ├── indicators.ts                   # Indicadores técnicos
│   └── mockData.ts                     # Datos mock
```

## 🚀 Instalación

### Requisitos Previos
- **Windows 7 o superior**
- **Node.js 16.x o superior** (recomendado: versión LTS)
- **npm 7.x o superior** (incluido con Node.js)
- **Navegador web moderno** (Chrome, Firefox, Edge, Safari)

### ⚡ Instalación Rápida (Recomendado)

#### Opción 1: Script Automático (Windows)
Si tienes PowerShell, simplemente ejecuta:
```powershell
# Click derecho en la carpeta del proyecto
# Selecciona "Abrir PowerShell aquí"
# Luego ejecuta:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
.\run.ps1
```

#### Opción 2: Script Batch (Windows)
Si tienes Command Prompt, simplemente ejecuta:
```bash
run.bat
```

### 🔧 Instalación Manual

#### Paso 1: Instalar Node.js
1. Ve a https://nodejs.org/
2. Descarga la **versión LTS** (Long Term Support)
3. Ejecuta el instalador
4. **IMPORTANTE**: Asegúrate de marcar **"Add to PATH"** durante la instalación
5. Reinicia tu computadora o terminal

#### Paso 2: Verificar la instalación
Abre PowerShell o Command Prompt y ejecuta:
```bash
node --version   # Debe mostrar: v20.x.x (o superior)
npm --version    # Debe mostrar: 10.x.x (o superior)
```

Si ves errores, **reinicia PowerShell** después de instalar Node.js.

#### Paso 3: Instalar dependencias
```bash
npm install
```

#### Paso 4: Compilar (Opcional)
```bash
npm run build
```

#### Paso 5: Ejecutar en desarrollo
```bash
npm run dev
```

Luego abre tu navegador en **http://localhost:3000**

### 🐛 Solución de Problemas

#### Error: "npm no se reconoce"
- **Solución 1**: Reinicia PowerShell completamente
- **Solución 2**: Comprueba que Node.js está en el PATH:
  ```powershell
  $env:PATH -split ';' | Where-Object {$_ -like '*nodejs*'}
  ```
- **Solución 3**: Reinstala Node.js asegurándote de marcar "Add to PATH"

#### Error: "Port 3000 already in use"
El puerto 3000 está en uso. Puedes:
- Matar el proceso: `taskkill /PID <pid> /F`
- O cambiar el puerto en el package.json

#### Error: "Cannot find module"
Ejecuta:
```bash
npm install
npm ci  # Clean install
```

#### Error durante la compilación
Intenta:
```bash
npm cache clean --force
npm install
npm run build
```

## 📈 Información del Análisis Individual

### Resumen Rápido
- Tendencia (Alcista/Bajista/Lateral)
- Sentimiento General
- Predicción de Dirección
- Nivel de Confianza
- Patrones Detectados

### Análisis Detallado
1. **Tendencia** - Estructura de mercado, ADX, medias móviles
2. **Patrones** - Formaciones de velas detectadas (Doji, Engulfing, etc.)
3. **Indicadores** - RSI, MACD, Bollinger Bands, Stochastic, ATR, ADX
4. **Predicción** - Objetivos de precio, stop loss, riesgo/beneficio
5. **Riesgo** - Factores de riesgo identificados
6. **Resumen** - Conclusión ejecutiva

## 🤖 Sistema de Recomendaciones Diarias (256+ Activos)

### Cómo Funciona
1. **Escaneo Automático**: Analiza 256+ activos en 13 categorías
2. **Histórico de Semana**: Recoge datos de los últimos 7 días
3. **Cálculo de ROI**: Calcula el retorno de inversión esperado
4. **Filtrado Inteligente**: Solo muestra activos con ROI ≥ 10%
5. **Clasificación**: Ordena por ROI y agrupa por categoría

### Categorías Analizadas (13 Categorías)
- **Criptomonedas** (40+): BTC, ETH, BNB, XRP, DOGE, ADA, SOL, CARDANO, etc.
- **Forex Mayor** (25+): EUR/USD, GBP/USD, JPY/USD, CHF/USD, CAD/USD, AUD/USD, NZD/USD, etc.
- **Índices** (15+): S&P 500 (SPX), Nasdaq 100 (NDX), Dollar Index (DXY), VIX, DAX, FTSE, etc.
- **Commodities** (18+): Oro, Plata, Cobre, Petróleo, Gas Natural, Trigo, Café, Cacao, etc.
- **Acciones Tecnología** (50+): AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META, NFLX, etc.
- **Bancos** (16+): JPM, BAC, WFC, GS, MS, BLK, etc.
- **Consumidor** (15+): WMT, KO, MCD, SBUX, AMZN, HD, etc.
- **Salud/Farmacia** (13+): JNJ, UNH, CVS, MRK, ABBV, LLY, etc.
- **Energía** (10+): XOM, CVX, COP, MPC, PSX, HES, etc.
- **Inmobiliario** (10+): REALTY, XLRE, PLD, AMT, CCI, etc.
- **Utilities** (7+): NEE, DUK, SO, EXC, D, WEC, etc.
- **Telecomunicaciones** (8+): VZ, T, TMUS, CMCSA, CHTR, etc.
- **Industriales** (12+): BA, GE, CAT, DE, RTX, APA, etc.
- **Materiales** (8+): FCX, NEM, TAP, DOW, MON, etc.

### Información Mostrada por Activo
- ROI Esperado (%)
- Precio Actual
- Dirección Predicha (Alcista/Bajista)
- Nivel de Confianza
- Relación Riesgo/Beneficio
- Objetivos de Precio
- Desempeño en últimas 24h/7d

## 🔑 Cambios Principales (v2.0)

### Arquitectura
- ✅ **Arquitectura escalable** de 5 capas (desde UI hasta Core Abstraction)
- ✅ **Factory Pattern** - Agregar proveedores sin refactorizar
- ✅ **Strategy Pattern** - Servicios independientes
- ✅ **Logger, Cache y Retry automáticos** en BaseService
- ✅ **Configuración centralizada** en lib/core/config.ts

### Funcionalidad
- ✅ Análisis **manual** (botón) en lugar de automático
- ✅ Datos recopilados **automáticamente** sin entrada manual
- ✅ Panel de análisis visible **debajo de los gráficos**
- ✅ Explicaciones detalladas en **español**
- ✅ Sistema de recomendaciones diarias con **ROI inteligente**
- ✅ Escaneo de **256+ activos** simultáneamente
- ✅ Análisis basado en **histórico de 7 días**

### Performance
- ✅ **Caché inteligente** (60s mercado, 4h recomendaciones)
- ✅ **Rate limiting** con sistema de cola batch
- ✅ **Fallback automático** entre proveedores
- ✅ **Retry automático** con backoff exponencial

## 📚 Documentación Completa

Esta es una distribución profesional con documentación extensiva:

| Archivo | Descripción |
|---------|-------------|
| `AGENTS.md` | Guía completa de arquitectura v2.0 (450+ líneas) |
| `ARQUITECTURA_COMPLETA.md` | Documentación técnica detallada |
| `REFACTORIZACION_FINAL_COMPLETA.md` | Resumen ejecutivo de cambios |
| `README.md` | Este archivo (guía de uso) |

**Para entender el código, lee en este orden:**
1. `AGENTS.md` - Arquitectura general
2. `lib/core/architecture.ts` - Interfaces y patrones
3. `lib/core/services.ts` - BaseService (base de todo)
4. `lib/services/` - Servicios específicos
5. `app/hooks/` - React Hooks reutilizables

## 📌 Botones Principales

### Botón de Análisis (página principal)
El botón **"⚡ Ejecutar Análisis"** está en la esquina superior derecha del panel. Presiona para:
- Ejecutar análisis con datos actuales
- Ver todas las explicaciones
- Actualizar cuando cambies timeframe o activo

### Botón de Recomendaciones (barra superior)
El botón **"✨ Recomendaciones"** en dorado está en la barra superior. Presiona para:
- Ir a la página de recomendaciones diarias
- Escanear todos los 256+ activos
- Ver los mejores con ROI ≥ 10%
- Filtrar por categoría o buscar activos específicos

## ⚠️ Disclaimer

Este es un **análisis técnico basado en datos históricos y patrones**:
- ❌ NO es recomendación financiera
- ❌ NO es garantía de rentabilidad
- ✅ Úsalo como herramienta de apoyo
- ✅ Siempre gestiona el riesgo correctamente
- ✅ Realiza tu propia investigación antes de invertir

## 📚 Documentación

Toda la documentación está en el código mediante comentarios y TypeScript.

## 🔗 URLs Importantes

- Análisis: `/`
- Recomendaciones: `/recommendations`
- API de Análisis: `/api/ai/analyze`
- API de Mercado: `/api/market`
- Datos en vivo: Binance API

## 📝 Notas Importantes para Desarrolladores

### Arquitectura
- **Modular**: Agregar features sin refactorizar código existente
- **Type Safe**: TypeScript strict mode, no `any` types
- **Patrones**: Factory, Strategy, Repository, Observer implementados
- **Configuración**: Centralizada en `lib/core/config.ts`, nunca hardcodear valores
- **Logging**: Automático vía BaseService, no necesita console.log manual
- **Caching**: Automático vía `getCachedOrExecute()`, no necesita implementar manualmente
- **Retry**: Automático vía `executeWithRetry()`, no necesita try-catch

### UI/UX
- **Responsive**: Tailwind mobile-first, probar en todos los breakpoints
- **Dark Mode**: Soporte obligatorio, usar CSS variables en `globals.css`
- **Explicaciones**: Todas en español, en lenguaje claro
- **Hidrogenación**: `suppressHydrationWarning` en `<html>` por theme provider

### Performance
- **Rate Limiting**: Respetar límites de APIs (Binance 1200/min)
- **Batching**: Sistema de cola en `priceCache.ts` (10/batch, 500ms)
- **Caching**: 60s mercado, 4h recomendaciones
- **Optimización**: Debounce para búsquedas, lazy loading para análisis

### Testing & Validation
- **Validación**: Usar `validationService.ts` para XSS prevention
- **Error Handling**: AppError personalizado en servicios
- **Type Safety**: Interfaces strictas, evitar `any`

## 💬 Contacto

Para soporte o reportar bugs, abre un issue en el repositorio.

---

**Status**: ✅ Producción (v2.0)  
**Última actualización**: Marzo 30, 2026  
**Arquitectura**: Escalable, lista para millones de usuarios

