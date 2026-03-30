import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  VendedorModel,
  VendedorPageableDto,
} from '../models/vendedor.model';

@Injectable({ providedIn: 'root' })
export class VendedorService {
  private readonly base = `${environment.apiUrl}empleados`;

  constructor(private readonly http: HttpClient) {}

  pageVendedores(pageable: VendedorPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/page`, pageable);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }
}
