/**
 * SERVICIOS BASE REUTILIZABLES
 * 
 * Implementaciones concretas de los patrones definidos en architecture.ts
 * Use estos como base para cualquier servicio nuevo
 */

import {
  CacheService,
  StateManager,
  Repository,
  EventBus,
  Logger,
  LogLevel,
  AsyncState,
  APIResponse,
  AppError,
  retryWithBackoff,
  RetryStrategy,
  Validator
} from './architecture';
import { getModuleConfig, LOGGING_CONFIG } from './config';

// ============================================================================
// LOGGER IMPLEMENTADO
// ============================================================================

export class ConsoleLogger implements Logger {
  constructor(private prefix: string = 'TradingIA') {}

  private format(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}${ctx}`;
  }

  debug(message: string, context?: any): void {
    if (LOGGING_CONFIG.level === 'debug') {
      console.log(this.format(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: any): void {
    console.log(this.format(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: any): void {
    console.warn(this.format(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: any): void {
    const errorInfo = error ? { name: error.name, message: error.message } : null;
    console.error(this.format(LogLevel.ERROR, message, { ...context, error: errorInfo }));
  }
}

// ============================================================================
// CACHE SERVICE IMPLEMENTADO
// ============================================================================

export class MemoryCacheService implements CacheService {
  private cache = new Map<string, { value: any; expiry?: number }>();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger('MemoryCache');
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + ttl : undefined;
    this.cache.set(key, { value, expiry });
    this.logger.debug(`Cache set: ${key}`, { ttl });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.logger.debug(`Cache deleted: ${key}`);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
}

// ============================================================================
// STATE MANAGER IMPLEMENTADO
// ============================================================================

export class SimpleStateManager<T extends Record<string, any>> implements StateManager<T> {
  private state: T;
  private listeners: Set<(state: T) => void> = new Set();
  private logger: Logger;

  constructor(initialState: T, logger?: Logger) {
    this.state = { ...initialState };
    this.logger = logger || new ConsoleLogger('StateManager');
  }

  getState(): T {
    return { ...this.state };
  }

  setState(newState: Partial<T>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...newState };

    this.logger.debug('State updated', {
      previous: previousState,
      current: this.state
    });

    this.listeners.forEach(listener => listener(this.getState()));
  }

  subscribe(listener: (state: T) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.state = { ...this.state };
    this.logger.info('State reset');
  }
}

// ============================================================================
// EVENT BUS IMPLEMENTADO
// ============================================================================

export class SimpleEventBus implements EventBus {
  private listeners = new Map<string, Set<Function>>();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger('EventBus');
  }

  publish<T>(topic: string, data: T): void {
    this.logger.debug(`Publishing event: ${topic}`, data);
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.forEach(handler => {
        try {
          (handler as Function)(data);
        } catch (error) {
          this.logger.error(`Error in event handler for ${topic}`, error as Error);
        }
      });
    }
  }

  subscribe<T>(topic: string, handler: (data: T) => void): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(handler);
    this.logger.debug(`Subscribed to ${topic}`);

    return () => this.unsubscribe(topic, handler);
  }

  subscribeOnce<T>(topic: string, handler: (data: T) => void): () => void {
    const wrapper = (data: T) => {
      handler(data);
      this.unsubscribe(topic, wrapper);
    };
    return this.subscribe(topic, wrapper);
  }

  private unsubscribe<T>(topic: string, handler: (data: T) => void): void {
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.delete(handler);
      if (topicListeners.size === 0) {
        this.listeners.delete(topic);
      }
    }
  }

  clear(topic?: string): void {
    if (topic) {
      this.listeners.delete(topic);
      this.logger.debug(`Cleared topic: ${topic}`);
    } else {
      this.listeners.clear();
      this.logger.info('Cleared all topics');
    }
  }
}

// ============================================================================
// REPOSITORY BASE IMPLEMENTADO
// ============================================================================

export class InMemoryRepository<T extends { id: string }, ID = string> implements Repository<T, ID> {
  private items = new Map<ID, T>();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger('Repository');
  }

  async getById(id: ID): Promise<T | null> {
    return this.items.get(id) || null;
  }

  async getAll(): Promise<T[]> {
    return Array.from(this.items.values());
  }

  async create(item: T): Promise<T> {
    this.items.set(item.id as unknown as ID, item);
    this.logger.debug(`Created item: ${item.id}`);
    return item;
  }

  async update(id: ID, updates: Partial<T>): Promise<T> {
    const item = this.items.get(id);
    if (!item) throw new AppError('Item not found', 'NOT_FOUND', 404);

    const updated = { ...item, ...updates };
    this.items.set(id, updated);
    this.logger.debug(`Updated item: ${id}`);
    return updated;
  }

  async delete(id: ID): Promise<void> {
    this.items.delete(id);
    this.logger.debug(`Deleted item: ${id}`);
  }

  async query(predicate: (item: T) => boolean): Promise<T[]> {
    return Array.from(this.items.values()).filter(predicate);
  }
}

// ============================================================================
// SERVICE BASE REUTILIZABLE
// ============================================================================

export abstract class BaseService {
  protected logger: Logger;
  protected cache: CacheService;
  protected moduleName: string;
  protected config: any;

  constructor(moduleName: string, logger?: Logger, cache?: CacheService) {
    this.moduleName = moduleName;
    this.logger = logger || new ConsoleLogger(moduleName);
    this.cache = cache || new MemoryCacheService(this.logger);
    this.config = getModuleConfig(moduleName);
  }

  /**
   * Ejecutar operación con manejo de errores y retry
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    this.logger.debug(`Executing: ${operationName}`);

    try {
      const result = await retryWithBackoff(operation, {
        maxAttempts: this.config.retries || 3,
        delay: 500,
        backoffMultiplier: 2
      });

      this.logger.debug(`Success: ${operationName}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed: ${operationName}`, error as Error);
      throw new AppError(
        `${operationName} failed`,
        'OPERATION_FAILED',
        500,
        { service: this.moduleName }
      );
    }
  }

  /**
   * Obtener del caché o ejecutar
   */
  protected async getCachedOrExecute<T>(
    cacheKey: string,
    operation: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = await this.cache.get<T>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    // Ejecutar operación
    const result = await operation();

    // Guardar en caché
    await this.cache.set(cacheKey, result, ttl || this.config.cache?.ttl);

    return result;
  }

  /**
   * Obtener respuesta formateada
   */
  protected formatResponse<T>(data: T, metadata?: Record<string, any>): APIResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
      metadata
    };
  }

  /**
   * Obtener respuesta de error
   */
  protected formatError(error: Error, code?: string): APIResponse {
    return {
      success: false,
      error: error.message,
      code: code ? 400 : 500,
      timestamp: Date.now()
    };
  }
}

// ============================================================================
// ASYNC STATE HELPER
// ============================================================================

export function createAsyncState<T>(data?: T): AsyncState<T> {
  return {
    data: data || null,
    loading: false,
    error: null,
    isSuccess: !data,
    timestamp: Date.now()
  };
}

export function updateAsyncState<T>(
  state: AsyncState<T>,
  updates: Partial<AsyncState<T>>
): AsyncState<T> {
  return {
    ...state,
    ...updates,
    timestamp: Date.now()
  };
}

// ============================================================================
// VALIDATOR BASE REUTILIZABLE
// ============================================================================

export class BaseValidator<T> implements Validator<T> {
  constructor(
    private schema: Record<string, any>,
    private transformer?: (value: any) => T
  ) {}

  validate(value: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, rule] of Object.entries(this.schema)) {
      const val = value[key];

      if (rule.required && (val === null || val === undefined)) {
        errors.push(`${key} is required`);
      }

      if (rule.type && val !== null && val !== undefined) {
        if (typeof val !== rule.type) {
          errors.push(`${key} must be of type ${rule.type}`);
        }
      }

      if (rule.min !== undefined && val < rule.min) {
        errors.push(`${key} must be >= ${rule.min}`);
      }

      if (rule.max !== undefined && val > rule.max) {
        errors.push(`${key} must be <= ${rule.max}`);
      }

      if (rule.pattern && !rule.pattern.test(val)) {
        errors.push(`${key} has invalid format`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  transform(value: any): T {
    if (this.transformer) {
      return this.transformer(value);
    }
    return value as T;
  }
}

