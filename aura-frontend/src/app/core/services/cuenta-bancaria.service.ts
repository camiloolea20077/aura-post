import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CuentaBancariaModel, CreateCuentaBancariaDto } from '../models/cuenta-bancaria.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

@Injectable({ providedIn: 'root' })
export class CuentaBancariaService {
  private readonly api = `${environment.apiUrl}tesoreria/cuentas`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ResponseModel<CuentaBancariaModel[]>> {
    return this.http.get<ResponseModel<CuentaBancariaModel[]>>(this.api);
  }

  create(dto: CreateCuentaBancariaDto): Observable<ResponseModel<CuentaBancariaModel>> {
    return this.http.post<ResponseModel<CuentaBancariaModel>>(this.api, dto);
  }

  update(id: number, dto: CreateCuentaBancariaDto): Observable<ResponseModel<CuentaBancariaModel>> {
    return this.http.put<ResponseModel<CuentaBancariaModel>>(`${this.api}/${id}`, dto);
  }

  toggle(id: number): Observable<ResponseModel<void>> {
    return this.http.patch<ResponseModel<void>>(`${this.api}/${id}/toggle`, {});
  }
}
