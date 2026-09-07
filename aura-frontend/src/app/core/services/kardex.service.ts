import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  KardexFiltroDto,
  KardexReporteFiltroDto,
} from '../models/kardex.model';

@Injectable({ providedIn: 'root' })
export class KardexService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  page(filtro: KardexFiltroDto): Observable<any> {
    return this.http.post<any>(`${this.base}kardex/page`, filtro);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}kardex/resumen/${id}`);
  }

  // Selectores auxiliares
  getSucursales(): Observable<any> {
    // El endpoint de sucursales es /activas (no /list, que caía en /{id}).
    return this.http.get<any>(`${this.base}sucursales/activas`);
  }

  buscarProductos(search: string): Observable<any> {
    return this.http.get<any>(`${this.base}productos/list?search=${search}`);
  }

  /**
   * El catálogo de tipos de movimiento.
   *
   * El front tenía su propia lista con 9 de los 17 tipos que escribe el
   * backend: merma, obsequio, devolución y reconteo salían en la tabla pero no
   * se podían filtrar. Ahora la sirve el enum del backend.
   */
  tiposMovimiento(): Observable<any> {
    return this.http.get<any>(`${this.base}kardex/tipos-movimiento`);
  }

  /** Reporte agrupado: una fila por producto con lo que entró y salió. */
  reporte(filtro: KardexReporteFiltroDto): Observable<any> {
    return this.http.post<any>(`${this.base}kardex/reporte`, filtro);
  }

  /** Kardex clásico de un producto, con saldo corrido. */
  detalle(filtro: KardexFiltroDto): Observable<any> {
    return this.http.post<any>(`${this.base}kardex/reporte/detalle`, filtro);
  }

  excelReporte(filtro: KardexReporteFiltroDto): Observable<Blob> {
    return this.http.post(`${this.base}reportes/kardex/excel`, filtro, {
      responseType: 'blob',
    });
  }

  excelDetalle(filtro: KardexFiltroDto): Observable<Blob> {
    return this.http.post(`${this.base}reportes/kardex/detalle/excel`, filtro, {
      responseType: 'blob',
    });
  }

  /** El resumen no tiene PDF: sus 23 columnas no se leen en una hoja. */
  pdfDetalle(filtro: KardexFiltroDto): Observable<Blob> {
    return this.http.post(`${this.base}reportes/kardex/detalle/pdf`, filtro, {
      responseType: 'blob',
    });
  }

  categorias(): Observable<any> {
    return this.http.get<any>(`${this.base}categorias/list`);
  }

  marcas(): Observable<any> {
    return this.http.get<any>(`${this.base}marcas/list`);
  }
}
