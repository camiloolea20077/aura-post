import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AfectadoPor,
  BuscarConceptoParams,
  ConceptoFormDto,
  ConceptoModel,
  ConceptoTipoModel,
  NuevaVigenciaDto,
  ProbarFormulaDto,
  PruebaFormula,
  ValidacionFormula,
  VariableFormula,
} from '../models/concepto.model';
import { PaginaModel } from '../models/nomina-parametros.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { IFilterTable } from '../../shared/utils/filter-table';

/**
 * Catálogo de conceptos de nómina.
 *
 * Backend: `ConceptoNominaController` → `/api/concepto`
 */
@Injectable({ providedIn: 'root' })
export class ConceptoService {
  private readonly base = `${environment.apiUrl}concepto`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Conceptos vigentes en una fecha.
   *
   * Devuelve los globales de ley más los propios de la empresa, con la
   * precedencia ya resuelta: si la empresa personalizó un concepto, viene el suyo.
   *
   * @param fecha 'YYYY-MM-DD'. Por defecto, hoy.
   */
  vigentes(fecha?: string): Observable<ResponseModel<ConceptoModel[]>> {
    const qs = fecha ? `?fecha=${fecha}` : '';
    return this.http.get<ResponseModel<ConceptoModel[]>>(`${this.base}${qs}`);
  }

  /** Buscador avanzado: texto (número, nombre o tipo) y filtros, paginado. */
  buscar(filtro: IFilterTable<BuscarConceptoParams>): Observable<ResponseModel<PaginaModel<ConceptoModel>>> {
    return this.http.post<ResponseModel<PaginaModel<ConceptoModel>>>(`${this.base}/buscar`, filtro);
  }

  /** Un concepto con los nombres de tipo y grupo. */
  obtener(id: number): Observable<ResponseModel<ConceptoModel>> {
    return this.http.get<ResponseModel<ConceptoModel>>(`${this.base}/${id}`);
  }

  /** Crea un concepto propio. 409 si el número ya está en uso. */
  crear(dto: ConceptoFormDto): Observable<ResponseModel<ConceptoModel>> {
    return this.http.post<ResponseModel<ConceptoModel>>(`${this.base}/create`, dto);
  }

  /**
   * Edita un concepto. Si es de ley, el backend guarda la versión de la empresa
   * y solo aplica los datos descriptivos.
   */
  actualizar(id: number, dto: ConceptoFormDto): Observable<ResponseModel<ConceptoModel>> {
    return this.http.put<ResponseModel<ConceptoModel>>(`${this.base}/${id}`, dto);
  }

  /** Nueva vigencia de un concepto propio: cierra la versión anterior el día antes. */
  nuevaVigencia(id: number, dto: NuevaVigenciaDto): Observable<ResponseModel<ConceptoModel>> {
    return this.http.post<ResponseModel<ConceptoModel>>(`${this.base}/${id}/vigencia`, dto);
  }

  /** Catálogo de tipos de concepto. */
  tipos(): Observable<ResponseModel<ConceptoTipoModel[]>> {
    return this.http.get<ResponseModel<ConceptoTipoModel[]>>(`${this.base}/tipos`);
  }

  /** Valida una fórmula: sintaxis, variables, funciones y conceptos referenciados. */
  validarFormula(formula: string, numero?: number | null): Observable<ResponseModel<ValidacionFormula>> {
    return this.http.post<ResponseModel<ValidacionFormula>>(`${this.base}/formula/validar`, { formula, numero });
  }

  /** Prueba una fórmula con valores de ejemplo, sin guardar. */
  probarFormula(dto: ProbarFormulaDto): Observable<ResponseModel<PruebaFormula>> {
    return this.http.post<ResponseModel<PruebaFormula>>(`${this.base}/formula/probar`, dto);
  }

  /** Variables que puede usar una fórmula, con un valor de ejemplo. */
  variablesFormula(): Observable<ResponseModel<VariableFormula[]>> {
    return this.http.get<ResponseModel<VariableFormula[]>>(`${this.base}/formula/variables`);
  }

  /** Qué alimenta la base del concepto ("Afectado por"). */
  afectadoPor(id: number): Observable<ResponseModel<AfectadoPor[]>> {
    return this.http.get<ResponseModel<AfectadoPor[]>>(`${this.base}/${id}/afectado-por`);
  }

  /** Número que se propone para un concepto nuevo. */
  siguienteNumero(): Observable<ResponseModel<number>> {
    return this.http.get<ResponseModel<number>>(`${this.base}/siguiente-numero`);
  }
}
