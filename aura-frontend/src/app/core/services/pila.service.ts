import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PilaAportanteConfigModel,
  PilaCotizanteModel,
  PilaEncabezadoModel,
  ReporteValidacionPilaModel,
} from '../models/pila.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/**
 * PILA (Fase 6).
 *
 * Backend: `PilaController` → `/api/pila`
 */
@Injectable({ providedIn: 'root' })
export class PilaService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Planillas generadas de la empresa, más recientes primero. */
  listar(): Observable<ResponseModel<PilaEncabezadoModel[]>> {
    return this.http.get<ResponseModel<PilaEncabezadoModel[]>>(`${this.base}pila`);
  }

  /**
   * Genera la planilla de un período ('YYYY-MM').
   *
   * Responde 409 con la lista de problemas por empleado si a algún contrato le
   * falta afiliación, tipo de cotizante o código de catálogo.
   */
  generar(periodo: string): Observable<ResponseModel<PilaEncabezadoModel>> {
    return this.http.post<ResponseModel<PilaEncabezadoModel>>(
      `${this.base}pila/generar/${periodo}`,
      {},
    );
  }

  /** Cotizantes (registros tipo 02) de una planilla. */
  cotizantes(encabezadoId: number): Observable<ResponseModel<PilaCotizanteModel[]>> {
    return this.http.get<ResponseModel<PilaCotizanteModel[]>>(
      `${this.base}pila/${encabezadoId}/cotizantes`,
    );
  }

  /** Reporte de validación tipo UGPP de la planilla de un período (P1). */
  validar(periodo: string): Observable<ResponseModel<ReporteValidacionPilaModel>> {
    return this.http.get<ResponseModel<ReporteValidacionPilaModel>>(
      `${this.base}pila/${periodo}/validar`,
    );
  }

  /** Configuración del aportante para PILA (P4b). */
  getAportanteConfig(): Observable<ResponseModel<PilaAportanteConfigModel>> {
    return this.http.get<ResponseModel<PilaAportanteConfigModel>>(
      `${this.base}pila/aportante-config`,
    );
  }

  guardarAportanteConfig(
    dto: PilaAportanteConfigModel,
  ): Observable<ResponseModel<PilaAportanteConfigModel>> {
    return this.http.put<ResponseModel<PilaAportanteConfigModel>>(
      `${this.base}pila/aportante-config`,
      dto,
    );
  }

  /** Archivo plano PILA del período (formato estándar Anexo Técnico 2). */
  archivo(periodo: string): Observable<ResponseModel<string>> {
    return this.http.get<ResponseModel<string>>(`${this.base}pila/${periodo}/archivo`);
  }
}
