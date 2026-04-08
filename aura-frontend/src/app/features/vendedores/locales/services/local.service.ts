import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateLocalDto,
  LocalPageableDto,
} from '../../models/vendedor.model';

@Injectable({ providedIn: 'root' })
export class LocalService {
  private readonly base = `${environment.apiUrl}locales`;

  constructor(private readonly http: HttpClient) {}

  page(pageable: LocalPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/page`, pageable);
  }

  getAll(): Observable<any> {
    return this.http.get<any>(`${this.base}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(dto: CreateLocalDto): Observable<any> {
    return this.http.post<any>(`${this.base}/create`, dto);
  }

  update(id: number, dto: CreateLocalDto): Observable<any> {
    return this.http.put<any>(`${this.base}/update/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }

  asignarVendedor(localId: number, vendedorId: number): Observable<any> {
    return this.http.post<any>(`${this.base}/${localId}/asignar-vendedor`, {
      vendedorId,
    });
  }
}
