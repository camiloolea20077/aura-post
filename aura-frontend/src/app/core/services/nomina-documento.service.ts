import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  AgregarEmpleadosDto,
  AgregarNovedadDocumentoDto,
  CandidatoNominaModel,
  CreateDocumentoNominaDto,
  DetalleLiquidacionModel,
  DocumentoNominaModel,
  EmpleadoDocumentoModel,
  FiltroDocumentoNominaDto,
  LiquidacionEmpleadoModel,
  NovedadDocumentoModel,
  ProcesoDocumentoModel,
  ProyeccionContableModel,
  ResultadoAgregarEmpleadosModel,
} from '../models/nomina-documento.model';
import { PagoNominaDto } from '../models/nomina.model';
import { ProcesoModel } from '../models/proceso.model';
import { PaginaModel } from '../models/nomina-parametros.model';

/**
 * Prenóminas y nóminas por documento.
 *
 * Backend: `NominaDocumentoController` → `/api/nomina/documentos`
 */
@Injectable({ providedIn: 'root' })
export class NominaDocumentoService {
  private readonly base = `${environment.apiUrl}nomina/documentos`;

  constructor(private readonly http: HttpClient) {}

  page(filtro: {
    page: number;
    rows: number;
    search?: string | null;
    params?: FiltroDocumentoNominaDto;
  }): Observable<ResponseModel<PaginaModel<DocumentoNominaModel>>> {
    return this.http.post<ResponseModel<PaginaModel<DocumentoNominaModel>>>(`${this.base}/page`, filtro);
  }

  obtener(id: number): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.get<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}`);
  }

  crearPrenomina(dto: CreateDocumentoNominaDto): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.post<ResponseModel<DocumentoNominaModel>>(`${this.base}/prenomina`, dto);
  }

  actualizar(id: number, dto: CreateDocumentoNominaDto): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.put<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}`, dto);
  }

  anular(id: number): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.put<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}/anular`, {});
  }

  // ── Ciclo prenómina → nómina ───────────────────────────────────────────

  confirmarPrenomina(id: number): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.post<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}/confirmar-prenomina`, {});
  }

  reabrir(id: number): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.post<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}/reabrir`, {});
  }

  /** Devuelve la nómina generada. */
  generarNomina(id: number): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.post<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}/generar-nomina`, {});
  }

  confirmarNomina(id: number): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.post<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}/confirmar-nomina`, {});
  }

  /** Paga empleados de la nómina confirmada; sin `nominaIds` paga todos los pendientes. */
  pagar(id: number, pago: PagoNominaDto, nominaIds: number[] = []): Observable<ResponseModel<DocumentoNominaModel>> {
    return this.http.post<ResponseModel<DocumentoNominaModel>>(`${this.base}/${id}/pagar`, { nominaIds, pago });
  }

  // ── Pestaña Novedades ──────────────────────────────────────────────────

  novedades(id: number): Observable<ResponseModel<NovedadDocumentoModel[]>> {
    return this.http.get<ResponseModel<NovedadDocumentoModel[]>>(`${this.base}/${id}/novedades`);
  }

  agregarNovedad(id: number, dto: AgregarNovedadDocumentoDto): Observable<ResponseModel<NovedadDocumentoModel[]>> {
    return this.http.post<ResponseModel<NovedadDocumentoModel[]>>(`${this.base}/${id}/novedades`, dto);
  }

  eliminarNovedad(id: number, novedadId: number): Observable<ResponseModel<NovedadDocumentoModel[]>> {
    return this.http.delete<ResponseModel<NovedadDocumentoModel[]>>(`${this.base}/${id}/novedades/${novedadId}`);
  }

  // ── Pestaña Empleados ──────────────────────────────────────────────────

  empleados(id: number): Observable<ResponseModel<EmpleadoDocumentoModel[]>> {
    return this.http.get<ResponseModel<EmpleadoDocumentoModel[]>>(`${this.base}/${id}/empleados`);
  }

  /** Vinculaciones vigentes en el período, con la causa por la que no entrarían. */
  candidatos(id: number): Observable<ResponseModel<CandidatoNominaModel[]>> {
    return this.http.get<ResponseModel<CandidatoNominaModel[]>>(`${this.base}/${id}/candidatos`);
  }

  agregarEmpleados(id: number, dto: AgregarEmpleadosDto): Observable<ResponseModel<ResultadoAgregarEmpleadosModel>> {
    return this.http.post<ResponseModel<ResultadoAgregarEmpleadosModel>>(`${this.base}/${id}/empleados`, dto);
  }

  quitarEmpleados(id: number, nominaIds: number[]): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(`${this.base}/${id}/empleados/quitar`, { nominaIds });
  }

  // ── Liquidación y traza ────────────────────────────────────────────────

  /**
   * Lanza la liquidación (202 con el proceso); el avance se consulta con
   * NominaService.consultarProceso. Sin `nominaIds`: todas, o solo las pendientes.
   */
  liquidar(id: number, nominaIds: number[] = [], soloPendientes = false): Observable<ResponseModel<ProcesoModel>> {
    return this.http.post<ResponseModel<ProcesoModel>>(`${this.base}/${id}/liquidar`, { nominaIds, soloPendientes });
  }

  liquidacion(id: number): Observable<ResponseModel<LiquidacionEmpleadoModel[]>> {
    return this.http.get<ResponseModel<LiquidacionEmpleadoModel[]>>(`${this.base}/${id}/liquidacion`);
  }

  detalle(id: number, nominaId: number): Observable<ResponseModel<DetalleLiquidacionModel[]>> {
    return this.http.get<ResponseModel<DetalleLiquidacionModel[]>>(`${this.base}/${id}/liquidacion/${nominaId}/detalle`);
  }

  traza(id: number): Observable<ResponseModel<ProcesoDocumentoModel[]>> {
    return this.http.get<ResponseModel<ProcesoDocumentoModel[]>>(`${this.base}/${id}/traza`);
  }

  /** Asiento que se generaría con lo liquidado (pestaña Contabilidad). */
  contabilidad(id: number): Observable<ResponseModel<ProyeccionContableModel>> {
    return this.http.get<ResponseModel<ProyeccionContableModel>>(`${this.base}/${id}/contabilidad`);
  }

  /** Excel de la consignación de cesantías por fondo (nómina de cesantías confirmada). */
  cesantiasExcel(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/cesantias-excel`, { responseType: 'blob' });
  }

  /** Dispara la descarga de un archivo en el navegador. */
  descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
}
