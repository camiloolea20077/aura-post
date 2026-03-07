import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CuentaCobrarModel,
  CuentaCobrarTableModel,
  CreateCuentaCobrarDto,
  UpdateCuentaCobrarDto,
  CreateAbonoCobrarDto,
  AbonoCobrarModel,
  CuentaCobrarFilters,
  ResumenCuentasCobrar,
} from '../models/cuenta-cobrar.model';

@Injectable({ providedIn: 'root' })
export class CuentaCobrarService {
  private readonly base = `${environment.apiUrl}cuentas-cobrar`;

  constructor(private readonly http: HttpClient) {}

  page(
    pageable: Partial<
      CuentaCobrarFilters & {
        page: number;
        rows: number;
        search?: string | null;
        order_by?: string;
        order?: string;
      }
    >,
  ): Observable<{
    status: number;
    message: string;
    error: boolean;
    data: {
      content: CuentaCobrarTableModel[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
    };
  }> {
    return this.http.post<any>(`${this.base}/page`, pageable);
  }

  getById(
    id: number,
  ): Observable<{
    status: number;
    message: string;
    error: boolean;
    data: CuentaCobrarModel;
  }> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(
    dto: CreateCuentaCobrarDto,
  ): Observable<{
    status: number;
    message: string;
    error: boolean;
    data: CuentaCobrarModel;
  }> {
    return this.http.post<any>(`${this.base}`, dto);
  }

  update(
    id: number,
    dto: UpdateCuentaCobrarDto,
  ): Observable<{
    status: number;
    message: string;
    error: boolean;
    data: CuentaCobrarModel;
  }> {
    return this.http.put<any>(`${this.base}/${id}`, dto);
  }

  createAbono(
    cuentaId: number,
    dto: CreateAbonoCobrarDto,
  ): Observable<{
    status: number;
    message: string;
    error: boolean;
    data: AbonoCobrarModel;
  }> {
    return this.http.post<any>(`${this.base}/${cuentaId}/abonos`, dto);
  }

  getAbonos(
    cuentaId: number,
  ): Observable<{
    status: number;
    message: string;
    error: boolean;
    data: AbonoCobrarModel[];
  }> {
    return this.http.get<any>(`${this.base}/${cuentaId}/abonos`);
  }

  deleteAbono(
    cuentaId: number,
    abonoId: number,
  ): Observable<{
    status: number;
    message: string;
    error: boolean;
    data: null;
  }> {
    return this.http.delete<any>(`${this.base}/${cuentaId}/abonos/${abonoId}`);
  }

  getResumen(
    params?: Partial<CuentaCobrarFilters>,
  ): Observable<{
    status: number;
    message: string;
    error: boolean;
    data: ResumenCuentasCobrar;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.fechaDesde) queryParams.set('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) queryParams.set('fechaHasta', params.fechaHasta);
    if (params?.clienteId)
      queryParams.set('clienteId', String(params.clienteId));
    if (params?.estado) queryParams.set('estado', params.estado);
    return this.http.get<any>(`${this.base}/resumen?${queryParams.toString()}`);
  }

  getVencidas(): Observable<{
    status: number;
    message: string;
    error: boolean;
    data: CuentaCobrarTableModel[];
  }> {
    return this.http.get<any>(`${this.base}/vencidas`);
  }

  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' });
  }

  descargarAbonoPdf(abonoId: number): Observable<Blob> {
    return this.http.get(`${this.base}/abonos/${abonoId}/pdf`, {
      responseType: 'blob',
    });
  }
}
