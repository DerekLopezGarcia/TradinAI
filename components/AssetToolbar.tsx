'use client';

import { Edit3, Check } from 'lucide-react';
import { useAssetBarStore } from '@/lib/assetBarStore';
import { ALL_ASSET_TYPES } from '@/lib/assetTypeRegistry';
import { QuickAccessChip } from '@/components/QuickAccessChip';
import { CategoryChip } from '@/components/CategoryChip';
import { useMarketStore } from '@/lib/store';

interface AssetToolbarProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
}

export function AssetToolbar({ selectedType, onTypeChange }: AssetToolbarProps) {
  const {
    pinnedAssets, categoryOrder, hiddenCategories,
    toolbarEditMode, setToolbarEditMode, unpinAsset, toggleCategoryVisibility,
  } = useAssetBarStore();
  const { setSelectedAsset } = useMarketStore();

  const orderedTypes = categoryOrder
    .map((v) => ALL_ASSET_TYPES.find((t) => t.value === v))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  const visibleTypes = orderedTypes.filter((t) => !hiddenCategories.includes(t.value));

  const handleSelectPinned = (symbol: string) => {
    const store = useMarketStore.getState();
    const asset = store.assets.find((a) => a.symbol === symbol);
    if (asset) {
      setSelectedAsset(asset);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {pinnedAssets.length > 0 && (
        <div className="flex items-center gap-1 pr-2 border-r border-border/50">
          {pinnedAssets.map((sym) => (
            <QuickAccessChip
              key={sym}
              symbol={sym}
              onUnpin={unpinAsset}
              onSelect={handleSelectPinned}
            />
          ))}
        </div>
      )}

      {visibleTypes.map((type) => (
        <CategoryChip key={type.value} typeConfig={type} isEditMode={toolbarEditMode} />
      ))}

      {hiddenCategories.length > 0 && toolbarEditMode && (
        <div className="flex items-center gap-1 ml-1 pl-2 border-l border-border/50">
          <span className="text-[10px] text-muted-foreground">Ocultas:</span>
          {hiddenCategories.map((v) => {
            const t = ALL_ASSET_TYPES.find((c) => c.value === v);
            if (!t) return null;
            return (
              <button
                key={v}
                onClick={() => toggleCategoryVisibility(v)}
                className="px-2 py-0.5 rounded bg-muted/30 text-[10px] text-muted-foreground hover:bg-muted/60 transition-colors"
                title="Mostrar categoría"
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setToolbarEditMode(!toolbarEditMode)}
        className={`p-1.5 rounded-lg transition-colors ${
          toolbarEditMode ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted text-muted-foreground'
        }`}
        title={toolbarEditMode ? 'Terminar edición' : 'Personalizar barra'}
        aria-label={toolbarEditMode ? 'Terminar edición' : 'Personalizar barra'}
      >
        {toolbarEditMode ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
