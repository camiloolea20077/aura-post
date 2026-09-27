import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LoteModel,
  LoteTableModel,
  UpdateLoteDto,
  VencimientoLoteModel,
  LotePageableDto,
} from '../models/lote.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class LoteService {
  private readonly apiUrl = `${environment.apiUrl}lotes`;
  constructor(private readonly http: HttpClient) {}

  page(dto: LotePageableDto): Observable<ResponseTableModel<LoteTableModel>> {
    return this.http.post<ResponseTableModel<LoteTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }
  getById(id: number): Observable<ResponseModel<LoteModel>> {
    return this.http.get<ResponseModel<LoteModel>>(`${this.apiUrl}/${id}`);
  }
  porVencer(): Observable<ResponseModel<LoteTableModel[]>> {
    return this.http.get<ResponseModel<LoteTableModel[]>>(
      `${this.apiUrl}/por-vencer`,
    );
  }
  vencimientos(
    sucursalId: number | null,
    dias: number | null,
  ): Observable<ResponseModel<VencimientoLoteModel[]>> {
    const params: string[] = [];
    if (sucursalId) params.push(`sucursalId=${sucursalId}`);
    if (dias !== null && dias !== undefined) params.push(`dias=${dias}`);
    return this.http.get<ResponseModel<VencimientoLoteModel[]>>(
      `${this.apiUrl}/vencimientos${params.length ? '?' + params.join('&') : ''}`,
    );
  }
  reglas(): Observable<ResponseModel<{ bloquearVencidos: boolean; diasAlerta: number }>> {
    return this.http.get<ResponseModel<{ bloquearVencidos: boolean; diasAlerta: number }>>(
      `${this.apiUrl}/reglas`,
    );
  }
  guardarReglas(dto: {
    bloquearVencidos: boolean;
    diasAlerta: number;
  }): Observable<ResponseModel<{ bloquearVencidos: boolean; diasAlerta: number }>> {
    return this.http.put<ResponseModel<{ bloquearVencidos: boolean; diasAlerta: number }>>(
      `${this.apiUrl}/reglas`,
      dto,
    );
  }
  update(id: number, dto: UpdateLoteDto): Observable<ResponseModel<LoteModel>> {
    return this.http.put<ResponseModel<LoteModel>>(`${this.apiUrl}/${id}`, dto);
  }
  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
