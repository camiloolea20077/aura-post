import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ModuloModel,
  ModuloTableModel,
  CreateModuloDto,
  UpdateModuloDto,
  SubmoduloModel,
  SubmoduloTableModel,
  CreateSubmoduloDto,
  UpdateSubmoduloDto,
} from '../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private readonly baseUrl = `${environment.apiUrl}platform`;

  constructor(private readonly http: HttpClient) {}

  pageModulos(pageable: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/modulos/page`, pageable);
  }

  getAllModulos(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/modulos`);
  }

  getModuloById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/modulos/${id}`);
  }

  createModulo(dto: CreateModuloDto): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/modulos`, dto);
  }

  updateModulo(id: number, dto: UpdateModuloDto): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/modulos/${id}`, dto);
  }

  deleteModulo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/modulos/${id}`);
  }

  pageSubmodulos(pageable: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/submodulos/page`, pageable);
  }

  getAllSubmodulos(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/submodulos`);
  }

  getSubmodulosByModulo(moduloId: number, params?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/submodulos/modulo/${moduloId}`, {
      params,
    });
  }

  getSubmoduloById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/submodulos/${id}`);
  }

  createSubmodulo(dto: CreateSubmoduloDto): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/submodulos`, dto);
  }

  updateSubmodulo(id: number, dto: UpdateSubmoduloDto): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/submodulos/${id}`, dto);
  }

  deleteSubmodulo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/submodulos/${id}`);
  }
}
