import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

export type PasoImportacion = 'plan-cuentas' | 'terceros' | 'saldos' | 'documentos';

export interface ResultadoFilaImportacion {
  fila: number;
  estado: 'NUEVO' | 'EXISTE' | 'ERROR' | 'ADVERTENCIA';
  detalle: string;
  mensaje: string;
}

export interface ResultadoImportacion {
  confirmado: boolean;
  nuevos: number;
  existentes: number;
  errores: number;
  filas: ResultadoFilaImportacion[];
  avisos: string[];
  totalDebito: number | null;
  totalCredito: number | null;
}

/** Migración desde otro software: el Excel se lee en el navegador y se envía como filas. */
@Injectable({ providedIn: 'root' })
export class ImportacionService {
  private readonly api = `${environment.apiUrl}importacion`;

  constructor(private readonly http: HttpClient) {}

  validar(paso: PasoImportacion, body: unknown): Observable<ResponseModel<ResultadoImportacion>> {
    return this.http.post<ResponseModel<ResultadoImportacion>>(`${this.api}/${paso}/validar`, body);
  }

  confirmar(paso: PasoImportacion, body: unknown): Observable<ResponseModel<ResultadoImportacion>> {
    return this.http.post<ResponseModel<ResultadoImportacion>>(`${this.api}/${paso}/confirmar`, body);
  }
}
