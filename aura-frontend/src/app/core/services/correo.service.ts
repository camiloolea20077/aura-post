import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CorreoFila,
  EnviarCorreo,
  GrupoCorreo,
  LoteEncolado,
  LoteNomina,
  ResumenLote,
  SugerenciaCorreo,
} from '../models/correo.model';

/**
 * Envío de documentos por correo: factura, cuenta de cobro y cotización uno a uno, y
 * comprobantes de nómina en masa (cola en el servidor). El PDF lo genera la pantalla.
 */
@Injectable({ providedIn: 'root' })
export class CorreoService {
  private readonly api = `${environment.apiUrl}correos`;

  constructor(private readonly http: HttpClient) {}

  /** Para, asunto y mensaje propuestos; también dice si el envío está configurado. */
  sugerencia(grupo: GrupoCorreo, documentoId: number): Observable<ResponseModel<SugerenciaCorreo>> {
    return this.http.get<ResponseModel<SugerenciaCorreo>>(`${this.api}/${grupo}/${documentoId}/sugerencia`);
  }

  /** Correos que ya se enviaron del documento. */
  historial(grupo: GrupoCorreo, documentoId: number): Observable<ResponseModel<CorreoFila[]>> {
    return this.http.get<ResponseModel<CorreoFila[]>>(`${this.api}/${grupo}/${documentoId}`);
  }

  /** Envía ya; la fila vuelve ENVIADO o FALLIDO con el motivo. */
  enviar(grupo: GrupoCorreo, documentoId: number, dto: EnviarCorreo): Observable<ResponseModel<CorreoFila>> {
    return this.http.post<ResponseModel<CorreoFila>>(`${this.api}/${grupo}/${documentoId}/enviar`, dto);
  }

  sugerenciaNomina(): Observable<ResponseModel<SugerenciaCorreo>> {
    return this.http.get<ResponseModel<SugerenciaCorreo>>(`${this.api}/nomina/sugerencia`);
  }

  /** Encola una tanda de comprobantes (máx. 50); las siguientes llevan el loteId de la primera. */
  encolarNomina(dto: LoteNomina): Observable<ResponseModel<LoteEncolado>> {
    return this.http.post<ResponseModel<LoteEncolado>>(`${this.api}/nomina/lote/enviar`, dto);
  }

  resumenLote(loteId: string): Observable<ResponseModel<ResumenLote>> {
    return this.http.get<ResponseModel<ResumenLote>>(`${this.api}/nomina/lote/${loteId}`);
  }

  // ── Cartera: recordatorio a todos los clientes vencidos ──
  sugerenciaCobroMasivo(): Observable<ResponseModel<SugerenciaCorreo>> {
    return this.http.get<ResponseModel<SugerenciaCorreo>>(`${this.api}/cartera/vencidos/sugerencia`);
  }

  /** El servidor arma el estado de cuenta de cada cliente y los encola. */
  cobrarVencidos(asunto: string, mensaje: string | null): Observable<ResponseModel<LoteEncolado>> {
    return this.http.post<ResponseModel<LoteEncolado>>(`${this.api}/cartera/vencidos/enviar`, { asunto, mensaje });
  }

  resumenLoteCobro(loteId: string): Observable<ResponseModel<ResumenLote>> {
    return this.http.get<ResponseModel<ResumenLote>>(`${this.api}/cartera/lote/${loteId}`);
  }
}
