import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CrearMapeoDto,
  ExogenaConcepto,
  ExogenaError,
  ExogenaFormato,
  ExogenaLinea,
  ExogenaLote,
  ExogenaMapeo,
} from '../models/exogena.model';

/** E11 · Información exógena DIAN — /api/contabilidad/exogena */
@Injectable({ providedIn: 'root' })
export class ExogenaService {
  private readonly api = `${environment.apiUrl}contabilidad/exogena`;

  constructor(private readonly http: HttpClient) {}

  formatos(): Observable<ResponseModel<ExogenaFormato[]>> {
    return this.http.get<ResponseModel<ExogenaFormato[]>>(
      `${this.api}/formatos`,
    );
  }

  conceptos(formatoId: number): Observable<ResponseModel<ExogenaConcepto[]>> {
    return this.http.get<ResponseModel<ExogenaConcepto[]>>(
      `${this.api}/formatos/${formatoId}/conceptos`,
    );
  }

  mapeos(formatoId?: number | null): Observable<ResponseModel<ExogenaMapeo[]>> {
    let params = new HttpParams();
    if (formatoId) params = params.set('formatoId', formatoId);
    return this.http.get<ResponseModel<ExogenaMapeo[]>>(`${this.api}/mapeos`, {
      params,
    });
  }

  crearMapeo(dto: CrearMapeoDto): Observable<ResponseModel<ExogenaMapeo>> {
    return this.http.post<ResponseModel<ExogenaMapeo>>(
      `${this.api}/mapeos`,
      dto,
    );
  }

  eliminarMapeo(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/mapeos/${id}`);
  }

  seedMapeos(): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(`${this.api}/mapeos/seed`, {});
  }

  validar(
    anio: number,
    formatoId: number,
  ): Observable<ResponseModel<ExogenaError[]>> {
    const params = new HttpParams()
      .set('anio', anio)
      .set('formatoId', formatoId);
    return this.http.get<ResponseModel<ExogenaError[]>>(`${this.api}/validar`, {
      params,
    });
  }

  generar(
    formatoId: number,
    anio: number,
    cuantiaMenorUmbral?: number | null,
  ): Observable<ResponseModel<ExogenaLote>> {
    return this.http.post<ResponseModel<ExogenaLote>>(`${this.api}/lotes`, {
      formatoId,
      anio,
      cuantiaMenorUmbral,
    });
  }

  lotes(anio?: number | null): Observable<ResponseModel<ExogenaLote[]>> {
    let params = new HttpParams();
    if (anio) params = params.set('anio', anio);
    return this.http.get<ResponseModel<ExogenaLote[]>>(`${this.api}/lotes`, {
      params,
    });
  }

  lineas(loteId: number): Observable<ResponseModel<ExogenaLinea[]>> {
    return this.http.get<ResponseModel<ExogenaLinea[]>>(
      `${this.api}/lotes/${loteId}/lineas`,
    );
  }

  errores(loteId: number): Observable<ResponseModel<ExogenaError[]>> {
    return this.http.get<ResponseModel<ExogenaError[]>>(
      `${this.api}/lotes/${loteId}/errores`,
    );
  }

  aprobar(loteId: number): Observable<ResponseModel<ExogenaLote>> {
    return this.http.post<ResponseModel<ExogenaLote>>(
      `${this.api}/lotes/${loteId}/aprobar`,
      {},
    );
  }

  /** Descarga el Excel del prevalidador DIAN. */
  exportar(loteId: number): Observable<Blob> {
    return this.http.get(`${this.api}/lotes/${loteId}/export`, {
      responseType: 'blob',
    });
  }
}
