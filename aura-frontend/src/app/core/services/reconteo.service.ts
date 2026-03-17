import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ReconteoPageableDto,
  CreateReconteoDto,
  UpdateReconteoDetalleDto,
} from '../models/reconteo.model';

@Injectable({ providedIn: 'root' })
export class ReconteoService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  page(pageable: ReconteoPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}reconteos/page`, pageable);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}reconteos/${id}`);
  }

  create(dto: CreateReconteoDto): Observable<any> {
    return this.http.post<any>(`${this.base}reconteos/create`, dto);
  }

  updateDetalle(
    reconteoId: number,
    detalleId: number,
    dto: UpdateReconteoDetalleDto,
  ): Observable<any> {
    return this.http.put<any>(
      `${this.base}reconteos/${reconteoId}/detalle/${detalleId}`,
      dto,
    );
  }

  aprobar(id: number): Observable<any> {
    return this.http.put<any>(`${this.base}reconteos/${id}/aprobar`, {});
  }

  anular(id: number): Observable<any> {
    return this.http.put<any>(`${this.base}reconteos/${id}/anular`, {});
  }

  getSucursales(): Observable<any> {
    return this.http.get<any>(`${this.base}sucursales/list`);
  }
}
