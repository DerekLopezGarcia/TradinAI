/**
 * app/hooks/useUserData.ts
 *
 * Hook para gestionar datos del usuario desde PostgreSQL
 * Integración con API /api/db/users
 */

import { useAsync } from './useAsync';

export interface User {
  id: string;
  email: string;
  name?: string;
  password_hash?: string;
  theme: 'dark' | 'light';
  notifications_enabled: boolean;
  language: string;
  created_at: string;
  updated_at: string;
  settings?: Record<string, any>;
  last_login_at?: string;
}

export interface UseUserDataOptions {
  userId?: string;
  enabled?: boolean;
}

/**
 * Hook para obtener datos del usuario
 */
export function useUserData({ userId, enabled = true }: UseUserDataOptions) {
  const fetchUser = async () => {
    if (!enabled || !userId) return null;

    const response = await fetch(`/api/db/users/${userId}`);
    if (!response.ok) throw new Error('Error fetching user data');
    return response.json();
  };

  return useAsync(fetchUser, {
    retry: 3,
  });
}

/**
 * Hook para obtener usuario por email
 */
export function useUserByEmail(email?: string) {
  const fetchUser = async () => {
    if (!email) return null;

    const params = new URLSearchParams();
    params.set('email', email);

    const response = await fetch(`/api/db/users?${params.toString()}`);
    if (!response.ok) throw new Error('Error fetching user');
    
    const users = await response.json();
    return users[0] || null;
  };

  return useAsync(fetchUser, {
    retry: 3,
  });
}

/**
 * Hook para actualizar perfil del usuario
 */
export function useUpdateUserProfile() {
  return async (userId: string, updates: Partial<User>) => {
    const response = await fetch(`/api/db/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating profile');
    }

    return response.json();
  };
}

/**
 * Hook para actualizar tema del usuario
 */
export function useUpdateTheme() {
  return async (userId: string, theme: 'dark' | 'light') => {
    const response = await fetch(`/api/db/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating theme');
    }

    return response.json();
  };
}

/**
 * Hook para actualizar lenguaje del usuario
 */
export function useUpdateLanguage() {
  return async (userId: string, language: string) => {
    const response = await fetch(`/api/db/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating language');
    }

    return response.json();
  };
}

/**
 * Hook para actualizar notificaciones del usuario
 */
export function useUpdateNotifications() {
  return async (userId: string, notifications_enabled: boolean) => {
    const response = await fetch(`/api/db/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications_enabled }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating notifications');
    }

    return response.json();
  };
}

/**
 * Hook para crear usuario
 */
export function useCreateUser() {
  return async (email: string, name?: string, theme?: string, language?: string) => {
    const response = await fetch('/api/db/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: name || email.split('@')[0],
        theme: theme || 'dark',
        language: language || 'es',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error creating user');
    }

    return response.json();
  };
}

/**
 * Hook para eliminar usuario
 */
export function useDeleteUser() {
  return async (userId: string) => {
    const response = await fetch(`/api/db/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error deleting user');
    }

    return response.json();
  };
}

/**
 * Hook para actualizar last_login
 */
export function useUpdateLastLogin() {
  return async (userId: string) => {
    const response = await fetch(`/api/db/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Vacío, pero triggers updated_at en DB
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating login time');
    }

    return response.json();
  };
}



