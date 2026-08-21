import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CajaModel,
  CajaTableModel,
  CreateCajaDto,
  UpdateCajaDto,
  CajaPageableDto,
  TurnoCajaModel,
  TurnoCajaTableModel,
  AbrirTurnoDto,
  CerrarTurnoDto,
  TurnoPageableDto,
  ResumenTurnoDto,
  MovimientoCajaDto,
  CreateMovimientoCajaDto,
  CreateAjusteRetroactivoDto,
} from '../models/caja.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

// ─── Caja ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly apiUrl = `${environment.apiUrl}cajas`;
  constructor(private readonly http: HttpClient) {}

  page(dto: CajaPageableDto): Observable<ResponseTableModel<CajaTableModel>> {
    return this.http.post<ResponseTableModel<CajaTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }
  getById(id: number): Observable<ResponseModel<CajaModel>> {
    return this.http.get<ResponseModel<CajaModel>>(`${this.apiUrl}/${id}`);
  }
  create(dto: CreateCajaDto): Observable<ResponseModel<CajaModel>> {
    return this.http.post<ResponseModel<CajaModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }
  update(id: number, dto: UpdateCajaDto): Observable<ResponseModel<CajaModel>> {
    return this.http.put<ResponseModel<CajaModel>>(`${this.apiUrl}/${id}`, dto);
  }
  delete(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.apiUrl}/${id}`);
  }
}

// ─── Turno de caja ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TurnoCajaService {
  private readonly apiUrl = `${environment.apiUrl}turnos`;
  constructor(private readonly http: HttpClient) {}

  page(
    dto: TurnoPageableDto,
  ): Observable<ResponseTableModel<TurnoCajaTableModel>> {
    return this.http.post<ResponseTableModel<TurnoCajaTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }
  getById(id: number): Observable<ResponseModel<TurnoCajaModel>> {
    return this.http.get<ResponseModel<TurnoCajaModel>>(`${this.apiUrl}/${id}`);
  }
  /** Turno activo del usuario actual — usado por POS */
  turnoActivo(): Observable<ResponseModel<TurnoCajaModel>> {
    return this.http.get<ResponseModel<TurnoCajaModel>>(
      `${this.apiUrl}/activo`,
    );
  }

  /**
   * Cajas con turno abierto, para preguntar de cual sale o entra la plata.
   *
   * A diferencia de turnoActivo(), no depende del usuario: el administrador no
   * tiene turno propio pero sí necesita elegir la caja del punto de venta.
   */
  abiertos(sucursalId?: number): Observable<ResponseModel<TurnoCajaModel[]>> {
    let params = new HttpParams();
    if (sucursalId != null) params = params.set('sucursalId', sucursalId);
    return this.http.get<ResponseModel<TurnoCajaModel[]>>(
      `${this.apiUrl}/abiertos`,
      { params },
    );
  }
  abrir(dto: AbrirTurnoDto): Observable<ResponseModel<TurnoCajaModel>> {
    return this.http.post<ResponseModel<TurnoCajaModel>>(
      `${this.apiUrl}/abrir`,
      dto,
    );
  }
  cerrar(
    id: number,
    dto: CerrarTurnoDto,
  ): Observable<ResponseModel<ResumenTurnoDto>> {
    return this.http.patch<ResponseModel<ResumenTurnoDto>>(
      `${this.apiUrl}/${id}/cerrar`,
      dto,
    );
  }
  resumen(id: number): Observable<ResponseModel<ResumenTurnoDto>> {
    return this.http.get<ResponseModel<ResumenTurnoDto>>(
      `${this.apiUrl}/${id}/resumen`,
    );
  }

  registrarMovimiento(
    turnoId: number,
    dto: CreateMovimientoCajaDto,
  ): Observable<ResponseModel<MovimientoCajaDto>> {
    return this.http.post<ResponseModel<MovimientoCajaDto>>(
      `${this.apiUrl}/${turnoId}/movimientos`,
      dto,
    );
  }

  /**
   * Corrige un arqueo ya cerrado sin reabrirlo.
   *
   * El cierre original queda intacto y el ajuste se suma encima: un arqueo que
   * se puede reescribir deja de probar lo que el cajero entregó ese día. Solo
   * el rol autorizador de la empresa puede hacerlo, y con motivo.
   */
  registrarAjusteRetroactivo(
    turnoId: number,
    dto: CreateAjusteRetroactivoDto,
  ): Observable<ResponseModel<MovimientoCajaDto>> {
    return this.http.post<ResponseModel<MovimientoCajaDto>>(
      `${this.apiUrl}/${turnoId}/ajustes-retroactivos`,
      dto,
    );
  }
}
