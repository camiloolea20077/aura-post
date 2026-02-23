import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateEmpresaDto,
  EmpresaPageableDto,
  UpdateEmpresaDto,
} from '../models/platform.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly base = `${environment.apiUrl}platform`;

  constructor(private readonly http: HttpClient) {}

  dashboard(): Observable<any> {
    return this.http.get<any>(`${this.base}/dashboard`);
  }

  page(dto: EmpresaPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/empresas/page`, dto);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/empresas/${id}`);
  }

  crear(dto: CreateEmpresaDto): Observable<any> {
    return this.http.post<any>(`${this.base}/empresas`, dto);
  }

  actualizar(id: number, dto: UpdateEmpresaDto): Observable<any> {
    return this.http.put<any>(`${this.base}/empresas/${id}`, dto);
  }

  suspender(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/empresas/${id}/suspender`, {});
  }

  activar(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/empresas/${id}/activar`, {});
  }
}
