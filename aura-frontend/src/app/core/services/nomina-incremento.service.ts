import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { DocumentoNominaModel } from '../models/nomina-documento.model';
import {
  EstadoIncremento,
  IncrementoDetalleModel,
  IncrementoModel,
  IncrementoRequestDto,
} from '../models/nomina-incremento.model';
import { PaginaModel } from '../models/nomina-parametros.model';

/**
 * Incrementos salariales: vista previa, aplicar, reversar y generar el retroactivo.
 *
 * Backend: `NominaIncrementoController` → `/api/nomina/incrementos`
 */
@Injectable({ providedIn: 'root' })
export class NominaIncrementoService {
  private readonly base = `${environment.apiUrl}nomina/incrementos`;

  constructor(private readonly http: HttpClient) {}

  page(filtro: {
    page: number;
    rows: number;
    search?: string | null;
    params?: { estado?: EstadoIncremento | null };
  }): Observable<ResponseModel<PaginaModel<IncrementoModel>>> {
    return this.http.post<ResponseModel<PaginaModel<IncrementoModel>>>(`${this.base}/page`, filtro);
  }

  obtener(id: number): Observable<ResponseModel<IncrementoModel>> {
    return this.http.get<ResponseModel<IncrementoModel>>(`${this.base}/${id}`);
  }

  detalle(id: number): Observable<ResponseModel<IncrementoDetalleModel[]>> {
    return this.http.get<ResponseModel<IncrementoDetalleModel[]>>(`${this.base}/${id}/detalle`);
  }

  crear(dto: IncrementoRequestDto): Observable<ResponseModel<IncrementoModel>> {
    return this.http.post<ResponseModel<IncrementoModel>>(this.base, dto);
  }

  actualizar(id: number, dto: IncrementoRequestDto): Observable<ResponseModel<IncrementoModel>> {
    return this.http.put<ResponseModel<IncrementoModel>>(`${this.base}/${id}`, dto);
  }

  quitar(id: number, detalleId: number): Observable<ResponseModel<IncrementoModel>> {
    return this.http.delete<ResponseModel<IncrementoModel>>(`${this.base}/${id}/detalle/${detalleId}`);
  }

  aplicar(id: number): Observable<ResponseModel<IncrementoModel>> {
    return this.http.put<ResponseModel<IncrementoModel>>(`${this.base}/${id}/aplicar`, {});
  }

  reversar(id: number): Observable<ResponseModel<IncrementoModel>> {
    return this.http.put<ResponseModel<IncrementoModel>>(`${this.base}/${id}/reversar`, {});
  }

  anular(id: number): Observable<ResponseModel<IncrementoModel>> {
    return this.http.put<ResponseModel<IncrementoModel>>(`${this.base}/${id}/anular`, {});
  }

  /** Genera la prenómina del retroactivo; devuelve el documento creado. */
  generarRetroactivo(id: number): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.post<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}/retroactivo`, {});
  }
}
