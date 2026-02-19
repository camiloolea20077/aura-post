import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LoteModel,
  LoteTableModel,
  CreateLoteDto,
  LotePageableDto,
} from '../models/lote.model';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class LoteService {
  private readonly apiUrl = `${environment.apiUrl}lotes`;
  constructor(private readonly http: HttpClient) {}

  page(dto: LotePageableDto): Observable<ResponseTableModel<LoteTableModel>> {
    return this.http.post<ResponseTableModel<LoteTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }
  getById(id: number): Observable<ResponseModel<LoteModel>> {
    return this.http.get<ResponseModel<LoteModel>>(`${this.apiUrl}/${id}`);
  }
  porVencer(): Observable<ResponseModel<LoteTableModel[]>> {
    return this.http.get<ResponseModel<LoteTableModel[]>>(
      `${this.apiUrl}/por-vencer`,
    );
  }
  create(dto: CreateLoteDto): Observable<ResponseModel<LoteModel>> {
    return this.http.post<ResponseModel<LoteModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }
  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.apiUrl}/${id}`);
  }
}
