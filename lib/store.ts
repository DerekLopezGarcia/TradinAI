import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Asset, AssetType, TimeFrame, Alert } from '@/lib/types';

/**
 * IMPORTANTE: NO SE DEBEN USAR MOCK_ASSETS CON DATOS HARDCODEADOS
 * 
 * Los datos de activos DEBEN ser cargados en tiempo real desde:
 * - APIs reales: Binance, Twelve Data, Yahoo Finance, CoinGecko, Quandl
 * - Base de datos (si está configurada)
 * - Fuentes de datos autorizadas
 * 
 * Si una API no está disponible → retorna null/error
 * NUNCA inventes datos o uses precios ficticios
 * 
 * Los usuarios confían en datos reales para decisiones financieras
 */

// Asset por defecto para que la página no quede en loading infinito
// Los precios se actualizan en tiempo real desde APIs
const DEFAULT_ASSET: Asset = {
  id: 'default_btc',
  symbol: 'BTCUSD',
  name: 'Bitcoin',
  type: 'crypto',
  price: 0, // Se actualizará desde API
  change: 0,
  changePercent: 0,
  isFavorite: true
};

interface MarketStore {
  assets: Asset[];
  selectedAsset: Asset | null;
  selectedTimeframe: TimeFrame;
  favorites: string[];
  alerts: Alert[];

  setSelectedAsset: (asset: Asset) => void;
  setSelectedTimeframe: (timeframe: TimeFrame) => void;
  toggleFavorite: (symbol: string) => void;
  updateAssetPrice: (symbol: string, price: number, change: number, changePercent: number) => void;
  addOrUpdateAssetPrice: (symbol: string, name: string, price: number, change: number, changePercent: number, type?: AssetType) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (alertId: string) => void;
  addAsset: (data: { symbol: string; name: string; type: AssetType }) => void;
}

export const useMarketStore = create<MarketStore>()(
  persist(
    (set) => ({
      // Los assets se deben cargar en tiempo real desde APIs
      // NO usar MOCK_ASSETS con datos hardcodeados
      assets: [DEFAULT_ASSET],  // Iniciar con asset por defecto
      selectedAsset: DEFAULT_ASSET,  // Seleccionar por defecto para que page no quede en loading
      selectedTimeframe: '1h',
      favorites: ['BTCUSD'],
      alerts: [],

      setSelectedAsset: (asset) => set({ selectedAsset: asset }),

      setSelectedTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

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

      addOrUpdateAssetPrice: (symbol, name, price, change, changePercent, type: AssetType = 'crypto') =>
        set((state) => {
          const existingAsset = state.assets.find(a => a.symbol === symbol);
          
          if (existingAsset) {
            // Actualizar existente
            return {
              assets: state.assets.map((asset) =>
                asset.symbol === symbol
                  ? { ...asset, price, change, changePercent }
                  : asset
              ),
              selectedAsset:
                state.selectedAsset?.symbol === symbol
                  ? { ...state.selectedAsset, price, change, changePercent }
                  : state.selectedAsset,
            };
          } else {
            // Agregar nuevo
            const newAsset: Asset = {
              id: `scanner_${symbol}`,
              symbol,
              name,
              type,
              price,
              change,
              changePercent,
              isFavorite: false,
            };
            return {
              assets: [...state.assets, newAsset],
            };
          }
        }),

      addAlert: (alert) =>
        set((state) => ({
          alerts: [...state.alerts, alert],
        })),

      removeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== alertId),
        })),

      addAsset: (data) =>
        set((state) => {
          const newAsset: Asset = {
            id: String(Date.now()),
            symbol: data.symbol,
            name: data.name,
            type: data.type as AssetType,
            price: 0,
            change: 0,
            changePercent: 0,
            isFavorite: false,
          };
          return {
            assets: [...state.assets, newAsset],
          };
        }),
    }),
    {
      name: 'trading-ia-store',
      partialize: (state) => ({
        favorites: state.favorites,
        selectedTimeframe: state.selectedTimeframe,
        alerts: state.alerts,
      }),
    }
  )
);

