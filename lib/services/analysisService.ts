/**
 * lib/services/analysisService.ts
 *
 * AnalysisService - Operaciones CRUD para análisis técnicos históricos
 * Extiende DatabaseService
 */

import { DatabaseService } from './databaseService';

export interface Analysis {
  id: string;
  user_id: string;
  symbol: string;
  asset_type: 'crypto' | 'stock' | 'forex' | 'commodity';
  timeframe: string;
  analysis_data: Record<string, any>;
  confidence: number; // 0.00 - 1.00
  patterns_detected?: string[];
  recommendation?: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  created_at: string;
  updated_at: string;
}

export interface HistoricalPrice {
  id: string;
  symbol: string;
  asset_type: 'crypto' | 'stock' | 'forex' | 'commodity';
  timeframe: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  timestamp: string;
  source: string;
  created_at: string;
}

export class AnalysisService extends DatabaseService {
  constructor() {
    super();
    this.logger.info('AnalysisService initialized');
  }

  /**
   * Guardar análisis
   */
  async saveAnalysis(data: Omit<Analysis, 'id' | 'created_at' | 'updated_at'>): Promise<Analysis> {
    return this.create<Analysis>('analyses', {
      ...data,
      id: '',
    } as any);
  }

  /**
   * Obtener análisis por ID
   */
  async getAnalysisById(analysisId: string): Promise<Analysis | null> {
    return this.findById<Analysis>('analyses', analysisId);
  }

  /**
   * Obtener análisis recientes de usuario
   */
  async getUserAnalyses(userId: string, limit: number = 50): Promise<Analysis[]> {
    return this.query_where<Analysis>(
      'analyses',
      'user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
  }

  /**
   * Obtener análisis por símbolo
   */
  async getAnalysesBySymbol(symbol: string, limit: number = 20): Promise<Analysis[]> {
    return this.query_where<Analysis>(
      'analyses',
      'symbol = $1 ORDER BY created_at DESC LIMIT $2',
      [symbol, limit]
    );
  }

  /**
   * Obtener análisis por símbolo y timeframe
   */
  async getAnalysisBySymbolAndTimeframe(
    symbol: string,
    timeframe: string
  ): Promise<Analysis | null> {
    const result = await this.query_where<Analysis>(
      'analyses',
      'symbol = $1 AND timeframe = $2 ORDER BY created_at DESC LIMIT 1',
      [symbol, timeframe]
    );
    return result[0] || null;
  }

  /**
   * Actualizar análisis
   */
  async updateAnalysis(analysisId: string, updates: Partial<Analysis>): Promise<Analysis | null> {
    return this.update<Analysis>('analyses', analysisId, updates);
  }

  /**
   * Eliminar análisis
   */
  async deleteAnalysis(analysisId: string): Promise<boolean> {
    return this.delete('analyses', analysisId);
  }

  /**
   * Obtener análisis por confianza mínima
   */
  async getAnalysesByMinConfidence(minConfidence: number): Promise<Analysis[]> {
    return this.query_where<Analysis>(
      'analyses',
      'confidence >= $1 ORDER BY confidence DESC',
      [minConfidence]
    );
  }

  /**
   * Guardar precio histórico
   */
  async saveHistoricalPrice(data: Omit<HistoricalPrice, 'id' | 'created_at'>): Promise<HistoricalPrice> {
    return this.create<HistoricalPrice>('historical_prices', {
      ...data,
      id: '',
    } as any);
  }

  /**
   * Obtener precios históricos
   */
  async getHistoricalPrices(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<HistoricalPrice[]> {
    return this.query_where<HistoricalPrice>(
      'historical_prices',
      'symbol = $1 AND timeframe = $2 ORDER BY timestamp DESC LIMIT $3',
      [symbol, timeframe, limit]
    );
  }

  /**
   * Obtener precios históricos entre fechas
   */
  async getPricesBetweenDates(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalPrice[]> {
    return this.query_where<HistoricalPrice>(
      'historical_prices',
      'symbol = $1 AND timestamp BETWEEN $2 AND $3 ORDER BY timestamp ASC',
      [symbol, startDate, endDate]
    );
  }

  /**
   * Limpiar precios históricos antiguos (>30 días)
   */
  async cleanOldPrices(daysOld: number = 30): Promise<number> {
    const sql = `
      DELETE FROM historical_prices
      WHERE timestamp < NOW() - INTERVAL '${daysOld} days'
      RETURNING id
    `;
    const result = await this.execute<{ id: string }>(sql);
    return result.length;
  }

  /**
   * Obtener resumen de análisis por usuario
   */
  async getUserAnalysisSummary(userId: string): Promise<{
    total_analyses: number;
    avg_confidence: number;
    latest_analysis: Analysis | null;
  }> {
    const summary = await this.query<any>(
      `SELECT
        COUNT(*) as total_analyses,
        AVG(confidence) as avg_confidence,
        MAX(created_at) as latest_analysis_date
      FROM analyses
      WHERE user_id = $1`,
      [userId],
      { cache: false }
    );

    const latest = await this.query_where<Analysis>(
      'analyses',
      'user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    return {
      total_analyses: parseInt(summary[0]?.total_analyses || '0', 10),
      avg_confidence: parseFloat(summary[0]?.avg_confidence || '0'),
      latest_analysis: latest[0] || null,
    };
  }

  /**
   * Transacción: Guardar análisis con precios históricos
   */
  async saveAnalysisWithPrices(
    analysisData: Omit<Analysis, 'id' | 'created_at' | 'updated_at'>,
    prices: Array<Omit<HistoricalPrice, 'id' | 'created_at'>>
  ): Promise<Analysis> {
    return this.transaction(async (executeQuery) => {
      // Guardar análisis
      const analysisSql = `
        INSERT INTO analyses 
        (user_id, symbol, asset_type, timeframe, analysis_data, confidence, patterns_detected, recommendation)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const analysisResult = await executeQuery(analysisSql, [
        analysisData.user_id,
        analysisData.symbol,
        analysisData.asset_type,
        analysisData.timeframe,
        JSON.stringify(analysisData.analysis_data),
        analysisData.confidence,
        JSON.stringify(analysisData.patterns_detected || []),
        analysisData.recommendation,
      ]);

      const analysis = analysisResult[0] as Analysis;

      // Guardar precios
      for (const price of prices) {
        const priceSql = `
          INSERT INTO historical_prices 
          (symbol, asset_type, timeframe, open_price, high_price, low_price, close_price, volume, timestamp, source)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        await executeQuery(priceSql, [
          price.symbol,
          price.asset_type,
          price.timeframe,
          price.open_price,
          price.high_price,
          price.low_price,
          price.close_price,
          price.volume,
          price.timestamp,
          price.source,
        ]);
      }

      return analysis;
    });
  }
}

export const analysisService = new AnalysisService();

