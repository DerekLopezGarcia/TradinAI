/**
 * ARQUITECTURA ESCALABLE - Capa de Abstracción Universal
 * 
 * Define interfaces y patrones globales reutilizables
 * Sin importar si es componente, hook, servicio, etc.
 */

// ============================================================================
// TIPOS Y INTERFACES FUNDAMENTALES
// ============================================================================

/**
 * Estado de carga/error universal para cualquier operación
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isSuccess: boolean;
  timestamp: number;
}

/**
 * Respuesta genérica de API
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Resultado de operación con tipo de evento
 */
export interface AsyncAction<T = any> {
  type: 'loading' | 'success' | 'error' | 'idle';
  payload?: T;
  error?: Error;
  metadata?: Record<string, any>;
}

/**
 * Configuración de cache genérica
 */
export interface CacheConfig {
  ttl: number; // Time to live en milisegundos
  key: string;
  strategy?: 'memory' | 'localStorage' | 'indexedDB';
}

/**
 * Listener genérico para eventos
 */
export type EventListener<T = any> = (data: T) => void;
export type EventUnsubscribe = () => void;

/**
 * Patrón de Observer/Publisher
 */
export interface EventEmitter<T = any> {
  on(event: string, listener: EventListener<T>): EventUnsubscribe;
  off(event: string, listener: EventListener<T>): void;
  emit(event: string, data: T): void;
  once(event: string, listener: EventListener<T>): EventUnsubscribe;
}

// ============================================================================
// PATRONES DE CONFIGURACIÓN
// ============================================================================

/**
 * Configuración centralizada para cualquier módulo
 */
export interface ModuleConfig {
  enabled: boolean;
  debug?: boolean;
  timeout?: number;
  retries?: number;
  cache?: CacheConfig;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

/**
 * Feature flag para control granular
 */
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rollout?: number; // 0-100 %
  users?: string[];
  metadata?: Record<string, any>;
}

/**
 * Configuración de integración externa
 */
export interface ExternalServiceConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  rateLimit?: {
    requestsPerMinute: number;
    burstSize: number;
  };
  fallbackUrls?: string[];
}

// ============================================================================
// PATRONES DE VALIDACIÓN Y TRANSFORMACIÓN
// ============================================================================

/**
 * Validador genérico
 */
export interface Validator<T> {
  validate(value: any): { valid: boolean; errors: string[] };
  transform?(value: any): T;
  schema?: Record<string, any>;
}

/**
 * Transformador de datos
 */
export interface Transformer<TIn, TOut> {
  transform(input: TIn): TOut;
  reverse?(output: TOut): TIn;
}

/**
 * Pipeline de transformación
 */
export interface TransformPipeline<T> {
  addStep(transform: Transformer<any, any>): TransformPipeline<T>;
  execute(input: any): T;
}

// ============================================================================
// PATRONES DE ALMACENAMIENTO
// ============================================================================

/**
 * Repositorio genérico
 */
export interface Repository<T, ID = string> {
  getById(id: ID): Promise<T | null>;
  getAll(): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: ID, item: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  query(predicate: (item: T) => boolean): Promise<T[]>;
}

/**
 * Servicio de caché
 */
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Gestor de estado local
 */
export interface StateManager<T> {
  getState(): T;
  setState(state: Partial<T>): void;
  subscribe(listener: (state: T) => void): () => void;
  reset(): void;
}

// ============================================================================
// PATRONES DE MANEJO DE ERRORES
// ============================================================================

/**
 * Error personalizado con contexto
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context
    };
  }
}

/**
 * Estrategia de retry
 */
export interface RetryStrategy {
  maxAttempts: number;
  delay: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

// ============================================================================
// PATRONES DE LOGGING Y MONITOREO
// ============================================================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Logger genérico
 */
export interface Logger {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
}

/**
 * Métrica de rendimiento
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Monitor de salud
 */
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastCheck: number;
  details?: Record<string, any>;
}

// ============================================================================
// PATRONES DE COMPOSICIÓN Y REUTILIZACIÓN
// ============================================================================

/**
 * Plugin genérico
 */
export interface Plugin<T = any> {
  name: string;
  version: string;
  install(context: T): void;
  uninstall(context: T): void;
}

/**
 * Middleware genérico
 */
export type Middleware<TReq = any, TRes = any> = (
  req: TReq,
  res: TRes,
  next: () => Promise<void>
) => Promise<void>;

/**
 * Composidor de funciones
 */
export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((result, fn) => fn(result), arg);
}

/**
 * Pipe de operaciones
 */
export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((result, fn) => fn(result), arg);
}

// ============================================================================
// PATRONES DE COMUNICACIÓN
// ============================================================================

/**
 * Bus de eventos global
 */
export interface EventBus {
  publish<T>(topic: string, data: T): void;
  subscribe<T>(topic: string, handler: (data: T) => void): () => void;
  subscribeOnce<T>(topic: string, handler: (data: T) => void): () => void;
  clear(topic?: string): void;
}

/**
 * Comando ejecutable
 */
export interface Command<TInput = any, TOutput = any> {
  execute(input: TInput): Promise<TOutput>;
  canExecute(input: TInput): boolean;
}

/**
 * Query ejecutable
 */
export interface Query<TInput = any, TOutput = any> {
  execute(input: TInput): Promise<TOutput>;
}

// ============================================================================
// FUNCIONES UTILITARIAS GLOBALES
// ============================================================================

/**
 * Factory genérico
 */
export function createFactory<T>(
  registry: Map<string, () => T>
): (type: string) => T {
  return (type: string) => {
    const creator = registry.get(type);
    if (!creator) throw new Error(`Unknown type: ${type}`);
    return creator();
  };
}

/**
 * Singleton pattern
 */
export function createSingleton<T>(creator: () => T): () => T {
  let instance: T | null = null;
  return () => {
    if (!instance) instance = creator();
    return instance;
  };
}

/**
 * Deep merge de objetos
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject((source as any)[key])) {
        if (!(key in target)) Object.assign(target, { [key]: {} });
        deepMerge((target as any)[key], (source as any)[key]);
      } else {
        Object.assign(target, { [key]: (source as any)[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Debounce genérico
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle genérico
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Retry con backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  strategy: RetryStrategy = {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    jitter: true
  }
): Promise<T> {
  let lastError: Error;
  for (let attempt = 0; attempt < strategy.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < strategy.maxAttempts - 1) {
        let delay = strategy.delay * Math.pow(strategy.backoffMultiplier || 1, attempt);
        if (strategy.jitter) {
          delay = delay * (0.5 + Math.random());
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
}


