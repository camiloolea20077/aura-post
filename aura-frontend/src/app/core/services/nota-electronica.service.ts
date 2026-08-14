import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  CrearNotaCreditoDto,
  FacturaDetalle,
  NotaElectronicaEstado,
} from '../models/nota-electronica.model';

@Injectable({ providedIn: 'root' })
export class NotaElectronicaService {
  private readonly base = `${environment.apiUrl}nota-electronica`;

  constructor(private readonly http: HttpClient) {}

  /** Busca facturas emitidas para referenciarlas en la nota. Respuesta cruda de Factus. */
  buscarFacturas(search: string): Observable<ResponseModel<unknown>> {
    return this.http.get<ResponseModel<unknown>>(
      `${this.base}/facturas`,
      { params: { search: search ?? '' } },
    );
  }

  /** Prefill de la factura: CUFE + ítems con IVA (detalle Factus o venta local). */
  facturaDetalle(
    billId: number | null,
    numero: string,
  ): Observable<ResponseModel<FacturaDetalle>> {
    const params: Record<string, string> = { numero };
    if (billId != null) params['billId'] = String(billId);
    return this.http.get<ResponseModel<FacturaDetalle>>(
      `${this.base}/factura-detalle`,
      { params },
    );
  }

  /** Crea y valida una nota crédito. Respuesta cruda de Factus (CUDE, número...). */
  crearNotaCredito(dto: CrearNotaCreditoDto): Observable<ResponseModel<unknown>> {
    return this.http.post<ResponseModel<unknown>>(`${this.base}/credito`, dto);
  }

  /** Crea y valida una nota débito (mismo payload). */
  crearNotaDebito(dto: CrearNotaCreditoDto): Observable<ResponseModel<unknown>> {
    return this.http.post<ResponseModel<unknown>>(`${this.base}/debito`, dto);
  }

  /** Listado local de notas emitidas. */
  listarLocal(): Observable<ResponseModel<NotaElectronicaEstado[]>> {
    return this.http.get<ResponseModel<NotaElectronicaEstado[]>>(`${this.base}/local`);
  }

  ver(id: number): Observable<ResponseModel<NotaElectronicaEstado>> {
    return this.http.get<ResponseModel<NotaElectronicaEstado>>(`${this.base}/${id}`);
  }

  /** PDF de la nota (Base64) desde Factus. */
  descargarPdf(id: number): Observable<ResponseModel<string>> {
    return this.http.get<ResponseModel<string>>(`${this.base}/${id}/pdf`);
  }

  /** Elimina la nota (solo si NO está validada por la DIAN). */
  eliminar(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.base}/${id}`);
  }

  /** Reenvía la nota por correo al cliente. */
  reenviarCorreo(id: number, email?: string): Observable<ResponseModel<void>> {
    const params: Record<string, string> = {};
    if (email) params['email'] = email;
    return this.http.post<ResponseModel<void>>(
      `${this.base}/${id}/reenviar-correo`,
      null,
      { params },
    );
  }
}
