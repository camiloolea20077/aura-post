import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateOrdenCompraDto,
  OrdenCompraModel,
  OrdenCompraTableModel,
  RecepcionOrdenDto,
} from '../models/orden-compra.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class OrdenCompraService {
  private readonly api = `${environment.apiUrl}ordenes-compra`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ResponseModel<OrdenCompraTableModel[]>> {
    return this.http.get<ResponseModel<OrdenCompraTableModel[]>>(this.api);
  }

  obtener(id: number): Observable<ResponseModel<OrdenCompraModel>> {
    return this.http.get<ResponseModel<OrdenCompraModel>>(`${this.api}/${id}`);
  }

  crear(dto: CreateOrdenCompraDto): Observable<ResponseModel<OrdenCompraModel>> {
    return this.http.post<ResponseModel<OrdenCompraModel>>(this.api, dto);
  }

  actualizar(id: number, dto: CreateOrdenCompraDto): Observable<ResponseModel<OrdenCompraModel>> {
    return this.http.put<ResponseModel<OrdenCompraModel>>(`${this.api}/${id}`, dto);
  }

  enviar(id: number): Observable<ResponseModel<OrdenCompraModel>> {
    return this.http.patch<ResponseModel<OrdenCompraModel>>(`${this.api}/${id}/enviar`, {});
  }

  confirmar(id: number): Observable<ResponseModel<OrdenCompraModel>> {
    return this.http.patch<ResponseModel<OrdenCompraModel>>(`${this.api}/${id}/confirmar`, {});
  }

  recibir(id: number, dto: RecepcionOrdenDto): Observable<ResponseModel<OrdenCompraModel>> {
    return this.http.post<ResponseModel<OrdenCompraModel>>(`${this.api}/${id}/recibir`, dto);
  }

  anular(id: number): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(`${this.api}/${id}/anular`, {});
  }
}
