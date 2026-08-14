import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AfiliacionModel,
  AfiliarDto,
  EntidadSeguridadSocial,
  TipoAfiliacion,
  TipoCotizanteDto,
} from '../models/afiliacion.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/**
 * Afiliaciones a seguridad social (Fase 5.5).
 *
 * Backend: `AfiliacionController` → `/api/afiliacion`
 */
@Injectable({ providedIn: 'root' })
export class AfiliacionService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Catálogo nacional de un tipo. */
  catalogo(tipo: TipoAfiliacion): Observable<ResponseModel<EntidadSeguridadSocial[]>> {
    return this.http.get<ResponseModel<EntidadSeguridadSocial[]>>(
      `${this.base}afiliacion/catalogo/${tipo}`,
    );
  }

  /** Afiliaciones de un contrato (vigentes e históricas). */
  porContrato(contratoId: number): Observable<ResponseModel<AfiliacionModel[]>> {
    return this.http.get<ResponseModel<AfiliacionModel[]>>(
      `${this.base}afiliacion/contrato/${contratoId}`,
    );
  }

  /**
   * Afilia o traslada. Devuelve la lista actualizada.
   *
   * Si ya había afiliación vigente del mismo tipo, se cierra (traslado).
   */
  afiliar(contratoId: number, dto: AfiliarDto): Observable<ResponseModel<AfiliacionModel[]>> {
    return this.http.post<ResponseModel<AfiliacionModel[]>>(
      `${this.base}afiliacion/contrato/${contratoId}`,
      dto,
    );
  }

  /** Problemas que impedirían generar PILA. Lista vacía = listo. */
  validar(contratoId: number, fecha?: string): Observable<ResponseModel<string[]>> {
    const qs = fecha ? `?fecha=${fecha}` : '';
    return this.http.get<ResponseModel<string[]>>(
      `${this.base}afiliacion/validar/${contratoId}${qs}`,
    );
  }

  /** Fija el tipo de cotizante (código UGPP) del contrato. Lo exige PILA. */
  cambiarTipoCotizante(contratoId: number, dto: TipoCotizanteDto): Observable<ResponseModel<void>> {
    return this.http.put<ResponseModel<void>>(
      `${this.base}afiliacion/contrato/${contratoId}/tipo-cotizante`,
      dto,
    );
  }
}
