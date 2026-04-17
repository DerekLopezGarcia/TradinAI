/**
 * lib/services/userService.ts
 *
 * UserService - Operaciones CRUD para usuarios
 * Extiende DatabaseService
 */

import { DatabaseService } from './databaseService';

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

export class UserService extends DatabaseService {
  constructor() {
    super();
    this.logger.info('UserService initialized');
  }

  /**
   * Obtener usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.query_where<User>('users', 'email = $1', [email]);
    return result[0] || null;
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    return this.create<User>('users', {
      ...data,
      id: '',
    } as any);
  }

  /**
   * Actualizar usuario
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    return this.update<User>('users', userId, updates);
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.findById<User>('users', userId);
  }

  /**
   * Listar todos los usuarios
   */
  async getAllUsers(limit?: number): Promise<User[]> {
    return this.findAll<User>('users', { limit });
  }

  /**
   * Actualizar last_login
   */
  async updateLastLogin(userId: string): Promise<void> {
    const sql = `UPDATE users SET last_login_at = NOW() WHERE id = $1`;
    await this.execute(sql, [userId]);
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(userId: string): Promise<boolean> {
    return this.delete('users', userId);
  }

  /**
   * Contar usuarios totales
   */
  async countUsers(): Promise<number> {
    return this.count('users');
  }
}

export const userService = new UserService();

