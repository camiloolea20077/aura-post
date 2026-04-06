import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthResponse, LoginDto, Modulo } from '../models/auth.model';

import { ResponseModel } from '../../shared/utils/responde.models';
import { environment } from '../../../environments/environment';
import { IndexDBService } from './index-db.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly indexDBService: IndexDBService,
  ) {}

  // ─── Login ──────────────────────────────────────────────────
  login(dto: LoginDto): Observable<ResponseModel<AuthResponse>> {
    return this.http.post<ResponseModel<AuthResponse>>(
      `${this.apiUrl}/login`,
      dto,
    );
  }

  // ─── Obtener sesión guardada como Observable ─────────────────
  // Usado por el AuthGuard para verificar token
  getAuthResponse(): Observable<AuthResponse | null> {
    return from(this.indexDBService.loadDataAuthDB());
  }

  // ─── Verificar si el token JWT está expirado ─────────────────
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload?.exp) return true;

      // exp está en segundos, Date.now() en milisegundos
      const isExpired = Date.now() >= payload.exp * 1000;
      return isExpired;
    } catch {
      return true;
    }
  }

  // ─── Decodificar payload del JWT ────────────────────────────
  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');

      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        '=',
      );

      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  getModulos(): Observable<ResponseModel<Modulo[]>> {
    return this.http.get<ResponseModel<Modulo[]>>(
      `${environment.apiUrl}public/empresas/permisos`,
    );
  }

  // ─── Logout ─────────────────────────────────────────────────
  async logout(): Promise<void> {
    await this.indexDBService.deleteDataAuthDB();
  }

  // ─── Obtener claims del token ────────────────────────────────
  getTokenClaims(): Observable<any> {
    return from(this.indexDBService.getToken()).pipe(
      map((token) => (token ? this.decodeToken(token) : null)),
    );
  }
  isAuthenticated(): Observable<boolean> {
    return this.getAuthResponse().pipe(
      map((auth) => {
        if (!auth?.token) return false;
        return !this.isTokenExpired(auth.token);
      }),
    );
  }
}
