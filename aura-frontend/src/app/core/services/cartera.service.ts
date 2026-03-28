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
}
