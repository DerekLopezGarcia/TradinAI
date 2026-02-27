import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Asset, TimeFrame, ChatMessage, Alert } from '@/lib/types';

export const MOCK_ASSETS: Asset[] = [
  // ==================== CRIPTOMONEDAS ====================
  {
    id: '1',
    symbol: 'BTCUSD',
    name: 'Bitcoin',
    type: 'crypto',
    price: 42350.50,
    change: 1250.50,
    changePercent: 3.05,
    isFavorite: true,
  },
  {
    id: '2',
    symbol: 'ETHUSD',
    name: 'Ethereum',
    type: 'crypto',
    price: 2250.75,
    change: 85.25,
    changePercent: 3.92,
    isFavorite: true,
  },
  {
    id: '8',
    symbol: 'SOLUSD',
    name: 'Solana',
    type: 'crypto',
    price: 135.42,
    change: 4.25,
    changePercent: 3.24,
    isFavorite: false,
  },
  {
    id: '9',
    symbol: 'XRPUSD',
    name: 'XRP',
    type: 'crypto',
    price: 2.15,
    change: 0.08,
    changePercent: 3.85,
    isFavorite: false,
  },
  {
    id: '10',
    symbol: 'ADAUSD',
    name: 'Cardano',
    type: 'crypto',
    price: 0.98,
    change: 0.03,
    changePercent: 3.16,
    isFavorite: false,
  },
  {
    id: '11',
    symbol: 'DOGEUSD',
    name: 'Dogecoin',
    type: 'crypto',
    price: 0.38,
    change: 0.02,
    changePercent: 5.56,
    isFavorite: false,
  },
  {
    id: '12',
    symbol: 'POLKAUSD',
    name: 'Polkadot',
    type: 'crypto',
    price: 8.42,
    change: 0.25,
    changePercent: 3.07,
    isFavorite: false,
  },
  {
    id: '13',
    symbol: 'LITEUSD',
    name: 'Litecoin',
    type: 'crypto',
    price: 185.35,
    change: 5.50,
    changePercent: 3.06,
    isFavorite: false,
  },

  // ==================== ACCIONES TECH ====================
  {
    id: '3',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    price: 192.35,
    change: 2.15,
    changePercent: 1.13,
    isFavorite: true,
  },
  {
    id: '4',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    price: 138.42,
    change: -1.58,
    changePercent: -1.13,
    isFavorite: false,
  },
  {
    id: '5',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    type: 'stock',
    price: 242.84,
    change: 5.84,
    changePercent: 2.46,
    isFavorite: true,
  },
  {
    id: '14',
    symbol: 'MSFT',
    name: 'Microsoft',
    type: 'stock',
    price: 420.15,
    change: 3.25,
    changePercent: 0.78,
    isFavorite: false,
  },
  {
    id: '15',
    symbol: 'AMZN',
    name: 'Amazon',
    type: 'stock',
    price: 185.42,
    change: 2.75,
    changePercent: 1.50,
    isFavorite: false,
  },
  {
    id: '16',
    symbol: 'META',
    name: 'Meta Platforms',
    type: 'stock',
    price: 485.95,
    change: 8.50,
    changePercent: 1.77,
    isFavorite: false,
  },
  {
    id: '17',
    symbol: 'NVDA',
    name: 'NVIDIA',
    type: 'stock',
    price: 876.50,
    change: 12.25,
    changePercent: 1.41,
    isFavorite: false,
  },

  // ==================== ACCIONES FINANCIERAS ====================
  {
    id: '18',
    symbol: 'JPM',
    name: 'JPMorgan Chase',
    type: 'stock',
    price: 197.35,
    change: 1.50,
    changePercent: 0.76,
    isFavorite: false,
  },
  {
    id: '19',
    symbol: 'BAC',
    name: 'Bank of America',
    type: 'stock',
    price: 35.42,
    change: 0.45,
    changePercent: 1.29,
    isFavorite: false,
  },
  {
    id: '20',
    symbol: 'GS',
    name: 'Goldman Sachs',
    type: 'stock',
    price: 414.25,
    change: 2.85,
    changePercent: 0.69,
    isFavorite: false,
  },

  // ==================== ACCIONES INDUSTRIALES ====================
  {
    id: '21',
    symbol: 'BA',
    name: 'Boeing',
    type: 'stock',
    price: 184.50,
    change: -2.15,
    changePercent: -1.15,
    isFavorite: false,
  },
  {
    id: '22',
    symbol: 'CAT',
    name: 'Caterpillar',
    type: 'stock',
    price: 342.15,
    change: 3.75,
    changePercent: 1.11,
    isFavorite: false,
  },
  {
    id: '23',
    symbol: 'MMM',
    name: '3M Company',
    type: 'stock',
    price: 95.25,
    change: 0.85,
    changePercent: 0.90,
    isFavorite: false,
  },

  // ==================== ÍNDICES ====================
  {
    id: '24',
    symbol: 'SPX',
    name: 'S&P 500',
    type: 'index',
    price: 5328.75,
    change: 45.50,
    changePercent: 0.86,
    isFavorite: true,
  },
  {
    id: '25',
    symbol: 'INDU',
    name: 'Dow Jones',
    type: 'index',
    price: 42525.50,
    change: 125.50,
    changePercent: 0.30,
    isFavorite: false,
  },
  {
    id: '26',
    symbol: 'CCMP',
    name: 'NASDAQ 100',
    type: 'index',
    price: 19285.25,
    change: 185.75,
    changePercent: 0.97,
    isFavorite: false,
  },
  {
    id: '27',
    symbol: 'VIX',
    name: 'Volatilidad (VIX)',
    type: 'index',
    price: 18.42,
    change: -0.85,
    changePercent: -4.41,
    isFavorite: false,
  },

  // ==================== PARES FOREX ====================
  {
    id: '6',
    symbol: 'EURUSD',
    name: 'Euro/Dólar',
    type: 'forex',
    price: 1.0945,
    change: 0.0045,
    changePercent: 0.41,
    isFavorite: false,
  },
  {
    id: '7',
    symbol: 'GBPUSD',
    name: 'Libra/Dólar',
    type: 'forex',
    price: 1.2685,
    change: -0.0025,
    changePercent: -0.20,
    isFavorite: false,
  },
  {
    id: '28',
    symbol: 'JPYUSD',
    name: 'Yen/Dólar',
    type: 'forex',
    price: 0.00645,
    change: 0.000045,
    changePercent: 0.70,
    isFavorite: false,
  },
  {
    id: '29',
    symbol: 'CHFUSD',
    name: 'Franco/Dólar',
    type: 'forex',
    price: 1.1245,
    change: 0.0032,
    changePercent: 0.29,
    isFavorite: false,
  },
  {
    id: '30',
    symbol: 'AUDUSD',
    name: 'Dólar Australiano/USD',
    type: 'forex',
    price: 0.6585,
    change: -0.0018,
    changePercent: -0.27,
    isFavorite: false,
  },
  {
    id: '31',
    symbol: 'CADMXN',
    name: 'Dólar Canadiense/Peso',
    type: 'forex',
    price: 17.25,
    change: 0.08,
    changePercent: 0.47,
    isFavorite: false,
  },

  // ==================== MATERIAS PRIMAS ====================
  {
    id: '32',
    symbol: 'XAUUSD',
    name: 'Oro (por troy oz)',
    type: 'commodity',
    price: 2385.50,
    change: 12.50,
    changePercent: 0.53,
    isFavorite: false,
  },
  {
    id: '33',
    symbol: 'XAGUSD',
    name: 'Plata (por troy oz)',
    type: 'commodity',
    price: 28.95,
    change: 0.25,
    changePercent: 0.87,
    isFavorite: false,
  },
  {
    id: '34',
    symbol: 'XPTUSD',
    name: 'Platino (por troy oz)',
    type: 'commodity',
    price: 1035.25,
    change: 8.75,
    changePercent: 0.85,
    isFavorite: false,
  },
  {
    id: '35',
    symbol: 'XPDUSD',
    name: 'Paladio (por troy oz)',
    type: 'commodity',
    price: 985.50,
    change: -5.25,
    changePercent: -0.53,
    isFavorite: false,
  },
  {
    id: '36',
    symbol: 'COPPER',
    name: 'Cobre',
    type: 'commodity',
    price: 4.25,
    change: 0.08,
    changePercent: 1.92,
    isFavorite: false,
  },
  {
    id: '37',
    symbol: 'CRUDE',
    name: 'Petróleo Crudo WTI',
    type: 'commodity',
    price: 82.45,
    change: 1.25,
    changePercent: 1.54,
    isFavorite: false,
  },
  {
    id: '38',
    symbol: 'NATGAS',
    name: 'Gas Natural',
    type: 'commodity',
    price: 3.15,
    change: -0.12,
    changePercent: -3.68,
    isFavorite: false,
  },
];

