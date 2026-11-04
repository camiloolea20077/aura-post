import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CargoAdjuntoModel,
  CargoConceptoModel,
  CargoNovedadModel,
  CargoTopeHorasModel,
  CopiaPlantillaModel,
  GuardarCargoConceptoDto,
  GuardarCargoNovedadDto,
} from '../models/cargo-plantilla.model';

/**
 * Plantilla de nómina del cargo: conceptos, novedades permitidas, topes de horas
 * y adjuntos. Cada escritura devuelve la lista completa actualizada.
 *
 * Backend: `NominaCargoPlantillaController` → `/api/nomina/cargos/{id}/…`
 */
@Injectable({ providedIn: 'root' })
export class NominaCargoPlantillaService {
  private readonly base = `${environment.apiUrl}nomina/cargos`;

  constructor(private readonly http: HttpClient) {}

  // ── Conceptos ──────────────────────────────────────────────

  conceptos(cargoId: number): Observable<ResponseModel<CargoConceptoModel[]>> {
    return this.http.get<ResponseModel<CargoConceptoModel[]>>(`${this.base}/${cargoId}/conceptos`);
  }

  /** Agrega varios conceptos por número; los que ya estaban se ignoran. */
  agregarConceptos(cargoId: number, numeros: number[]): Observable<ResponseModel<CargoConceptoModel[]>> {
    return this.http.post<ResponseModel<CargoConceptoModel[]>>(`${this.base}/${cargoId}/conceptos`, { numeros });
  }

  actualizarConcepto(
    cargoId: number,
    filaId: number,
    dto: GuardarCargoConceptoDto,
  ): Observable<ResponseModel<CargoConceptoModel[]>> {
    return this.http.put<ResponseModel<CargoConceptoModel[]>>(`${this.base}/${cargoId}/conceptos/${filaId}`, dto);
  }

  quitarConcepto(cargoId: number, filaId: number): Observable<ResponseModel<CargoConceptoModel[]>> {
    return this.http.delete<ResponseModel<CargoConceptoModel[]>>(`${this.base}/${cargoId}/conceptos/${filaId}`);
  }

  // ── Novedades permitidas ───────────────────────────────────

  novedades(cargoId: number): Observable<ResponseModel<CargoNovedadModel[]>> {
    return this.http.get<ResponseModel<CargoNovedadModel[]>>(`${this.base}/${cargoId}/novedades`);
  }

  agregarNovedades(cargoId: number, numeros: number[]): Observable<ResponseModel<CargoNovedadModel[]>> {
    return this.http.post<ResponseModel<CargoNovedadModel[]>>(`${this.base}/${cargoId}/novedades`, { numeros });
  }

  actualizarNovedad(
    cargoId: number,
    filaId: number,
    dto: GuardarCargoNovedadDto,
  ): Observable<ResponseModel<CargoNovedadModel[]>> {
    return this.http.put<ResponseModel<CargoNovedadModel[]>>(`${this.base}/${cargoId}/novedades/${filaId}`, dto);
  }

  quitarNovedad(cargoId: number, filaId: number): Observable<ResponseModel<CargoNovedadModel[]>> {
    return this.http.delete<ResponseModel<CargoNovedadModel[]>>(`${this.base}/${cargoId}/novedades/${filaId}`);
  }

  // ── Topes de horas ─────────────────────────────────────────

  topes(cargoId: number): Observable<ResponseModel<CargoTopeHorasModel[]>> {
    return this.http.get<ResponseModel<CargoTopeHorasModel[]>>(`${this.base}/${cargoId}/topes-horas`);
  }

  /** Reemplaza todos los topes del cargo. */
  guardarTopes(cargoId: number, topes: CargoTopeHorasModel[]): Observable<ResponseModel<CargoTopeHorasModel[]>> {
    return this.http.put<ResponseModel<CargoTopeHorasModel[]>>(`${this.base}/${cargoId}/topes-horas`, topes);
  }

  // ── Adjuntos ───────────────────────────────────────────────

  adjuntos(cargoId: number): Observable<ResponseModel<CargoAdjuntoModel[]>> {
    return this.http.get<ResponseModel<CargoAdjuntoModel[]>>(`${this.base}/${cargoId}/adjuntos`);
  }

  subirAdjunto(cargoId: number, archivo: File): Observable<ResponseModel<CargoAdjuntoModel>> {
    const datos = new FormData();
    datos.append('archivo', archivo);
    return this.http.post<ResponseModel<CargoAdjuntoModel>>(`${this.base}/${cargoId}/adjuntos`, datos);
  }

  eliminarAdjunto(cargoId: number, adjuntoId: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.base}/${cargoId}/adjuntos/${adjuntoId}`);
  }

  // ── Copiar ─────────────────────────────────────────────────

  /** Copia conceptos, novedades y topes de otro cargo; lo que ya estaba no se toca. */
  copiarDe(cargoId: number, origenId: number): Observable<ResponseModel<CopiaPlantillaModel>> {
    return this.http.post<ResponseModel<CopiaPlantillaModel>>(`${this.base}/${cargoId}/copiar-de/${origenId}`, {});
  }
}
