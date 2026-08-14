import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  TerceroModel,
  TerceroTableModel,
  CreateTerceroDto,
  UpdateTerceroDto,
  TerceroPageableDto,
  MunicipioDto,
  EstadoCuentaClienteModel,
} from '../models/tercero.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class TerceroService {
  private readonly apiUrl = `${environment.apiUrl}terceros`;
  constructor(private readonly http: HttpClient) {}

  page(
    dto: TerceroPageableDto,
  ): Observable<ResponseTableModel<TerceroTableModel>> {
    return this.http.post<ResponseTableModel<TerceroTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<TerceroModel>> {
    return this.http.get<ResponseModel<TerceroModel>>(`${this.apiUrl}/${id}`);
  }

  /** Selector POS — clientes activos */
  clientes(search = ''): Observable<ResponseModel<TerceroTableModel[]>> {
    const params = new HttpParams().set('search', search);
    return this.http.get<ResponseModel<TerceroTableModel[]>>(
      `${this.apiUrl}/clientes`,
      { params },
    );
  }

  /** Selector compras — proveedores activos */
  proveedores(search = ''): Observable<ResponseModel<TerceroTableModel[]>> {
    const params = new HttpParams().set('search', search);
    return this.http.get<ResponseModel<TerceroTableModel[]>>(
      `${this.apiUrl}/proveedores`,
      { params },
    );
  }

  /** Selector de banco — terceros marcados como banco. */
  bancos(search = ''): Observable<ResponseModel<TerceroTableModel[]>> {
    const params = new HttpParams().set('search', search);
    return this.http.get<ResponseModel<TerceroTableModel[]>>(
      `${this.apiUrl}/bancos`,
      { params },
    );
  }

  /** Selector estado de cuenta — clientes y proveedores activos (requiere búsqueda ≥ 2). */
  terceros(search = ''): Observable<ResponseModel<TerceroTableModel[]>> {
    const params = new HttpParams().set('search', search);
    return this.http.get<ResponseModel<TerceroTableModel[]>>(
      `${this.apiUrl}/todos`,
      { params },
    );
  }

  /** Selector completo (todos los clientes y proveedores activos) para dropdowns. */
  tercerosSelector(): Observable<ResponseModel<TerceroTableModel[]>> {
    return this.http.get<ResponseModel<TerceroTableModel[]>>(
      `${this.apiUrl}/selector`,
    );
  }

  create(dto: CreateTerceroDto): Observable<ResponseModel<TerceroModel>> {
    return this.http.post<ResponseModel<TerceroModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateTerceroDto,
  ): Observable<ResponseModel<TerceroModel>> {
    return this.http.put<ResponseModel<TerceroModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }

  buscarMunicipios(search: string): Observable<ResponseModel<MunicipioDto[]>> {
    return this.http.post<ResponseModel<MunicipioDto[]>>(
      `${environment.apiUrl}municipios`,
      { search },
    );
  }

  getMunicipioById(id: number): Observable<ResponseModel<MunicipioDto>> {
    return this.http.get<ResponseModel<MunicipioDto>>(
      `${environment.apiUrl}municipios/${id}`,
    );
  }

  /** Resuelve un municipio por su código DANE (para mostrar el nombre). */
  getMunicipioByCodigo(codigo: string): Observable<ResponseModel<MunicipioDto>> {
    return this.http.get<ResponseModel<MunicipioDto>>(
      `${environment.apiUrl}municipios/codigo/${codigo}`,
    );
  }

  getEstadoCuenta(
    clienteId: number,
    fechaDesde?: string,
    fechaHasta?: string,
  ): Observable<ResponseModel<EstadoCuentaClienteModel>> {
    let params = new HttpParams();
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);
    return this.http.get<ResponseModel<EstadoCuentaClienteModel>>(
      `${this.apiUrl}/${clienteId}/estado-cuenta`,
      { params },
    );
  }

  getEstadoCuentaPdf(
    clienteId: number,
    fechaDesde?: string,
    fechaHasta?: string,
  ): Observable<Blob> {
    let params = new HttpParams();
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);
    return this.http.get(`${this.apiUrl}/${clienteId}/estado-cuenta/pdf`, {
      params,
      responseType: 'blob',
    });
  }
}
