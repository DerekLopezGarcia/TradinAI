import { NextRequest, NextResponse } from 'next/server';
import { AIAnalysisRequest, AIChatRequest } from '@/lib/types';

/**
 * API de Análisis de IA - Proporciona análisis técnico y conversación de mercado
 * Endpoints:
 * - POST /api/ai - Análisis técnico de gráficos
 * - GET /api/ai - Chat de análisis de mercado
 */

// ==================== CONFIGURACIÓN ====================

/**
 * Prompt del sistema para análisis técnico financiero
 * Define el comportamiento y formato de respuestas de la IA
 */
const SYSTEM_PROMPT = `Eres un analista financiero experto con acceso a datos de mercado en tiempo real.

Tu trabajo es:
1. Analizar gráficos de precios e identificar tendencias
2. Detectar niveles de soporte y resistencia
3. Evaluar el sentimiento basándote en noticias
4. Proporcionar recomendaciones de trading con nivel de confianza
5. Explicar el razonamiento detrás de cada análisis

IMPORTANTES:
- Responde siempre en español
- Proporciona análisis técnicos precisos y accionables
- Sé conciso pero completo
- Incluye siempre niveles clave de precio
- Evalúa el nivel de riesgo
- Justifica tu recomendación

FORMATO DE RESPUESTA REQUERIDO (JSON):
{
  "analysis": "Análisis técnico detallado en 2-3 párrafos",
  "trend": "bullish|bearish|neutral",
  "recommendation": "strong_buy|buy|hold|sell|strong_sell",
  "confidence": 0-100,
  "riskLevel": "low|medium|high",
  "reasoning": "Explicación concisa del análisis",
  "keyLevels": [
    { "level": número, "type": "support|resistance" }
  ]
}`;

/**
 * Prompt para conversación de chat
 */
const CHAT_SYSTEM_PROMPT = `Eres un asistente especializado en análisis financiero y mercados de valores.
Proporciona información útil, análisis y educación sobre trading y inversión.
Responde siempre en español de manera profesional pero accesible.
Si se menciona un símbolo específico, proporciona contexto de mercado relevante.`;

// ==================== TIPOS ====================

interface PriceSummary {
  current: number;
  high: number;
  low: number;
  avgVolume: number;
  range: number;
  volatility: number;
}

interface NewsItem {
  title: string;
  snippet: string;
  source?: string;
  url?: string;
}

interface AIAnalysisResponse {
  analysis: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  recommendation: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  support: number;
  resistance: number;
  keyLevels: Array<{ level: number; type: 'support' | 'resistance' }>;
  relatedNews?: NewsItem[];
  timestamp: number;
}

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Calcula estadísticas del precio a partir de datos de velas
 * @param chartData - Array de datos de velas
 * @returns Resumen de precios
 */
function calculatePriceSummary(chartData: any[]): PriceSummary {
  const recentData = chartData.slice(-50);

  if (recentData.length === 0) {
    return {
      current: 0,
      high: 0,
      low: 0,
      avgVolume: 0,
      range: 0,
      volatility: 0,
    };
  }

  const current = recentData[recentData.length - 1]?.close || 0;
  const high = Math.max(...recentData.map(d => d.high));
  const low = Math.min(...recentData.map(d => d.low));
  const avgVolume = recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length;
  const range = high - low;

  // Volatilidad = desviación estándar / media
  const mean = recentData.reduce((sum, d) => sum + d.close, 0) / recentData.length;
  const variance = recentData.reduce((sum, d) => sum + Math.pow(d.close - mean, 2), 0) / recentData.length;
  const volatility = Math.sqrt(variance) / mean;

  return {
    current,
    high,
    low,
    avgVolume,
    range,
    volatility,
  };
}

/**
 * Formatea un resumen de precios para el prompt
 * @param summary - Resumen de precios
 * @returns String formateado
 */
