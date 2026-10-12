import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  ConceptoContableNominaModel,
  GuardarConceptoContableDto,
} from '../models/nomina-parametros.model';

/**
 * Cuenta y tercero por concepto de nómina: cambios de la empresa sobre la
 * contabilización por defecto del asiento de nómina.
 *
 * Backend: `NominaConceptoContableController` → `/api/nomina/conceptos-contables`
 */
@Injectable({ providedIn: 'root' })
export class NominaConceptoContableService {
  private readonly base = `${environment.apiUrl}nomina/conceptos-contables`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ResponseModel<ConceptoContableNominaModel[]>> {
    return this.http.get<ResponseModel<ConceptoContableNominaModel[]>>(this.base);
  }

  guardar(codigo: string, dto: GuardarConceptoContableDto): Observable<ResponseModel<ConceptoContableNominaModel>> {
    return this.http.put<ResponseModel<ConceptoContableNominaModel>>(`${this.base}/${codigo}`, dto);
  }

  /** Vuelve el concepto a su contabilización por defecto. */
  restablecer(codigo: string): Observable<ResponseModel<ConceptoContableNominaModel>> {
    return this.http.delete<ResponseModel<ConceptoContableNominaModel>>(`${this.base}/${codigo}`);
  }
}
