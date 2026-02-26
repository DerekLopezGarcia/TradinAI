import { NextRequest, NextResponse } from 'next/server';
import { generateMockAIAnalysis, generateMockAIChatResponse } from '@/lib/mockData';
import { AIAnalysisRequest, AIChatRequest } from '@/lib/types';

// POST /api/ai/analyze
export async function POST(request: NextRequest) {
  const body: AIAnalysisRequest = await request.json();
  const { symbol, timeframe, chartData } = body;

  // Simular análisis de IA
  const trends: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
  const trend = trends[Math.floor(Math.random() * trends.length)];

  const { analysis, recommendation } = generateMockAIAnalysis(symbol, trend);
  const confidence = Math.floor(Math.random() * 40) + 60;

  // Calcular soportes y resistencias
  const prices = chartData.map(c => c.close);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const avgPrice = (maxPrice + minPrice) / 2;

  const support = minPrice * 0.98;
  const resistance = maxPrice * 1.02;

  return NextResponse.json({
    analysis,
    trend,
    recommendation,
    confidence,
    support: parseFloat(support.toFixed(2)),
    resistance: parseFloat(resistance.toFixed(2)),
    keyLevels: [
      { level: support, type: 'support' as const },
      { level: avgPrice, type: 'support' as const },
      { level: resistance, type: 'resistance' as const },
    ],
    timestamp: Date.now(),
  });
}

// Ruta para chat (si se necesita un endpoint GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const message = searchParams.get('message') || '';
  const symbol = searchParams.get('symbol') || '';

  const response = generateMockAIChatResponse(message, symbol);

  return NextResponse.json({
    response,
    timestamp: Date.now(),
  });
}