interface MarketStore {
  assets: Asset[];
  selectedAsset: Asset | null;
  selectedTimeframe: TimeFrame;
  darkMode: boolean;
  favorites: string[];
  chatMessages: ChatMessage[];
  alerts: Alert[];

  // Actions
  setSelectedAsset: (asset: Asset) => void;
  setSelectedTimeframe: (timeframe: TimeFrame) => void;
  setDarkMode: (dark: boolean) => void;
  toggleFavorite: (symbol: string) => void;
  updateAssetPrice: (symbol: string, price: number, change: number, changePercent: number) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (alertId: string) => void;
  updateAlert: (alertId: string, triggered: boolean) => void;
}

export const useMarketStore = create<MarketStore>()(
  persist(
    (set) => ({
      assets: MOCK_ASSETS,
      selectedAsset: MOCK_ASSETS[0],
      selectedTimeframe: '1h',
      darkMode: true,
      favorites: ['BTCUSD', 'ETHUSD', 'AAPL', 'TSLA'],
      chatMessages: [],
      alerts: [],

      setSelectedAsset: (asset) => set({ selectedAsset: asset }),

      setSelectedTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

      setDarkMode: (dark) => set({ darkMode: dark }),

      toggleFavorite: (symbol) =>
        set((state) => {
          const isFav = state.favorites.includes(symbol);
          return {
            favorites: isFav
              ? state.favorites.filter((s) => s !== symbol)
              : [...state.favorites, symbol],
            assets: state.assets.map((asset) =>
              asset.symbol === symbol
                ? { ...asset, isFavorite: !asset.isFavorite }
                : asset
            ),
          };
        }),

      updateAssetPrice: (symbol, price, change, changePercent) =>
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.symbol === symbol
              ? { ...asset, price, change, changePercent }
              : asset
          ),
          selectedAsset:
            state.selectedAsset?.symbol === symbol
              ? { ...state.selectedAsset, price, change, changePercent }
              : state.selectedAsset,
        })),

      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),

      clearChatMessages: () => set({ chatMessages: [] }),

      addAlert: (alert) =>
        set((state) => ({
          alerts: [...state.alerts, alert],
        })),

      removeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== alertId),
        })),

      updateAlert: (alertId, triggered) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? { ...a, triggeredAt: triggered ? Date.now() : undefined }
              : a
          ),
        })),
    }),
    {
      name: 'trading-ia-store',
      partialize: (state) => ({
        darkMode: state.darkMode,
        favorites: state.favorites,
        selectedTimeframe: state.selectedTimeframe,
        alerts: state.alerts,
      }),
    }
  )
);

