/**
 * app/api/db/watchlists/route.ts
 *
 * POST: Crear watchlist
 * GET: Listar watchlists del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { watchlistService } from '@/lib/services/watchlistService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, name, description, is_default = false } = body;

    if (!user_id || !name) {
      return NextResponse.json(
        { error: 'user_id y name requeridos' },
        { status: 400 }
      );
    }

    const watchlist = await watchlistService.createWatchlist({
      user_id,
      name,
      description,
      is_default,
    });

    return NextResponse.json(watchlist, { status: 201 });
  } catch (error) {
    console.error('Error creating watchlist:', error);
    return NextResponse.json(
      { error: 'Error al crear watchlist' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id requerido' },
        { status: 400 }
      );
    }

    const watchlists = await watchlistService.getUserWatchlists(userId);

    return NextResponse.json(watchlists);
  } catch (error) {
    console.error('Error fetching watchlists:', error);
    return NextResponse.json(
      { error: 'Error al obtener watchlists' },
      { status: 500 }
    );
  }
}

