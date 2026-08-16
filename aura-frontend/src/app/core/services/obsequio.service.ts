import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateObsequioDto,
  ObsequioPageableDto,
} from '../models/obsequio.model';

@Injectable({ providedIn: 'root' })
export class ObsequioService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  page(pageable: ObsequioPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}obsequios/page`, pageable);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}obsequios/${id}`);
  }

  create(dto: CreateObsequioDto): Observable<any> {
    return this.http.post<any>(`${this.base}obsequios/create`, dto);
  }

  anular(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}obsequios/${id}/anular`, {});
  }
}
