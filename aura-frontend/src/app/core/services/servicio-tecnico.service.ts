import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  ClienteRapidoServicio,
  ConsultaServicioPublica,
  EntregarServicio,
  PagoServicio,
  ClienteServicio,
  ConfigServicioTecnico,
  EstadoOrdenServicio,
  FiltroOrdenesServicio,
  GuardarItemServicio,
  GuardarOrdenServicio,
  IndicadoresServicio,
  MomentoFoto,
  OrdenServicioDetalle,
  OrdenServicioFila,
  PaginaServicio,
} from '../models/servicio-tecnico.model';

/**
 * Servicio técnico (/api/servicio-tecnico). La empresa y el usuario salen del
 * token en el backend.
 */
@Injectable({ providedIn: 'root' })
export class ServicioTecnicoService {
  private readonly api = `${environment.apiUrl}servicio-tecnico`;

  constructor(private readonly http: HttpClient) {}

  // ── Bandeja ──

  listar(
    page: number,
    rows: number,
    search: string,
    filtro: FiltroOrdenesServicio,
  ): Observable<ResponseModel<PaginaServicio<OrdenServicioFila>>> {
    return this.http.post<ResponseModel<PaginaServicio<OrdenServicioFila>>>(`${this.api}/ordenes/page`, {
      page,
      rows,
      search: search?.trim() || null,
      params: filtro,
    });
  }

  indicadores(): Observable<ResponseModel<IndicadoresServicio>> {
    return this.http.get<ResponseModel<IndicadoresServicio>>(`${this.api}/ordenes/indicadores`);
  }

  // ── Orden ──

  obtener(id: number): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.get<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}`);
  }

  crear(dto: GuardarOrdenServicio): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.post<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes`, dto);
  }

  actualizar(id: number, dto: GuardarOrdenServicio): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.put<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}`, dto);
  }

  cambiarEstado(
    id: number,
    estado: EstadoOrdenServicio,
    nota: string | null,
  ): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.post<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}/estado`, {
      estado,
      nota,
    });
  }

  agregarNota(id: number, nota: string): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.post<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}/notas`, { nota });
  }

  agregarItem(id: number, dto: GuardarItemServicio): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.post<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}/items`, dto);
  }

  eliminarItem(id: number, itemId: number): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.delete<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}/items/${itemId}`);
  }

  // ── Fotos (nunca una URL pública: el contenido sale por el backend) ──

  subirFoto(id: number, archivo: Blob, nombre: string, momento: MomentoFoto): Observable<ResponseModel<OrdenServicioDetalle>> {
    const form = new FormData();
    form.append('archivo', archivo, nombre);
    const params = new HttpParams().set('momento', momento);
    return this.http.post<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}/fotos`, form, { params });
  }

  foto(id: number, fotoId: number): Observable<Blob> {
    return this.http.get(`${this.api}/ordenes/${id}/fotos/${fotoId}`, { responseType: 'blob' });
  }

  eliminarFoto(id: number, fotoId: number): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.delete<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}/fotos/${fotoId}`);
  }

  // ── Abonos y entrega ──

  registrarAbono(id: number, pago: PagoServicio): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.post<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}/abonos`, pago);
  }

  anularAbono(id: number, abonoId: number, motivo: string): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.post<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}/abonos/${abonoId}/anular`, {
      motivo,
    });
  }

  entregar(id: number, dto: EntregarServicio): Observable<ResponseModel<OrdenServicioDetalle>> {
    return this.http.post<ResponseModel<OrdenServicioDetalle>>(`${this.api}/ordenes/${id}/entregar`, dto);
  }

  // ── Consulta pública (sin sesión) ──

  consultaPublica(token: string): Observable<ResponseModel<ConsultaServicioPublica>> {
    return this.http.get<ResponseModel<ConsultaServicioPublica>>(`${environment.apiUrl}auth/consulta-servicio/${token}`);
  }

  responderPresupuesto(token: string, aprueba: boolean, comentario: string | null): Observable<ResponseModel<ConsultaServicioPublica>> {
    return this.http.post<ResponseModel<ConsultaServicioPublica>>(
      `${environment.apiUrl}auth/consulta-servicio/${token}/respuesta`,
      { aprueba, comentario },
    );
  }

  // ── Cliente rápido y configuración ──

  crearCliente(dto: ClienteRapidoServicio): Observable<ResponseModel<ClienteServicio>> {
    return this.http.post<ResponseModel<ClienteServicio>>(`${this.api}/clientes`, dto);
  }

  config(): Observable<ResponseModel<ConfigServicioTecnico>> {
    return this.http.get<ResponseModel<ConfigServicioTecnico>>(`${this.api}/config`);
  }

  guardarConfig(dto: Omit<ConfigServicioTecnico, 'siguienteNumero' | 'productoServicioNombre'>): Observable<ResponseModel<ConfigServicioTecnico>> {
    return this.http.put<ResponseModel<ConfigServicioTecnico>>(`${this.api}/config`, dto);
  }
}
