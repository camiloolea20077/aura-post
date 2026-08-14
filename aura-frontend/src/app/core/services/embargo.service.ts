import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateEmbargoDto, EmbargoModel } from '../models/embargo.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/**
 * Embargos sobre el salario (V113).
 *
 * Backend: `EmbargoController` → `/api/embargo`
 */
@Injectable({ providedIn: 'root' })
export class EmbargoService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  porContrato(contratoId: number): Observable<ResponseModel<EmbargoModel[]>> {
    return this.http.get<ResponseModel<EmbargoModel[]>>(
      `${this.base}embargo/contrato/${contratoId}`,
    );
  }

  crear(dto: CreateEmbargoDto): Observable<ResponseModel<EmbargoModel>> {
    return this.http.post<ResponseModel<EmbargoModel>>(`${this.base}embargo`, dto);
  }

  terminar(id: number, fechaFin?: string): Observable<ResponseModel<EmbargoModel>> {
    return this.http.put<ResponseModel<EmbargoModel>>(
      `${this.base}embargo/${id}/terminar`,
      { fechaFin: fechaFin ?? null },
    );
  }
}
