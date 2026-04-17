/**
 * app/api/db/watchlists/[id]/route.ts
 *
 * GET: Obtener watchlist con items
 * PUT: Actualizar watchlist
 * DELETE: Eliminar watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { watchlistService } from '@/lib/services/watchlistService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const watchlist = await watchlistService.getWatchlistById(id);

    if (!watchlist) {
      return NextResponse.json(
        { error: 'Watchlist no encontrada' },
        { status: 404 }
      );
    }

    const items = await watchlistService.getWatchlistItems(id);

    return NextResponse.json({
      ...watchlist,
      items,
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Error al obtener watchlist' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const watchlist = await watchlistService.updateWatchlist(id, body);

    if (!watchlist) {
      return NextResponse.json(
        { error: 'Watchlist no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error updating watchlist:', error);
    return NextResponse.json(
      { error: 'Error al actualizar watchlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await watchlistService.deleteWatchlist(id);
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    return NextResponse.json(
      { error: 'Error al eliminar watchlist' },
      { status: 500 }
    );
  }
}

