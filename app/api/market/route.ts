import { NextRequest, NextResponse } from 'next/server';
import { generateMockCandleData, getNewsByAsset, generateMockAIAnalysis } from '@/lib/mockData';
import { TimeFrame } from '@/lib/types';

// GET /api/market/price?symbol=BTCUSD
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'BTCUSD';
  const type = searchParams.get('type') || 'price';

  if (type === 'history') {
    const interval = (searchParams.get('interval') || '1h') as TimeFrame;
    const data = generateMockCandleData(symbol, interval, 60);

    return NextResponse.json({
      symbol,
      interval,
      data,
      timestamp: Date.now(),
    });
  }

  if (type === 'news') {
    const news = getNewsByAsset(symbol);

    return NextResponse.json({
      symbol,
      news,
      timestamp: Date.now(),
    });
  }

  // Default: price
  const prices: Record<string, number> = {
    'BTCUSD': 42350,
    'ETHUSD': 2250,
    'AAPL': 192,
    'GOOGL': 138,
    'TSLA': 242,
    'EURUSD': 1.0945,
    'GBPUSD': 1.2685,
  };

  const price = prices[symbol] || 100;
  const change = (Math.random() - 0.5) * 100;
  const changePercent = (change / price) * 100;

  return NextResponse.json({
    symbol,
    price,
    change,
    changePercent,
    timestamp: Date.now(),
  });
}

