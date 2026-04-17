/**
 * app/api/db/watchlists/[id]/items/route.ts
 *
 * POST: Agregar item a watchlist
 * GET: Obtener items de watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { watchlistService } from '@/lib/services/watchlistService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const items = await watchlistService.getWatchlistItems(id);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching watchlist items:', error);
    return NextResponse.json(
      { error: 'Error al obtener items' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { symbol, asset_type = 'crypto' } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'symbol requerido' },
        { status: 400 }
      );
    }

    const item = await watchlistService.addWatchlistItem(id, symbol, asset_type);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error adding watchlist item:', error);
    return NextResponse.json(
      { error: 'Error al agregar item' },
      { status: 500 }
    );
  }
}

