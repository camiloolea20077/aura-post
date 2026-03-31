import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  EmpresaPermisos,
  UpdatePermisoDto,
} from '../models/permiso.model';

@Injectable({ providedIn: 'root' })
export class PermisoService {
  private readonly baseUrl = `${environment.apiUrl}platform/empresas`;

  constructor(private readonly http: HttpClient) {}

  getPermisos(empresaId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${empresaId}/permisos`);
  }

  updatePermisos(empresaId: number, dto: UpdatePermisoDto): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${empresaId}/permisos`, dto);
  }
}
