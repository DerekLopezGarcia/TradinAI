/**
 * Servicio centralizado de logging de errores de datos
 * Proporciona mensajes claros y descriptivos para debugging
 * T1.5: Mejorar Logging de Errores de Datos
 */

export type ErrorCategory = 
  | 'API_TIMEOUT' 
  | 'INVALID_SYMBOL'
  | 'RATE_LIMITED'
  | 'INVALID_DATA'
  | 'NETWORK_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'PARSE_ERROR'
  | 'CACHE_MISS'
  | 'UNKNOWN';

export interface ErrorLog {
  timestamp: Date;
  symbol: string;
  category: ErrorCategory;
  message: string;
  provider?: string;
  statusCode?: number;
  errorDetails?: string;
}

class ErrorLoggingService {
  private logs: ErrorLog[] = [];
  private maxLogs = 500; // Mantener últimos 500 logs para debugging
  private silent = false; // Para tests

  /**
   * Registra un error con categorización automática
   */
  logError(
    symbol: string,
    error: Error | string,
    provider?: string,
    statusCode?: number,
    context?: string
  ): void {
    const category = this.categorizeError(error, statusCode);
    const message = this.formatMessage(symbol, category, error, provider, statusCode, context);

    const log: ErrorLog = {
      timestamp: new Date(),
      symbol,
      category,
      message,
      provider,
      statusCode,
      errorDetails: error instanceof Error ? error.message : String(error),
    };

    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log en consola con colores para desarrollo
    if (!this.silent) {
      this.logToConsole(log);
    }
  }

  /**
   * Categoriza automáticamente el tipo de error
   */
  private categorizeError(
    error: Error | string,
    statusCode?: number
  ): ErrorCategory {
    const errorStr = error instanceof Error ? error.message : String(error);

    // Por código de estado HTTP
    if (statusCode === 408 || statusCode === 504) return 'API_TIMEOUT';
    if (statusCode === 429) return 'RATE_LIMITED';
    if (statusCode === 400) return 'INVALID_DATA';
    if (statusCode === 503 || statusCode === 502) return 'PROVIDER_UNAVAILABLE';

    // Por mensaje de error
    if (errorStr.includes('timeout') || errorStr.includes('abort')) return 'API_TIMEOUT';
    if (errorStr.includes('Invalid symbol') || errorStr.includes('invalid')) return 'INVALID_SYMBOL';
    if (errorStr.includes('429') || errorStr.includes('rate')) return 'RATE_LIMITED';
    if (errorStr.includes('parse') || errorStr.includes('JSON')) return 'PARSE_ERROR';
    if (errorStr.includes('network') || errorStr.includes('ECONNREFUSED')) return 'NETWORK_ERROR';
    if (errorStr.includes('unavailable') || errorStr.includes('502') || errorStr.includes('503')) 
      return 'PROVIDER_UNAVAILABLE';

    return 'UNKNOWN';
  }

  /**
   * Formatea mensaje descriptivo para el usuario
   */
  private formatMessage(
    symbol: string,
    category: ErrorCategory,
    error: Error | string,
    provider?: string,
    statusCode?: number,
    context?: string
  ): string {
    const providerStr = provider ? ` [${provider}]` : '';
    const contextStr = context ? ` | ${context}` : '';
    const statusStr = statusCode ? ` (${statusCode})` : '';

    const messages: Record<ErrorCategory, string> = {
      API_TIMEOUT: `⏱️ ${symbol}${providerStr}: Timeout - API tardó demasiado${statusStr}`,
      INVALID_SYMBOL: `❌ ${symbol}: Símbolo inválido o no soportado${contextStr}`,
      RATE_LIMITED: `🚫 ${symbol}${providerStr}: Demasiadas solicitudes (rate limited)${statusStr}`,
      INVALID_DATA: `📊 ${symbol}: Datos inválidos recibidos${statusStr}${contextStr}`,
      NETWORK_ERROR: `🌐 ${symbol}: Error de conexión de red${contextStr}`,
      PROVIDER_UNAVAILABLE: `⛔ ${symbol}${providerStr}: Proveedor no disponible${statusStr}`,
      PARSE_ERROR: `🔍 ${symbol}: Error al procesar datos${contextStr}`,
      CACHE_MISS: `💾 ${symbol}: Caché no disponible${contextStr}`,
      UNKNOWN: `⚠️  ${symbol}: Error desconocido${contextStr}`,
    };

    return messages[category];
  }

