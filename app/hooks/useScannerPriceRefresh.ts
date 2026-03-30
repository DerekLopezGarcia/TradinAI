'use client';

import { useEffect } from 'react';
import { useMarketStore } from '@/lib/store';
import { getAssetsByCategory, getCategories } from '@/lib/scannerAssets';

/**
 * Hook para actualizar automáticamente los precios de activos del scanner
 * Refresca cada 30 segundos
 */
export function useScannerPriceRefresh() {
  const { addOrUpdateAssetPrice } = useMarketStore();

  useEffect(() => {
    // Función para refrescar precios
    const refreshPrices = async () => {
      const allSymbols = new Set<string>();
      
      // Recopilar todos los símbolos únicos
      for (const category of getCategories()) {
        const symbols = getAssetsByCategory(category);
        symbols.forEach(s => allSymbols.add(s));
      }

      // Actualizar precios
      await Promise.allSettled(
        Array.from(allSymbols).map(async (symbol) => {
          try {
            const res = await fetch(`/api/market?symbol=${symbol}&type=price`);
            if (!res.ok) return;
            const d = await res.json();
            if (d.price && !isNaN(d.price)) {
              addOrUpdateAssetPrice(symbol, symbol, d.price, d.change ?? 0, d.changePercent ?? 0, 'crypto');
            }
          } catch { /* ignorar */ }
        })
      );
    };

    // Ejecutar inmediatamente
    refreshPrices();

    // Luego cada 30 segundos
    const interval = setInterval(refreshPrices, 30000);

    return () => clearInterval(interval);
  }, [addOrUpdateAssetPrice]);
}

