# AGENTS.md - Trading IA Codebase Guide

AI agents working on this codebase should understand the project architecture, data flows, patterns, and key workflows.

## 🏗️ Architecture Overview

**TradingIA** is a Next.js 16 + React 19 real-time financial market analysis platform with AI-powered technical analysis and recommendations.

### Core Tech Stack
- **Frontend**: Next.js (App Router), React 19, TypeScript 5.5
- **State**: Zustand (persistent store)
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components (CVA)
- **Charts**: Lightweight-charts + Recharts
- **Data Source**: Binance API (real candles), mock fallbacks
- **AI**: Custom technical analysis engine (candleAnalysisService)

### Major Components & Responsibilities

```
app/
├── page.tsx               # Main trading dashboard (client)
├── layout.tsx             # Root layout + theme provider
├── api/
│   ├── ai/route.ts       # AI analysis endpoint (Claude/custom)
│   ├── ai/analyze/       # Candle analysis API
│   └── market/           # Live price & historical candles
└── hooks/                # React hooks for data + analysis
    ├── useMarketData     # Fetch & cache candles from Binance
    ├── useAutoAnalysis   # Manual candle analysis on demand
    └── useDailyRec...    # Scan 256+ assets for recommendations

lib/
├── store.ts              # Zustand store: selected asset, timeframe, favorites
├── types.ts              # Core TypeScript interfaces
├── indicators.ts         # Technical indicators (SMA, RSI, MACD, BB, ATR, ADX, Stochastic)
└── services/
    ├── binanceService    # Binance API integration + caching
    ├── candleAnalysis... # 50+ candle patterns, trend analysis, predictions
    ├── assetScanner...   # ROI calculation, recommendation filtering
    ├── validationService # Input sanitization (XSS/injection prevention)
    └── market*Service    # Market hours, news, price conversion
```

## 🔄 Key Data Flows

### 1. Manual Analysis Flow (On-Demand)
```
User clicks "⚡ Ejecutar Análisis"
↓
useAutoAnalysis hook invoked
↓
analyzeCandles() [candleAnalysisService]
  ├─ Analyze patterns (50+ types)
  ├─ Calculate indicators (RSI, MACD, BB, Stochastic, ATR, ADX)
  ├─ Detect support/resistance levels
  ├─ Generate 3 predictions (main, alternative, inverse)
  └─ Format detailed response
↓
AutoAnalysisDisplay renders results with explanations
```

### 2. Asset Scanning Flow (Recommendations)
```
User clicks "✨ Recomendaciones" → "Obtener Recomendaciones"
↓
useDailyRecommendations hook
  ├─ Check cache (max 4 hours old, same day)
  ├─ If fresh: return cached results
  └─ If stale: scan 256+ assets
      ├─ ASSETS_BY_CATEGORY (13 categories × 20 assets)
      ├─ For each: getWeeklyCandles() → analyzeCandles()
      └─ Calculate ROI = (target - current / current) × probability
↓
Filter by ROI ≥ 10% (configurable minROI in UI)
↓
RecommendationsPanel displays Top 10 per category + Top 50 global
```

### 3. Real-Time Price Updates
```
Every 3 seconds: useScannerPriceRefresh()
  └─ Poll /api/market?type=price for live OHLC updates
↓
Update last candle in chart (don't clear, animate)
↓
Header displays current price + daily change%
```

## 🎯 Critical Patterns & Conventions

### Data Validation (Mandatory)
Every user input must pass through `validationService` BEFORE use:
```typescript
import { validateSymbol, validateTimeFrame } from '@/lib/services/validationService';

// ❌ WRONG - Direct use
const data = await fetch(`/api/market?symbol=${userInput}`);

// ✅ CORRECT - Validate first
if (!validateSymbol(userInput)) throw new Error('Invalid symbol');
const params = createSafeParams({ symbol: userInput, type: 'history' });
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

| File | Purpose |
|------|---------|
| `lib/store.ts` | Zustand store, MOCK_ASSETS list (256+ assets × 13 categories) |
| `lib/types.ts` | Core interfaces: Asset, CandleData, Analysis, TimeFrame |
| `lib/services/candleAnalysisService.ts` | 900+ lines, complete technical analysis engine |
| `lib/services/binanceService.ts` | Binance API, caching, symbol normalization (USD→USDT) |
| `lib/services/validationService.ts` | Input sanitization, XSS prevention |
| `app/api/ai/route.ts` | AI analysis endpoint, system prompts for Claude |
| `app/page.tsx` | Main dashboard, market data hooks, layout orchestration |
| `components/AutoAnalysisDisplay.tsx` | Renders analysis results with accordion sections |

## 🔨 Developer Workflows

### Running Locally
```bash
npm run dev                # Start dev server on http://localhost:3000
npm run build              # Production build
npm run start              # Run production build locally
npm run lint               # Run ESLint
```

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

## ⚠️ Important Edge Cases

### Symbol Normalization
Binance requires USDT suffix, internal format uses USD:
```typescript
// Binance: BTCUSDT
// Internal: BTCUSD
// binanceService.normalizePair('BTCUSD') → 'BTCUSDT'
```

### Hydration Mismatch
Theme provider + dark mode can cause SSR mismatches. Already mitigated with:
- `suppressHydrationWarning` on `<html>`
- `useEffect` to sync client theme after mount

### Duplicate Key Warnings
Asset lists use unique IDs per category:
```typescript
// ✅ CORRECT: category + index + symbol
id: `scanner_${categoryName.toLowerCase()}_${index}_${symbol}`
```

### Missing Candle Data
If Binance returns <500 candles:
- Fall back to mock data (see `useMarketData.ts`)
- `candleAnalysisService` validates minimum 10 candles for analysis
- RSI/MACD require ≥ period + buffer (e.g., RSI(14) needs 20+ candles)

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
- Implement caching in `priceCache.ts` pattern
- Add validation in `validationService.ts`
- Wrap API calls in try-catch with fallbacks

## 📝 Notes for Agents

- **Spanish UI/Docs**: All user-facing text is Spanish; code comments mix Spanish/English
- **Responsive Design**: Tailwind mobile-first approach; test on all breakpoints
- **Dark Mode**: Mandatory support; use CSS variables from `globals.css`
- **Type Safety**: Strict TypeScript required; no `any` types allowed
- **Testing**: Focus on critical paths (analysis correctness, price accuracy)
- **Performance**: Optimize candle analysis for 500+ assets scanning (debounce, parallel if possible)

