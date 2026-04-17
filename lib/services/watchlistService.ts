/**
 * lib/services/watchlistService.ts
 *
 * WatchlistService - Operaciones CRUD para watchlists y sus items
 * Extiende DatabaseService
 */

import { DatabaseService } from './databaseService';

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  settings?: Record<string, any>;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  symbol: string;
  asset_type: 'crypto' | 'stock' | 'forex' | 'commodity';
  added_at: string;
  last_price?: number;
  last_price_update?: string;
  notes?: string;
}

export class WatchlistService extends DatabaseService {
  constructor() {
    super();
    this.logger.info('WatchlistService initialized');
  }

  /**
   * Crear watchlist
   */
  async createWatchlist(data: Omit<Watchlist, 'id' | 'created_at' | 'updated_at'>): Promise<Watchlist> {
    return this.create<Watchlist>('watchlists', {
      ...data,
      id: '',
    } as any);
  }

  /**
   * Obtener watchlist por ID
   */
  async getWatchlistById(watchlistId: string): Promise<Watchlist | null> {
    return this.findById<Watchlist>('watchlists', watchlistId);
  }

  /**
   * Listar watchlists del usuario
   */
  async getUserWatchlists(userId: string): Promise<Watchlist[]> {
    return this.query_where<Watchlist>('watchlists', 'user_id = $1 ORDER BY created_at DESC', [userId]);
  }

  /**
   * Obtener watchlist por defecto del usuario
   */
  async getDefaultWatchlist(userId: string): Promise<Watchlist | null> {
    const result = await this.query_where<Watchlist>(
      'watchlists',
      'user_id = $1 AND is_default = true',
      [userId]
    );
    return result[0] || null;
  }

  /**
   * Actualizar watchlist
   */
  async updateWatchlist(watchlistId: string, updates: Partial<Watchlist>): Promise<Watchlist | null> {
    return this.update<Watchlist>('watchlists', watchlistId, updates);
  }

  /**
   * Eliminar watchlist
   */
  async deleteWatchlist(watchlistId: string): Promise<boolean> {
    return this.delete('watchlists', watchlistId);
  }

  /**
   * Agregar item a watchlist (wrapper)
   */
  async addWatchlistItem(watchlistId: string, symbol: string, asset_type: string): Promise<WatchlistItem> {
    return this.addItem({
      watchlist_id: watchlistId,
      symbol,
      asset_type: asset_type as any,
    });
  }

  /**
   * Remover item de watchlist (wrapper)
   */
  async removeWatchlistItem(itemId: string): Promise<boolean> {
    return this.removeItem(itemId);
  }

  /**
   * Agregar item a watchlist
   */
  async addItem(data: Omit<WatchlistItem, 'id' | 'added_at'>): Promise<WatchlistItem> {
    return this.create<WatchlistItem>('watchlist_items', {
      ...data,
      id: '',
    } as any);
  }

  /**
   * Listar items de watchlist
   */
  async getWatchlistItems(watchlistId: string): Promise<WatchlistItem[]> {
    return this.query_where<WatchlistItem>(
      'watchlist_items',
      'watchlist_id = $1 ORDER BY added_at DESC',
      [watchlistId]
    );
  }

  /**
   * Actualizar item
   */
  async updateItem(itemId: string, updates: Partial<WatchlistItem>): Promise<WatchlistItem | null> {
    return this.update<WatchlistItem>('watchlist_items', itemId, updates);
  }

  /**
   * Eliminar item de watchlist
   */
  async removeItem(itemId: string): Promise<boolean> {
    return this.delete('watchlist_items', itemId);
  }

  /**
   * Obtener item por symbol en watchlist
   */
  async findItemBySymbol(watchlistId: string, symbol: string): Promise<WatchlistItem | null> {
    const result = await this.query_where<WatchlistItem>(
      'watchlist_items',
      'watchlist_id = $1 AND symbol = $2',
      [watchlistId, symbol]
    );
    return result[0] || null;
  }

  /**
   * Actualizar precio de item
   */
  async updateItemPrice(itemId: string, price: number): Promise<void> {
    const sql = `UPDATE watchlist_items SET last_price = $1, last_price_update = NOW() WHERE id = $2`;
    await this.execute(sql, [price, itemId]);
  }

  /**
   * Contar items en watchlist
   */
  async countItems(watchlistId: string): Promise<number> {
    return this.count('watchlist_items', 'watchlist_id = $1', [watchlistId]);
  }

  /**
   * Transacción: Crear watchlist con items
   */
  async createWatchlistWithItems(
    watchlistData: Omit<Watchlist, 'id' | 'created_at' | 'updated_at'>,
    items: Array<Omit<WatchlistItem, 'id' | 'added_at' | 'watchlist_id'>>
  ): Promise<Watchlist> {
    return this.transaction(async (executeQuery) => {
      // Crear watchlist
      const watchlistSql = `
        INSERT INTO watchlists (user_id, name, description, is_default, settings)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const watchlistResult = await executeQuery(watchlistSql, [
        watchlistData.user_id,
        watchlistData.name,
        watchlistData.description,
        watchlistData.is_default,
        JSON.stringify(watchlistData.settings || {}),
      ]);

      const watchlist = watchlistResult[0] as Watchlist;

      // Agregar items
      for (const item of items) {
        const itemSql = `
          INSERT INTO watchlist_items (watchlist_id, symbol, asset_type, notes)
          VALUES ($1, $2, $3, $4)
        `;
        await executeQuery(itemSql, [watchlist.id, item.symbol, item.asset_type, item.notes]);
      }

      return watchlist;
    });
  }
}

export const watchlistService = new WatchlistService();

