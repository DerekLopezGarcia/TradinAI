/**
 * lib/database/pool.ts
 * 
 * Connection Pool para PostgreSQL en Railway
 * 
 * Features:
 * - Pool de conexiones reutilizable
 * - Circuit breaker pattern
 * - Retry automático con backoff exponencial
 * - Logging centralizado
 * - Health checks periódicos
 */

import { Pool, PoolClient } from 'pg';
import { ConsoleLogger } from '../core/services';

// ============================================================================
// TYPES
// ============================================================================

interface PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

interface CircuitBreakerState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number | null;
  successCount: number;
}

// ============================================================================
// RAILWAY CONNECTION POOL
// ============================================================================

export class RailwayConnectionPool {
  private pool: Pool;
  private logger: ConsoleLogger;
  private circuitBreaker: CircuitBreakerState;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5; // Fallos antes de abrir
  private readonly CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutos
  private readonly CIRCUIT_BREAKER_SUCCESS_THRESHOLD = 3; // Éxitos para cerrar

  constructor(config: PoolConfig) {
    this.logger = new ConsoleLogger('RailwayPool');

    // Pool config
    const poolConfig = {
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max || 10, // Máximo 10 conexiones para serverless/edge
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 10000,
      ssl: config.ssl || {
        rejectUnauthorized: false, // Railway usa certificados autofirmados
      },
      // Railway específico: aplicación
      application_name: 'tradingIA',
    };

    this.pool = new Pool(poolConfig);

    // Circuit breaker inicial
    this.circuitBreaker = {
      status: 'CLOSED',
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0,
    };

    // Event listeners
    this.setupPoolListeners();

    this.logger.info('✅ Railway Connection Pool inicializado', {
      host: poolConfig.host,
      database: poolConfig.database,
      maxConnections: poolConfig.max,
    });
  }

  /**
   * Configurar event listeners del pool
   */
  private setupPoolListeners(): void {
    this.pool.on('error', (err: Error) => {
      this.logger.error('❌ Pool error no capturado', err);
      this.recordFailure();
    });

    this.pool.on('connect', () => {
      this.logger.debug('📡 Nueva conexión establecida');
    });

    this.pool.on('remove', () => {
      this.logger.debug('📡 Conexión removida del pool');
    });
  }

