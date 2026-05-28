'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMarketStore } from '@/lib/store';
import { TimeFrame } from '@/lib/types';
import { TrendingUp, TrendingDown, Heart, Sparkles, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationPanel } from '@/components/NotificationPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useTranslation } from '@/lib/i18n/useTranslation';


export function Header() {
  const { selectedAsset, setSelectedAsset, assets, toggleFavorite } = useMarketStore();
  const { t } = useTranslation();
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [failedAssets, setFailedAssets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const assetListRef = useRef<HTMLDivElement>(null);

  const filteredAssets = useMemo(() => {
    if (!searchQuery) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter(
      (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [assets, searchQuery]);

  const assetVirtualizer = useVirtualizer({
    count: filteredAssets.length,
    getScrollElement: () => assetListRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  // Subscribirse a cambios del selectedAsset para asegurar re-render
  const [displayAsset, setDisplayAsset] = useState(selectedAsset);
  
  useEffect(() => {
    // Actualizar displayAsset cuando selectedAsset cambia
    setDisplayAsset(selectedAsset);
  }, [selectedAsset?.symbol, selectedAsset?.price, selectedAsset?.changePercent]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssetDropdownOpen(false);
      }
    }
    if (isAssetDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAssetDropdownOpen]);

  // Cargar precios de todos los activos cuando se abre el dropdown
  const loadAssetPrices = async () => {
    setIsLoadingPrices(true);
    const currentFailed = new Set<string>();

    // Timeout de 18 segundos
    const timeoutId = setTimeout(() => {
      setIsLoadingPrices(false);
    }, 18000);

    try {
      await Promise.allSettled(assets.map(async (asset) => {
        try {
          const params = new URLSearchParams({
            symbol: asset.symbol.toUpperCase(),
            type: 'price'
          });
          
          const res = await fetch(`/api/market?${params.toString()}`);
          if (!res.ok) {
            currentFailed.add(asset.symbol);
            return;
          }
          const d = await res.json();
          
          // Validar que tenemos precio válido - más permisivo
          if (d?.price !== undefined && d?.price !== null && d?.price !== '') {
            const price = parseFloat(String(d.price));
            if (!isNaN(price)) {
              const change = parseFloat(String(d.change ?? 0));
              const changePercent = parseFloat(String(d.changePercent ?? 0));
              
              // Actualizar precio en el store
              const { updateAssetPrice } = useMarketStore.getState();
              updateAssetPrice(asset.symbol, price, isNaN(change) ? 0 : change, isNaN(changePercent) ? 0 : changePercent);
            } else {
              currentFailed.add(asset.symbol);
            }
          } else {
            currentFailed.add(asset.symbol);
          }
        } catch {
          currentFailed.add(asset.symbol);
        }
      }));
      
      setFailedAssets(currentFailed);
      setIsLoadingPrices(false);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleToggleDropdown = () => {
    if (!isAssetDropdownOpen && assets.length > 0) {
      loadAssetPrices();
      setSearchQuery('');
      assetVirtualizer.scrollToIndex(0);
    }
    setIsAssetDropdownOpen(!isAssetDropdownOpen);
  };

  if (!selectedAsset) return null;

  const isPositive = (displayAsset?.changePercent ?? 0) >= 0;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">TIA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TradinAI</h1>
                <p className="text-xs text-muted-foreground">{t('header.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/recommendations" className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t('header.recommendations')}
            </Link>
            <ThemeToggle />
            <NotificationPanel />
            <SettingsPanel />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleToggleDropdown}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors bg-muted/30"
            >
              <div className="text-left">
                <span className="font-semibold text-foreground">{displayAsset?.symbol}</span>
                <span className="text-xs text-muted-foreground ml-2">{displayAsset?.name}</span>
              </div>
              <span className={`text-sm font-semibold ${isPositive ? 'price-up' : 'price-down'}`}>
                {isPositive ? '+' : ''}{displayAsset?.changePercent?.toFixed(2) ?? '0.00'}%
              </span>
            </button>

            {isAssetDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-lg z-50 shadow-xl">
                <div className="p-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('header.search')}
                    className="w-full px-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div ref={assetListRef} className="overflow-y-auto" style={{ maxHeight: '384px' }}>
                  {isLoadingPrices ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('header.loadingPrices')}
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">{t('header.noResults')}</div>
                  ) : (
                    <div style={{ height: `${assetVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                      {assetVirtualizer.getVirtualItems().map((virtualItem) => {
                        const asset = filteredAssets[virtualItem.index];
                        const isFailed = failedAssets.has(asset.symbol);
                        return (
                          <div
                            key={asset.id}
                            onClick={() => {
                              if (!isFailed) {
                                setSelectedAsset(asset);
                                setIsAssetDropdownOpen(false);
                                setSearchQuery('');
                              }
                            }}
                            className={`absolute top-0 left-0 w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/50 ${isFailed ? 'opacity-60 cursor-default' : 'cursor-pointer'} transition-colors`}
                            style={{ transform: `translateY(${virtualItem.start}px)`, height: `${virtualItem.size}px` }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-foreground truncate">{asset.symbol}</div>
                              <div className="text-xs text-muted-foreground truncate">{asset.name}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <div className="text-right">
                                {isFailed ? (
                                  <div className="text-xs text-destructive font-medium">{t('header.failed')}</div>
                                ) : (
                                  <>
                                    <div className="text-sm font-medium text-foreground">${asset.price.toFixed(2)}</div>
                                    <div className={`text-xs ${asset.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                                      {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                                    </div>
                                  </>
                                )}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.symbol); }}
                                className="p-1 rounded hover:bg-muted transition-colors"
                              >
                                <Heart className={`w-4 h-4 transition-colors ${asset.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('common.price')}</p>
              <p className="text-2xl font-bold text-foreground">${displayAsset?.price?.toFixed(2) ?? '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('common.change')}</p>
              <p className={`text-lg font-bold flex items-center gap-1 ${isPositive ? 'price-up' : 'price-down'}`}>
                {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {isPositive ? '+' : ''}{displayAsset?.change?.toFixed(2) ?? '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

interface TimeFrameSelectorProps {
  selectedTimeframe: TimeFrame;
  onSelect: (timeframe: TimeFrame) => void;
}

export function TimeFrameSelector({ selectedTimeframe, onSelect }: TimeFrameSelectorProps) {
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

  return (
    <div className="flex gap-1 flex-wrap">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onSelect(tf)}
          className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
            selectedTimeframe === tf
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 hover:bg-muted text-foreground'
          }`}
        >
          {tf.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
