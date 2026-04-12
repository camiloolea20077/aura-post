import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  RutaModel,
  RutaTableModel,
  CreateRutaDto,
  RutaPageableDto,
} from '../../models/vendedor.model';

@Injectable({ providedIn: 'root' })
export class RutaService {
  private readonly base = `${environment.apiUrl}rutas`;

  constructor(private readonly http: HttpClient) {}

  page(pageable: RutaPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/page`, pageable);
  }

  getAll(): Observable<any> {
    return this.http.get<any>(`${this.base}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(dto: CreateRutaDto): Observable<any> {
    return this.http.post<any>(`${this.base}/create`, dto);
  }

  update(id: number, dto: CreateRutaDto): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }

  validar(vendedorId: number, localId: number, diaSemana: number): Observable<any> {
    return this.http.get<any>(`${this.base}/validar`, {
      params: { vendedorId, localId, diaSemana },
    });
  }

  getByVendedor(vendedorId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/vendedor/${vendedorId}`);
  }
}
