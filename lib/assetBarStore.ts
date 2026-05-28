import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ALL_ASSET_TYPES } from '@/lib/assetTypeRegistry';
import type { AssetTypeConfig } from '@/lib/assetTypeRegistry';

export interface AssetBarStore {
  pinnedAssets: string[];
  categoryOrder: string[];
  hiddenCategories: string[];
  toolbarEditMode: boolean;

  pinAsset: (symbol: string) => void;
  unpinAsset: (symbol: string) => void;
  reorderCategoryUp: (value: string) => void;
  reorderCategoryDown: (value: string) => void;
  toggleCategoryVisibility: (value: string) => void;
  setToolbarEditMode: (mode: boolean) => void;
}

const defaultOrder = ALL_ASSET_TYPES.map((t) => t.value);

export const useAssetBarStore = create<AssetBarStore>()(
  persist(
    (set) => ({
      pinnedAssets: [],
      categoryOrder: defaultOrder,
      hiddenCategories: [],
      toolbarEditMode: false,

      pinAsset: (symbol) =>
        set((s) => {
          if (s.pinnedAssets.includes(symbol)) return s;
          return { pinnedAssets: [...s.pinnedAssets, symbol] };
        }),

      unpinAsset: (symbol) =>
        set((s) => ({
          pinnedAssets: s.pinnedAssets.filter((p) => p !== symbol),
        })),

      reorderCategoryUp: (value) =>
        set((s) => {
          const idx = s.categoryOrder.indexOf(value);
          if (idx <= 0) return s;
          const next = [...s.categoryOrder];
          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
          return { categoryOrder: next };
        }),

      reorderCategoryDown: (value) =>
        set((s) => {
          const idx = s.categoryOrder.indexOf(value);
          if (idx === -1 || idx >= s.categoryOrder.length - 1) return s;
          const next = [...s.categoryOrder];
          [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
          return { categoryOrder: next };
        }),

      toggleCategoryVisibility: (value) =>
        set((s) => {
          const hidden = s.hiddenCategories.includes(value)
            ? s.hiddenCategories.filter((h) => h !== value)
            : [...s.hiddenCategories, value];
          return { hiddenCategories: hidden };
        }),

      setToolbarEditMode: (mode) => set({ toolbarEditMode: mode }),
    }),
    {
      name: 'trading-ia-asset-bar',
      partialize: (state) => ({
        pinnedAssets: state.pinnedAssets,
        categoryOrder: state.categoryOrder,
        hiddenCategories: state.hiddenCategories,
        toolbarEditMode: state.toolbarEditMode,
      }),
    }
  )
);
