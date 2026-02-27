'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMarketStore } from '@/lib/store';
import { TimeFrame } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  Heart,
  Menu,
  X,
  Settings,
  Bell,
  MessageSquare,
  Moon,
  Sun
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { selectedAsset, setSelectedAsset, assets, darkMode, setDarkMode, toggleFavorite } = useMarketStore();
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
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
    <header className="glass sticky top-0 z-50 backdrop-blur-xl">
      <div className="px-6 py-4">
        {/* Primera línea: Logo y controles */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-muted/20 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">TIA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">TradingIA</h1>
                <p className="text-xs text-muted-foreground">Análisis de Mercado con IA</p>
              </div>
            </div>
          </div>

          {/* Controles derechos */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 hover:bg-muted/20 rounded-lg transition-all duration-200 hover:scale-110"
              title="Cambiar tema"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              className="p-2.5 hover:bg-muted/20 rounded-lg transition-all duration-200 hover:scale-110 relative"
              title="Alertas"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
            </button>
            <button
              className="p-2.5 hover:bg-muted/20 rounded-lg transition-all duration-200 hover:scale-110"
              title="Configuración"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Segunda línea: Selector de activos y precio */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Selector de activos */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted/20 transition-colors bg-muted/10"
            >
              <div className="flex flex-col text-left">
                <span className="font-semibold text-sm">{selectedAsset.symbol}</span>
                <span className="text-xs text-muted-foreground">{selectedAsset.name}</span>
              </div>
              <span className={`text-xs font-semibold ${isPositive ? 'price-up' : 'price-down'}`}>
                {isPositive ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
              </span>
            </button>

            {/* Dropdown de activos */}
            {isAssetDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 glass rounded-lg p-4 z-50 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                  <button className="px-2 py-1 rounded bg-primary/20 text-primary font-semibold">Todos</button>
                  <button className="px-2 py-1 rounded hover:bg-muted/20">Stocks</button>
                  <button className="px-2 py-1 rounded hover:bg-muted/20">Crypto</button>
                </div>

                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setIsAssetDropdownOpen(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 cursor-pointer transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{asset.symbol}</div>
                      <div className="text-xs text-muted-foreground">{asset.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-semibold">${asset.price.toFixed(2)}</div>
                        <div className={`text-xs ${asset.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                          {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(asset.symbol);
                        }}
                        className="p-1 rounded hover:bg-muted/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart
                          className={`w-4 h-4 ${asset.isFavorite ? 'fill-secondary text-secondary' : ''}`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Información de precio */}
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio Actual</p>
              <p className="text-2xl font-bold">${selectedAsset.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cambio</p>
              <p className={`text-2xl font-bold flex items-center gap-2 ${isPositive ? 'price-up' : 'price-down'}`}>
                {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                {isPositive ? '+' : ''}{selectedAsset.change.toFixed(2)} ({selectedAsset.changePercent.toFixed(2)}%)
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

const TimeFrameSelectorComponent = ({ selectedTimeframe, onSelect }: TimeFrameSelectorProps) => {
  const timeframes = useMemo(() => ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const, []);

  const handleSelect = useCallback((tf: TimeFrame) => {
    onSelect(tf);
  }, [onSelect]);

  return (
    <div className="flex gap-2 flex-wrap">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => handleSelect(tf)}
          className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
            selectedTimeframe === tf
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/20 hover:bg-muted/40'
          }`}
        >
          {tf.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export const TimeFrameSelector = React.memo(TimeFrameSelectorComponent);

