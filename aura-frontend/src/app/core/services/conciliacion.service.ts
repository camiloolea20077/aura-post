import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CrearExtractoDto,
  ExtractoBancario,
  ExtractoLinea,
  MovimientoLibro,
  ResumenConciliacion,
  SugerenciaMatching,
  TipoAjusteBancario,
} from '../models/conciliacion.model';

/** E9 · Conciliación bancaria — /api/contabilidad/conciliacion */
@Injectable({ providedIn: 'root' })
export class ConciliacionService {
  private readonly api = `${environment.apiUrl}contabilidad/conciliacion/extractos`;

  constructor(private readonly http: HttpClient) {}

  crear(dto: CrearExtractoDto): Observable<ResponseModel<ExtractoBancario>> {
    return this.http.post<ResponseModel<ExtractoBancario>>(this.api, dto);
  }

  listar(
    cuentaBancariaId?: number | null,
  ): Observable<ResponseModel<ExtractoBancario[]>> {
    let params = new HttpParams();
    if (cuentaBancariaId)
      params = params.set('cuentaBancariaId', cuentaBancariaId);
    return this.http.get<ResponseModel<ExtractoBancario[]>>(this.api, {
      params,
    });
  }

  eliminar(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/${id}`);
  }

  lineas(id: number): Observable<ResponseModel<ExtractoLinea[]>> {
    return this.http.get<ResponseModel<ExtractoLinea[]>>(
      `${this.api}/${id}/lineas`,
    );
  }

  importar(
    id: number,
    csv?: string | null,
    lineas?: { fecha: string; descripcion: string; valor: number }[] | null,
  ): Observable<ResponseModel<ExtractoLinea[]>> {
    return this.http.post<ResponseModel<ExtractoLinea[]>>(
      `${this.api}/${id}/lineas`,
      { csv, lineas },
    );
  }

  sugerencias(id: number): Observable<ResponseModel<SugerenciaMatching[]>> {
    return this.http.get<ResponseModel<SugerenciaMatching[]>>(
      `${this.api}/${id}/sugerencias`,
    );
  }

  movimientosLibro(id: number): Observable<ResponseModel<MovimientoLibro[]>> {
    return this.http.get<ResponseModel<MovimientoLibro[]>>(
      `${this.api}/${id}/movimientos-libro`,
    );
  }

  conciliar(
    id: number,
    lineaId: number,
    asientoDetalleId: number,
  ): Observable<ResponseModel<ExtractoLinea>> {
    return this.http.post<ResponseModel<ExtractoLinea>>(
      `${this.api}/${id}/lineas/${lineaId}/conciliar`,
      { asientoDetalleId },
    );
  }

  desconciliar(
    id: number,
    lineaId: number,
  ): Observable<ResponseModel<ExtractoLinea>> {
    return this.http.post<ResponseModel<ExtractoLinea>>(
      `${this.api}/${id}/lineas/${lineaId}/desconciliar`,
      {},
    );
  }

  registrarAjuste(
    id: number,
    lineaId: number,
    tipo: TipoAjusteBancario,
  ): Observable<ResponseModel<ExtractoLinea>> {
    return this.http.post<ResponseModel<ExtractoLinea>>(
      `${this.api}/${id}/lineas/${lineaId}/ajuste`,
      { tipo },
    );
  }

  resumen(id: number): Observable<ResponseModel<ResumenConciliacion>> {
    return this.http.get<ResponseModel<ResumenConciliacion>>(
      `${this.api}/${id}/resumen`,
    );
  }

  cerrar(id: number): Observable<ResponseModel<ExtractoBancario>> {
    return this.http.post<ResponseModel<ExtractoBancario>>(
      `${this.api}/${id}/cerrar`,
      {},
    );
  }
}
