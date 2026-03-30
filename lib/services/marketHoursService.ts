/**
 * Servicio para gestionar horarios de apertura y cierre de mercados
 */

export interface MarketHours {
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index';
  timezone: string;
  openTime: { hour: number; minute: number }; // UTC
  closeTime: { hour: number; minute: number }; // UTC
  isOpen24: boolean;
}

export const MARKET_HOURS: Record<string, MarketHours> = {
  // Criptos - Abiertas 24/7
  'BTCUSD': { name: 'Bitcoin', type: 'crypto', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'ETHUSD': { name: 'Ethereum', type: 'crypto', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'SOLUSD': { name: 'Solana', type: 'crypto', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'XRPUSD': { name: 'XRP', type: 'crypto', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'ADAUSD': { name: 'Cardano', type: 'crypto', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'DOGEUSD': { name: 'Dogecoin', type: 'crypto', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'POLKAUSD': { name: 'Polkadot', type: 'crypto', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'LITEUSD': { name: 'Litecoin', type: 'crypto', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },

  // Acciones NASDAQ (9:30 - 16:00 EST = 13:30 - 20:00 UTC)
  'AAPL': { name: 'Apple', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'MSFT': { name: 'Microsoft', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'GOOGL': { name: 'Google', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'AMZN': { name: 'Amazon', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'TSLA': { name: 'Tesla', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'META': { name: 'Meta', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'NFLX': { name: 'Netflix', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'NVDA': { name: 'NVIDIA', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },

  // Acciones NYSE (9:30 - 16:00 EST = 13:30 - 20:00 UTC)
  'JPM': { name: 'JPMorgan', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'BAC': { name: 'Bank of America', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'GS': { name: 'Goldman Sachs', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'BA': { name: 'Boeing', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'JNJ': { name: 'Johnson & Johnson', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'PG': { name: 'Procter & Gamble', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'WMT': { name: 'Walmart', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'DIS': { name: 'Disney', type: 'stock', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },

  // Índices (mismo horario que NYSE)
  'SPX': { name: 'S&P 500', type: 'index', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'NDX': { name: 'NASDAQ-100', type: 'index', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'DXY': { name: 'Dollar Index', type: 'index', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'VIX': { name: 'VIX', type: 'index', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },

  // Forex - Abiertas casi 24/7 (con cierre el fin de semana)
  'EURUSD': { name: 'Euro/Dólar', type: 'forex', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'GBPUSD': { name: 'Libra/Dólar', type: 'forex', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'JPYUSD': { name: 'Yen/Dólar', type: 'forex', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'CHFUSD': { name: 'Franco/Dólar', type: 'forex', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'AUDUSD': { name: 'Dólar Australiano/USD', type: 'forex', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },
  'CADMXN': { name: 'Dólar Canadiense/Peso', type: 'forex', timezone: 'UTC', openTime: { hour: 0, minute: 0 }, closeTime: { hour: 24, minute: 0 }, isOpen24: true },

  // Materias Primas (horarios de NYSE extendido)
  'XAUUSD': { name: 'Oro', type: 'commodity', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'XAGUSD': { name: 'Plata', type: 'commodity', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'XPTUSD': { name: 'Platino', type: 'commodity', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'XPDUSD': { name: 'Paladio', type: 'commodity', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'COPPER': { name: 'Cobre', type: 'commodity', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'CRUDE': { name: 'Petróleo', type: 'commodity', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
  'NATGAS': { name: 'Gas Natural', type: 'commodity', timezone: 'NYSE', openTime: { hour: 13, minute: 30 }, closeTime: { hour: 20, minute: 0 }, isOpen24: false },
};

class MarketHoursService {
  /**
   * Obtiene los horarios para un símbolo
   */
  getMarketHours(symbol: string): MarketHours {
    return MARKET_HOURS[symbol] || {
      name: symbol,
      type: 'stock',
      timezone: 'UTC',
      openTime: { hour: 13, minute: 30 },
      closeTime: { hour: 20, minute: 0 },
      isOpen24: false,
    };
  }

  /**
   * Verifica si un mercado está abierto en este momento
   */
  isMarketOpen(symbol: string): boolean {
    const hours = this.getMarketHours(symbol);
    if (hours.isOpen24) return true;

    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    const openTime = hours.openTime.hour * 60 + hours.openTime.minute;
    const closeTime = hours.closeTime.hour * 60 + hours.closeTime.minute;

    return currentTime >= openTime && currentTime < closeTime;
  }

  /**
   * Calcula la hora de apertura de hoy en milisegundos
   */
  getTodayOpenTime(symbol: string): number {
    const hours = this.getMarketHours(symbol);
    const today = new Date();
    today.setUTCHours(hours.openTime.hour, hours.openTime.minute, 0, 0);
    return today.getTime();
  }

  /**
   * Calcula la hora de cierre de hoy en milisegundos
   */
  getTodayCloseTime(symbol: string): number {
    const hours = this.getMarketHours(symbol);
    const today = new Date();
    today.setUTCHours(hours.closeTime.hour, hours.closeTime.minute, 0, 0);
    return today.getTime();
  }

  /**
   * Obtiene información sobre el estado del mercado
   */
  getMarketStatus(symbol: string): {
    isOpen: boolean;
    openTime: Date;
    closeTime: Date;
    type: string;
    nextEventTime: Date;
    nextEvent: 'opening' | 'closing';
  } {
    const hours = this.getMarketHours(symbol);
    const now = new Date();
    const openTime = new Date(now);
    const closeTime = new Date(now);

    openTime.setUTCHours(hours.openTime.hour, hours.openTime.minute, 0, 0);
    closeTime.setUTCHours(hours.closeTime.hour, hours.closeTime.minute, 0, 0);

    const isOpen = this.isMarketOpen(symbol);

    let nextEventTime: Date;
    let nextEvent: 'opening' | 'closing';

    if (now < openTime) {
      nextEventTime = openTime;
      nextEvent = 'opening';
    } else if (now < closeTime) {
      nextEventTime = closeTime;
      nextEvent = 'closing';
    } else {
      // Mercado cerrado, próxima apertura es mañana
      const tomorrow = new Date(openTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextEventTime = tomorrow;
      nextEvent = 'opening';
    }

    return {
      isOpen,
      openTime,
      closeTime,
      type: hours.type,
      nextEventTime,
      nextEvent,
    };
  }
}

export const marketHoursService = new MarketHoursService();

