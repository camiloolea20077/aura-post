import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { IndexDBService } from '../services/index-db.service';
import { AlertService } from '../../shared/pipes/alert.service';
import { AuthResponse } from '../models/auth.model';


@Injectable()
export class GlobalInterceptor implements HttpInterceptor {
  constructor(
    private readonly indexDBService: IndexDBService,
    private readonly router: Router,
    private readonly alertService: AlertService
  ) {}

  intercept<T>(
    request: HttpRequest<T>,
    next: HttpHandler
  ): Observable<HttpEvent<T>> {
    return from(this.indexDBService.loadDataAuthDB()).pipe(
      switchMap((auth: AuthResponse | null) => {
        let headers = request.headers;

        if (auth?.token) {
          headers = headers
            .set('Authorization', `Bearer ${auth.token}`)
            .set('Accept', '*/*');
        }

        // FormData: no poner Content-Type (el browser lo pone con boundary)
        if (request.body instanceof FormData) {
          request = request.clone({
            headers: headers.set('enctype', 'multipart/form-data'),
          });
        } else {
          request = request.clone({ headers });
        }

        return next.handle(request).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              this.alertService.showError(
                'Sesión expirada',
                error.error?.message ?? 'Por favor, vuelva a iniciar sesión.'
              );
              this.indexDBService.deleteDataAuthDB();
              this.router.navigate(['/login']);
            }
            // Propaga el error para que el catch del servicio lo maneje
            return throwError(() => error.error || error);
          })
        );
      })
    );
  }
}