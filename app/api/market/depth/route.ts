import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol')?.toUpperCase() || 'BTCUSD';
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

  const pair = symbol.endsWith('USDT')
    ? symbol
    : symbol.endsWith('USD')
      ? symbol.slice(0, -3) + 'USDT'
      : symbol + 'USDT';

  try {
    const url = `https://api.binance.com/api/v3/depth?symbol=${pair}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Binance depth HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      symbol,
      bids: data.bids,
      asks: data.asks,
      timestamp: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
