/**
 * Servicio de Alertas Dinámicas - T2.4
 * 
 * Sistema de alertas con condiciones técnicas:
 * - Precio (mayor que, menor que, igual a)
 * - Cambio porcentual (% arriba/abajo)
 * - Indicadores (RSI, MACD, cruce de SMA)
 * - Notificaciones web push
 * - Persistencia en localStorage
 */

import { CandleData } from '@/lib/types';

export type AlertConditionType = 'price' | 'percent_change' | 'rsi' | 'macd' | 'sma_cross';
export type AlertOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
export type AlertNotificationType = 'web' | 'browser' | 'all';

export interface AlertCondition {
  type: AlertConditionType;
  operator: AlertOperator;
  value: number;
  
  // Para RSI, MACD, SMA
  period?: number;
}

export interface Alert {
  id: string;
  symbol: string;
  name: string;
  enabled: boolean;
  condition: AlertCondition;
  createdAt: number;
  lastTriggeredAt: number | null;
  
  // Configuración de notificación
  notificationType: AlertNotificationType;
  soundEnabled: boolean;
  
  // Para evitar spam
  minMinutesBetweenAlerts: number; // Mínimo tiempo entre notificaciones del mismo alert
}

export interface AlertTriggerEvent {
  alert: Alert;
  currentValue: number;
  timestamp: number;
  message: string;
}

