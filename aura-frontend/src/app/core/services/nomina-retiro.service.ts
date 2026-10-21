import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { DocumentoNominaModel } from '../models/nomina-documento.model';
import { PaginaModel } from '../models/nomina-parametros.model';
import { EstadoRetiro, RegistrarRetiroDto, RetiroModel } from '../models/nomina-retiro.model';

/**
 * Retiros de vinculaciones: registrar (termina la vinculación) y anular.
 *
 * Backend: `NominaRetiroController` → `/api/nomina/retiros`
 */
@Injectable({ providedIn: 'root' })
export class NominaRetiroService {
  private readonly base = `${environment.apiUrl}nomina/retiros`;

  constructor(private readonly http: HttpClient) {}

  page(filtro: {
    page: number;
    rows: number;
    search?: string | null;
    params?: { estado?: EstadoRetiro | null };
  }): Observable<ResponseModel<PaginaModel<RetiroModel>>> {
    return this.http.post<ResponseModel<PaginaModel<RetiroModel>>>(`${this.base}/page`, filtro);
  }

  obtener(id: number): Observable<ResponseModel<RetiroModel>> {
    return this.http.get<ResponseModel<RetiroModel>>(`${this.base}/${id}`);
  }

  registrar(dto: RegistrarRetiroDto): Observable<ResponseModel<RetiroModel>> {
    return this.http.post<ResponseModel<RetiroModel>>(this.base, dto);
  }

  /** Genera la prenómina de liquidación definitiva; devuelve el documento creado. */
  generarLiquidacion(id: number): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.post<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}/liquidacion`, {});
  }

  anular(id: number): Observable<ResponseModel<RetiroModel>> {
    return this.http.put<ResponseModel<RetiroModel>>(`${this.base}/${id}/anular`, {});
  }
}
