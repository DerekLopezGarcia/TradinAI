/**
 * lib/services/alertServiceDB.ts
 *
 * AlertService - Operaciones CRUD para alertas de precios
 * Versión con persistencia en PostgreSQL
 * Extiende DatabaseService
 */

import { DatabaseService } from './databaseService';

export type AlertConditionType = 'price_above' | 'price_below' | 'percent_change' | 'technical_signal';
export type AlertFrequency = 'once' | 'always' | 'daily';

export interface Alert {
  id: string;
  user_id: string;
  symbol: string;
  asset_type: 'crypto' | 'stock' | 'forex' | 'commodity';
  condition_type: AlertConditionType;
  target_price?: number;
  trigger_percentage?: number;
  trigger_condition?: string; // JSON serializado
  is_active: boolean;
  is_triggered: boolean;
  triggered_at?: string;
  frequency: AlertFrequency;
  created_at: string;
  updated_at: string;
  last_notification_at?: string;
}

export class AlertServiceDB extends DatabaseService {
  constructor() {
    super();
    this.logger.info('AlertServiceDB initialized');
  }

  /**
   * Crear alerta
   */
  async createAlert(data: Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'is_triggered' | 'triggered_at'>): Promise<Alert> {
    return this.create<Alert>('alerts', {
      ...data,
      id: '',
      is_triggered: false,
    } as any);
  }

  /**
   * Obtener alerta por ID
   */
  async getAlertById(alertId: string): Promise<Alert | null> {
    return this.findById<Alert>('alerts', alertId);
  }

  /**
   * Listar alertas del usuario
   */
  async getUserAlerts(userId: string, limit?: number | boolean, onlyActive?: boolean): Promise<Alert[]> {
    // Handle overload: (userId, onlyActive) or (userId, limit, onlyActive)
    let finalLimit: number | undefined;
    let finalOnlyActive = true;

    if (typeof limit === 'boolean') {
      finalOnlyActive = limit;
    } else if (typeof limit === 'number') {
      finalLimit = limit;
      finalOnlyActive = onlyActive ?? true;
    }

    const whereClause = finalOnlyActive ? 'user_id = $1 AND is_active = true' : 'user_id = $1';
    const limitClause = finalLimit ? ` LIMIT ${finalLimit}` : '';
    const sql = `SELECT * FROM alerts WHERE ${whereClause} ORDER BY created_at DESC${limitClause}`;
    
    return this.query<Alert>(sql, [userId], { cache: false });
  }

  /**
   * Obtener alertas por símbolo
   */
  async getAlertsBySymbol(symbol: string, onlyActive: boolean = true): Promise<Alert[]> {
    const whereClause = onlyActive ? 'symbol = $1 AND is_active = true' : 'symbol = $1';
    return this.query_where<Alert>(
      'alerts',
      `${whereClause} ORDER BY created_at DESC`,
      [symbol]
    );
  }

  /**
   * Obtener alertas sin disponer
   */
  async getUntriggeredAlerts(userId: string): Promise<Alert[]> {
    return this.query_where<Alert>(
      'alerts',
      'user_id = $1 AND is_active = true AND is_triggered = false ORDER BY created_at ASC',
      [userId]
    );
  }

  /**
   * Actualizar alerta
   */
  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<Alert | null> {
    return this.update<Alert>('alerts', alertId, updates);
  }

  /**
   * Obtener alertas por usuario y símbolo
   */
  async getUserSymbolAlerts(userId: string, symbol: string, limit?: number): Promise<Alert[]> {
    const limitClause = limit ? ` LIMIT ${limit}` : '';
    const sql = `
      SELECT * FROM alerts 
      WHERE user_id = $1 AND symbol = $2 
      ORDER BY created_at DESC${limitClause}
    `;
    return this.query<Alert>(sql, [userId, symbol], { cache: false });
  }

  /**
   * Marcar alerta como disparada (retorna Alert)
   */
  async markAsTriggered(alertId: string): Promise<Alert | null> {
    const sql = `
      UPDATE alerts
      SET is_triggered = true, triggered_at = NOW(), last_notification_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.query<Alert>(sql, [alertId], { cache: false });
    return result[0] || null;
  }

  /**
   * Marcar alerta como disparada (legacy - sin retorno)
   */
  async triggerAlert(alertId: string): Promise<void> {
    const sql = `
      UPDATE alerts
      SET is_triggered = true, triggered_at = NOW(), last_notification_at = NOW()
      WHERE id = $1
    `;
    await this.execute(sql, [alertId]);
    this.logger.debug(`Alert triggered: ${alertId}`);
  }

  /**
   * Resetear alerta (desmarcar disparada)
   */
  async resetAlert(alertId: string): Promise<Alert | null> {
    const sql = `
      UPDATE alerts
      SET is_triggered = false, triggered_at = NULL
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.query<Alert>(sql, [alertId], { cache: false });
    return result[0] || null;
  }

