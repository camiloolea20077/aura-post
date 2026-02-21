import { HttpClient } from '@angular/common/http';
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
}
