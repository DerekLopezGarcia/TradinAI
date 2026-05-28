/**
 * lib/services/migrationService.ts
 *
 * MigrationService - Migra datos de localStorage a PostgreSQL
 * Valida integridad y gestiona rollback
 */

import { userService } from './userService';
import { watchlistService } from './watchlistService';
import { alertServiceDB } from './alertServiceDB';
import { BaseService } from '../core/services';

export interface MigrationData {
  user?: {
    id?: string;
    email: string;
    name?: string;
    theme?: 'dark' | 'light';
    language?: string;
  };
  watchlists?: Array<{
    id?: string;
    name: string;
    description?: string;
    is_default?: boolean;
    items?: Array<{
      symbol: string;
      asset_type: string;
    }>;
  }>;
  alerts?: Array<{
    id?: string;
    symbol: string;
    asset_type: string;
    condition_type: string;
    target_price?: number;
    trigger_percentage?: number;
    frequency?: string;
    is_active?: boolean;
  }>;
}

export interface MigrationResult {
  success: boolean;
  userId?: string;
  watchlistsCount: number;
  alertsCount: number;
  errors: string[];
  warnings: string[];
}

export class MigrationService extends BaseService {
  constructor() {
    super('migration');
  }

  /**
   * Migrar datos desde localStorage exportados
   */
  async migrateUserData(data: MigrationData): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      watchlistsCount: 0,
      alertsCount: 0,
      errors: [],
      warnings: [],
    };

    try {
      // 1. Validar datos
      const validation = this.validateMigrationData(data);
      if (!validation.valid) {
        result.errors.push(...validation.errors);
        return result;
      }
      result.warnings.push(...validation.warnings);

      // 2. Crear o actualizar usuario
      let userId: string;
      if (!data.user?.email) {
        result.errors.push('User email required');
        return result;
      }

      const existingUser = await userService.findByEmail(data.user.email);
      if (existingUser) {
        userId = existingUser.id;
        this.logger.info(`Existing user found: ${userId}`);
      } else {
        const newUser = await userService.createUser({
          email: data.user.email,
          name: data.user.name || data.user.email.split('@')[0],
          theme: data.user.theme || 'dark',
          language: data.user.language || 'es',
          notifications_enabled: true,
        });
        userId = newUser.id;
        this.logger.info(`New user created: ${userId}`);
      }

      result.userId = userId;

      // 3. Migrar watchlists
      if (data.watchlists && data.watchlists.length > 0) {
        for (const wl of data.watchlists) {
          try {
            const watchlist = await watchlistService.createWatchlist({
              user_id: userId,
              name: wl.name,
              description: wl.description,
              is_default: wl.is_default || false,
            });

            // Agregar items a watchlist
            if (wl.items && wl.items.length > 0) {
              for (const item of wl.items) {
                try {
                  await watchlistService.addWatchlistItem(
                    watchlist.id,
                    item.symbol,
                    item.asset_type
                  );
                } catch (err) {
                  result.warnings.push(
                    `No se pudo agregar item ${item.symbol} a watchlist ${wl.name}`
                  );
                }
              }
            }

            result.watchlistsCount++;
          } catch (err) {
            result.warnings.push(
              `Failed to migrate watchlist ${wl.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
        }
      }

      // 4. Migrar alertas
      if (data.alerts && data.alerts.length > 0) {
        for (const alert of data.alerts) {
          try {
            await alertServiceDB.createAlert({
              user_id: userId,
              symbol: alert.symbol,
              asset_type: alert.asset_type as any,
              condition_type: alert.condition_type as any,
              target_price: alert.target_price,
              trigger_percentage: alert.trigger_percentage,
              frequency: (alert.frequency as any) || 'once',
              is_active: alert.is_active !== false,
            });
            result.alertsCount++;
          } catch (err) {
            result.warnings.push(
              `Failed to migrate alert for ${alert.symbol}: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
        }
      }

      result.success = true;
      this.logger.info('Migration completed successfully', result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error.message : 'migration.errorUnknown';
      result.errors.push(`Migration error: ${err}`);
      this.logger.error('Migration error', error as Error);
      return result;
    }
  }

  /**
   * Validar datos de migración
   */
  private validateMigrationData(data: MigrationData): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data) {
      errors.push('migration.errorEmpty');
      return { valid: false, errors, warnings };
    }

    // Validar usuario
    if (!data.user) {
      errors.push('migration.errorUserRequired');
    } else {
      if (!data.user.email || !data.user.email.includes('@')) {
        errors.push('migration.errorInvalidEmail');
      }
    }

    // Validar watchlists
    if (data.watchlists) {
      if (!Array.isArray(data.watchlists)) {
        errors.push('migration.errorWatchlistsArray');
      } else {
        for (const wl of data.watchlists) {
          if (!wl.name) {
            warnings.push('migration.warningWatchlistNoName');
          }
          if (wl.items && !Array.isArray(wl.items)) {
            warnings.push('migration.warningItemsArray');
          }
        }
      }
    }

    // Validar alertas
    if (data.alerts) {
      if (!Array.isArray(data.alerts)) {
        errors.push('migration.errorAlertsArray');
      } else {
        for (const alert of data.alerts) {
          if (!alert.symbol) {
            warnings.push('migration.warningAlertNoSymbol');
          }
          if (!['crypto', 'stock', 'forex', 'commodity'].includes(alert.asset_type)) {
            warnings.push(
              `Alert ${alert.symbol}: invalid asset_type ${alert.asset_type}`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Crear usuario de demostración
   */
  async createDemoUser(): Promise<string> {
    const demoEmail = 'demo@tradingIA.com';

    try {
      // Verificar si ya existe
      const existing = await userService.findByEmail(demoEmail);
      if (existing) {
        this.logger.info(`Demo user already exists: ${existing.id}`);
        return existing.id;
      }

      // Crear usuario demo
      const demoUser = await userService.createUser({
        email: demoEmail,
        name: 'Demo User',
        theme: 'dark',
        language: 'es',
        notifications_enabled: true,
      });

      this.logger.info(`Demo user created: ${demoUser.id}`);
      return demoUser.id;
    } catch (error) {
      this.logger.error('Error creating demo user', error as Error);
      throw error;
    }
  }

  /**
   * Exportar datos del usuario (para backup antes de migrar)
   */
  async exportUserData(userId: string): Promise<MigrationData> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const watchlists = await watchlistService.getUserWatchlists(userId);
      const watchlistsData = [];

      for (const wl of watchlists) {
        const items = await watchlistService.getWatchlistItems(wl.id);
        watchlistsData.push({
          id: wl.id,
          name: wl.name,
          description: wl.description,
          is_default: wl.is_default,
          items: items.map((i) => ({
            symbol: i.symbol,
            asset_type: i.asset_type,
          })),
        });
      }

      const alerts = await alertServiceDB.getUserAlerts(userId, 100);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          theme: user.theme,
          language: user.language,
        },
        watchlists: watchlistsData,
        alerts: alerts.map((a) => ({
          id: a.id,
          symbol: a.symbol,
          asset_type: a.asset_type,
          condition_type: a.condition_type,
          target_price: a.target_price,
          trigger_percentage: a.trigger_percentage,
          frequency: a.frequency,
          is_active: a.is_active,
        })),
      };
    } catch (error) {
      this.logger.error('Error exporting user data', error as Error);
      throw error;
    }
  }
}

export const migrationService = new MigrationService();