function formatPriceSummary(summary: PriceSummary): string {
  return `- Precio actual: $${summary.current.toFixed(2)}
- Máximo reciente: $${summary.high.toFixed(2)}
- Mínimo reciente: $${summary.low.toFixed(2)}
- Rango: $${summary.range.toFixed(2)}
- Volatilidad: ${(summary.volatility * 100).toFixed(2)}%
- Volumen promedio: ${(summary.avgVolume / 1e6).toFixed(2)}M`;
}

/**
 * Formatea noticias para el prompt
 * @param news - Array de noticias
 * @returns String formateado
 */
function formatNewsContext(news: NewsItem[]): string {
  if (!news || news.length === 0) {
    return 'No hay noticias recientes disponibles.';
  }

  return news
    .map((item, idx) => `${idx + 1}. ${item.title}: ${item.snippet}`)
    .join('\n');
}

/**
 * Extrae JSON de una respuesta de texto
 * @param text - Texto que contiene JSON
 * @returns Objeto parseado o null
 */
function extractJSON(text: string): Record<string, any> | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}

/**
 * Valida y normaliza una respuesta de análisis
 * @param parsed - Objeto parseado de IA
 * @param priceSummary - Resumen de precios
 * @returns Respuesta validada
 */
function normalizeAnalysisResponse(
  parsed: Record<string, any>,
  priceSummary: PriceSummary
): Partial<AIAnalysisResponse> {
  const trend = ['bullish', 'bearish', 'neutral'].includes(parsed.trend)
    ? parsed.trend
    : 'neutral';

  const recommendations = ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'];
  const recommendation = recommendations.includes(parsed.recommendation)
    ? parsed.recommendation
    : 'hold';

  const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 70));
  const riskLevel = ['low', 'medium', 'high'].includes(parsed.riskLevel)
    ? parsed.riskLevel
    : 'medium';

  return {
    analysis: parsed.analysis || 'Análisis no disponible',
    trend: trend as any,
    recommendation,
    confidence,
    riskLevel: riskLevel as any,
    support: priceSummary.low * 0.98,
    resistance: priceSummary.high * 1.02,
    keyLevels: Array.isArray(parsed.keyLevels)
      ? parsed.keyLevels
      : [
          { level: priceSummary.low * 0.98, type: 'support' as const },
          { level: priceSummary.high * 1.02, type: 'resistance' as const },
        ],
  };
}

// ==================== MANEJO DE BUSQUEDA WEB ====================

/**
 * Simula búsqueda web (en producción usaría web_search real)
 * @param query - Término de búsqueda
 * @param num - Número de resultados
 * @returns Array de noticias
 */
async function searchNews(query: string, num: number = 5): Promise<NewsItem[]> {
  try {
    // En desarrollo/sin SDK, simular resultados
    // En producción, usar: const zai = await ZAI.create();
    // const results = await zai.functions.invoke('web_search', { query, num });

    return [
      {
        title: `Análisis de ${query} - Movimientos recientes`,
        snippet: 'Datos de mercado actualizados mostrando tendencias significativas.',
      },
      {
        title: `${query} mantiene fortaleza en sesión de trading`,
        snippet: 'El activo continúa con momentum positivo según analistas.',
      },
      {
        title: `Factores macroeconomómicos afectan ${query}`,
        snippet: 'Indicadores económicos influyen en la dirección del precio.',
      },
    ];
  } catch (error) {
    console.error('Error buscando noticias:', error);
    return [];
  }
}

/**
 * Genera análisis usando IA (con fallback)
 * @param prompt - Prompt para la IA
 * @returns Respuesta de la IA
 */
