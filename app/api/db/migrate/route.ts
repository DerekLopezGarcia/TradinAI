/**
 * app/api/db/migrate/route.ts
 *
 * POST: Migrar datos de localStorage a PostgreSQL
 * GET: Exportar datos de usuario para backup
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrationService } from '@/lib/services/migrationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'migrate') {
      if (!data) {
        return NextResponse.json(
          { error: 'Datos de migración requeridos' },
          { status: 400 }
        );
      }

      const result = await migrationService.migrateUserData(data);

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    } else if (action === 'create-demo') {
      const demoUserId = await migrationService.createDemoUser();

      return NextResponse.json({
        success: true,
        userId: demoUserId,
        email: 'demo@tradingIA.com',
        message: 'Usuario de demostración creado',
      });
    } else {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error en migración:', error);
    return NextResponse.json(
      { error: 'Error en migración' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const action = searchParams.get('action');

    if (action === 'export') {
      if (!userId) {
        return NextResponse.json(
          { error: 'user_id requerido' },
          { status: 400 }
        );
      }

      const exportedData = await migrationService.exportUserData(userId);

      return NextResponse.json(exportedData);
    } else if (action === 'create-demo') {
      const demoUserId = await migrationService.createDemoUser();

      return NextResponse.json({
        success: true,
        userId: demoUserId,
        email: 'demo@tradingIA.com',
      });
    } else {
      return NextResponse.json(
        { error: 'Acción no especificada' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error en migración:', error);
    return NextResponse.json(
      { error: 'Error en migración' },
      { status: 500 }
    );
  }
}

