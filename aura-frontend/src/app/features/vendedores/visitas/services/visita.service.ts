import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  VisitaModel,
  VisitaTableModel,
  CreateVisitaDto,
  ConfirmarLlegadaDto,
  VisitaPageableDto,
} from '../../models/vendedor.model';

@Injectable({ providedIn: 'root' })
export class VisitaService {
  private readonly base = `${environment.apiUrl}visitas`;

  constructor(private readonly http: HttpClient) {}

  page(pageable: VisitaPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/page`, pageable);
  }

  getHoy(): Observable<any> {
    return this.http.get<any>(`${this.base}/hoy`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(dto: CreateVisitaDto): Observable<any> {
    return this.http.post<any>(`${this.base}`, dto);
  }

  confirmar(id: number, dto: ConfirmarLlegadaDto): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/confirmar`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
