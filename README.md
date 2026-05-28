# TradinAI

Financial market analysis platform with real-time data, technical indicators, and AI-powered insights.

## Features

- **Real-time charts** — Candlestick charts with SMA, EMA, RSI, ADX, Stochastic, Bollinger Bands
- **Technical analysis** — Automatic pattern recognition (20+ candlestick patterns), trend analysis, support/resistance detection
- **Asset scanner** — Scan 170+ assets across crypto, stocks, forex, indices, and commodities; ranked by composite score
- **Customizable dashboard** — Drag-and-drop widget grid with chart, indicators, analysis, news, alerts, heatmap
- **Real-time alerts** — Price-level and moving average cross alerts with polling
- **i18n** — Spanish and English support

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS, Lucide icons |
| State | Zustand (persisted) |
| Charts | lightweight-charts (TradingView), Recharts |
| Widgets | react-grid-layout |
| Testing | Jest + ts-jest |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run test suite |

## Project Structure

```
app/
  api/           — REST endpoints (market data, alerts, watchlists, users)
  hooks/         — React hooks (market data, analysis, predictions, alerts, i18n)
  page.tsx       — Main dashboard
lib/
  services/      — Core logic (candle analysis, asset scanner, indicators, providers)
  core/          — Infrastructure (base service, cache, event bus, logging)
  i18n/          — Translation files (es.json, en.json)
  types.ts       — Shared type definitions
  store.ts       — Zustand store
  indicators.ts  — Pure technical indicator calculations
  widgetRegistry.ts / widgetStore.ts — Widget system
components/
  widgets/       — Dashboard widgets (chart, indicators, analysis, news, alerts, etc.)
  BottomNav.tsx  — Mobile navigation bar
  AssetToolbar.tsx — Pinned asset quick-access bar
  CategoryChip.tsx — Asset dropdown by category
```

## Configuration

Create a `.env.local` file:

```
BINANCE_API_KEY=
BINANCE_SECRET_KEY=
ALPACA_API_KEY=
ALPACA_SECRET_KEY=
FINNHUB_API_KEY=
TWELVEDATA_API_KEY=
```

At least one data provider must be configured. The platform falls back through Binance → CoinGecko → Yahoo Finance → Alpaca → Finnhub.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/market` | Price, history, or news for any symbol |
| `GET /api/market/candles` | Candlestick data |
| `GET /api/market/quote` | Real-time stock quote |
| `GET /api/market/depth` | Order book depth |
| `POST /api/ai/analyze` | Professional candlestick analysis |
| `GET/POST /api/db/alerts` | Alert management |
| `GET/POST /api/db/watchlists` | Watchlist management |
| `GET/POST /api/db/users` | User management |

## Tests

```bash
npm test
```

Tests cover indicator calculations (SMA, EMA, RSI, ATR, ADX, Stochastic) and alert service logic.

## License

MIT