export class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private storageKey = 'trading_ia_alerts';
  private observers: Set<(event: AlertTriggerEvent) => void> = new Set();
  private lastSoundTime = 0; // ✅ Rate limiting para sonidos
  private readonly SOUND_COOLDOWN_MS = 5000; // ✅ Mínimo 5 segundos entre sonidos

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Crear nueva alerta
   */
  public createAlert(
    symbol: string,
    name: string,
    condition: AlertCondition,
    options: {
      notificationType?: AlertNotificationType;
      soundEnabled?: boolean;
      minMinutesBetweenAlerts?: number;
    } = {}
  ): Alert {
    // ✅ Validar límite de alertas (máximo 100 para no explotar localStorage)
    if (this.alerts.size >= 100) {
      throw new Error('Maximum number of alerts (100) reached');
    }

    // ✅ Validar inputs
    if (!symbol || typeof symbol !== 'string' || symbol.length > 20) {
      throw new Error('Invalid symbol');
    }
    if (!name || typeof name !== 'string' || name.length > 100) {
      throw new Error('Invalid alert name');
    }
    if (!condition || typeof condition !== 'object') {
      throw new Error('Invalid condition');
    }
    if (!['price', 'percent_change', 'rsi', 'macd', 'sma_cross'].includes(condition.type)) {
      throw new Error('Invalid condition type');
    }
    if (!['gt', 'lt', 'eq', 'gte', 'lte'].includes(condition.operator)) {
      throw new Error('Invalid condition operator');
    }
    if (typeof condition.value !== 'number' || !isFinite(condition.value)) {
      throw new Error('Invalid condition value');
    }
    // ✅ Validar range para SMA period
    if (condition.period && (condition.period < 2 || condition.period > 200)) {
      throw new Error('Invalid period: must be between 2 and 200');
    }

    const alert: Alert = {
      id: this.generateId(),
      symbol,
      name,
      enabled: true,
      condition,
      createdAt: Date.now(),
      lastTriggeredAt: null,
      notificationType: options.notificationType || 'web',
      soundEnabled: options.soundEnabled ?? true,
      minMinutesBetweenAlerts: options.minMinutesBetweenAlerts || 5
    };

    this.alerts.set(alert.id, alert);
    this.saveToStorage();

    return alert;
  }

  /**
   * Obtener todas las alertas
   */
  public getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Obtener alertas para un símbolo específico
   */
  public getAlertsBySymbol(symbol: string): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.symbol === symbol);
  }

  /**
   * Obtener alerta por ID
   */
  public getAlert(id: string): Alert | null {
    return this.alerts.get(id) || null;
  }

  /**
   * Actualizar alerta
   */
  public updateAlert(id: string, updates: Partial<Alert>): Alert | null {
    const alert = this.alerts.get(id);
    if (!alert) return null;

    const updated = { ...alert, ...updates, id: alert.id }; // Prevenir cambio de ID
    this.alerts.set(id, updated);
    this.saveToStorage();

    return updated;
  }

  /**
   * Eliminar alerta
   */
  public deleteAlert(id: string): boolean {
    const deleted = this.alerts.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Habilitar/deshabilitar alerta
   */
  public setAlertEnabled(id: string, enabled: boolean): Alert | null {
    return this.updateAlert(id, { enabled });
  }

  /**
   * Verificar condición de alerta contra datos actuales
   */
  public checkAlert(alert: Alert, currentPrice: number, candles: CandleData[]): boolean {
    if (!alert.enabled) return false;

    // Verificar cooldown de notificaciones
    if (alert.lastTriggeredAt) {
      const minutesSinceLastAlert = (Date.now() - alert.lastTriggeredAt) / 1000 / 60;
      if (minutesSinceLastAlert < alert.minMinutesBetweenAlerts) {
        return false;
      }
    }

    const condition = alert.condition;
    let conditionMet = false;

    switch (condition.type) {
      case 'price':
        conditionMet = this.checkPriceCondition(currentPrice, condition);
        break;

      case 'percent_change':
        if (candles.length > 0) {
          const change = ((currentPrice - candles[candles.length - 1].close) / candles[candles.length - 1].close) * 100;
          conditionMet = this.checkNumericCondition(change, condition);
        }
        break;

      case 'rsi':
        if (candles.length >= 14) {
          const rsi = this.calculateRSI(candles);
          conditionMet = this.checkNumericCondition(rsi, condition);
        }
        break;

      case 'macd':
        if (candles.length >= 26) {
          const macd = this.calculateMACD(candles);
          conditionMet = this.checkNumericCondition(macd, condition);
        }
        break;

      case 'sma_cross':
        if (candles.length >= 20) {
          const crossed = this.checkSMACross(candles, condition.period || 10);
          conditionMet = crossed;
        }
        break;
    }

    return conditionMet;
  }

  /**
   * Verificar todas las alertas para un símbolo (pure check sin efectos secundarios)
   * Los observadores se notifican desde el caller (useAlerts hook)
   */
  public checkAllAlerts(symbol: string, currentPrice: number, candles: CandleData[]): AlertTriggerEvent[] {
    const alertsForSymbol = this.getAlertsBySymbol(symbol);
    const triggeredEvents: AlertTriggerEvent[] = [];

    for (const alert of alertsForSymbol) {
      if (this.checkAlert(alert, currentPrice, candles)) {
        // Actualizar timestamp de último disparo
        this.updateAlert(alert.id, { lastTriggeredAt: Date.now() });

        const message = this.generateAlertMessage(alert, currentPrice, candles);

        const event: AlertTriggerEvent = {
          alert,
          currentValue: currentPrice,
          timestamp: Date.now(),
          message
        };

        triggeredEvents.push(event);
      }
    }

    return triggeredEvents;
  }

  /**
   * Procesar eventos disparados: notificar observadores y enviar notificaciones web
   * Se llama desde useAlerts para evitar duplicados
   */
  public processTriggerEvents(events: AlertTriggerEvent[]): void {
    for (const event of events) {
      // Notificar observadores
      this.notifyObservers(event);

      // Enviar notificación web
      this.sendNotification(event.alert, event.message);
    }
  }

  /**
   * Suscribirse a eventos de alerta
   */
  public subscribe(callback: (event: AlertTriggerEvent) => void): () => void {
    this.observers.add(callback);

    // Retornar función para desuscribirse
    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Privados
   */

  private checkPriceCondition(currentPrice: number, condition: AlertCondition): boolean {
    return this.checkNumericCondition(currentPrice, condition);
  }

  private checkNumericCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'eq':
        return Math.abs(value - condition.value) < 0.01; // Tolerance para floats
      case 'gte':
        return value >= condition.value;
      case 'lte':
        return value <= condition.value;
      default:
        return false;
    }
  }

  private calculateRSI(candles: CandleData[]): number {
    const changes = [];
    for (let i = 1; i < Math.min(14, candles.length); i++) {
      changes.push(candles[i].close - candles[i - 1].close);
    }

    const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0);
    const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0));

    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgGain / Math.max(avgLoss, 0.0001);

    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(candles: CandleData[]): number {
    // Simplificado: usar MACD value
    const ema12 = this.calculateEMA(candles, 12);
    const ema26 = this.calculateEMA(candles, 26);

    return ema12 - ema26;
  }

  private calculateEMA(candles: CandleData[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = candles[0].close;

    for (let i = 1; i < candles.length; i++) {
      ema = candles[i].close * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  private checkSMACross(candles: CandleData[], fastPeriod: number): boolean {
    const slowPeriod = fastPeriod * 2;

    if (candles.length < slowPeriod) return false;

    const recentCandles = candles.slice(-slowPeriod - 1);

    const fastCurrent = recentCandles.slice(-fastPeriod).reduce((sum, c) => sum + c.close, 0) / fastPeriod;
    const slowCurrent = recentCandles.slice(-slowPeriod).reduce((sum, c) => sum + c.close, 0) / slowPeriod;

    const fastPrevious = recentCandles.slice(-fastPeriod - 1, -1).reduce((sum, c) => sum + c.close, 0) / fastPeriod;
    const slowPrevious = recentCandles.slice(-slowPeriod - 1, -1).reduce((sum, c) => sum + c.close, 0) / slowPeriod;

    // Cruce de arriba hacia abajo o de abajo hacia arriba
    const crossedAbove = fastPrevious <= slowPrevious && fastCurrent > slowCurrent;
    const crossedBelow = fastPrevious >= slowPrevious && fastCurrent < slowCurrent;

    return crossedAbove || crossedBelow;
  }

  private generateAlertMessage(alert: Alert, currentPrice: number, candles: CandleData[]): string {
    const condition = alert.condition;
    // ✅ Sanitizar valores para evitar inyección
    const sanitizedSymbol = (alert.symbol || '').replace(/[^A-Z0-9]/g, '');
    const sanitizedName = (alert.name || '').substring(0, 50).replace(/[<>]/g, '');

    switch (condition.type) {
      case 'price':
        return `Alert: ${sanitizedSymbol} price ${condition.operator === 'gt' ? 'exceeded' : 'dropped below'} ${condition.value.toFixed(2)}. Current: ${currentPrice.toFixed(2)}`;

      case 'percent_change':
        const change = ((currentPrice - candles[candles.length - 1].close) / candles[candles.length - 1].close) * 100;
        return `Alert: ${sanitizedSymbol} changed by ${change.toFixed(2)}% (target: ${condition.value}%)`;

      case 'rsi':
        const rsi = this.calculateRSI(candles);
        return `Alert: ${sanitizedSymbol} RSI is ${rsi.toFixed(1)} (target: ${condition.operator === 'gt' ? 'above' : 'below'} ${condition.value})`;

      case 'macd':
        const macd = this.calculateMACD(candles);
        return `Alert: ${sanitizedSymbol} MACD is ${macd.toFixed(4)} (target: ${condition.value})`;

      case 'sma_cross':
        return `Alert: ${sanitizedSymbol} SMA crossover detected`;

      default:
        return `Alert triggered for ${sanitizedSymbol}`;
    }
  }

  private sendNotification(alert: Alert, message: string): void {
    if (alert.notificationType === 'browser' || alert.notificationType === 'all') {
      this.sendBrowserNotification(alert.name, message, alert.soundEnabled);
    }
  }

  private sendBrowserNotification(title: string, message: string, playSound: boolean): void {
    // Notificación en navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icon.png',
        tag: 'trading-ia-alert',
        requireInteraction: true
      });
    }

    // Sonido
    if (playSound) {
      this.playAlertSound();
    }
  }

  private playAlertSound(): void {
    try {
      // ✅ Rate limiting: máximo 1 sonido cada 5 segundos
      const now = Date.now();
      if (now - this.lastSoundTime < this.SOUND_COOLDOWN_MS) {
        return; // Ignorar, sonido muy reciente
      }
      this.lastSoundTime = now;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frecuencia en Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // ✅ Usar errorLoggingService si disponible, sino fallback seguro
      if (typeof console !== 'undefined' && console.error) {
        console.error('Error playing alert sound:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private notifyObservers(event: AlertTriggerEvent): void {
    this.observers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        // ✅ Logging seguro sin exponer stack traces
        const msg = error instanceof Error ? error.message : 'Unknown error';
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[AlertService] Observer error:', msg);
        }
      }
    });
  }

  private saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const alertsArray = Array.from(this.alerts.values());
        localStorage.setItem(this.storageKey, JSON.stringify(alertsArray));
      }
    } catch (error) {
      // ✅ Logging seguro
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (msg.includes('QuotaExceededError')) {
        // ✅ Alerta específica: localStorage lleno
        console.warn('[AlertService] localStorage quota exceeded - consider implementing cleanup');
        // Aquí podrías disparar evento para notificar al usuario
      } else {
        console.warn('[AlertService] Error saving alerts:', msg);
      }
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const alertsArray: Alert[] = JSON.parse(data);
          
          // ✅ Validación de schema - Prevenir inyección de datos maliciosos
          for (const alert of alertsArray) {
            if (!this.isValidAlert(alert)) {
              console.warn('[AlertService] Invalid alert structure in localStorage, skipping');
              continue;
            }
            this.alerts.set(alert.id, alert);
          }
        }
      }
    } catch (error) {
      // ✅ Logging seguro sin exponer stacks
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[AlertService] Error loading alerts:', msg);
      // No fallar completamente, continuar sin alertas
    }
  }

  /**
   * ✅ Validación de estructura de Alert
   */
  private isValidAlert(obj: any): obj is Alert {
    if (!obj || typeof obj !== 'object') return false;
    if (typeof obj.id !== 'string') return false;
    if (typeof obj.symbol !== 'string') return false;
    if (typeof obj.name !== 'string') return false;
    if (typeof obj.enabled !== 'boolean') return false;
    if (!obj.condition || typeof obj.condition !== 'object') return false;
    if (typeof obj.createdAt !== 'number') return false;
    if (obj.lastTriggeredAt !== null && typeof obj.lastTriggeredAt !== 'number') return false;
    if (typeof obj.soundEnabled !== 'boolean') return false;
    if (typeof obj.minMinutesBetweenAlerts !== 'number') return false;
    
    // Validar condition
    const cond = obj.condition;
    if (!['price', 'percent_change', 'rsi', 'macd', 'sma_cross'].includes(cond.type)) return false;
    if (!['gt', 'lt', 'eq', 'gte', 'lte'].includes(cond.operator)) return false;
    if (typeof cond.value !== 'number' || !isFinite(cond.value)) return false;
    
    return true;
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpiar alertas antiguas (más de 30 días)
   */
  public cleanup(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    for (const [id, alert] of this.alerts.entries()) {
      // Eliminar alertas deshabilitadas hace más de 30 días
      if (!alert.enabled && alert.createdAt < thirtyDaysAgo) {
        this.alerts.delete(id);
      }
    }

    this.saveToStorage();
  }
}

export const alertService = new AlertService();
export default alertService;

