import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TrasladoPageableDto,
  CreateTrasladoDto,
} from '../models/traslado.model';

@Injectable({ providedIn: 'root' })
export class TrasladoService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  page(pageable: TrasladoPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}traslados/page`, pageable);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}traslados/${id}`);
  }

  create(dto: CreateTrasladoDto): Observable<any> {
    // El back lo expone en /traslados/create (POST /traslados no existe).
    return this.http.post<any>(`${this.base}traslados/create`, dto);
  }

  anular(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}traslados/${id}/anular`, {});
  }

  // Lista de sucursales para selectores
  getSucursales(): Observable<any> {
    // El endpoint de sucursales es /activas (no /list, que caía en /{id}).
    return this.http.get<any>(`${this.base}sucursales/activas`);
  }
}
