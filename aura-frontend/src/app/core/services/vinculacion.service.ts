import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { PaginaModel } from '../models/nomina-parametros.model';
import {
  CentroCostoVinculacion,
  CreateNovedadPermitidaDto,
  CreateVinculacionConceptoDto,
  NovedadPermitida,
  VinculacionConcepto,
  CreateVinculacionDto,
  FiltroVinculacion,
  TipoSoporteVinculacion,
  VinculacionModel,
  VinculacionTableModel,
} from '../models/vinculacion.model';

/**
 * Vinculaciones (rediseño de nómina R2).
 *
 * Backend: `VinculacionController` → `/api/nomina/vinculaciones`. El salario y
 * la terminación se cambian con `ContratoService` (`/api/contrato`).
 */
@Injectable({ providedIn: 'root' })
export class VinculacionService {
  private readonly base = `${environment.apiUrl}nomina/vinculaciones`;

  constructor(private readonly http: HttpClient) {}

  /** Listado paginado con búsqueda y filtros. */
  page(
    page: number,
    rows: number,
    search: string | null,
    params: FiltroVinculacion,
  ): Observable<ResponseModel<PaginaModel<VinculacionTableModel>>> {
    return this.http.post<ResponseModel<PaginaModel<VinculacionTableModel>>>(`${this.base}/page`, {
      page,
      rows,
      search,
      params,
    });
  }

  obtener(id: number): Observable<ResponseModel<VinculacionModel>> {
    return this.http.get<ResponseModel<VinculacionModel>>(`${this.base}/${id}`);
  }

  /** Crea la vinculación con su consecutivo y abre el histórico salarial. */
  crear(dto: CreateVinculacionDto): Observable<ResponseModel<VinculacionModel>> {
    return this.http.post<ResponseModel<VinculacionModel>>(this.base, dto);
  }

  /** Edita la vinculación (no el empleado ni el salario). */
  actualizar(id: number, dto: CreateVinculacionDto): Observable<ResponseModel<VinculacionModel>> {
    return this.http.put<ResponseModel<VinculacionModel>>(`${this.base}/${id}`, dto);
  }

  // ── Centros de costo ──────────────────────────────────────────────────

  centrosCosto(id: number): Observable<ResponseModel<CentroCostoVinculacion[]>> {
    return this.http.get<ResponseModel<CentroCostoVinculacion[]>>(`${this.base}/${id}/centros-costo`);
  }

  /** Reemplaza la distribución (vacía o que sume 100 %). */
  guardarCentrosCosto(id: number, centros: CentroCostoVinculacion[]): Observable<ResponseModel<CentroCostoVinculacion[]>> {
    return this.http.put<ResponseModel<CentroCostoVinculacion[]>>(`${this.base}/${id}/centros-costo`, centros);
  }

  // ── Conceptos propios ─────────────────────────────────────────────────

  conceptos(id: number): Observable<ResponseModel<VinculacionConcepto[]>> {
    return this.http.get<ResponseModel<VinculacionConcepto[]>>(`${this.base}/${id}/conceptos`);
  }

  crearConcepto(id: number, dto: CreateVinculacionConceptoDto): Observable<ResponseModel<VinculacionConcepto[]>> {
    return this.http.post<ResponseModel<VinculacionConcepto[]>>(`${this.base}/${id}/conceptos`, dto);
  }

  actualizarConcepto(id: number, conceptoId: number, dto: CreateVinculacionConceptoDto): Observable<ResponseModel<VinculacionConcepto[]>> {
    return this.http.put<ResponseModel<VinculacionConcepto[]>>(`${this.base}/${id}/conceptos/${conceptoId}`, dto);
  }

  eliminarConcepto(id: number, conceptoId: number): Observable<ResponseModel<VinculacionConcepto[]>> {
    return this.http.delete<ResponseModel<VinculacionConcepto[]>>(`${this.base}/${id}/conceptos/${conceptoId}`);
  }

  // ── Novedades permitidas ──────────────────────────────────────────────

  novedadesPermitidas(id: number): Observable<ResponseModel<NovedadPermitida[]>> {
    return this.http.get<ResponseModel<NovedadPermitida[]>>(`${this.base}/${id}/novedades-permitidas`);
  }

  crearNovedad(id: number, dto: CreateNovedadPermitidaDto): Observable<ResponseModel<NovedadPermitida[]>> {
    return this.http.post<ResponseModel<NovedadPermitida[]>>(`${this.base}/${id}/novedades-permitidas`, dto);
  }

  actualizarNovedad(id: number, novedadId: number, dto: CreateNovedadPermitidaDto): Observable<ResponseModel<NovedadPermitida[]>> {
    return this.http.put<ResponseModel<NovedadPermitida[]>>(`${this.base}/${id}/novedades-permitidas/${novedadId}`, dto);
  }

  eliminarNovedad(id: number, novedadId: number): Observable<ResponseModel<NovedadPermitida[]>> {
    return this.http.delete<ResponseModel<NovedadPermitida[]>>(`${this.base}/${id}/novedades-permitidas/${novedadId}`);
  }

  /** Sube el soporte interno (acto/documento) o externo (contrato firmado). */
  subirSoporte(id: number, tipo: TipoSoporteVinculacion, archivo: File): Observable<ResponseModel<VinculacionModel>> {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.post<ResponseModel<VinculacionModel>>(`${this.base}/${id}/soporte/${tipo}`, form);
  }
}
