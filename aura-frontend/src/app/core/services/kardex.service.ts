import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KardexFiltroDto } from '../models/kardex.model';

@Injectable({ providedIn: 'root' })
export class KardexService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  page(filtro: KardexFiltroDto): Observable<any> {
    return this.http.post<any>(`${this.base}kardex/page`, filtro);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}kardex/resumen/${id}`);
  }

  // Selectores auxiliares
  getSucursales(): Observable<any> {
    // El endpoint de sucursales es /activas (no /list, que caía en /{id}).
    return this.http.get<any>(`${this.base}sucursales/activas`);
  }

  buscarProductos(search: string): Observable<any> {
    return this.http.get<any>(`${this.base}productos/list?search=${search}`);
  }
}
