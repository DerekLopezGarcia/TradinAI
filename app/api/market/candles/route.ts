import { NextRequest, NextResponse } from 'next/server';
import { binanceService } from '@/lib/services/binanceService';
import { validateSymbol } from '@/lib/services/validationService';
import { TimeFrame } from '@/lib/types';

/**
 * API para obtener velas históricas desde Binance
 * Actúa como proxy para evitar problemas de CORS en el cliente
 *
 * GET /api/market/candles?symbol=BTCUSD&interval=1h
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSD';
    const interval = (searchParams.get('interval') || '1h') as TimeFrame;

    // Validar símbolo
    if (!validateSymbol(symbol)) {
      return NextResponse.json(
        { error: 'Símbolo inválido', symbol },
        { status: 400 }
      );
    }

    // Validar intervalo
    const validIntervals: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: 'Intervalo inválido', interval },
        { status: 400 }
      );
    }

    // Obtener velas de Binance
    const candles = await binanceService.getHistoricalCandles(symbol, interval);

    if (!candles || candles.length === 0) {
      return NextResponse.json(
        {
          error: `No se obtuvieron datos para ${symbol}`,
          symbol,
          interval,
        },
        { status: 404 }
      );
    }

    // Retornar velas
    return NextResponse.json({
      symbol,
      interval,
      count: candles.length,
      candles,
      timestamp: Date.now(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    console.error('[API] Error en /api/market/candles:', errorMessage);

    return NextResponse.json(
      {
        error: 'Error al obtener velas históricas',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

