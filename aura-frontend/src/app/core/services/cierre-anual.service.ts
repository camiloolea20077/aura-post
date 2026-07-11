import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CierreAnualOperacion,
  DistribucionDto,
  DistribucionUtilidades,
  DividendoPago,
  PagoDividendoDto,
  ProvisionRentaDto,
  SugerenciaDistribucion,
  SugerenciaProvision,
} from '../models/cierre-anual.model';

/** E8 · Cierre anual fiscal — /api/contabilidad/cierre-anual */
@Injectable({ providedIn: 'root' })
export class CierreAnualService {
  private readonly api = `${environment.apiUrl}contabilidad/cierre-anual`;

  constructor(private readonly http: HttpClient) {}

  sugerenciaProvision(
    anio: number,
    tarifa?: number | null,
  ): Observable<ResponseModel<SugerenciaProvision>> {
    let params = new HttpParams().set('anio', anio);
    if (tarifa) params = params.set('tarifa', tarifa);
    return this.http.get<ResponseModel<SugerenciaProvision>>(
      `${this.api}/provision-renta/sugerencia`,
      { params },
    );
  }

  provisionar(
    dto: ProvisionRentaDto,
  ): Observable<ResponseModel<CierreAnualOperacion>> {
    return this.http.post<ResponseModel<CierreAnualOperacion>>(
      `${this.api}/provision-renta`,
      dto,
    );
  }

  trasladar(
    anio: number,
    fecha?: string | null,
  ): Observable<ResponseModel<CierreAnualOperacion>> {
    return this.http.post<ResponseModel<CierreAnualOperacion>>(
      `${this.api}/traslado`,
      { anio, fecha },
    );
  }

  operaciones(): Observable<ResponseModel<CierreAnualOperacion[]>> {
    return this.http.get<ResponseModel<CierreAnualOperacion[]>>(
      `${this.api}/operaciones`,
    );
  }

  sugerenciaDistribucion(): Observable<ResponseModel<SugerenciaDistribucion>> {
    return this.http.get<ResponseModel<SugerenciaDistribucion>>(
      `${this.api}/distribucion/sugerencia`,
    );
  }

  distribuir(
    dto: DistribucionDto,
  ): Observable<ResponseModel<DistribucionUtilidades>> {
    return this.http.post<ResponseModel<DistribucionUtilidades>>(
      `${this.api}/distribucion`,
      dto,
    );
  }

  distribuciones(): Observable<ResponseModel<DistribucionUtilidades[]>> {
    return this.http.get<ResponseModel<DistribucionUtilidades[]>>(
      `${this.api}/distribuciones`,
    );
  }

  pagos(distribucionId: number): Observable<ResponseModel<DividendoPago[]>> {
    return this.http.get<ResponseModel<DividendoPago[]>>(
      `${this.api}/distribuciones/${distribucionId}/pagos`,
    );
  }

  pagarDividendos(
    dto: PagoDividendoDto,
  ): Observable<ResponseModel<DividendoPago>> {
    return this.http.post<ResponseModel<DividendoPago>>(
      `${this.api}/dividendos/pagos`,
      dto,
    );
  }
}
