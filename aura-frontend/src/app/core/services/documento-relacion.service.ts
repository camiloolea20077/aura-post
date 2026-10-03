import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/** Tipos lógicos de documento de la cadena documental (espejo del backend). */
export type TipoDocumento =
  | 'COTIZACION'
  | 'PEDIDO'
  | 'VENTA'
  | 'DEVOLUCION'
  | 'NOTA_VENTA'
  | 'ORDEN_COMPRA'
  | 'REMISION_COMPRA'
  | 'COMPRA'
  | 'NOTA_COMPRA'
  | 'RECIBO'
  | 'EGRESO';

/** Una relación vista desde un documento, en cualquiera de los dos sentidos. */
export interface Relacionado {
  relacionId: number;
  /** Tipo del documento del OTRO extremo. */
  tipo: TipoDocumento | string;
  /** Id del documento del otro extremo. */
  id: number;
  /** Número visible del otro documento (COT-0001, FE-120…), si el back lo resuelve. */
  numero: string | null;
  lineaId: number | null;
  lineaPropiaId: number | null;
  cantidad: number | null;
  valor: number | null;
  estado: 'VIGENTE' | 'ANULADA';
  createdAt: string | null;
}

export interface Relacionados {
  /** De dónde viene este documento. */
  origenes: Relacionado[];
  /** A dónde fue este documento. */
  destinos: Relacionado[];
}

@Injectable({ providedIn: 'root' })
export class DocumentoRelacionService {
  private readonly api = `${environment.apiUrl}documentos`;

  constructor(private readonly http: HttpClient) {}

  /** Relaciones hacia atrás (origen) y hacia adelante (destino) de un documento. */
  relacionados(tipo: TipoDocumento | string, id: number): Observable<ResponseModel<Relacionados>> {
    return this.http.get<ResponseModel<Relacionados>>(`${this.api}/${tipo}/${id}/relacionados`);
  }
}
