import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ConceptoCajaModel, CreateConceptoCajaDto } from '../models/concepto-caja.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class ConceptoCajaService {
  private readonly api = `${environment.apiUrl}conceptos-caja`;

  constructor(private readonly http: HttpClient) {}

  listar(tipo?: string): Observable<ResponseModel<ConceptoCajaModel[]>> {
    let params = new HttpParams();
    if (tipo) params = params.set('tipo', tipo);
    return this.http.get<ResponseModel<ConceptoCajaModel[]>>(this.api, { params });
  }

  crear(dto: CreateConceptoCajaDto): Observable<ResponseModel<ConceptoCajaModel>> {
    return this.http.post<ResponseModel<ConceptoCajaModel>>(this.api, dto);
  }

  actualizar(id: number, dto: CreateConceptoCajaDto): Observable<ResponseModel<ConceptoCajaModel>> {
    return this.http.put<ResponseModel<ConceptoCajaModel>>(`${this.api}/${id}`, dto);
  }

  eliminar(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/${id}`);
  }
}