async function generateAIAnalysis(prompt: string): Promise<string> {
  try {
    // En desarrollo/sin SDK, retornar respuesta por defecto
    // En producción, usar:
    // const zai = await ZAI.create();
    // const completion = await zai.chat.completions.create({
    //   messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    //   temperature: 0.7,
    //   max_tokens: 1000
    // });

    // Respuesta por defecto para desarrollo
    return JSON.stringify({
      analysis:
        'El activo muestra una tendencia alcista con soporte establecido en los niveles recientes. La volatilidad se mantiene dentro de parámetros normales.',
      trend: 'bullish',
      recommendation: 'buy',
      confidence: 75,
      riskLevel: 'medium',
      reasoning: 'La convergencia de indicadores técnicos sugiere continuación alcista',
      keyLevels: [
        { level: 40000, type: 'support' },
        { level: 45000, type: 'resistance' },
      ],
    });
  } catch (error) {
    console.error('Error generando análisis de IA:', error);
    throw error;
  }
}

// ==================== HANDLERS ====================

/**
 * POST /api/ai
 *
 * Análisis técnico de gráficos usando IA
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AIAnalysisRequest = await request.json();
    const { symbol, timeframe, chartData } = body;

    // Validar entrada
    if (!symbol || !chartData || chartData.length === 0) {
      return NextResponse.json(
        { error: 'Symbol y chartData son requeridos' },
        { status: 400 }
      );
    }

    // Calcular estadísticas del precio
    const priceSummary = calculatePriceSummary(chartData);

    // Buscar noticias recientes
    const news = await searchNews(`${symbol} stock news analysis`, 5);

    // Preparar últimas 10 velas para el análisis
    const recentCandles = chartData.slice(-10);

    // Construir prompt detallado
    const analysisPrompt = `Analiza ${symbol} en timeframe ${timeframe}:

DATOS ACTUALES:
${formatPriceSummary(priceSummary)}

NOTICIAS RECIENTES:
${formatNewsContext(news)}

ÚLTIMAS 10 VELAS:
${JSON.stringify(recentCandles, null, 2)}

Proporciona un análisis técnico completo con recomendación en formato JSON.`;

    // Generar análisis con IA
    const aiResponse = await generateAIAnalysis(analysisPrompt);

    // Parsear respuesta
    const parsed = extractJSON(aiResponse) || {};
    const normalized = normalizeAnalysisResponse(parsed, priceSummary);

    const response: AIAnalysisResponse = {
      analysis: normalized.analysis || '',
      trend: (normalized.trend as any) || 'neutral',
      recommendation: normalized.recommendation || 'hold',
      confidence: normalized.confidence || 70,
      riskLevel: (normalized.riskLevel as any) || 'medium',
      support: normalized.support || priceSummary.low * 0.98,
      resistance: normalized.resistance || priceSummary.high * 1.02,
      keyLevels: normalized.keyLevels || [
        { level: priceSummary.low * 0.98, type: 'support' },
        { level: priceSummary.high * 1.02, type: 'resistance' },
      ],
      relatedNews: news.slice(0, 3),
      timestamp: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI analysis error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        error: 'Failed to analyze',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai
 *
 * Chat de análisis de mercado con contexto web
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const message = searchParams.get('message') || '';
    const symbol = searchParams.get('symbol') || '';

    // Validar entrada
    if (!message) {
      return NextResponse.json(
        { error: 'Message parameter is required' },
        { status: 400 }
      );
    }

    // Buscar contexto web
    const context = await searchNews(
      symbol ? `${symbol} ${message}` : message,
      3
    );

    // Construir prompt para chat
    const chatPrompt = `${symbol ? `Pregunta sobre ${symbol}: ` : ''}${message}

Contexto de noticias:
${formatNewsContext(context)}

Responde de manera profesional y educativa.`;

    // Generar respuesta de chat
    const completion = await generateAIAnalysis(chatPrompt);

    // Extraer contenido (puede ser JSON o texto plano)
    const parsed = extractJSON(completion);
    const responseText = parsed?.analysis || parsed?.response || completion;

    return NextResponse.json({
      response: responseText,
      relatedNews: context.slice(0, 2),
      symbol: symbol || undefined,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('AI chat error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        response: 'Lo siento, no pude procesar tu solicitud. Intenta de nuevo.',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

