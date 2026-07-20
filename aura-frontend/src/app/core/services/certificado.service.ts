import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DesprendibleModel } from '../models/desprendible.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/**
 * Desprendible y certificados de nómina (Fase 10).
 *
 * Backend: `CertificadoController` → `/api/certificado`
 */
@Injectable({ providedIn: 'root' })
export class CertificadoService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Desprendible de una nómina, con la traza de cada línea. */
  desprendible(nominaId: number): Observable<ResponseModel<DesprendibleModel>> {
    return this.http.get<ResponseModel<DesprendibleModel>>(
      `${this.base}certificado/desprendible/${nominaId}`,
    );
  }

  /**
   * Certificado de ingresos y retenciones de un año.
   *
   * Se archiva: si se pide dos veces devuelve el mismo documento.
   */
  ingresos(terceroId: number, agno: number): Observable<ResponseModel<unknown>> {
    return this.http.get<ResponseModel<unknown>>(
      `${this.base}certificado/ingresos/${terceroId}/${agno}`,
    );
  }
}
