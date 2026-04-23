import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseTableModel } from '../../shared/utils/response-table.model';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CotizacionModel,
  CotizacionTableModel,
  CreateCotizacionDto,
  CotizacionPageableDto,
  UpdateCotizacionDto,
} from '../models/cotizacion.model';

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private readonly apiUrl = `${environment.apiUrl}cotizaciones`;

  constructor(private readonly http: HttpClient) {}

  page(dto: CotizacionPageableDto): Observable<ResponseTableModel<CotizacionTableModel>> {
    return this.http.post<ResponseTableModel<CotizacionTableModel>>(
      `${this.apiUrl}/page`,
      dto,
    );
  }

  getById(id: number): Observable<ResponseModel<CotizacionModel>> {
    return this.http.get<ResponseModel<CotizacionModel>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCotizacionDto): Observable<ResponseModel<CotizacionModel>> {
    return this.http.post<ResponseModel<CotizacionModel>>(
      `${this.apiUrl}/create`,
      dto,
    );
  }

  anular(id: number): Observable<ResponseModel<boolean>> {
    return this.http.patch<ResponseModel<boolean>>(
      `${this.apiUrl}/${id}/anular`,
      {},
    );
  }

  convertirAVenta(id: number): Observable<ResponseModel<CotizacionModel>> {
    return this.http.get<ResponseModel<CotizacionModel>>(
      `${this.apiUrl}/${id}/convertir`,
    );
  }

  update(id: number, dto: UpdateCotizacionDto): Observable<ResponseModel<CotizacionModel>> {
    return this.http.put<ResponseModel<CotizacionModel>>(
      `${this.apiUrl}/${id}`,
      dto,
    );
  }
}
