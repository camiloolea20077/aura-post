import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CuentaPagarModel,
  CuentaPagarTableModel,
  CreateCuentaPagarDto,
  UpdateCuentaPagarDto,
  CreateAbonoPagarDto,
  AbonoPagarModel,
  CuentaPagarFilters,
  ResumenCuentasPagar,
} from '../models/cuenta-pagar.model';

@Injectable({ providedIn: 'root' })
export class CuentaPagarService {
  private readonly base = `${environment.apiUrl}cuentas-pagar`;

  constructor(private readonly http: HttpClient) {}

  page(
    pageable: Partial<CuentaPagarFilters & { page: number; rows: number; search?: string | null; order_by?: string; order?: string }>,
  ): Observable<{ status: number; message: string; error: boolean; data: { content: CuentaPagarTableModel[]; totalElements: number; totalPages: number; size: number; number: number } }> {
    return this.http.post<any>(`${this.base}/page`, pageable);
  }

  getById(id: number): Observable<{ status: number; message: string; error: boolean; data: CuentaPagarModel }> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(dto: CreateCuentaPagarDto): Observable<{ status: number; message: string; error: boolean; data: CuentaPagarModel }> {
    return this.http.post<any>(`${this.base}`, dto);
  }

  update(id: number, dto: UpdateCuentaPagarDto): Observable<{ status: number; message: string; error: boolean; data: CuentaPagarModel }> {
    return this.http.put<any>(`${this.base}/${id}`, dto);
  }

  createAbono(cuentaId: number, dto: CreateAbonoPagarDto): Observable<{ status: number; message: string; error: boolean; data: AbonoPagarModel }> {
    return this.http.post<any>(`${this.base}/${cuentaId}/abonos`, dto);
  }

  getAbonos(cuentaId: number): Observable<{ status: number; message: string; error: boolean; data: AbonoPagarModel[] }> {
    return this.http.get<any>(`${this.base}/${cuentaId}/abonos`);
  }

  deleteAbono(cuentaId: number, abonoId: number): Observable<{ status: number; message: string; error: boolean; data: null }> {
    return this.http.delete<any>(`${this.base}/${cuentaId}/abonos/${abonoId}`);
  }

  getResumen(params?: Partial<CuentaPagarFilters>): Observable<{ status: number; message: string; error: boolean; data: ResumenCuentasPagar }> {
    const queryParams = new URLSearchParams();
    if (params?.fechaDesde) queryParams.set('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) queryParams.set('fechaHasta', params.fechaHasta);
    if (params?.proveedorId) queryParams.set('proveedorId', String(params.proveedorId));
    if (params?.estado) queryParams.set('estado', params.estado);
    return this.http.get<any>(`${this.base}/resumen?${queryParams.toString()}`);
  }

  getVencidas(): Observable<{ status: number; message: string; error: boolean; data: CuentaPagarTableModel[] }> {
    return this.http.get<any>(`${this.base}/vencidas`);
  }
}
