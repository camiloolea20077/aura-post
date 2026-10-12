import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CreateCuentaBancariaDto,
  CreateExperienciaDto,
  CreateFamiliarDto,
  CuentaBancaria,
  Experiencia,
  Familiar,
} from '../models/empleado-hoja-vida.model';

/**
 * Hoja de vida del empleado: cuentas bancarias, familiares e historial laboral.
 * Cada operación devuelve la lista actualizada.
 *
 * Backend: `EmpleadoHojaVidaController` → `/api/empleados/{empleadoId}/…`
 */
@Injectable({ providedIn: 'root' })
export class EmpleadoHojaVidaService {
  private readonly base = `${environment.apiUrl}empleados`;

  constructor(private readonly http: HttpClient) {}

  // ── Cuentas bancarias ─────────────────────────────────────────────────

  cuentas(empleadoId: number): Observable<ResponseModel<CuentaBancaria[]>> {
    return this.http.get<ResponseModel<CuentaBancaria[]>>(`${this.base}/${empleadoId}/cuentas-bancarias`);
  }

  /** La principal se copia al tercero: de ahí se paga la nómina. */
  crearCuenta(empleadoId: number, dto: CreateCuentaBancariaDto): Observable<ResponseModel<CuentaBancaria[]>> {
    return this.http.post<ResponseModel<CuentaBancaria[]>>(`${this.base}/${empleadoId}/cuentas-bancarias`, dto);
  }

  actualizarCuenta(empleadoId: number, id: number, dto: CreateCuentaBancariaDto): Observable<ResponseModel<CuentaBancaria[]>> {
    return this.http.put<ResponseModel<CuentaBancaria[]>>(`${this.base}/${empleadoId}/cuentas-bancarias/${id}`, dto);
  }

  eliminarCuenta(empleadoId: number, id: number): Observable<ResponseModel<CuentaBancaria[]>> {
    return this.http.delete<ResponseModel<CuentaBancaria[]>>(`${this.base}/${empleadoId}/cuentas-bancarias/${id}`);
  }

  // ── Familiares ────────────────────────────────────────────────────────

  familiares(empleadoId: number): Observable<ResponseModel<Familiar[]>> {
    return this.http.get<ResponseModel<Familiar[]>>(`${this.base}/${empleadoId}/familiares`);
  }

  crearFamiliar(empleadoId: number, dto: CreateFamiliarDto): Observable<ResponseModel<Familiar[]>> {
    return this.http.post<ResponseModel<Familiar[]>>(`${this.base}/${empleadoId}/familiares`, dto);
  }

  actualizarFamiliar(empleadoId: number, id: number, dto: CreateFamiliarDto): Observable<ResponseModel<Familiar[]>> {
    return this.http.put<ResponseModel<Familiar[]>>(`${this.base}/${empleadoId}/familiares/${id}`, dto);
  }

  eliminarFamiliar(empleadoId: number, id: number): Observable<ResponseModel<Familiar[]>> {
    return this.http.delete<ResponseModel<Familiar[]>>(`${this.base}/${empleadoId}/familiares/${id}`);
  }

  // ── Historial laboral ─────────────────────────────────────────────────

  experiencia(empleadoId: number): Observable<ResponseModel<Experiencia[]>> {
    return this.http.get<ResponseModel<Experiencia[]>>(`${this.base}/${empleadoId}/experiencia`);
  }

  crearExperiencia(empleadoId: number, dto: CreateExperienciaDto): Observable<ResponseModel<Experiencia[]>> {
    return this.http.post<ResponseModel<Experiencia[]>>(`${this.base}/${empleadoId}/experiencia`, dto);
  }

  actualizarExperiencia(empleadoId: number, id: number, dto: CreateExperienciaDto): Observable<ResponseModel<Experiencia[]>> {
    return this.http.put<ResponseModel<Experiencia[]>>(`${this.base}/${empleadoId}/experiencia/${id}`, dto);
  }

  eliminarExperiencia(empleadoId: number, id: number): Observable<ResponseModel<Experiencia[]>> {
    return this.http.delete<ResponseModel<Experiencia[]>>(`${this.base}/${empleadoId}/experiencia/${id}`);
  }
}
