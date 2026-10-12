import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { VacacionesSaldoModel } from '../models/nomina.model';
import { PaginaModel } from '../models/nomina-parametros.model';
import {
  EstadoVacacion,
  RegistrarVacacionDto,
  ResultadoColectivasModel,
  VacacionModel,
  VacacionesColectivasDto,
} from '../models/nomina-vacacion.model';

/**
 * Vacaciones: registrar (en tiempo o en dinero), colectivas, regreso anticipado y anular.
 *
 * Backend: `NominaVacacionController` → `/api/nomina/vacaciones`
 */
@Injectable({ providedIn: 'root' })
export class NominaVacacionService {
  private readonly base = `${environment.apiUrl}nomina/vacaciones`;

  constructor(private readonly http: HttpClient) {}

  page(filtro: {
    page: number;
    rows: number;
    search?: string | null;
    params?: { estado?: EstadoVacacion | null; empleadoId?: number | null };
  }): Observable<ResponseModel<PaginaModel<VacacionModel>>> {
    return this.http.post<ResponseModel<PaginaModel<VacacionModel>>>(`${this.base}/page`, filtro);
  }

  /** Saldo de días de la vinculación a hoy. */
  saldo(contratoId: number): Observable<ResponseModel<VacacionesSaldoModel>> {
    return this.http.get<ResponseModel<VacacionesSaldoModel>>(`${this.base}/saldo/${contratoId}`);
  }

  registrar(dto: RegistrarVacacionDto): Observable<ResponseModel<VacacionModel>> {
    return this.http.post<ResponseModel<VacacionModel>>(this.base, dto);
  }

  colectivas(dto: VacacionesColectivasDto): Observable<ResponseModel<ResultadoColectivasModel>> {
    return this.http.post<ResponseModel<ResultadoColectivasModel>>(`${this.base}/colectivas`, dto);
  }

  /** Regreso anticipado: fecha en que volvió a trabajar (yyyy-MM-dd). */
  retorno(id: number, fecha: string): Observable<ResponseModel<VacacionModel>> {
    return this.http.put<ResponseModel<VacacionModel>>(`${this.base}/${id}/retorno`, { fecha });
  }

  anular(id: number): Observable<ResponseModel<VacacionModel>> {
    return this.http.put<ResponseModel<VacacionModel>>(`${this.base}/${id}/anular`, {});
  }
}
