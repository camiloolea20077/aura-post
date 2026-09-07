import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  AuditoriaFiltroDto,
  AuditoriaResultadoModel,
} from '../models/auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly base = `${environment.apiUrl}reportes`;

  constructor(private readonly http: HttpClient) {}

  /** La vista previa de los hallazgos, sin generar el PDF. */
  auditar(
    filtro: AuditoriaFiltroDto,
  ): Observable<ResponseModel<AuditoriaResultadoModel>> {
    return this.http.post<ResponseModel<AuditoriaResultadoModel>>(
      `${this.base}/auditoria`,
      filtro,
    );
  }

  /** El reporte completo. Sale de la misma corrida que la vista previa. */
  pdf(filtro: AuditoriaFiltroDto): Observable<Blob> {
    return this.http.post(`${this.base}/gerencial/pdf`, filtro, {
      responseType: 'blob',
    });
  }
}
