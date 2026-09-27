import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { NotificacionModel } from '../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly apiUrl = `${environment.apiUrl}notificaciones`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ResponseModel<NotificacionModel[]>> {
    return this.http.get<ResponseModel<NotificacionModel[]>>(this.apiUrl);
  }
}
