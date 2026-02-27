// Tipos de datos para la aplicación

export type AssetType = 'stock' | 'crypto' | 'forex' | 'index' | 'commodity';
export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type AlertType = 'price_above' | 'price_below' | 'sma_cross' | 'ema_cross';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  change: number;
  changePercent: number;
  isFavorite: boolean;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Indicator {
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB';
  period?: number;
  values: number[];
}

export interface Analysis {
  id: string;
  symbol: string;
  timeframe: TimeFrame;
  timestamp: number;
  analysis: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  recommendation: string;
  confidence: number;
  support: number;
  resistance: number;
  relatedNews?: NewsItem[];
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  timestamp: number;
  sentiment: Sentiment;
  relevantAssets: string[];
  imageUrl?: string;
}

export interface Alert {
  id: string;
  symbol: string;
  type: AlertType;
  value: number;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: {
    symbol?: string;
    timeframe?: TimeFrame;
    analysisId?: string;
  };
}

export interface MarketState {
  assets: Asset[];
  selectedAsset: Asset | null;
  selectedTimeframe: TimeFrame;
  darkMode: boolean;
  favorites: string[];
}

export interface MarketDataResponse {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface ChartDataResponse {
  symbol: string;
  interval: TimeFrame;
  data: CandleData[];
  timestamp: number;
}

export interface AIAnalysisRequest {
  symbol: string;
  timeframe: TimeFrame;
  chartData: CandleData[];
  indicators: Indicator[];
  pastAnalysis?: Analysis[];
}

export interface AIAnalysisResponse {
  analysis: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  recommendation: string;
  confidence: number;
  support: number;
  resistance: number;
  keyLevels: { level: number; type: 'support' | 'resistance' }[];
}

export interface AIChartRequest {
  symbol: string;
  timeframe: TimeFrame;
  currentPrice: number;
  chartData: CandleData[];
  indicators: Indicator[];
}

export interface AIChatRequest {
  message: string;
  symbol?: string;
  timeframe?: TimeFrame;
  chatHistory?: ChatMessage[];
}

export interface AIChatResponse {
  response: string;
  relatedNews?: NewsItem[];
  suggestedAssets?: string[];
}

// ==================== TIPOS PARA DATOS EN TIEMPO REAL ====================

/**
 * Estado de conexión a WebSocket o servicio en tiempo real
 */
export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastUpdate: number | null;
  message?: string;
}

/**
 * Precio en tiempo real de un activo
 * Se utiliza para WebSocket y actualizaciones de precio en vivo
 */
export interface RealtimePrice {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
}

/**
 * Interfaz para caché de datos de mercado
 * Proporciona métodos para almacenar y recuperar datos con TTL
 */
export interface MarketCache {
  /**
   * Obtiene un valor del caché
   * @param key - Clave del caché
   * @returns Valor cacheado o null si no existe o ha expirado
   */
  get: <T>(key: string) => T | null;

  /**
   * Establece un valor en el caché
   * @param key - Clave del caché
   * @param value - Valor a almacenar
   * @param ttl - Tiempo de vida en milisegundos (opcional)
   */
  set: <T>(key: string, value: T, ttl?: number) => void;

  /**
   * Limpia el caché
   * @param key - Clave específica a limpiar (opcional). Si no se proporciona, limpia todo
   */
  clear: (key?: string) => void;
}

