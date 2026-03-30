/**
 * Pool de Web Workers para paralelización de cálculos
 * Mantiene 4 workers activos y distribuye tareas entre ellos
 * 
 * T1.1 Fase 2: Verdadera paralelización sin bloquear UI
 */

import { IndicatorWorkerInput, IndicatorWorkerOutput } from './indicatorWorker';

export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    input: IndicatorWorkerInput;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private activeWorkers: Set<number> = new Set();
  private readonly poolSize = 4;
  private supported = false;

  constructor() {
    // Detectar si Web Workers está soportado
    this.supported = typeof Worker !== 'undefined';

    if (!this.supported) {
      console.warn(
        'Web Workers not supported. Fallback to synchronous calculation.'
      );
      return;
    }

    // Inicializar pool de workers
    try {
      for (let i = 0; i < this.poolSize; i++) {
        // En navegador, crear worker desde archivo bundleado
        const worker = new Worker(
          new URL('./indicatorWorker.ts', import.meta.url),
          { type: 'module' }
        );
        this.workers.push(worker);
      }
    } catch (error) {
      console.warn('Failed to initialize workers:', error);
      this.supported = false;
    }
  }

  /**
   * Ejecutar cálculo de indicador en worker pool
   */
  async execute(input: IndicatorWorkerInput): Promise<any> {
    // Si no hay soporte de workers, caer a implementación síncrona
    if (!this.supported || this.workers.length === 0) {
      return this.executeSync(input);
    }

    return new Promise((resolve, reject) => {
      this.taskQueue.push({ input, resolve, reject });
      this.processTasks();
    });
  }

  /**
   * Procesar tareas pendientes usando workers disponibles
   */
  private processTasks(): void {
    while (this.taskQueue.length > 0 && this.activeWorkers.size < this.poolSize) {
      const task = this.taskQueue.shift();
      if (!task) break;

      // Encontrar worker disponible
      const workerIndex = this.findAvailableWorker();
      if (workerIndex === -1) break;

      this.activeWorkers.add(workerIndex);
      const worker = this.workers[workerIndex];

      // Manejar respuesta del worker
      const messageHandler = (event: MessageEvent<IndicatorWorkerOutput>) => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        this.activeWorkers.delete(workerIndex);

        if ('error' in event.data && event.data.error) {
          task.reject(new Error(event.data.error as string));
        } else {
          task.resolve(event.data.result);
        }

        // Procesar siguiente tarea en queue
        this.processTasks();
      };

      const errorHandler = (error: ErrorEvent) => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        this.activeWorkers.delete(workerIndex);

        task.reject(new Error(error.message || 'Worker error'));
        this.processTasks();
      };

      worker.addEventListener('message', messageHandler);
      worker.addEventListener('error', errorHandler);

      // Enviar tarea al worker
      worker.postMessage(task.input);
    }
  }

  /**
   * Encontrar worker disponible
   */
  private findAvailableWorker(): number {
    for (let i = 0; i < this.workers.length; i++) {
      if (!this.activeWorkers.has(i)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Fallback síncrono para navegadores sin Web Workers
   */
  private executeSync(input: IndicatorWorkerInput): any {
    const {
      type,
      closes,
      highs,
      lows,
    } = input;

    // Lazy import para evitar circular dependencies
    const {
      calculateRSI,
      calculateMACD,
      calculateBollingerBands,
      calculateATR,
      calculateStochastic,
    } = require('@/lib/indicators');

    switch (type) {
      case 'rsi':
        return closes ? calculateRSI(closes, 14) : null;
      case 'macd':
        return closes ? calculateMACD(closes) : null;
      case 'bollingerBands':
        return closes ? calculateBollingerBands(closes, 20, 2) : null;
      case 'atr':
        return highs && lows && closes ? calculateATR(highs, lows, closes, 14) : null;
      case 'stochastic':
        return highs && lows && closes
          ? calculateStochastic(highs, lows, closes, 14, 3)
          : null;
      default:
        throw new Error(`Unknown indicator type: ${type}`);
    }
  }

  /**
   * Terminar todos los workers (para cleanup)
   */
  terminate(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers.clear();
  }

  /**
   * Verificar si workers están soportados
   */
  isSupported(): boolean {
    return this.supported && this.workers.length > 0;
  }
}

// Singleton instance
let poolInstance: WorkerPool | null = null;

/**
 * Obtener instancia global del pool
 */
export function getWorkerPool(): WorkerPool {
  if (!poolInstance) {
    poolInstance = new WorkerPool();
  }
  return poolInstance;
}


