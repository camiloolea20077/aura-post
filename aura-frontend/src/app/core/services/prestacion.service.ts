import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CrearPrestacionDto,
  LiquidacionDefinitivaDto,
  LotePrestacionModel,
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

  // ── Lotes (V122): el listado agrupa; el detalle abre el desglose ──

  listarLotes(): Observable<ResponseModel<LotePrestacionModel[]>> {
    return this.http.get<ResponseModel<LotePrestacionModel[]>>(`${this.base}/lotes`);
  }

  detalleLote(lote: string): Observable<ResponseModel<PrestacionModel[]>> {
    return this.http.get<ResponseModel<PrestacionModel[]>>(`${this.base}/lote/${lote}`);
  }

  aprobarLote(lote: string): Observable<ResponseModel<PrestacionModel[]>> {
    return this.http.put<ResponseModel<PrestacionModel[]>>(`${this.base}/lote/${lote}/aprobar`, {});
  }

  pagarLote(lote: string, dto: PagoNominaDto): Observable<ResponseModel<PrestacionModel[]>> {
    return this.http.put<ResponseModel<PrestacionModel[]>>(`${this.base}/lote/${lote}/pagar`, dto);
  }

  anularLote(lote: string): Observable<ResponseModel<PrestacionModel[]>> {
    return this.http.put<ResponseModel<PrestacionModel[]>>(`${this.base}/lote/${lote}/anular`, {});
  }
}
