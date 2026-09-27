import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CarteraDashboardModel,
  ClienteCarteraModel,
  CreateGestionCobroDto,
  CreateTerceroCreditoDto,
  CuentaVencidaAlertaModel,
  EdadCarteraModel,
  ValidacionCreditoModel,
  CreateReciboCajaDto,
  AgendaCobroModel,
  TableroCarteraModel,
  ReglaCreditoModel,
  SimulacionReglaModel,
  SolicitudCreditoModel,
  FichaClienteCarteraModel,
  ReciboCajaModel,
  ReciboCajaTableModel,
  AcuerdoPagoModel,
  CreateAcuerdoPagoDto,
} from '../models/cartera.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class CarteraService {
  private readonly api = `${environment.apiUrl}cartera`;

  constructor(private readonly http: HttpClient) {}

  // ── Dashboard ─────────────────────────────────────────────────────
  dashboard(): Observable<ResponseModel<CarteraDashboardModel>> {
    return this.http.get<ResponseModel<CarteraDashboardModel>>(`${this.api}/dashboard`);
  }

  // ── Alertas ───────────────────────────────────────────────────────
  alertas(limit = 50): Observable<ResponseModel<CuentaVencidaAlertaModel[]>> {
    return this.http.get<ResponseModel<CuentaVencidaAlertaModel[]>>(
      `${this.api}/alertas`, { params: new HttpParams().set('limit', limit) }
    );
  }

  // ── Edades ────────────────────────────────────────────────────────
  edades(): Observable<ResponseModel<EdadCarteraModel[]>> {
    return this.http.get<ResponseModel<EdadCarteraModel[]>>(`${this.api}/edades`);
  }

  // ── Clientes ──────────────────────────────────────────────────────
  clientes(page: number, rows: number, search?: string): Observable<ResponseModel<PageResult<ClienteCarteraModel>>> {
    let params = new HttpParams().set('page', page).set('rows', rows);
    if (search) params = params.set('search', search);
    return this.http.get<ResponseModel<PageResult<ClienteCarteraModel>>>(`${this.api}/clientes`, { params });
  }

  // ── Crédito ───────────────────────────────────────────────────────
  abrirCredito(dto: CreateTerceroCreditoDto): Observable<ResponseModel<any>> {
    return this.http.post<ResponseModel<any>>(`${this.api}/credito`, dto);
  }

  actualizarCredito(id: number, dto: CreateTerceroCreditoDto): Observable<ResponseModel<any>> {
    return this.http.put<ResponseModel<any>>(`${this.api}/credito/${id}`, dto);
  }

  // ── Validación ────────────────────────────────────────────────────
  validarVenta(terceroId: number, monto: number): Observable<ResponseModel<ValidacionCreditoModel>> {
    const params = new HttpParams().set('terceroId', terceroId).set('monto', monto);
    return this.http.get<ResponseModel<ValidacionCreditoModel>>(`${this.api}/validar-venta`, { params });
  }

  // ── Gestión de cobros ─────────────────────────────────────────────
  registrarGestion(dto: CreateGestionCobroDto): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(`${this.api}/gestion`, dto);
  }

  // ── Score ─────────────────────────────────────────────────────────
  recalcularScore(terceroId: number): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(`${this.api}/score/${terceroId}/recalcular`, {});
  }

  // ── Solicitudes ───────────────────────────────────────────────────
  aprobarSolicitud(id: number): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(`${this.api}/solicitudes/${id}/aprobar`, {});
  }

  rechazarSolicitud(id: number, motivo: string): Observable<ResponseModel<void>> {
    const params = new HttpParams().set('motivo', motivo);
    return this.http.patch<ResponseModel<void>>(`${this.api}/solicitudes/${id}/rechazar`, {}, { params });
  }

  // ── Reglas de crédito ─────────────────────────────────────────────
  reglas(): Observable<ResponseModel<ReglaCreditoModel[]>> {
    return this.http.get<ResponseModel<ReglaCreditoModel[]>>(`${this.api}/reglas`);
  }

  guardarRegla(regla: ReglaCreditoModel): Observable<ResponseModel<ReglaCreditoModel>> {
    return regla.id
      ? this.http.put<ResponseModel<ReglaCreditoModel>>(`${this.api}/reglas/${regla.id}`, regla)
      : this.http.post<ResponseModel<ReglaCreditoModel>>(`${this.api}/reglas`, regla);
  }

  activarRegla(id: number, activo: boolean): Observable<ResponseModel<ReglaCreditoModel>> {
    return this.http.patch<ResponseModel<ReglaCreditoModel>>(`${this.api}/reglas/${id}/activo`, { activo });
  }

  eliminarRegla(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/reglas/${id}`);
  }

  simularRegla(regla: ReglaCreditoModel): Observable<ResponseModel<SimulacionReglaModel[]>> {
    return this.http.post<ResponseModel<SimulacionReglaModel[]>>(`${this.api}/reglas/simular`, regla);
  }

  // ── Autorizaciones de crédito ─────────────────────────────────────
  solicitudes(estado?: string | null): Observable<ResponseModel<SolicitudCreditoModel[]>> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<ResponseModel<SolicitudCreditoModel[]>>(`${this.api}/solicitudes`, { params });
  }

  solicitud(id: number): Observable<ResponseModel<SolicitudCreditoModel>> {
    return this.http.get<ResponseModel<SolicitudCreditoModel>>(`${this.api}/solicitudes/${id}`);
  }

  solicitarAutorizacion(terceroId: number, monto: number, observacion: string | null): Observable<ResponseModel<SolicitudCreditoModel>> {
    return this.http.post<ResponseModel<SolicitudCreditoModel>>(`${this.api}/solicitudes`, { terceroId, monto, observacion });
  }

  aprobarAutorizacion(id: number, vigenciaHoras: number): Observable<ResponseModel<SolicitudCreditoModel>> {
    return this.http.post<ResponseModel<SolicitudCreditoModel>>(`${this.api}/solicitudes/${id}/aprobar`, { vigenciaHoras });
  }

  rechazarAutorizacion(id: number, motivo: string): Observable<ResponseModel<SolicitudCreditoModel>> {
    return this.http.post<ResponseModel<SolicitudCreditoModel>>(`${this.api}/solicitudes/${id}/rechazar`, { motivo });
  }

  // ── Tablero gerencial ─────────────────────────────────────────────
  tablero(meses = 6): Observable<ResponseModel<TableroCarteraModel>> {
    return this.http.get<ResponseModel<TableroCarteraModel>>(`${this.api}/tablero`, {
      params: new HttpParams().set('meses', meses),
    });
  }

  // ── Agenda del cobrador ───────────────────────────────────────────
  agenda(dias = 7): Observable<ResponseModel<AgendaCobroModel>> {
    return this.http.get<ResponseModel<AgendaCobroModel>>(`${this.api}/agenda`, {
      params: new HttpParams().set('dias', dias),
    });
  }

  // ── Ficha del cliente ─────────────────────────────────────────────
  ficha(terceroId: number): Observable<ResponseModel<FichaClienteCarteraModel>> {
    return this.http.get<ResponseModel<FichaClienteCarteraModel>>(`${this.api}/clientes/${terceroId}/ficha`);
  }

  // ── Recibos de caja ───────────────────────────────────────────────
  recibos(filtro: {
    terceroId?: number | null;
    estado?: string | null;
    search?: string | null;
    page: number;
    rows: number;
  }): Observable<ResponseModel<PageResult<ReciboCajaTableModel>>> {
    let params = new HttpParams().set('page', filtro.page).set('rows', filtro.rows);
    if (filtro.terceroId) params = params.set('terceroId', filtro.terceroId);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.search) params = params.set('search', filtro.search);
    return this.http.get<ResponseModel<PageResult<ReciboCajaTableModel>>>(`${this.api}/recibos`, { params });
  }

  recibo(id: number): Observable<ResponseModel<ReciboCajaModel>> {
    return this.http.get<ResponseModel<ReciboCajaModel>>(`${this.api}/recibos/${id}`);
  }

  crearRecibo(dto: CreateReciboCajaDto): Observable<ResponseModel<ReciboCajaModel>> {
    return this.http.post<ResponseModel<ReciboCajaModel>>(`${this.api}/recibos`, dto);
  }

  anularRecibo(id: number, motivo: string): Observable<ResponseModel<ReciboCajaModel>> {
    return this.http.post<ResponseModel<ReciboCajaModel>>(`${this.api}/recibos/${id}/anular`, { motivo });
  }

  reciboPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/recibos/${id}/pdf`, { responseType: 'blob' });
  }

  // ── Acuerdos de pago ──────────────────────────────────────────────
  acuerdos(filtro: {
    estado?: string | null;
    search?: string | null;
    page: number;
    rows: number;
  }): Observable<ResponseModel<PageResult<AcuerdoPagoModel>>> {
    let params = new HttpParams().set('page', filtro.page).set('rows', filtro.rows);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.search) params = params.set('search', filtro.search);
    return this.http.get<ResponseModel<PageResult<AcuerdoPagoModel>>>(`${this.api}/acuerdos`, { params });
  }

  acuerdo(id: number): Observable<ResponseModel<AcuerdoPagoModel>> {
    return this.http.get<ResponseModel<AcuerdoPagoModel>>(`${this.api}/acuerdos/${id}`);
  }

  crearAcuerdo(dto: CreateAcuerdoPagoDto): Observable<ResponseModel<AcuerdoPagoModel>> {
    return this.http.post<ResponseModel<AcuerdoPagoModel>>(`${this.api}/acuerdos`, dto);
  }

  anularAcuerdo(id: number, motivo: string): Observable<ResponseModel<AcuerdoPagoModel>> {
    return this.http.post<ResponseModel<AcuerdoPagoModel>>(`${this.api}/acuerdos/${id}/anular`, { motivo });
  }

  acuerdoPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/acuerdos/${id}/pdf`, { responseType: 'blob' });
  }

  /** Aplica saldo de un anticipo del cliente a una de sus facturas. */
  cruzarAnticipo(anticipoId: number, cuentaCobrarId: number, monto: number): Observable<ResponseModel<unknown>> {
    return this.http.post<ResponseModel<unknown>>(
      `${environment.apiUrl}contabilidad/anticipos/${anticipoId}/cruzar`,
      { cuentaCobrarId: String(cuentaCobrarId), monto: String(monto) },
    );
  }
}
