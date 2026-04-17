/**
 * lib/services/databaseService.ts
 *
 * DatabaseService - Servicio base para acceso a PostgreSQL
 * Extiende BaseService para obtener logging, cache, retry automáticos
 *
 * Patrón: Strategy Pattern + Repository Pattern
 * Hereda de: BaseService (logger, cache, retry)
 */

import { getPool } from '../database/pool';
import { BaseService } from '../core/services';

// ============================================================================
// TYPES
// ============================================================================

export interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number; // ms
  retry?: number;
}

export interface RepositoryQuery<T> {
  predicate?: (item: T) => boolean;
  limit?: number;
  offset?: number;
  orderBy?: { field: string; direction: 'ASC' | 'DESC' }[];
}

// ============================================================================
// DATABASE SERVICE
// ============================================================================

export class DatabaseService extends BaseService {
  constructor() {
    super('database');
  }

  /**
   * Ejecutar query con retry automático
   * Retorna solo rows (sin metadata de QueryResult)
   */
  async query<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<T[]> {
    const { cache = true, cacheTTL = 300000, retry = 3 } = options || {};

    // Si cache habilitado, intentar desde caché primero
    if (cache) {
      return this.getCachedOrExecute(
        `query:${sql}:${JSON.stringify(params)}`,
        () => this.executeQuery<T>(sql, params, retry),
        cacheTTL
      );
    }

    // Sin cache, ejecutar directamente
    return this.executeQuery<T>(sql, params, retry);
  }

  /**
   * Ejecutar query sin cache
   */
  async execute<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return this.executeQuery<T>(sql, params, 3);
  }

  /**
   * Iniciar transacción
   */
  async transaction<T>(fn: (executeQuery: (sql: string, params?: any[]) => Promise<any[]>) => Promise<T>): Promise<T> {
    const client = await getPool().getClient();

    try {
      // BEGIN transacción
      await client.query('BEGIN');

      // Ejecutar función con cliente
      const executeQueryInTransaction = (sql: string, params?: any[]) => {
        return client.query(sql, params).then((res: any) => res.rows);
      };

      const result = await fn(executeQueryInTransaction);

      // COMMIT
      await client.query('COMMIT');
      this.logger.debug('✅ Transacción completada');

      return result;
    } catch (error) {
      // ROLLBACK
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        this.logger.error('Error durante ROLLBACK', rollbackError as Error);
      }

      this.logger.error('❌ Transacción fallida, rollback ejecutado', error as Error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener por ID genérico
   */
  async findById<T extends { id: string }>(table: string, id: string): Promise<T | null> {
    const result = await this.query<T>(`SELECT * FROM ${table} WHERE id = $1`, [id], {
      cache: true,
      cacheTTL: 60000, // 1 min
    });
    return result[0] || null;
  }

  /**
   * Obtener todos
   */
  async findAll<T = any>(
    table: string,
    options?: RepositoryQuery<T>
  ): Promise<T[]> {
    const { limit, offset } = options || {};

    let sql = `SELECT * FROM ${table}`;

    if (offset !== undefined) {
      sql += ` OFFSET ${offset}`;
    }

    if (limit !== undefined) {
      sql += ` LIMIT ${limit}`;
    }

    return this.query<T>(sql, undefined, { cache: true, cacheTTL: 120000 });
  }

  /**
   * Crear registro
   */
  async create<T extends { id?: string }>(table: string, data: T): Promise<T> {
    const keys = Object.keys(data).filter((k) => data[k as keyof T] !== undefined);
    const values = keys.map((k) => data[k as keyof T]);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
    const columns = keys.join(',');

    const sql = `
      INSERT INTO ${table} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.execute<T>(sql, values);
    this.logger.debug(`✅ Created in ${table}`, { id: (result[0] as any)?.id });

    return result[0];
  }

  /**
   * Actualizar registro
   */
  async update<T extends { id: string }>(table: string, id: string, updates: Partial<T>): Promise<T | null> {
    const keys = Object.keys(updates).filter((k) => updates[k as keyof T] !== undefined);

    if (keys.length === 0) {
      this.logger.warn(`No updates for ${table}:${id}`);
      return this.findById<T>(table, id);
    }

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(',');
    const values = [...keys.map((k) => updates[k as keyof T]), id];

    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;

    const result = await this.execute<T>(sql, values);
    this.logger.debug(`✅ Updated ${table}:${id}`);

    return result[0] || null;
  }

  /**
   * Eliminar registro
   */
  async delete(table: string, id: string): Promise<boolean> {
    const sql = `DELETE FROM ${table} WHERE id = $1`;
    await this.execute(sql, [id]);
    this.logger.debug(`✅ Deleted from ${table}:${id}`);
    return true;
  }

  /**
   * Query con filtro personalizado
   */
  async query_where<T = any>(table: string, whereClause: string, params?: any[]): Promise<T[]> {
    const sql = `SELECT * FROM ${table} WHERE ${whereClause}`;
    return this.query<T>(sql, params);
  }

  /**
   * Contar registros
   */
  async count(table: string, whereClause?: string, params?: any[]): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;

    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }

    const result = await this.query<{ count: string }>(sql, params, { cache: false });
    return parseInt(result[0]?.count || '0', 10);
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Ejecutar query contra el pool con retry
   */
  private async executeQuery<T>(sql: string, params?: any[], retries: number = 3): Promise<T[]> {
    try {
      const result = await getPool().query(sql, params, retries);
      return result as T[];
    } catch (error) {
      this.logger.error('Query execution failed', error as Error);
      throw error;
    }
  }
}

/**
 * Instancia singleton de DatabaseService
 */
export const databaseService = new DatabaseService();

