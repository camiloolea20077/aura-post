import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BodegaDto,
  BodegaTableModel,
  CreateBodegaDto,
  UpdateBodegaDto,
} from '../models/bodega.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class BodegaService {
  private readonly apiUrl = `${environment.apiUrl}bodegas`;

  constructor(private readonly http: HttpClient) {}

  page(filter: {
    page: number;
    rows: number;
    search?: string | null;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/page`, filter);
  }

  /**
   * Combo de bodegas. Sin `sucursalId` usa la del token; `todas` trae las de
   * la empresa (traslados entre sedes) y `soloVenta` deja fuera averías y
   * cuarentena.
   */
  list(opts?: {
    sucursalId?: number | null;
    todas?: boolean;
    soloVenta?: boolean;
  }): Observable<ResponseModel<BodegaDto[]>> {
    let params = new HttpParams();
    if (opts?.sucursalId != null)
      params = params.set('sucursalId', String(opts.sucursalId));
    if (opts?.todas) params = params.set('todas', 'true');
    if (opts?.soloVenta) params = params.set('soloVenta', 'true');
    return this.http.get<ResponseModel<BodegaDto[]>>(`${this.apiUrl}/list`, {
      params,
    });
  }

  getById(id: number): Observable<ResponseModel<BodegaTableModel>> {
    return this.http.get<ResponseModel<BodegaTableModel>>(
      `${this.apiUrl}/${id}`,
    );
  }

  create(dto: CreateBodegaDto): Observable<ResponseModel<BodegaTableModel>> {
    return this.http.post<ResponseModel<BodegaTableModel>>(this.apiUrl, dto);
  }

  update(
    id: number,
    dto: UpdateBodegaDto,
  ): Observable<ResponseModel<BodegaTableModel>> {
    return this.http.put<ResponseModel<BodegaTableModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.apiUrl}/${id}`);
  }
}
