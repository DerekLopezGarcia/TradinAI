/**
 * app/api/db/alerts/[id]/route.ts
 *
 * GET: Obtener alerta por ID
 * PUT: Actualizar alerta
 * DELETE: Eliminar alerta
 * PATCH: Marcar como disparada
 */

import { NextRequest, NextResponse } from 'next/server';
import { alertServiceDB } from '@/lib/services/alertServiceDB';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const alert = await alertServiceDB.getAlertById(id);

    if (!alert) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { error: 'Error al obtener alerta' },
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
    const { target_price, trigger_percentage, is_active, frequency } = body;

    const alert = await alertServiceDB.updateAlert(id, {
      target_price,
      trigger_percentage,
      is_active,
      frequency,
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Error al actualizar alerta' },
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

    const success = await alertServiceDB.deleteAlert(id);

    if (!success) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Error al eliminar alerta' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'trigger') {
      const alert = await alertServiceDB.markAsTriggered(id);
      if (!alert) {
        return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
      }
      return NextResponse.json(alert);
    } else if (action === 'reset') {
      const alert = await alertServiceDB.resetAlert(id);
      if (!alert) {
        return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
      }
      return NextResponse.json(alert);
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error patching alert:', error);
    return NextResponse.json(
      { error: 'Error al actualizar alerta' },
      { status: 500 }
    );
  }
}

