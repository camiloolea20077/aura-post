import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ProductoModel,
  ProductoTableModel,
  CreateProductoDto,
  UpdateProductoDto,
  PageableDto,
  ProductoInventarioModel,
  ConsumoComponenteModel,
  UsoProducto,
  CambioUnidadPreviewModel,
  CambioUnidadRequest,
} from '../models/producto.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly apiUrl = `${environment.apiUrl}productos`;

  constructor(private readonly http: HttpClient) {}

  // ─── Paginado via POST body (como el backend) ─────────────
  page(dto: PageableDto): Observable<ResponseTableModel<ProductoTableModel>> {
    return this.http.post<ResponseTableModel<ProductoTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  // ─── Detalle por ID ───────────────────────────────────────
  getById(id: number): Observable<ResponseModel<ProductoModel>> {
    return this.http.get<ResponseModel<ProductoModel>>(`${this.apiUrl}/${id}`);
  }

  // ─── Lista simple para dropdowns ─────────────────────────
  list(): Observable<ResponseModel<ProductoTableModel[]>> {
    return this.http.get<ResponseModel<ProductoTableModel[]>>(
      `${this.apiUrl}/list`,
    );
  }

  // ─── Búsqueda para selects (server-side, limitado) ───────
  /** `usos` restringe por uso del producto (p. ej. insumos para una receta). */
  search(
    query: string,
    usos?: UsoProducto[],
  ): Observable<ResponseModel<ProductoTableModel[]>> {
    let params = new HttpParams().set('search', query);
    if (usos?.length) params = params.set('uso', usos.join(','));
    return this.http.get<ResponseModel<ProductoTableModel[]>>(
      `${this.apiUrl}/list`,
      { params },
    );
  }

  // ─── Operaciones de inventario (merma, obsequio) ──────────
  /** A diferencia de /pos, incluye insumos y productos ocultos del POS. */
  buscarInventario(
    search: string,
    sucursalId: number | null,
  ): Observable<ResponseModel<ProductoInventarioModel[]>> {
    let params = new HttpParams().set('search', search);
    if (sucursalId) params = params.set('sucursalId', sucursalId);
    return this.http.get<ResponseModel<ProductoInventarioModel[]>>(
      `${this.apiUrl}/inventario`,
      { params },
    );
  }

  /** Coincidencia exacta por SKU o código de barras (escáner). 404 si no existe. */
  /** Producto para operaciones de inventario, por id y con el stock de la sucursal. */
  inventarioPorId(
    productoId: number,
    sucursalId: number | null,
  ): Observable<ResponseModel<ProductoInventarioModel>> {
    let params = new HttpParams();
    if (sucursalId) params = params.set('sucursalId', sucursalId);
    return this.http.get<ResponseModel<ProductoInventarioModel>>(
      `${this.apiUrl}/inventario/id/${productoId}`,
      { params },
    );
  }

  buscarPorCodigo(
    codigo: string,
    sucursalId: number | null,
  ): Observable<ResponseModel<ProductoInventarioModel>> {
    let params = new HttpParams();
    if (sucursalId) params = params.set('sucursalId', sucursalId);
    return this.http.get<ResponseModel<ProductoInventarioModel>>(
      `${this.apiUrl}/inventario/codigo/${encodeURIComponent(codigo)}`,
      { params },
    );
  }

  /** Componentes que salen del inventario por `cantidad` unidades de un producto con receta. */
  explosion(
    productoId: number,
    cantidad: number,
    sucursalId: number | null,
  ): Observable<ResponseModel<ConsumoComponenteModel[]>> {
    let params = new HttpParams().set('cantidad', cantidad);
    if (sucursalId) params = params.set('sucursalId', sucursalId);
    return this.http.get<ResponseModel<ConsumoComponenteModel[]>>(
      `${this.apiUrl}/${productoId}/explosion`,
      { params },
    );
  }

  /** Vista previa de pasar la base del producto a una presentación más pequeña. */
  previewCambioUnidad(
    productoId: number,
    presentacionId: number,
  ): Observable<ResponseModel<CambioUnidadPreviewModel>> {
    const params = new HttpParams().set('presentacionId', presentacionId);
    return this.http.get<ResponseModel<CambioUnidadPreviewModel>>(
      `${this.apiUrl}/${productoId}/cambio-unidad`,
      { params },
    );
  }

  aplicarCambioUnidad(
    productoId: number,
    dto: CambioUnidadRequest,
  ): Observable<ResponseModel<CambioUnidadPreviewModel>> {
    return this.http.post<ResponseModel<CambioUnidadPreviewModel>>(
      `${this.apiUrl}/${productoId}/cambio-unidad`,
      dto,
    );
  }

  // ─── CRUD ─────────────────────────────────────────────────
  create(dto: CreateProductoDto): Observable<ResponseModel<ProductoModel>> {
    return this.http.post<ResponseModel<ProductoModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  update(
    id: number,
    dto: UpdateProductoDto,
  ): Observable<ResponseModel<ProductoModel>> {
    return this.http.put<ResponseModel<ProductoModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
  /** Idempotente: si el producto ya tiene código, devuelve ese mismo. */
  generarCodigoBarras(id: number): Observable<ResponseModel<any>> {
    return this.http.post<ResponseModel<any>>(
      `${this.apiUrl}/${id}/codigo-barras/generar`,
      {},
    );
  }

  actualizarCodigoBarras(
    id: number,
    dto: { codigoBarras: string },
  ): Observable<ResponseModel<any>> {
    return this.http.patch<ResponseModel<any>>(
      `${this.apiUrl}/${id}/codigo-barras`,
      dto,
    );
  }
}
