import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol')?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter required' }, { status: 400 });
  }

  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return NextResponse.json({ error: 'Alpaca API keys not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`,
      {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': secretKey,
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Alpaca quote HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const quote = data.quote;

    return NextResponse.json({
      symbol,
      bidPrice: quote.bid_price ? parseFloat(quote.bid_price) : 0,
      bidSize: quote.bid_size ? parseFloat(quote.bid_size) : 0,
      askPrice: quote.ask_price ? parseFloat(quote.ask_price) : 0,
      askSize: quote.ask_size ? parseFloat(quote.ask_size) : 0,
      timestamp: quote.timestamp ? Math.floor(quote.timestamp / 1000000) : Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
