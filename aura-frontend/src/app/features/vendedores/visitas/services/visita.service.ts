import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ResponseModel } from '../../../../shared/utils/responde.models';
import {
  VisitaModel,
  VisitaTableModel,
  CreateVisitaDto,
  ConfirmarLlegadaDto,
  VisitaPageableDto,
  CreateVisitaAndConfirmarDto,
} from '../../models/vendedor.model';

@Injectable({ providedIn: 'root' })
export class VisitaService {
  private readonly base = `${environment.apiUrl}visitas`;

  constructor(private readonly http: HttpClient) {}

  page(pageable: VisitaPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/page`, pageable);
  }

  getHoy(): Observable<any> {
    return this.http.get<any>(`${this.base}/hoy`);
  }

  getById(id: number): Observable<ResponseModel<VisitaModel>> {
    return this.http.get<ResponseModel<VisitaModel>>(`${this.base}/${id}`);
  }

  create(dto: CreateVisitaDto): Observable<ResponseModel<VisitaModel>> {
    return this.http.post<ResponseModel<VisitaModel>>(`${this.base}/create`, dto);
  }

  crearConfirmada(dto: CreateVisitaAndConfirmarDto): Observable<ResponseModel<VisitaModel>> {
    return this.http.post<ResponseModel<VisitaModel>>(`${this.base}/create-confirmada`, dto);
  }

  confirmar(id: number, dto: ConfirmarLlegadaDto): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(`${this.base}/${id}/confirmar`, dto);
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.base}/${id}`);
  }
}
