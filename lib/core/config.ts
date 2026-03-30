/**
 * CONFIGURACIÓN CENTRALIZADA DEL PROYECTO
 * 
 * Todos los valores configurables en un solo lugar
 * Fácil de mantener y escalar
 */

import { ModuleConfig, ExternalServiceConfig, FeatureFlag, RetryStrategy } from './architecture';

// ============================================================================
// CONFIGURACIÓN DEL PROYECTO
// ============================================================================

export const PROJECT_CONFIG = {
  name: 'TradingIA',
  version: '2.0.0',
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// ============================================================================
// CONFIGURACIÓN DE MÓDULOS
// ============================================================================

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  // Data Layer
  dataProviders: {
    enabled: true,
    debug: PROJECT_CONFIG.isDevelopment,
    timeout: 10000,
    retries: 3,
    cache: {
      ttl: 60000, // 1 minuto
      key: 'dataProviders',
      strategy: 'memory'
    }
  },

  // Market Data
  marketData: {
    enabled: true,
    timeout: 10000,
    retries: 3,
    cache: {
      ttl: 30000, // 30 segundos para precios
      key: 'marketData',
      strategy: 'memory'
    }
  },

  // Analysis Engine
  analysis: {
    enabled: true,
    timeout: 5000,
    retries: 1,
    cache: {
      ttl: 300000, // 5 minutos
      key: 'analysis',
      strategy: 'indexedDB'
    }
  },

  // Scanner
  scanner: {
    enabled: true,
    timeout: 30000,
    retries: 2,
    cache: {
      ttl: 14400000, // 4 horas
      key: 'scanner',
      strategy: 'localStorage'
    }
  },

  // News Service
  news: {
    enabled: true,
    timeout: 8000,
    retries: 2,
    cache: {
      ttl: 600000, // 10 minutos
      key: 'news',
      strategy: 'memory'
    }
  }
};

// ============================================================================
// CONFIGURACIÓN DE SERVICIOS EXTERNOS
// ============================================================================

export const EXTERNAL_SERVICES: Record<string, ExternalServiceConfig> = {
  binance: {
    name: 'Binance',
    baseUrl: 'https://api.binance.com/api/v3',
    timeout: 8000,
    retries: 3,
    rateLimit: {
      requestsPerMinute: 1200,
      burstSize: 10
    }
  },

  twelveData: {
    name: 'Twelve Data',
    baseUrl: 'https://api.twelvedata.com',
    apiKey: process.env.TWELVE_DATA_API_KEY,
    timeout: 10000,
    retries: 2,
    rateLimit: {
      requestsPerMinute: 600,
      burstSize: 5
    }
  },

  yahooFinance: {
    name: 'Yahoo Finance',
    baseUrl: 'https://query1.finance.yahoo.com',
    timeout: 8000,
    retries: 2,
    rateLimit: {
      requestsPerMinute: 2000,
      burstSize: 20
    }
  },

  coingecko: {
    name: 'CoinGecko',
    baseUrl: 'https://api.coingecko.com/api/v3',
    timeout: 8000,
    retries: 3,
    rateLimit: {
      requestsPerMinute: 500,
      burstSize: 10
    }
  },

  quandl: {
    name: 'Quandl',
    baseUrl: 'https://www.quandl.com/api/v3',
    apiKey: process.env.QUANDL_API_KEY,
    timeout: 10000,
    retries: 2,
    rateLimit: {
      requestsPerMinute: 200,
      burstSize: 5
    }
  }
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  websocketRealtime: {
    name: 'WebSocket Real-time Prices',
    enabled: false,
    rollout: 0,
    metadata: { eta: 'April 2026' }
  },

  localDataStorage: {
    name: 'Local Data Storage',
    enabled: false,
    rollout: 0,
    metadata: { eta: 'April 2026' }
  },

  mlPricePrediction: {
    name: 'ML Price Prediction',
    enabled: false,
    rollout: 0,
    metadata: { eta: 'May 2026' }
  },

  advancedAnalytics: {
    name: 'Advanced Analytics Dashboard',
    enabled: false,
    rollout: 0,
    metadata: { eta: 'May 2026' }
  },

  multiLanguage: {
    name: 'Multi-Language Support',
    enabled: false,
    rollout: 0,
    metadata: { eta: 'June 2026' }
  }
};

// ============================================================================
// CONFIGURACIÓN DE UI/UX
// ============================================================================

export const UI_CONFIG = {
  // Timeframes disponibles
  timeframes: ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const,

  // Temas soportados
  themes: ['light', 'dark', 'auto'] as const,
  defaultTheme: 'dark' as const,

  // Idiomas soportados
  languages: ['es', 'en', 'fr', 'de', 'pt'] as const,
  defaultLanguage: 'es' as const,

  // Configuración de animaciones
  animations: {
    enabled: true,
    reducedMotion: false,
    duration: 300 // ms
  },

  // Paginación
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100
  },

  // Modalidades
  modal: {
    animationDuration: 300,
    backdropOpacity: 0.5
  }
};

