/**
 * app/api/db/alerts/route.ts
 *
 * POST: Crear alerta
 * GET: Listar alertas del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { alertServiceDB } from '@/lib/services/alertServiceDB';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      symbol,
      asset_type = 'crypto',
      condition_type,
      target_price,
      trigger_percentage,
      frequency = 'once',
    } = body;

    if (!user_id || !symbol || !condition_type) {
      return NextResponse.json(
        { error: 'user_id, symbol y condition_type requeridos' },
        { status: 400 }
      );
    }

    const alert = await alertServiceDB.createAlert({
      user_id,
      symbol,
      asset_type,
      condition_type,
      target_price,
      trigger_percentage,
      frequency,
      is_active: true,
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Error al crear alerta' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const symbol = searchParams.get('symbol');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id requerido' },
        { status: 400 }
      );
    }

    let alerts;

    if (symbol) {
      alerts = await alertServiceDB.getUserSymbolAlerts(userId, symbol, limit);
    } else {
      alerts = await alertServiceDB.getUserAlerts(userId, limit);
    }

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    );
  }
}

