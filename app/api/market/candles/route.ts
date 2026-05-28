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
import {
  BinanceProvider,
  TwelveDataProvider,
  YahooFinanceProvider,
  QuandlProvider,
  CoinGeckoProvider
} from '@/lib/services/dataProviders';

// Registrar proveedores al iniciar - DIRECTO SIN REQUIRE
let providersInitialized = false;

function initializeProviders() {
  if (!providersInitialized) {
    try {
      // Registrar cada proveedor directamente
      providerManager.register(new BinanceProvider());
      providerManager.register(new TwelveDataProvider());
      providerManager.register(new YahooFinanceProvider());
      providerManager.register(new QuandlProvider());
      providerManager.register(new CoinGeckoProvider());
      
      console.log('✅ Providers initialized successfully');
      providersInitialized = true;
    } catch (error) {
      console.error('❌ Error initializing providers:', error);
      providersInitialized = false;
      throw error;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSD';
    const interval = (searchParams.get('interval') || '1h') as TimeFrame;

    // Validar entrada
    if (!validateSymbol(symbol)) {
      console.warn(`❌ Invalid symbol: ${symbol}`);
      return NextResponse.json(
        { error: 'Invalid symbol', symbol },
        { status: 400 }
      );
    }

    const validIntervals: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
    if (!validIntervals.includes(interval)) {
      console.warn(`❌ Invalid interval: ${interval}`);
      return NextResponse.json(
        { error: 'Invalid interval', interval },
        { status: 400 }
      );
    }

    // Detectar tipo de activo
    const assetType = detectAssetType(symbol);

    console.log(`📊 /api/market/candles: ${symbol} (${assetType}) [${interval}]`);

    // Inicializar proveedores
    try {
      initializeProviders();
    } catch (initError) {
      console.error('❌ Failed to initialize providers:', initError);
      return NextResponse.json(
        { error: 'Provider initialization failed', details: String(initError) },
        { status: 500 }
      );
    }

    console.log(`✅ Providers initialized, attempting to fetch data...`);

    // Intentar obtener datos de los proveedores disponibles
    const result = await providerManager.fetchFromProviders(symbol, assetType, interval);

    if (!result) {
      console.warn(`❌ No data available for ${symbol} after trying all providers`);
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

