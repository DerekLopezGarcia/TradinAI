/**
 * app/api/db/users/route.ts
 * 
 * POST: Crear usuario
 * GET: Listar usuarios
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, theme = 'dark', language = 'es' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Verificar que el usuario no existe
    const existing = await userService.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 });
    }

    const user = await userService.createUser({
      email,
      name: name || email.split('@')[0],
      theme,
      language,
      notifications_enabled: true,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const users = await userService.getAllUsers(limit);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

