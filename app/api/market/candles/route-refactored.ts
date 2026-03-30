/**
 * API Endpoint: /api/market/candles
 * Refactorizado para usar Data Provider Factory
 * Código más limpio, mantenible y escalable
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSymbol, validateTimeFrame } from '@/lib/services/validationService';
import { TimeFrame } from '@/lib/types';
import {
  detectAssetType,
  providerManager,
  DataProviderResult
} from '@/lib/services/dataProviderFactory';
import { registerDefaultProviders } from '@/lib/services/dataProviders';

// Registrar proveedores al iniciar
let providersInitialized = false;

function initializeProviders() {
  if (!providersInitialized) {
    registerDefaultProviders();
    providersInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSD';
    const interval = (searchParams.get('interval') || '1h') as TimeFrame;

    // Validar entrada
    if (!validateSymbol(symbol)) {
      return NextResponse.json(
        { error: 'Invalid symbol', symbol },
        { status: 400 }
      );
    }

    const validIntervals: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval', interval },
        { status: 400 }
      );
    }

    // Detectar tipo de activo
    const assetType = detectAssetType(symbol);

    console.log(`📊 /api/market/candles: ${symbol} (${assetType}) [${interval}]`);

    // Inicializar proveedores
    initializeProviders();

    // Intentar obtener datos de los proveedores disponibles
    const result = await providerManager.fetchFromProviders(symbol, assetType, interval);

    if (!result) {
      console.warn(`❌ No data available for ${symbol}`);
      return NextResponse.json(
        { error: `No data available for ${symbol}`, symbol, type: assetType },
        { status: 404 }
      );
    }

    console.log(`✅ ${symbol}: ${result.candles.length} candles from ${result.source}`);

    return NextResponse.json({
      symbol,
      interval,
      type: assetType,
      count: result.candles.length,
      candles: result.candles,
      source: result.source,
      isFallback: result.isFallback,
      timestamp: result.timestamp,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ /api/market/candles error:', errorMessage);

    return NextResponse.json(
      {
        error: 'Failed to fetch candle data',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

