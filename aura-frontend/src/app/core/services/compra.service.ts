import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CompraAcreditableFiltroDto,
  CompraAcreditableItemModel,
  CompraAcreditableModel,
  CompraModel,
  CompraTableModel,
  CreateCompraDto,
  CompraPageableDto,
} from '../models/compra.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly apiUrl = `${environment.apiUrl}compras`;
  constructor(private readonly http: HttpClient) {}

  page(
    dto: CompraPageableDto,
  ): Observable<ResponseTableModel<CompraTableModel>> {
    return this.http.post<ResponseTableModel<CompraTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<CompraModel>> {
    return this.http.get<ResponseModel<CompraModel>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Facturas del proveedor sobre las que se puede emitir una nota crédito.
   *
   * <p>Va paginado y con la búsqueda en el servidor: un proveedor de años tiene
   * miles de facturas y traerlas todas para filtrarlas en el navegador tumba el
   * formulario.
   */
  acreditablesPage(
    dto: CompraPageableDto & { params: CompraAcreditableFiltroDto },
  ): Observable<ResponseTableModel<CompraAcreditableModel>> {
    return this.http.post<ResponseTableModel<CompraAcreditableModel>>(
      `${this.apiUrl}/acreditables/page`,
      dto,
    );
  }

  /** Lo que queda por acreditar de cada producto de una factura. */
  itemsAcreditables(
    compraId: number,
  ): Observable<ResponseModel<CompraAcreditableItemModel[]>> {
    return this.http.get<ResponseModel<CompraAcreditableItemModel[]>>(
      `${this.apiUrl}/${compraId}/acreditable`,
    );
  }

  create(dto: CreateCompraDto): Observable<ResponseModel<CompraModel>> {
    return this.http.post<ResponseModel<CompraModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  update(id: number, dto: CreateCompraDto): Observable<ResponseModel<CompraModel>> {
    return this.http.put<ResponseModel<CompraModel>>(`${this.apiUrl}/${id}`, dto);
  }

  anular(id: number): Observable<ResponseModel<boolean>> {
    return this.http.patch<ResponseModel<boolean>>(
      `${this.apiUrl}/${id}/anular`,
      {},
    );
  }
}
