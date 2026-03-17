'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMarketStore } from '@/lib/store';
import { TimeFrame } from '@/lib/types';
import { TrendingUp, TrendingDown, Heart, Menu, Bell, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { selectedAsset, setSelectedAsset, assets, toggleFavorite } = useMarketStore();
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  if (!selectedAsset) return null;

  const isPositive = selectedAsset.changePercent >= 0;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-muted"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">TIA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TradinAI</h1>
                <p className="text-xs text-muted-foreground">Análisis con IA</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-lg transition-colors hover:bg-muted relative">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-muted">
              <Settings className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors bg-muted/30"
            >
              <div className="text-left">
                <span className="font-semibold text-foreground">{selectedAsset.symbol}</span>
                <span className="text-xs text-muted-foreground ml-2">{selectedAsset.name}</span>
              </div>
              <span className={`text-sm font-semibold ${isPositive ? 'price-up' : 'price-down'}`}>
                {isPositive ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
              </span>
            </button>

            {isAssetDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-lg p-2 z-50 max-h-96 overflow-y-auto shadow-xl">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => { setSelectedAsset(asset); setIsAssetDropdownOpen(false); }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{asset.symbol}</div>
                      <div className="text-xs text-muted-foreground">{asset.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">${asset.price.toFixed(2)}</div>
                        <div className={`text-xs ${asset.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                          {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.symbol); }}
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <Heart className={`w-4 h-4 transition-colors ${asset.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Precio</p>
              <p className="text-2xl font-bold text-foreground">${selectedAsset.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cambio</p>
              <p className={`text-lg font-bold flex items-center gap-1 ${isPositive ? 'price-up' : 'price-down'}`}>
                {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {isPositive ? '+' : ''}{selectedAsset.change.toFixed(2)}
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
