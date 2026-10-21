import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthResponse, EmpresaOpcion, LoginDto, Modulo } from '../models/auth.model';

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
  /** "¿Olvidaste tu contraseña?": el servidor responde igual exista o no el usuario. */
  solicitarCambioClave(usuario: string): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(`${this.apiUrl}/forgot-password`, { usuario });
  }

  /** Cambia la contraseña con el token del enlace que llegó al correo. */
  restablecerClave(token: string, nuevaPassword: string): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(`${this.apiUrl}/reset-password`, { token, nuevaPassword });
  }

  login(dto: LoginDto): Observable<ResponseModel<AuthResponse>> {
    return this.http.post<ResponseModel<AuthResponse>>(
      `${this.apiUrl}/login`,
      dto,
    );
  }

  // ─── Cambiar de sede (token nuevo con la sede elegida) ──────
  cambiarSede(sucursalId: number): Observable<ResponseModel<AuthResponse>> {
    return this.http.post<ResponseModel<AuthResponse>>(
      `${this.apiUrl}/cambiar-sede`,
      { sucursalId },
    );
  }

  // ─── Firma contable: elegir o cambiar la empresa de trabajo ──
  /**
   * Devuelve el token para esa empresa. Tras el login se manda el token de paso
   * ({@code tokenPaso}); desde "Cambiar empresa", el de la sesión.
   */
  seleccionarEmpresa(empresaId: number, tokenPaso?: string): Observable<ResponseModel<AuthResponse>> {
    const headers = tokenPaso ? new HttpHeaders({ Authorization: `Bearer ${tokenPaso}` }) : undefined;
    return this.http.post<ResponseModel<AuthResponse>>(
      `${this.apiUrl}/seleccionar-empresa`,
      { empresaId },
      { headers },
    );
  }

  /** Empresas en las que puede trabajar (su firma y sus clientes). */
  empresas(): Observable<ResponseModel<EmpresaOpcion[]>> {
    return this.http.get<ResponseModel<EmpresaOpcion[]>>(`${this.apiUrl}/empresas`);
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