  /**
   * Logs en consola con estilos según categoría
   */
  private logToConsole(log: ErrorLog): void {
    const styles: Record<ErrorCategory, string> = {
      API_TIMEOUT: 'color: #FF9800; font-weight: bold;', // Naranja
      INVALID_SYMBOL: 'color: #F44336; font-weight: bold;', // Rojo
      RATE_LIMITED: 'color: #9C27B0; font-weight: bold;', // Púrpura
      INVALID_DATA: 'color: #2196F3; font-weight: bold;', // Azul
      NETWORK_ERROR: 'color: #F44336; font-weight: bold;', // Rojo
      PROVIDER_UNAVAILABLE: 'color: #FF5722; font-weight: bold;', // Rojo oscuro
      PARSE_ERROR: 'color: #FFC107; font-weight: bold;', // Amarillo
      CACHE_MISS: 'color: #4CAF50; font-weight: bold;', // Verde
      UNKNOWN: 'color: #757575; font-weight: bold;', // Gris
    };

    const style = styles[log.category];
    const time = log.timestamp.toLocaleTimeString('es-ES');
    const details = log.errorDetails ? `\n  Detalles: ${log.errorDetails}` : '';

    console.log(
      `%c[${time}] ${log.message}${details}`,
      style
    );
  }

  /**
   * Obtiene historial de errores para debugging
   */
  getErrorHistory(symbol?: string, limit: number = 50): ErrorLog[] {
    let filtered = this.logs;
    if (symbol) {
      filtered = filtered.filter(l => l.symbol === symbol);
    }
    return filtered.slice(-limit);
  }

  /**
   * Obtiene resumen de errores por categoría
   */
  getErrorSummary(): Record<ErrorCategory | 'TOTAL', number> {
    const summary: Record<ErrorCategory, number> = {
      API_TIMEOUT: 0,
      INVALID_SYMBOL: 0,
      RATE_LIMITED: 0,
      INVALID_DATA: 0,
      NETWORK_ERROR: 0,
      PROVIDER_UNAVAILABLE: 0,
      PARSE_ERROR: 0,
      CACHE_MISS: 0,
      UNKNOWN: 0,
    };

    for (const log of this.logs) {
      summary[log.category]++;
    }

    return {
      ...summary,
      TOTAL: this.logs.length,
    };
  }

  /**
   * Obtiene estadísticas por símbolo
   */
  getErrorsBySymbol(symbol: string): { category: ErrorCategory; count: number }[] {
    const counts: Record<ErrorCategory, number> = {
      API_TIMEOUT: 0,
      INVALID_SYMBOL: 0,
      RATE_LIMITED: 0,
      INVALID_DATA: 0,
      NETWORK_ERROR: 0,
      PROVIDER_UNAVAILABLE: 0,
      PARSE_ERROR: 0,
      CACHE_MISS: 0,
      UNKNOWN: 0,
    };

    for (const log of this.logs) {
      if (log.symbol === symbol) {
        counts[log.category]++;
      }
    }

    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([category, count]) => ({
        category: category as ErrorCategory,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Limpia el historial de logs
   */
  clearHistory(): void {
    this.logs = [];
  }

  /**
   * Modo silencioso (para tests)
   */
  setSilent(silent: boolean): void {
    this.silent = silent;
  }

  /**
   * Exporta logs en formato JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton
export const errorLoggingService = new ErrorLoggingService();

