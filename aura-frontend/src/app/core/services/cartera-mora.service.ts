import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CalculoInteresModel,
  CandidatoCastigoModel,
  CastigarDto,
  CastigoModel,
  DeterioroSugeridoModel,
  FacturarInteresDto,
  InteresMoraModel,
  PaginaModel,
  PoliticaCarteraModel,
  ResumenInteresClienteModel,
} from '../models/cartera-mora.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/** Cartera C5 (intereses de mora) y C9 (deterioro y castigo): /api/cartera. */
@Injectable({ providedIn: 'root' })
export class CarteraMoraService {
  private readonly api = `${environment.apiUrl}cartera`;

  constructor(private readonly http: HttpClient) {}

  // ── Política ──────────────────────────────────────────────────────
  politica(): Observable<ResponseModel<PoliticaCarteraModel>> {
    return this.http.get<ResponseModel<PoliticaCarteraModel>>(`${this.api}/politica`);
  }

  guardarPolitica(dto: PoliticaCarteraModel): Observable<ResponseModel<PoliticaCarteraModel>> {
    return this.http.put<ResponseModel<PoliticaCarteraModel>>(`${this.api}/politica`, dto);
  }

  // ── Intereses de mora ─────────────────────────────────────────────
  calcularIntereses(terceroId?: number | null, fecha?: string | null): Observable<ResponseModel<CalculoInteresModel>> {
    let params = new HttpParams();
    if (terceroId) params = params.set('terceroId', terceroId);
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<ResponseModel<CalculoInteresModel>>(`${this.api}/intereses/calculo`, { params });
  }

  resumenInteresCliente(terceroId: number): Observable<ResponseModel<ResumenInteresClienteModel>> {
    return this.http.get<ResponseModel<ResumenInteresClienteModel>>(`${this.api}/intereses/cliente/${terceroId}`);
  }

  intereses(filtro: {
    terceroId?: number | null;
    search?: string | null;
    page: number;
    rows: number;
  }): Observable<ResponseModel<PaginaModel<InteresMoraModel>>> {
    let params = new HttpParams().set('page', filtro.page).set('rows', filtro.rows);
    if (filtro.terceroId) params = params.set('terceroId', filtro.terceroId);
    if (filtro.search) params = params.set('search', filtro.search);
    return this.http.get<ResponseModel<PaginaModel<InteresMoraModel>>>(`${this.api}/intereses`, { params });
  }

  interes(id: number): Observable<ResponseModel<InteresMoraModel>> {
    return this.http.get<ResponseModel<InteresMoraModel>>(`${this.api}/intereses/${id}`);
  }

  facturarIntereses(dto: FacturarInteresDto): Observable<ResponseModel<InteresMoraModel>> {
    return this.http.post<ResponseModel<InteresMoraModel>>(`${this.api}/intereses`, dto);
  }

  anularInteres(id: number, motivo: string): Observable<ResponseModel<InteresMoraModel>> {
    return this.http.post<ResponseModel<InteresMoraModel>>(`${this.api}/intereses/${id}/anular`, { motivo });
  }

  // ── Deterioro ─────────────────────────────────────────────────────
  deterioro(): Observable<ResponseModel<DeterioroSugeridoModel>> {
    return this.http.get<ResponseModel<DeterioroSugeridoModel>>(`${this.api}/deterioro`);
  }

  proponerDeterioro(): Observable<ResponseModel<unknown>> {
    return this.http.post<ResponseModel<unknown>>(`${this.api}/deterioro/proponer`, {});
  }

  // ── Castigo ───────────────────────────────────────────────────────
  candidatosCastigo(dias?: number | null, terceroId?: number | null): Observable<ResponseModel<CandidatoCastigoModel[]>> {
    let params = new HttpParams();
    if (dias != null) params = params.set('dias', dias);
    if (terceroId) params = params.set('terceroId', terceroId);
    return this.http.get<ResponseModel<CandidatoCastigoModel[]>>(`${this.api}/castigos/candidatos`, { params });
  }

  castigos(filtro: { search?: string | null; page: number; rows: number }): Observable<ResponseModel<PaginaModel<CastigoModel>>> {
    let params = new HttpParams().set('page', filtro.page).set('rows', filtro.rows);
    if (filtro.search) params = params.set('search', filtro.search);
    return this.http.get<ResponseModel<PaginaModel<CastigoModel>>>(`${this.api}/castigos`, { params });
  }

  castigar(dto: CastigarDto): Observable<ResponseModel<CastigoModel[]>> {
    return this.http.post<ResponseModel<CastigoModel[]>>(`${this.api}/castigos`, dto);
  }

  anularCastigo(id: number, motivo: string): Observable<ResponseModel<CastigoModel>> {
    return this.http.post<ResponseModel<CastigoModel>>(`${this.api}/castigos/${id}/anular`, { motivo });
  }
}
