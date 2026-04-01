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

  rotacionInventario(): Observable<any> {
    return this.http.get<any>(`${this.base}/rotacion-inventario`);
  }
}