  /**
   * Desactivar alerta
   */
  async deactivateAlert(alertId: string): Promise<void> {
    const sql = `UPDATE alerts SET is_active = false WHERE id = $1`;
    await this.execute(sql, [alertId]);
  }

  /**
   * Activar alerta
   */
  async activateAlert(alertId: string): Promise<void> {
    const sql = `UPDATE alerts SET is_active = true WHERE id = $1`;
    await this.execute(sql, [alertId]);
  }

  /**
   * Eliminar alerta
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    return this.delete('alerts', alertId);
  }

  /**
   * Obtener alertas que necesitan notificación
   */
  async getAlertsNeedingNotification(userId: string, minMinutesBetween: number = 30): Promise<Alert[]> {
    const sql = `
      SELECT * FROM alerts
      WHERE user_id = $1
      AND is_active = true
      AND is_triggered = true
      AND (last_notification_at IS NULL OR last_notification_at < NOW() - INTERVAL '${minMinutesBetween} minutes')
      ORDER BY triggered_at ASC
    `;
    return this.query<Alert>(sql, [userId], { cache: false });
  }

  /**
   * Contar alertas activas por usuario
   */
  async countActiveAlerts(userId: string): Promise<number> {
    return this.count('alerts', 'user_id = $1 AND is_active = true', [userId]);
  }

  /**
   * Obtener alertas activas por símbolo y tipo
   */
  async getAlertsBySymbolAndType(
    symbol: string,
    conditionType: AlertConditionType
  ): Promise<Alert[]> {
    return this.query_where<Alert>(
      'alerts',
      'symbol = $1 AND condition_type = $2 AND is_active = true',
      [symbol, conditionType]
    );
  }

  /**
   * Limpiar alertas disparadas antiguas (>7 días)
   */
  async cleanOldTriggeredAlerts(daysOld: number = 7): Promise<number> {
    const sql = `
      DELETE FROM alerts
      WHERE is_triggered = true
      AND triggered_at < NOW() - INTERVAL '${daysOld} days'
      RETURNING id
    `;
    const result = await this.execute<{ id: string }>(sql);
    return result.length;
  }

  /**
   * Estadísticas de alertas por usuario
   */
  async getUserAlertStats(userId: string): Promise<{
    total: number;
    active: number;
    triggered: number;
    by_type: Record<AlertConditionType, number>;
  }> {
    const total = await this.count('alerts', 'user_id = $1', [userId]);
    const active = await this.count('alerts', 'user_id = $1 AND is_active = true', [userId]);
    const triggered = await this.count('alerts', 'user_id = $1 AND is_triggered = true', [userId]);

    const byType = await this.query<any>(
      `SELECT condition_type, COUNT(*) as count FROM alerts WHERE user_id = $1 GROUP BY condition_type`,
      [userId],
      { cache: false }
    );

    const typeMap: Record<AlertConditionType, number> = {
      price_above: 0,
      price_below: 0,
      percent_change: 0,
      technical_signal: 0,
    };

    byType.forEach((row: any) => {
      typeMap[row.condition_type as AlertConditionType] = parseInt(row.count, 10);
    });

    return {
      total,
      active,
      triggered,
      by_type: typeMap,
    };
  }

  /**
   * Transacción: Crear alerta con validación
   */
  async createAlertWithValidation(
    data: Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'is_triggered' | 'triggered_at'>
  ): Promise<Alert> {
    return this.transaction(async (executeQuery) => {
      // Verificar que el usuario no tiene alertas duplicadas
      const existingSql = `
        SELECT COUNT(*) as count FROM alerts
        WHERE user_id = $1 AND symbol = $2 AND condition_type = $3 AND is_active = true
      `;

      const existing = await executeQuery(existingSql, [
        data.user_id,
        data.symbol,
        data.condition_type,
      ]);

      if (parseInt(existing[0]?.count || '0', 10) > 0) {
        throw new Error(`Active alert already exists for ${data.symbol} with this condition`);
      }

      // Crear nueva alerta
      const createSql = `
        INSERT INTO alerts 
        (user_id, symbol, asset_type, condition_type, target_price, trigger_percentage, trigger_condition, is_active, frequency)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await executeQuery(createSql, [
        data.user_id,
        data.symbol,
        data.asset_type,
        data.condition_type,
        data.target_price,
        data.trigger_percentage,
        data.trigger_condition,
        data.is_active,
        data.frequency || 'once',
      ]);

      return result[0] as Alert;
    });
  }
}

export const alertServiceDB = new AlertServiceDB();

