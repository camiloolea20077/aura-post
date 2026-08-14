import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateDeduccionDto, DeduccionModel } from '../models/retefuente.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/**
 * Retención en la fuente (Fase 4.5).
 *
 * Backend: `RetefuenteController` → `/api/retefuente`, `/api/contrato`
 */
@Injectable({ providedIn: 'root' })
export class RetefuenteService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  deducciones(contratoId: number): Observable<ResponseModel<DeduccionModel[]>> {
    return this.http.get<ResponseModel<DeduccionModel[]>>(
      `${this.base}retefuente/deducciones/${contratoId}`,
    );
  }

  crear(dto: CreateDeduccionDto): Observable<ResponseModel<DeduccionModel>> {
    return this.http.post<ResponseModel<DeduccionModel>>(
      `${this.base}retefuente/deducciones`,
      dto,
    );
  }

  eliminar(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(
      `${this.base}retefuente/deducciones/${id}`,
    );
  }

  /** Cambia el procedimiento de retefuente del contrato ('1' | '2'). */
  cambiarProcedimiento(contratoId: number, procedimiento: '1' | '2'): Observable<ResponseModel<void>> {
    return this.http.put<ResponseModel<void>>(
      `${this.base}contrato/${contratoId}/procedimiento-retefuente`,
      { procedimiento },
    );
  }
}