  /**
   * Ejecutar query con circuit breaker + retry
   */
  async query<T extends any[] = any[]>(
    sql: string,
    values?: any[],
    retries: number = 3
  ): Promise<T> {
    // Verificar circuit breaker
    if (this.circuitBreaker.status === 'OPEN') {
      const timeSinceFailure = Date.now() - (this.circuitBreaker.lastFailureTime || 0);
      if (timeSinceFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
        this.logger.info('🔄 Circuit breaker: intentando HALF_OPEN');
        this.circuitBreaker.status = 'HALF_OPEN';
        this.circuitBreaker.successCount = 0;
      } else {
        throw new Error(
          `Circuit breaker OPEN: DB no disponible. Retry en ${this.CIRCUIT_BREAKER_TIMEOUT / 1000}s`
        );
      }
    }

    // Retry loop con backoff exponencial
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.pool.query<any>(sql, values);
        this.recordSuccess();
        return result.rows as T;
      } catch (error) {
        lastError = error as Error;
        this.recordFailure();

        // Logs detallados por tipo de error
        if (attempt < retries) {
          const backoffMs = Math.pow(2, attempt - 1) * 100; // 100ms, 200ms, 400ms
          this.logger.warn(
            `⚠️ Query falló (intento ${attempt}/${retries}), reintentando en ${backoffMs}ms: ${sql.substring(0, 50)}...`
          );
          await this.delay(backoffMs);
        } else {
          this.logger.error('❌ Query falló después de todos los reintentos', lastError);
        }
      }
    }

    throw lastError || new Error('Query failed: unknown error');
  }

  /**
   * Obtener cliente para transacciones
   * Usado en Fase 1 para implementar transactions() en DatabaseService
   */
  async getClient(): Promise<PoolClient> {
    if (this.circuitBreaker.status === 'OPEN') {
      throw new Error('Circuit breaker OPEN: no puedo obtener cliente');
    }

    try {
      const client = await this.pool.connect();
      this.recordSuccess();
      return client;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1');
      this.logger.debug('✅ Health check OK');
      return !!result;
    } catch (error) {
      this.logger.error('❌ Health check falló', error as Error);
      return false;
    }
  }

  /**
   * Iniciar health checks periódicos
   */
  startHealthChecks(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(() => {
      this.healthCheck().catch((err: Error) => {
        this.logger.error('Health check error', err);
      });
    }, intervalMs);

    this.logger.info(`📊 Health checks iniciados (cada ${intervalMs}ms)`);
  }

  /**
   * Detener health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.info('🛑 Health checks detenidos');
    }
  }

  /**
   * Obtener estadísticas del pool
   */
  getStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    circuitBreaker: CircuitBreakerState;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      circuitBreaker: { ...this.circuitBreaker },
    };
  }

  /**
   * Cerrar pool
   */
  async close(): Promise<void> {
    this.stopHealthChecks();
    await this.pool.end();
    this.logger.info('🔌 Connection pool cerrado');
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Registrar fallo (para circuit breaker)
   */
  private recordFailure(): void {
    if (this.circuitBreaker.status === 'HALF_OPEN') {
      this.logger.warn('❌ HALF_OPEN falló, reabriendo circuit breaker');
      this.circuitBreaker.status = 'OPEN';
      this.circuitBreaker.failureCount = 0;
      this.circuitBreaker.lastFailureTime = Date.now();
    } else if (this.circuitBreaker.status === 'CLOSED') {
      this.circuitBreaker.failureCount++;
      if (this.circuitBreaker.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
        this.logger.warn(`🔴 CIRCUIT BREAKER ABIERTO (${this.circuitBreaker.failureCount} fallos)`);
        this.circuitBreaker.status = 'OPEN';
        this.circuitBreaker.lastFailureTime = Date.now();
      }
    }
  }

  /**
   * Registrar éxito (para circuit breaker)
   */
  private recordSuccess(): void {
    if (this.circuitBreaker.status === 'CLOSED') {
      this.circuitBreaker.failureCount = 0;
    } else if (this.circuitBreaker.status === 'HALF_OPEN') {
      this.circuitBreaker.successCount++;
      if (this.circuitBreaker.successCount >= this.CIRCUIT_BREAKER_SUCCESS_THRESHOLD) {
        this.logger.info('🟢 CIRCUIT BREAKER CERRADO (recuperado)');
        this.circuitBreaker.status = 'CLOSED';
        this.circuitBreaker.failureCount = 0;
        this.circuitBreaker.successCount = 0;
      }
    }
  }

  /**
   * Helper: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let poolInstance: RailwayConnectionPool | null = null;

/**
 * Obtener instancia del pool (singleton)
 */
export function getPool(): RailwayConnectionPool {
  if (!poolInstance) {
    const config: PoolConfig = {
      host: process.env.RAILWAY_DATABASE_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.RAILWAY_DATABASE_PORT || process.env.DB_PORT || '5432'),
      database: process.env.RAILWAY_DATABASE_NAME || process.env.DB_NAME || 'trading_ia',
      user: process.env.RAILWAY_DATABASE_USER || process.env.DB_USER || 'postgres',
      password: process.env.RAILWAY_DATABASE_PASSWORD || process.env.DB_PASSWORD || '',
      max: 10,
      connectionTimeoutMillis: 10000,
    };

    if (!config.password) {
      console.warn('⚠️ DATABASE_PASSWORD no configurada en env');
    }

    poolInstance = new RailwayConnectionPool(config);

    // Iniciar health checks
    poolInstance.startHealthChecks(30000);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM recibido, cerrando pool...');
      await poolInstance?.close();
      process.exit(0);
    });
  }

  return poolInstance;
}

/**
 * Cerrar pool instance
 * Llamar en graceful shutdown o cuando se termine la aplicación
 */
export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.close();
    poolInstance = null;
  }
}

export default getPool;

