import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  NominaElectronicaEstado,
  NominaElectronicaPayload,
  NominaElectronicaRespuesta,
} from '../models/nomina-electronica.model';

@Injectable({ providedIn: 'root' })
export class NominaElectronicaService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Previsualiza el payload que se le mandaría a Factus (no envía nada). */
  preview(
    nominaId: number,
  ): Observable<ResponseModel<NominaElectronicaPayload>> {
    return this.http.get<ResponseModel<NominaElectronicaPayload>>(
      `${this.base}nomina-electronica/${nominaId}/preview`,
    );
  }

  /**
   * Envía la nómina a Factus v2 y devuelve la respuesta cruda. El
   * {@code numberingRangeId} es opcional: si no se manda, el backend usa el
   * configurado por defecto.
   */
  enviar(
    nominaId: number,
    numberingRangeId?: string,
  ): Observable<ResponseModel<NominaElectronicaRespuesta>> {
    const body: Record<string, string> = {};
    if (numberingRangeId) body['numberingRangeId'] = numberingRangeId;
    return this.http.post<ResponseModel<NominaElectronicaRespuesta>>(
      `${this.base}nomina-electronica/${nominaId}/enviar`,
      body,
    );
  }

  /**
   * Estado local persistido de la nómina electrónica de una nómina. `data` es
   * {@code null} si aún no se ha enviado.
   */
  estado(
    nominaId: number,
  ): Observable<ResponseModel<NominaElectronicaEstado | null>> {
    return this.http.get<ResponseModel<NominaElectronicaEstado | null>>(
      `${this.base}nomina-electronica/nomina/${nominaId}`,
    );
  }

  /** Listado local (persistido) de todas las nóminas electrónicas de la empresa. */
  listarLocal(): Observable<ResponseModel<NominaElectronicaEstado[]>> {
    return this.http.get<ResponseModel<NominaElectronicaEstado[]>>(
      `${this.base}nomina-electronica/local`,
    );
  }

  /** Borrado directo en Factus (SOLO sandbox/pruebas; en producción usa la nota). */
  eliminarSandbox(referenceCode: string): Observable<ResponseModel<unknown>> {
    return this.http.delete<ResponseModel<unknown>>(
      `${this.base}nomina-electronica/reference/${referenceCode}`,
    );
  }

  /** Descarga el XML firmado de la nómina electrónica como archivo. */
  descargarXml(nominaId: number): Observable<Blob> {
    return this.http.get(
      `${this.base}nomina-electronica/nomina/${nominaId}/xml`,
      { responseType: 'blob' },
    );
  }

  /**
   * Nota de eliminación (forma DIAN de anular una nómina ya aceptada). Marca la
   * nómina electrónica como ANULADA.
   */
  notaEliminacion(referenceCode: string): Observable<ResponseModel<unknown>> {
    return this.http.post<ResponseModel<unknown>>(
      `${this.base}nomina-electronica/reference/${referenceCode}/nota-eliminacion`,
      {},
    );
  }
}
