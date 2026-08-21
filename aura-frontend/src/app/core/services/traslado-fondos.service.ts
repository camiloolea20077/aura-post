import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateTrasladoFondosDto,
  TrasladoFondosModel,
} from '../models/traslado-fondos.model';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/**
 * Traslados de dinero entre bolsillos de la empresa.
 *
 * <p>Ojo con el nombre: no tiene nada que ver con `TrasladoService`, que mueve
 * inventario entre sucursales. Este mueve plata.
 */
@Injectable({ providedIn: 'root' })
export class TrasladoFondosService {
  private readonly api = `${environment.apiUrl}traslados-fondos`;

  constructor(private readonly http: HttpClient) {}

  /** Sin fechas, el backend lista el mes en curso. */
  listar(
    desde?: string,
    hasta?: string,
    concepto?: string,
  ): Observable<ResponseModel<TrasladoFondosModel[]>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    if (concepto) params = params.set('concepto', concepto);
    return this.http.get<ResponseModel<TrasladoFondosModel[]>>(this.api, {
      params,
    });
  }

  obtener(id: number): Observable<ResponseModel<TrasladoFondosModel>> {
    return this.http.get<ResponseModel<TrasladoFondosModel>>(
      `${this.api}/${id}`,
    );
  }

  crear(
    dto: CreateTrasladoFondosDto,
  ): Observable<ResponseModel<TrasladoFondosModel>> {
    return this.http.post<ResponseModel<TrasladoFondosModel>>(this.api, dto);
  }
}
