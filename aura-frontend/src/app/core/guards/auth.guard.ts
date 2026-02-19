import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const isLoginRoute = state.url === '/login';
    const isRootRoute  = state.url === '/';

    return this.authService
      .getAuthResponse()
      .toPromise()
      .then((authResponse) => {
        const token     = authResponse?.token;
        const isExpired = !token || this.authService.isTokenExpired(token);

        // ── Ruta raíz '/' ────────────────────────────────────
        if (isRootRoute) {
          this.router.navigate([isExpired ? '/login' : '/dashboard']);
          return false;
        }

        // ── Token expirado o inexistente ─────────────────────
        if (isExpired) {
          if (!isLoginRoute) {
            this.router.navigate(['/login']);
            return false;
          }
          return true; // permite acceder al login
        }

        // ── Token válido intentando ir al login ──────────────
        if (isLoginRoute) {
          this.router.navigate(['/dashboard']);
          return false;
        }

        // ── Token válido, acceso normal ──────────────────────
        return true;
      });
  }
}