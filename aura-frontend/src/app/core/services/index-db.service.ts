import { Injectable } from '@angular/core';
import localforage from 'localforage';
import { AuthResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class IndexDBService {
  private readonly AUTH_KEY = 'authResponse';

  constructor() {
    localforage.config({
      name: 'aura-pos-db',
      version: 1.0,
      storeName: 'authData',
      description: 'Datos de sesión AURA POS',
    });
  }

  // ─── Guardar sesión completa ────────────────────────────────
  async saveAuthData(data: AuthResponse): Promise<void> {
    try {
      await localforage.setItem<AuthResponse>(this.AUTH_KEY, data);
    } catch (error) {
      console.error('[IndexDB] Error guardando sesión:', error);
    }
  }

  // ─── Cargar sesión completa ─────────────────────────────────
  async loadDataAuthDB(): Promise<AuthResponse | null> {
    try {
      const data = await localforage.getItem<AuthResponse>(this.AUTH_KEY);
      return data ?? null;
    } catch (error) {
      console.error('[IndexDB] Error cargando sesión:', error);
      return null;
    }
  }

  // ─── Eliminar sesión (logout) ───────────────────────────────
  async deleteDataAuthDB(): Promise<void> {
    try {
      await localforage.removeItem(this.AUTH_KEY);
    } catch (error) {
      console.error('[IndexDB] Error eliminando sesión:', error);
    }
  }

  // ─── Verificar autenticación ────────────────────────────────
  async isAuthenticated(): Promise<boolean> {
    const data = await this.loadDataAuthDB();
    return !!data?.token;
  }

  // ─── Getters individuales ───────────────────────────────────
  async getToken(): Promise<string | null> {
    const data = await this.loadDataAuthDB();
    return data?.token ?? null;
  }

  async getEmpresaId(): Promise<number | null> {
    const data = await this.loadDataAuthDB();
    return data?.user?.empresaId ?? null;
  }

  async getSucursalId(): Promise<number | null> {
    const data = await this.loadDataAuthDB();
    return data?.user?.sucursalId ?? null;
  }

  async getUsuarioId(): Promise<number | null> {
    const data = await this.loadDataAuthDB();
    return data?.user?.id ?? null;
  }

  async getUserNombre(): Promise<string | null> {
    const data = await this.loadDataAuthDB();
    return data?.user?.nombre ?? null;
  }

  async getRol(): Promise<string | null> {
    const data = await this.loadDataAuthDB();
    return data?.user?.rol ?? null;
  }
}