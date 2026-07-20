import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ConceptoModel, CreateConceptoDto } from '../models/concepto.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/**
 * Catálogo de conceptos de nómina (Fase 3).
 *
 * Backend: `ConceptoNominaController` → `/api/concepto`
 */
@Injectable({ providedIn: 'root' })
export class ConceptoService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /**
   * Conceptos vigentes en una fecha.
   *
   * Devuelve los globales de ley más los propios de la empresa, con la
   * precedencia ya resuelta: si la empresa personalizó un código, viene el suyo.
   *
   * @param fecha 'YYYY-MM-DD'. Por defecto, hoy.
   */
  vigentes(fecha?: string): Observable<ResponseModel<ConceptoModel[]>> {
    const qs = fecha ? `?fecha=${fecha}` : '';
    return this.http.get<ResponseModel<ConceptoModel[]>>(`${this.base}concepto${qs}`);
  }

  /**
   * Crea un concepto propio de la empresa.
   *
   * Responde 409 si la vigencia se solapa con otra versión del mismo código.
   */
  crear(dto: CreateConceptoDto): Observable<ResponseModel<ConceptoModel>> {
    return this.http.post<ResponseModel<ConceptoModel>>(`${this.base}concepto/create`, dto);
  }
}