// ============================================================================
// CONFIGURACIÓN DE DATOS
// ============================================================================

export const DATA_CONFIG = {
  // Asset types
  assetTypes: ['stock', 'crypto', 'forex', 'index', 'commodity'] as const,

  // Límites de datos
  limits: {
    maxCandlesPerRequest: 500,
    maxHistoryDays: 365,
    minCandlesForAnalysis: 10,
    maxAssetsInScan: 256
  },

  // Defaults
  defaults: {
    defaultTimeframe: '1h' as const,
    defaultAsset: 'BTCUSD',
    defaultInterval: 3000, // ms para updates
    defaultCacheExpiry: 60000 // ms
  }
};

// ============================================================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================================================

export const SECURITY_CONFIG = {
  // Rate limiting
  rateLimit: {
    enabled: true,
    windowMs: 60000, // 1 minuto
    maxRequests: 100
  },

  // CORS
  cors: {
    enabled: true,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  },

  // Validación de entrada
  validation: {
    maxSymbolLength: 20,
    maxMessageLength: 500,
    allowedCharsInSymbol: /^[A-Z0-9]{1,20}$/
  },

  // Timeouts y límites
  timeouts: {
    defaultRequestTimeout: 10000,
    maxRequestTimeout: 30000,
    sessionTimeout: 3600000 // 1 hora
  }
};

// ============================================================================
// CONFIGURACIÓN DE LOGGING
// ============================================================================

export const LOGGING_CONFIG = {
  // Niveles de log
  level: PROJECT_CONFIG.isDevelopment ? 'debug' : 'info',

  // Destinos
  outputs: [
    { type: 'console', enabled: true },
    { type: 'file', enabled: false, path: './logs' },
    { type: 'remote', enabled: false, url: process.env.LOG_SERVICE_URL }
  ],

  // Configuración
  format: PROJECT_CONFIG.isDevelopment ? 'pretty' : 'json',
  includeTimestamp: true,
  includeContext: true,
  maxLogSize: 50 * 1024 * 1024 // 50MB
};

// ============================================================================
// CONFIGURACIÓN DE PERFORMANCE
// ============================================================================

export const PERFORMANCE_CONFIG = {
  // Debounce y throttle
  debounce: {
    search: 300,
    resize: 200,
    scroll: 100
  },

  throttle: {
    priceUpdate: 1000,
    canvasRender: 100
  },

  // Límites de memory
  memory: {
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    maxHistorySize: 50 * 1024 * 1024 // 50MB
  },

  // Web Workers
  workers: {
    enabled: true,
    poolSize: 4
  }
};

// ============================================================================
// CONFIGURACIÓN DE RETRY
// ============================================================================

export const RETRY_STRATEGIES: Record<string, RetryStrategy> = {
  // Conservative - para operaciones críticas
  conservative: {
    maxAttempts: 5,
    delay: 1000,
    backoffMultiplier: 2,
    jitter: true
  },

  // Standard - para operaciones normales
  standard: {
    maxAttempts: 3,
    delay: 500,
    backoffMultiplier: 2,
    jitter: true
  },

  // Aggressive - para operaciones no críticas
  aggressive: {
    maxAttempts: 1,
    delay: 0
  }
};

// ============================================================================
// CONSTANTES DE NEGOCIO
// ============================================================================

export const BUSINESS_CONFIG = {
  // Umbrales de análisis
  analysis: {
    minConfidenceScore: 0.6,
    minROI: 0.1, // 10%
    minSupportLevel: 0.02
  },

  // Alertas
  alerts: {
    maxActiveAlerts: 50,
    checkInterval: 60000, // 1 minuto
    retentionDays: 30
  },

  // Recomendaciones
  recommendations: {
    minScore: 0.7,
    maxRecommendations: 50,
    updateInterval: 3600000 // 1 hora
  }
};

// ============================================================================
// FUNCIÓN HELPER PARA OBTENER CONFIGURACIÓN
// ============================================================================

/**
 * Obtener configuración de módulo con defaults
 */
export function getModuleConfig(moduleName: string): ModuleConfig {
  return MODULE_CONFIGS[moduleName] || {
    enabled: true,
    debug: PROJECT_CONFIG.isDevelopment,
    timeout: 10000,
    retries: 3
  };
}

/**
 * Obtener configuración de servicio externo
 */
export function getServiceConfig(serviceName: string): ExternalServiceConfig | null {
  return EXTERNAL_SERVICES[serviceName] || null;
}

/**
 * Verificar si feature está habilitada
 */
export function isFeatureEnabled(featureName: string, userId?: string): boolean {
  const flag = FEATURE_FLAGS[featureName];
  if (!flag) return false;
  if (!flag.enabled) return false;

  // Rollout basado en porcentaje
  if (flag.rollout && flag.rollout < 100) {
    const hash = userId ? hashUserId(userId) : Math.random();
    return (hash % 100) < flag.rollout;
  }

  // Rollout basado en usuarios específicos
  if (flag.users && userId) {
    return flag.users.includes(userId);
  }

  return true;
}

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

