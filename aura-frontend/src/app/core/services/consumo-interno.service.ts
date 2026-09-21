import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateConsumoInternoDto,
  ConsumoInternoPageableDto,
  SaveConceptoConsumoInternoDto,
} from '../models/consumo-interno.model';

@Injectable({ providedIn: 'root' })
export class ConsumoInternoService {
  private readonly base = `${environment.apiUrl}consumos-internos`;

  constructor(private readonly http: HttpClient) {}

  page(pageable: ConsumoInternoPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/page`, pageable);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(dto: CreateConsumoInternoDto): Observable<any> {
    return this.http.post<any>(`${this.base}/create`, dto);
  }

  anular(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/anular`, {});
  }

  conceptos(): Observable<any> {
    return this.http.get<any>(`${this.base}/conceptos`);
  }

  crearConcepto(dto: SaveConceptoConsumoInternoDto): Observable<any> {
    return this.http.post<any>(`${this.base}/conceptos`, dto);
  }

  actualizarConcepto(id: number, dto: SaveConceptoConsumoInternoDto): Observable<any> {
    return this.http.put<any>(`${this.base}/conceptos/${id}`, dto);
  }
}
