import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  AnticipoCliente,
  CondicionPago,
  FacturaVentaDetalle,
  FacturaVentaFila,
  GuardarFacturaVenta,
} from '../models/factura-venta.model';

/** Ventas › Facturas (factura de venta fuera del POS). */
@Injectable({ providedIn: 'root' })
export class FacturaVentaService {
  private readonly apiUrl = `${environment.apiUrl}facturas-venta`;

  constructor(private readonly http: HttpClient) {}

  page(dto: {
    page: number;
    rows: number;
    search?: string | null;
    params?: { estado?: string | null };
  }): Observable<ResponseTableModel<FacturaVentaFila>> {
    return this.http.post<ResponseTableModel<FacturaVentaFila>>(`${this.apiUrl}/page`, dto);
  }

  getById(id: number): Observable<ResponseModel<FacturaVentaDetalle>> {
    return this.http.get<ResponseModel<FacturaVentaDetalle>>(`${this.apiUrl}/${id}`);
  }

  crear(dto: GuardarFacturaVenta): Observable<ResponseModel<FacturaVentaDetalle>> {
    return this.http.post<ResponseModel<FacturaVentaDetalle>>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: GuardarFacturaVenta): Observable<ResponseModel<FacturaVentaDetalle>> {
    return this.http.put<ResponseModel<FacturaVentaDetalle>>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.apiUrl}/${id}`);
  }

  /** Emite; a crédito puede cruzar anticipos del cliente. */
  emitir(
    id: number,
    anticipos: { anticipoId: number; monto: number }[] = [],
  ): Observable<ResponseModel<FacturaVentaDetalle>> {
    return this.http.post<ResponseModel<FacturaVentaDetalle>>(`${this.apiUrl}/${id}/emitir`, { anticipos });
  }

  /** Borrador con lo pendiente de una cotización. */
  desdeCotizacion(cotizacionId: number, sucursalId: number): Observable<ResponseModel<FacturaVentaDetalle>> {
    return this.http.post<ResponseModel<FacturaVentaDetalle>>(
      `${this.apiUrl}/desde-cotizacion/${cotizacionId}`,
      {},
      { params: { sucursalId: String(sucursalId) } },
    );
  }

  /** Borrador con un pedido de vendedor. */
  desdePedido(pedidoId: number): Observable<ResponseModel<FacturaVentaDetalle>> {
    return this.http.post<ResponseModel<FacturaVentaDetalle>>(`${this.apiUrl}/desde-pedido/${pedidoId}`, {});
  }

  anticiposCliente(clienteId: number): Observable<ResponseModel<AnticipoCliente[]>> {
    return this.http.get<ResponseModel<AnticipoCliente[]>>(`${this.apiUrl}/anticipos-cliente/${clienteId}`);
  }

  guardarCondicion(c: Partial<CondicionPago>): Observable<ResponseModel<CondicionPago>> {
    return c.id
      ? this.http.put<ResponseModel<CondicionPago>>(`${this.apiUrl}/condiciones-pago/${c.id}`, c)
      : this.http.post<ResponseModel<CondicionPago>>(`${this.apiUrl}/condiciones-pago`, c);
  }

  /** Borrador nuevo igual a esta factura. */
  copiar(id: number): Observable<ResponseModel<FacturaVentaDetalle>> {
    return this.http.post<ResponseModel<FacturaVentaDetalle>>(`${this.apiUrl}/${id}/copiar`, {});
  }

  anular(id: number): Observable<ResponseModel<FacturaVentaDetalle>> {
    return this.http.post<ResponseModel<FacturaVentaDetalle>>(`${this.apiUrl}/${id}/anular`, {});
  }

  facturaElectronica(id: number): Observable<ResponseModel<any>> {
    return this.http.post<ResponseModel<any>>(`${this.apiUrl}/${id}/factura-electronica`, {});
  }

  condiciones(soloActivas = true): Observable<ResponseModel<CondicionPago[]>> {
    return this.http.get<ResponseModel<CondicionPago[]>>(`${this.apiUrl}/condiciones-pago`, {
      params: { soloActivas: String(soloActivas) },
    });
  }
}
