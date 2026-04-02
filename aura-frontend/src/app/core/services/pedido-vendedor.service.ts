import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import {
  CreatePedidoDto,
  PedidoPageableDto,
  PedidoVendedorModel,
  PedidoVendedorTableModel,
  RegistrarCobroDto,
} from '../models/pedido-vendedor.model';

@Injectable({ providedIn: 'root' })
export class PedidoVendedorService {
  private readonly url = `${environment.apiUrl}pedidos-vendedor`;
  constructor(private readonly http: HttpClient) {}

  page(dto: PedidoPageableDto): Observable<ResponseTableModel<PedidoVendedorTableModel>> {
    return this.http.post<ResponseTableModel<PedidoVendedorTableModel>>(`${this.url}/page`, dto);
  }

  getById(id: number): Observable<ResponseModel<PedidoVendedorModel>> {
    return this.http.get<ResponseModel<PedidoVendedorModel>>(`${this.url}/${id}`);
  }

  create(dto: CreatePedidoDto): Observable<ResponseModel<PedidoVendedorModel>> {
    return this.http.post<ResponseModel<PedidoVendedorModel>>(`${this.url}/create`, dto);
  }

  despachar(id: number): Observable<ResponseModel<boolean>> {
    return this.http.patch<ResponseModel<boolean>>(`${this.url}/${id}/despachar`, {});
  }

  registrarCobro(id: number, dto: RegistrarCobroDto): Observable<ResponseModel<boolean>> {
    return this.http.patch<ResponseModel<boolean>>(`${this.url}/${id}/cobrar`, dto);
  }

  anular(id: number): Observable<ResponseModel<boolean>> {
    return this.http.patch<ResponseModel<boolean>>(`${this.url}/${id}/anular`, {});
  }
}
