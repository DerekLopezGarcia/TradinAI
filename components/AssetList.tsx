'use client';

import React from 'react';
import { Asset } from '@/lib/types';
import { Heart, TrendingUp, TrendingDown } from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
  selectedAsset: Asset | null;
  onSelectAsset: (asset: Asset) => void;
  onToggleFavorite: (symbol: string) => void;
  groupByType?: boolean;
}

export function AssetList({
  assets,
  selectedAsset,
  onSelectAsset,
  onToggleFavorite,
  groupByType = false,
}: AssetListProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stock':
        return '📈 Acciones';
      case 'crypto':
        return '🪙 Criptomonedas';
      case 'forex':
        return '💱 Forex';
      default:
        return type;
    }
  };

  if (groupByType) {
    const grouped = assets.reduce(
      (acc, asset) => {
        if (!acc[asset.type]) acc[asset.type] = [];
        acc[asset.type].push(asset);
        return acc;
      },
      {} as Record<string, Asset[]>
    );

    return (
      <>
        {Object.entries(grouped).map(([type, typeAssets]) => (
          <div key={type} className="mb-6">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">
              {getTypeLabel(type)}
            </h4>
            <div className="space-y-1">
              {typeAssets.map((asset) => (
                <AssetListItem
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAsset?.id === asset.id}
                  onSelect={onSelectAsset}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <div className="space-y-1">
      {assets.map((asset) => (
        <AssetListItem
          key={asset.id}
          asset={asset}
          isSelected={selectedAsset?.id === asset.id}
          onSelect={onSelectAsset}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

interface AssetListItemProps {
  asset: Asset;
  isSelected: boolean;
  onSelect: (asset: Asset) => void;
  onToggleFavorite: (symbol: string) => void;
}

function AssetListItem({
  asset,
  isSelected,
  onSelect,
  onToggleFavorite,
}: AssetListItemProps) {
  const isPositive = asset.changePercent >= 0;

  return (
    <button
      onClick={() => onSelect(asset)}
      className={`w-full text-left px-3 py-2 rounded-lg transition-all group ${
        isSelected
          ? 'bg-primary/20 border border-primary shadow-lg shadow-primary/20'
          : 'hover:bg-muted/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{asset.symbol}</p>
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <div className="text-right">
            <p className="text-xs font-semibold">${asset.price.toFixed(2)}</p>
            <p className={`text-xs font-semibold ${isPositive ? 'text-primary' : 'text-secondary'}`}>
              {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(asset.symbol);
            }}
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/20 rounded"
            title={asset.isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
          >
            <Heart
              className={`w-4 h-4 ${
                asset.isFavorite ? 'fill-secondary text-secondary' : 'text-muted-foreground'
              }`}
            />
          </button>
        </div>
      </div>
    </button>
  );
}

