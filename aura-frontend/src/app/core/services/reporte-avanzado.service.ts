import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ReporteVentasCategoriaModel,
  ReporteTopProductoModel,
  ReporteVentasVendedorModel,
  ReporteMargenesProductoModel,
  ReporteRotacionInventarioModel,
  ReporteResumenAvanzadoModel,
  ReporteMovimientosCajaModel,
  ReporteUtilidadCreditoModel,
  ReporteUtilidadFiltro,
  ReporteUtilidadModel,
} from '../models/reporte-avanzado.model';

@Injectable({ providedIn: 'root' })
export class ReporteAvanzadoService {
  private readonly base = `${environment.apiUrl}reportes/avanzado`;

  constructor(private http: HttpClient) {}

  private buildParams(desde?: string, hasta?: string): HttpParams {
    let p = new HttpParams();
    if (desde) p = p.set('desde', desde);
    if (hasta) p = p.set('hasta', hasta);
    return p;
  }

  resumen(desde?: string, hasta?: string): Observable<any> {
    return this.http.get<any>(`${this.base}/resumen`, {
      params: this.buildParams(desde, hasta),
    });
  }

  ventasPorCategoria(desde?: string, hasta?: string): Observable<any> {
    return this.http.get<any>(`${this.base}/ventas-categoria`, {
      params: this.buildParams(desde, hasta),
    });
  }

  topProductos(desde?: string, hasta?: string, limite = 20): Observable<any> {
    let p = this.buildParams(desde, hasta).set('limite', limite.toString());
    return this.http.get<any>(`${this.base}/top-productos`, { params: p });
  }

  ventasPorVendedor(desde?: string, hasta?: string): Observable<any> {
    return this.http.get<any>(`${this.base}/ventas-vendedor`, {
      params: this.buildParams(desde, hasta),
    });
  }

  margenes(desde?: string, hasta?: string): Observable<any> {
    return this.http.get<any>(`${this.base}/margenes`, {
      params: this.buildParams(desde, hasta),
    });
  }

  /** Utilidad en ventas (venta sin IVA − costo promedio al vender), contado y crédito. */
  utilidad(filtro: ReporteUtilidadFiltro): Observable<{ data: ReporteUtilidadModel }> {
    return this.http.get<{ data: ReporteUtilidadModel }>(`${this.base}/utilidad`, {
      params: this.utilidadParams(filtro),
    });
  }

  /** Las ventas a crédito del período, con utilidad, abonado y por cobrar. */
  utilidadCredito(filtro: ReporteUtilidadFiltro): Observable<{ data: ReporteUtilidadCreditoModel[] }> {
    return this.http.get<{ data: ReporteUtilidadCreditoModel[] }>(`${this.base}/utilidad/credito`, {
      params: this.buildParams(filtro.desde, filtro.hasta),
    });
  }

  /** El mismo reporte de utilidad en Excel. */
  utilidadExcel(filtro: ReporteUtilidadFiltro): Observable<Blob> {
    return this.http.get(`${this.base}/utilidad/excel`, {
      params: this.utilidadParams(filtro),
      responseType: 'blob',
    });
  }

  private utilidadParams(f: ReporteUtilidadFiltro): HttpParams {
    return this.buildParams(f.desde, f.hasta).set('agrupar', f.agrupar).set('forma', f.forma);
  }

  rotacionInventario(): Observable<any> {
    return this.http.get<any>(`${this.base}/rotacion-inventario`);
  }

  movimientosCaja(desde?: string, hasta?: string): Observable<any> {
    return this.http.get<any>(`${this.base}/movimientos-caja`, {
      params: this.buildParams(desde, hasta),
    });
  }
}
