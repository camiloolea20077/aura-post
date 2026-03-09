import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateEmpresaDto,
  CreateEmpresaResponseDto,
  EmpresaPageableDto,
  UpdateEmpresaDto,
  ErrorLogPageableDto,
  ErrorLogGrupoPageableDto,
} from '../models/platform.model';
import { ResponseModel } from '../../shared/utils/responde.models';
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

  crear(dto: CreateEmpresaDto): Observable<ResponseModel<CreateEmpresaResponseDto>> {
    return this.http.post<ResponseModel<CreateEmpresaResponseDto>>(`${this.base}/empresas`, dto);
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

  // ─── Error Logs ───────────────────────────────────────────────
  errorLogs(dto: ErrorLogPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/error-logs/page`, dto);
  }

  errorLogGrupos(dto: ErrorLogGrupoPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/error-logs/grupos`, dto);
  }

  errorLogDetalle(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/error-logs/${id}`);
  }

  errorLogsPorGrupo(grupoHash: string, page: number, rows: number): Observable<any> {
    return this.http.post<any>(`${this.base}/error-logs/page`, { grupoHash, page, rows });
  }
}
