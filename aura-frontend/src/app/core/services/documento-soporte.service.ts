import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  DocumentoSoporteModel,
  EmitirDocumentoSoporteDto,
  OrigenDocumentoSoporte,
  PreviaDocumentoSoporteModel,
} from '../models/documento-soporte.model';

@Injectable({ providedIn: 'root' })
export class DocumentoSoporteService {
  private readonly api = `${environment.apiUrl}documentos-soporte`;

  constructor(private readonly http: HttpClient) {}

  /** Lo que se enviaría y qué falta. No llama a la DIAN. */
  previa(
    origenTipo: OrigenDocumentoSoporte,
    origenId: number,
  ): Observable<ResponseModel<PreviaDocumentoSoporteModel>> {
    return this.http.get<ResponseModel<PreviaDocumentoSoporteModel>>(
      `${this.api}/previa`,
      { params: new HttpParams().set('origenTipo', origenTipo).set('origenId', origenId) },
    );
  }

  emitir(dto: EmitirDocumentoSoporteDto): Observable<ResponseModel<DocumentoSoporteModel>> {
    return this.http.post<ResponseModel<DocumentoSoporteModel>>(this.api, dto);
  }

  listar(desde?: string, hasta?: string): Observable<ResponseModel<DocumentoSoporteModel[]>> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ResponseModel<DocumentoSoporteModel[]>>(this.api, { params });
  }

  pdf(id: number): Observable<ResponseModel<{ pdfBase64: string }>> {
    return this.http.get<ResponseModel<{ pdfBase64: string }>>(`${this.api}/${id}/pdf`);
  }

  descartar(id: number): Observable<ResponseModel<DocumentoSoporteModel>> {
    return this.http.delete<ResponseModel<DocumentoSoporteModel>>(`${this.api}/${id}`);
  }

  /** Abre el PDF (Base64) en una pestaña nueva. */
  abrirPdf(base64: string): void {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    window.open(url, '_blank');
  }
}
