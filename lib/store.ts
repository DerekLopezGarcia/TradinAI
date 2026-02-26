import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Asset, TimeFrame, ChatMessage, Alert } from '@/lib/types';

export const MOCK_ASSETS: Asset[] = [
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

