import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CrearPrestacionDto,
  LiquidacionDefinitivaDto,
  PrestacionModel,
} from '../models/prestacion.model';
import { PagoNominaDto } from '../models/nomina.model';

@Injectable({ providedIn: 'root' })
export class PrestacionService {
  private readonly base = `${environment.apiUrl}prestaciones`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ResponseModel<PrestacionModel[]>> {
    return this.http.get<ResponseModel<PrestacionModel[]>>(this.base);
  }

  crear(dto: CrearPrestacionDto): Observable<ResponseModel<PrestacionModel>> {
    return this.http.post<ResponseModel<PrestacionModel>>(this.base, dto);
  }

  liquidacionDefinitiva(
    dto: LiquidacionDefinitivaDto,
  ): Observable<ResponseModel<PrestacionModel[]>> {
    return this.http.post<ResponseModel<PrestacionModel[]>>(
      `${this.base}/liquidacion-definitiva`,
      dto,
    );
  }

  aprobar(id: number): Observable<ResponseModel<PrestacionModel>> {
    return this.http.put<ResponseModel<PrestacionModel>>(`${this.base}/${id}/aprobar`, {});
  }

  pagar(id: number, dto: PagoNominaDto): Observable<ResponseModel<PrestacionModel>> {
    return this.http.put<ResponseModel<PrestacionModel>>(`${this.base}/${id}/pagar`, dto);
  }

  anular(id: number): Observable<ResponseModel<PrestacionModel>> {
    return this.http.put<ResponseModel<PrestacionModel>>(`${this.base}/${id}/anular`, {});
  }
}
