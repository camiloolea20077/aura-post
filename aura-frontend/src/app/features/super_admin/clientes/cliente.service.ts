import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ResponseModel } from '../../../shared/utils/responde.models';
import {
  ClienteModel,
  ClientesResumen,
  GuardarSuscripcionDto,
  RegistrarPagoDto,
  SuscripcionPagoModel,
} from './cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly baseUrl = `${environment.apiUrl}platform`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ResponseModel<ClienteModel[]>> {
    return this.http.get<ResponseModel<ClienteModel[]>>(
      `${this.baseUrl}/clientes`,
    );
  }

  resumen(): Observable<ResponseModel<ClientesResumen>> {
    return this.http.get<ResponseModel<ClientesResumen>>(
      `${this.baseUrl}/clientes/resumen`,
    );
  }

  guardarSuscripcion(
    empresaId: number,
    dto: GuardarSuscripcionDto,
  ): Observable<ResponseModel<ClienteModel>> {
    return this.http.put<ResponseModel<ClienteModel>>(
      `${this.baseUrl}/clientes/${empresaId}/suscripcion`,
      dto,
    );
  }

  pagos(empresaId: number): Observable<ResponseModel<SuscripcionPagoModel[]>> {
    return this.http.get<ResponseModel<SuscripcionPagoModel[]>>(
      `${this.baseUrl}/clientes/${empresaId}/pagos`,
    );
  }

  registrarPago(
    empresaId: number,
    dto: RegistrarPagoDto,
  ): Observable<ResponseModel<ClienteModel>> {
    return this.http.post<ResponseModel<ClienteModel>>(
      `${this.baseUrl}/clientes/${empresaId}/pagos`,
      dto,
    );
  }

  eliminarPago(pagoId: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(
      `${this.baseUrl}/clientes/pagos/${pagoId}`,
    );
  }
}
