import { environment } from '../../../../../environments/environment';
import { ResponseModel } from '../../../../shared/utils/responde.models';
import {
  TipoEmpleadoModel,
  CreateTipoEmpleadoDto,
  UpdateTipoEmpleadoDto,
} from '../models/tipo-empleado.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TipoEmpleadoService {
  private readonly baseUrl = `${environment.apiUrl}tipos-empleado`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ResponseModel<TipoEmpleadoModel[]>> {
    return this.http.get<ResponseModel<TipoEmpleadoModel[]>>(this.baseUrl);
  }

  getById(id: number): Observable<ResponseModel<TipoEmpleadoModel>> {
    return this.http.get<ResponseModel<TipoEmpleadoModel>>(
      `${this.baseUrl}/${id}`,
    );
  }

  create(
    dto: CreateTipoEmpleadoDto,
  ): Observable<ResponseModel<TipoEmpleadoModel>> {
    return this.http.post<ResponseModel<TipoEmpleadoModel>>(this.baseUrl, dto);
  }

  update(
    id: number,
    dto: UpdateTipoEmpleadoDto,
  ): Observable<ResponseModel<TipoEmpleadoModel>> {
    return this.http.put<ResponseModel<TipoEmpleadoModel>>(
      `${this.baseUrl}/${id}`,
      dto,
    );
  }

  delete(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.baseUrl}/${id}`);
  }
}