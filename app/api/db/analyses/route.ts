/**
 * app/api/db/analyses/route.ts
 *
 * POST: Guardar análisis
 * GET: Obtener análisis
 */

import { NextRequest, NextResponse } from 'next/server';
import { analysisService } from '@/lib/services/analysisService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      symbol,
      asset_type = 'crypto',
      timeframe = '1h',
      analysis_data,
      confidence = 0.5,
      patterns_detected,
      recommendation,
    } = body;

    if (!user_id || !symbol || !analysis_data) {
      return NextResponse.json(
        { error: 'user_id, symbol y analysis_data requeridos' },
        { status: 400 }
      );
    }

    const analysis = await analysisService.saveAnalysis({
      user_id,
      symbol,
      asset_type,
      timeframe,
      analysis_data,
      confidence: Math.min(confidence, 1),
      patterns_detected,
      recommendation,
    });

    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    console.error('Error saving analysis:', error);
    return NextResponse.json(
      { error: 'Error al guardar análisis' },
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

    let analyses;

    if (symbol) {
      analyses = await analysisService.getAnalysesBySymbol(symbol, limit);
    } else if (userId) {
      analyses = await analysisService.getUserAnalyses(userId, limit);
    } else {
      return NextResponse.json(
        { error: 'user_id o symbol requerido' },
        { status: 400 }
      );
    }

    return NextResponse.json(analyses);
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: 'Error al obtener análisis' },
      { status: 500 }
    );
  }
}

