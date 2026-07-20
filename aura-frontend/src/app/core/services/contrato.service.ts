import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CambiarSalarioDto,
  ContratoDetalleModel,
  ContratoModel,
  ContratoTableModel,
  CreateContratoDto,
  CreateRenovacionDto,
  RenovacionModel,
  SalarioHistorialModel,
  TerminarContratoDto,
} from '../models/contrato.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/**
 * Contratos laborales (Fase 2).
 *
 * Backend: `ContratoController` → `/api/contrato`
 */
@Injectable({ providedIn: 'root' })
export class ContratoService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Contratos activos de un empleado. Puede haber varios (multi-vínculo). */
  porEmpleado(empleadoId: number): Observable<ResponseModel<ContratoTableModel[]>> {
    return this.http.get<ResponseModel<ContratoTableModel[]>>(
      `${this.base}contrato/empleado/${empleadoId}`,
    );
  }

  /** Detalle con historial salarial, renovaciones y centros de costo. */
  obtener(id: number): Observable<ResponseModel<ContratoDetalleModel>> {
    return this.http.get<ResponseModel<ContratoDetalleModel>>(`${this.base}contrato/${id}`);
  }

  historialSalarios(id: number): Observable<ResponseModel<SalarioHistorialModel[]>> {
    return this.http.get<ResponseModel<SalarioHistorialModel[]>>(
      `${this.base}contrato/${id}/historial-salarios`,
    );
  }

  /** Contratos a término fijo que vencen dentro de N días. */
  porVencer(dias = 30): Observable<ResponseModel<ContratoTableModel[]>> {
    return this.http.get<ResponseModel<ContratoTableModel[]>>(
      `${this.base}contrato/por-vencer?dias=${dias}`,
    );
  }

  crear(dto: CreateContratoDto): Observable<ResponseModel<ContratoModel>> {
    return this.http.post<ResponseModel<ContratoModel>>(`${this.base}contrato/create`, dto);
  }

  /** Edita el contrato (corrección). No cambia el salario (eso es cambiarSalario). */
  editar(id: number, dto: CreateContratoDto): Observable<ResponseModel<ContratoModel>> {
    return this.http.put<ResponseModel<ContratoModel>>(`${this.base}contrato/${id}`, dto);
  }

  /**
   * Cambia el salario preservando el histórico.
   *
   * NO es un update: cierra la vigencia anterior y abre una nueva. Por eso el
   * DTO exige `fechaDesde` — sin ella no hay retroactivos ni bandera `vsp` en
   * PILA. El backend rechaza una fecha anterior o igual a la vigencia actual.
   */
  cambiarSalario(id: number, dto: CambiarSalarioDto): Observable<ResponseModel<ContratoModel>> {
    return this.http.put<ResponseModel<ContratoModel>>(`${this.base}contrato/${id}/salario`, dto);
  }

  /**
   * Termina el contrato.
   *
   * `causaRetiro` determina si hay indemnización y cómo se calcula. No es
   * descriptiva.
   */
  terminar(id: number, dto: TerminarContratoDto): Observable<ResponseModel<ContratoModel>> {
    return this.http.put<ResponseModel<ContratoModel>>(`${this.base}contrato/${id}/terminar`, dto);
  }

  /** Prórroga de un contrato a término fijo. Deja rastro, no sobrescribe. */
  renovar(id: number, dto: CreateRenovacionDto): Observable<ResponseModel<RenovacionModel>> {
    return this.http.post<ResponseModel<RenovacionModel>>(
      `${this.base}contrato/${id}/renovacion`,
      dto,
    );
  }
}
