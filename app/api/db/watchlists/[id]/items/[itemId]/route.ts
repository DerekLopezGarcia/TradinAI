/**
 * app/api/db/watchlists/[id]/items/[itemId]/route.ts
 *
 * DELETE: Remover item de watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { watchlistService } from '@/lib/services/watchlistService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;

    const success = await watchlistService.removeWatchlistItem(itemId);

    if (!success) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, itemId });
  } catch (error) {
    console.error('Error removing watchlist item:', error);
    return NextResponse.json(
      { error: 'Error al remover item' },
      { status: 500 }
    );
  }
}

