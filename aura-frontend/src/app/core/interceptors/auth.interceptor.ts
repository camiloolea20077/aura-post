// auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { IndexDBService } from '../services/index-db.service';
import { LOCALE } from '../../shared/utils/date.utils';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const indexDBService = inject(IndexDBService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return from(indexDBService.getToken()).pipe(
    switchMap((token) => {
      // Adjuntar token si existe y no está expirado
      const cloned =
        token && !authService.isTokenExpired(token)
          ? req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
                'X-locale': LOCALE,
              },
            })
          : req;

      return next(cloned).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            // Token expirado o inválido → limpiar sesión y redirigir
            authService.logout().then(() => {
              router.navigate(['/login']);
            });
          }
          return throwError(() => error);
        }),
      );
    }),
  );
};
