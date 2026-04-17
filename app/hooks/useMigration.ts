/**
 * app/hooks/useMigration.ts
 *
 * Hook para migrar datos desde localStorage a PostgreSQL
 */

import { useAsync } from './useAsync';

export interface MigrationData {
  user?: {
    email: string;
    name?: string;
    theme?: 'dark' | 'light';
    language?: string;
  };
  watchlists?: Array<{
    name: string;
    description?: string;
    is_default?: boolean;
    items?: Array<{
      symbol: string;
      asset_type: string;
    }>;
  }>;
  alerts?: Array<{
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

/**
 * Hook para migrar datos desde localStorage
 */
export function useMigration() {
  return async (data: MigrationData): Promise<MigrationResult> => {
    const response = await fetch('/api/db/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'migrate',
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en migración');
    }

    return response.json();
  };
}

/**
 * Hook para crear usuario de demostración
 */
export function useCreateDemoUser() {
  return async (): Promise<{ success: boolean; userId: string; email: string }> => {
    const response = await fetch('/api/db/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-demo',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error creando usuario demo');
    }

    return response.json();
  };
}

/**
 * Hook para exportar datos del usuario (backup)
 */
export function useExportUserData(userId?: string) {
  const fetchExport = async () => {
    if (!userId) return null;

    const params = new URLSearchParams();
    params.set('user_id', userId);
    params.set('action', 'export');

    const response = await fetch(`/api/db/migrate?${params.toString()}`);
    if (!response.ok) throw new Error('Error exportando datos');
    return response.json();
  };

  return useAsync(fetchExport, {
    retry: 3,
  });
}

/**
 * Exportar datos a archivo JSON
 */
export function downloadUserDataAsJSON(data: MigrationData, email: string) {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tradingIA-backup-${email}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

