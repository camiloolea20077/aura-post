import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  SerialProductoModel,
  SerialProductoTableModel,
  CreateSerialProductoDto,
  SerialPageableDto,
  SerialBuscadoModel,
  SerialTrazaModel,
} from '../models/serial-producto.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';
import { IFilterTable } from '../../shared/utils/filter-table';

@Injectable({ providedIn: 'root' })
export class SerialProductoService {
  private readonly apiUrl = `${environment.apiUrl}seriales`;
  constructor(private readonly http: HttpClient) {}

  page(
    filter: IFilterTable<any>,
  ): Observable<ResponseTableModel<SerialProductoTableModel>> {
    return this.http.post<ResponseTableModel<SerialProductoTableModel>>(
      `${this.apiUrl}/page`,
      filter,
    );
  }
  getById(id: number): Observable<ResponseModel<SerialProductoModel>> {
    return this.http.get<ResponseModel<SerialProductoModel>>(
      `${this.apiUrl}/${id}`,
    );
  }
  create(
    dto: CreateSerialProductoDto,
  ): Observable<ResponseModel<SerialProductoModel>> {
    return this.http.post<ResponseModel<SerialProductoModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }
  /** Seriales DISPONIBLES de un producto en una sucursal. */
  disponibles(
    productoId: number,
    sucursalId: number,
  ): Observable<ResponseModel<SerialProductoTableModel[]>> {
    return this.http.get<ResponseModel<SerialProductoTableModel[]>>(
      `${this.apiUrl}/disponibles/${productoId}/${sucursalId}`,
    );
  }
  /** Seriales de una línea vendida que se pueden devolver. */
  vendidosEnLinea(
    ventaDetalleId: number,
  ): Observable<ResponseModel<SerialProductoTableModel[]>> {
    return this.http.get<ResponseModel<SerialProductoTableModel[]>>(
      `${this.apiUrl}/venta-detalle/${ventaDetalleId}`,
    );
  }
  /** POS: el texto escaneado es un serial disponible. */
  buscar(
    codigo: string,
    sucursalId?: number | null,
  ): Observable<ResponseModel<SerialBuscadoModel[]>> {
    const suc = sucursalId ? `&sucursalId=${sucursalId}` : '';
    return this.http.get<ResponseModel<SerialBuscadoModel[]>>(
      `${this.apiUrl}/buscar?codigo=${encodeURIComponent(codigo)}${suc}`,
    );
  }
  trazabilidad(serial: string): Observable<ResponseModel<SerialTrazaModel[]>> {
    return this.http.get<ResponseModel<SerialTrazaModel[]>>(
      `${this.apiUrl}/trazabilidad?serial=${encodeURIComponent(serial)}`,
    );
  }
  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
