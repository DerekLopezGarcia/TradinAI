'use client';

import { useEffect } from 'react';
import { useMarketStore } from '@/lib/store';
import { priceCache } from '@/lib/services/priceCache';
import { validateSymbol, createSafeParams } from '@/lib/services/validationService';

/**
 * Hook para actualizar constantemente el precio del activo seleccionado
 * Se ejecuta cada 3 segundos para mantener el precio actualizado en tiempo real
 * Solo actualiza el activo seleccionado, no hace carga pesada
 */
export function useScannerPriceRefresh() {
  const { selectedAsset, addOrUpdateAssetPrice } = useMarketStore();

  useEffect(() => {
    if (!selectedAsset?.symbol || !validateSymbol(selectedAsset.symbol)) {
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    // Función para refrescar el precio del activo seleccionado
    const refreshPrice = async () => {
      if (!isMounted) return;
      
      const symbol = selectedAsset.symbol;
      
      try {
        // Validar símbolo antes de usar
        if (!validateSymbol(symbol)) {
          console.warn('Invalid symbol:', symbol);
          return;
        }

        const params = createSafeParams({
          symbol,
          type: 'price',
          // Cache busting para forzar datos frescos
          _: Date.now()
        });

        // Fetch con timeout y signal de cancelación
        const res = await fetch(`/api/market?${params.toString()}`, {
          cache: 'no-store',
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!res.ok) {
          console.warn(`Price refresh failed: ${res.status}`);
          return;
        }

        const d = await res.json();
        
        // Validar respuesta antes de usar
        if (d.price && typeof d.price === 'number' && !isNaN(d.price)) {
          // Guardar en caché para uso posterior
          priceCache.set(
            symbol,
            d.price,
            d.change ?? 0,
            d.changePercent ?? 0
          );
          
          // Actualizar en el store inmediatamente
          addOrUpdateAssetPrice(
            symbol,
            symbol,
            d.price,
            d.change ?? 0,
            d.changePercent ?? 0,
            'crypto'
          );
        }
      } catch (error) {
        // No loguear errores de cancelación (son esperados al desmontar)
        if (error instanceof Error && error.name !== 'AbortError') {
          console.debug(`Price refresh error for ${selectedAsset.symbol}:`, error);
        }
      }
    };

    // Ejecutar inmediatamente al cargar
    refreshPrice();

    // Actualizar cada 3 segundos
    const interval = setInterval(() => {
      if (isMounted) refreshPrice();
    }, 3000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, [selectedAsset?.symbol, addOrUpdateAssetPrice]);
}




