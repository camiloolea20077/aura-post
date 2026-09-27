import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

export type MotivoAbandono = 'VACIADO' | 'PESTANA_CERRADA';

export interface ItemCarritoAbandonado {
  productoId: number | null;
  presentacionId: number | null;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  agregadoAt: string | null;
}

export interface RegistrarCarritoAbandonado {
  sucursalId: number | null;
  turnoCajaId: number | null;
  clienteId: number | null;
  motivo: MotivoAbandono;
  /** Hora local sin zona: la misma fuente que vaciadoAt. */
  iniciadoAt: string;
  vaciadoAt: string;
  items: ItemCarritoAbandonado[];
}

export interface CarritoAbandonadoModel {
  id: number;
  iniciadoAt: string;
  vaciadoAt: string;
  minutos: number;
  motivo: MotivoAbandono;
  usuario: string | null;
  cliente: string | null;
  sucursal: string | null;
  items: number;
  total: number;
  detalle: ItemCarritoAbandonado[];
}

export interface ReporteCarritosAbandonados {
  desde: string;
  hasta: string;
  minutosMinimos: number;
  carritos: number;
  valor: number;
  productos: number;
  minutosPromedio: number;
  descartadosPorTiempo: number;
  topProductos: { productoId: number | null; nombre: string; cantidad: number; valor: number; carritos: number }[];
  porCajero: { usuarioId: number | null; usuario: string; carritos: number; valor: number }[];
  lista: CarritoAbandonadoModel[];
}

@Injectable({ providedIn: 'root' })
export class CarritoAbandonadoService {
  private readonly api = `${environment.apiUrl}pos/carritos-abandonados`;

  constructor(private readonly http: HttpClient) {}

  registrar(dto: RegistrarCarritoAbandonado): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(this.api, dto);
  }

  reporte(
    desde: string,
    hasta: string,
    minutosMinimos: number,
    sucursalId?: number | null,
  ): Observable<ResponseModel<ReporteCarritosAbandonados>> {
    let params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta)
      .set('minutosMinimos', minutosMinimos);
    if (sucursalId != null) params = params.set('sucursalId', sucursalId);
    return this.http.get<ResponseModel<ReporteCarritosAbandonados>>(`${this.api}/reporte`, { params });
  }
}
