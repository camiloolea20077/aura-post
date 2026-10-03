import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  AccionEspecial,
  AutorizacionDada,
  BitacoraFiltro,
  BitacoraPagina,
  BloqueoLog,
  CambioLog,
  ExcesoVenta,
  GuardarExcepciones,
  GuardarPerfil,
  CodigoGenerado,
  EstadoSolicitud,
  SolicitarAutorizacion,
  SolicitudPendiente,
  UsarCodigo,
  ModoControl,
  NodoArbol,
  PerfilDetalle,
  PerfilFila,
  PermisosDeUsuario,
  PermisosUsuario,
} from '../models/permisos.model';

/** Permisos del usuario logueado y administración de perfiles. */
@Injectable({ providedIn: 'root' })
export class PermisosService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  mios(): Observable<ResponseModel<PermisosUsuario>> {
    return this.http.get<ResponseModel<PermisosUsuario>>(
      `${this.api}permisos/mios`,
    );
  }

  // ── Perfiles ──────────────────────────────────────────────
  listar(): Observable<ResponseModel<PerfilFila[]>> {
    return this.http.get<ResponseModel<PerfilFila[]>>(`${this.api}perfiles`);
  }

  /** Perfiles activos para elegir en el formulario de usuario. */
  opciones(): Observable<ResponseModel<PerfilFila[]>> {
    return this.http.get<ResponseModel<PerfilFila[]>>(
      `${this.api}perfiles/opciones`,
    );
  }

  arbol(): Observable<ResponseModel<NodoArbol[]>> {
    return this.http.get<ResponseModel<NodoArbol[]>>(
      `${this.api}perfiles/arbol`,
    );
  }

  /** Acciones especiales de los submódulos que la empresa tiene (V192). */
  especiales(): Observable<ResponseModel<AccionEspecial[]>> {
    return this.http.get<ResponseModel<AccionEspecial[]>>(
      `${this.api}perfiles/especiales`,
    );
  }

  detalle(id: number): Observable<ResponseModel<PerfilDetalle>> {
    return this.http.get<ResponseModel<PerfilDetalle>>(
      `${this.api}perfiles/${id}`,
    );
  }

  crear(dto: GuardarPerfil): Observable<ResponseModel<PerfilDetalle>> {
    return this.http.post<ResponseModel<PerfilDetalle>>(
      `${this.api}perfiles`,
      dto,
    );
  }

  actualizar(
    id: number,
    dto: GuardarPerfil,
  ): Observable<ResponseModel<PerfilDetalle>> {
    return this.http.put<ResponseModel<PerfilDetalle>>(
      `${this.api}perfiles/${id}`,
      dto,
    );
  }

  duplicar(id: number): Observable<ResponseModel<PerfilDetalle>> {
    return this.http.post<ResponseModel<PerfilDetalle>>(
      `${this.api}perfiles/${id}/duplicar`,
      {},
    );
  }

  eliminar(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}perfiles/${id}`);
  }

  // ── Excepciones por usuario ───────────────────────────────
  permisosDeUsuario(
    usuarioId: number,
  ): Observable<ResponseModel<PermisosDeUsuario>> {
    return this.http.get<ResponseModel<PermisosDeUsuario>>(
      `${this.api}perfiles/usuarios/${usuarioId}`,
    );
  }

  guardarExcepciones(
    usuarioId: number,
    dto: GuardarExcepciones,
  ): Observable<ResponseModel<PermisosDeUsuario>> {
    return this.http.put<ResponseModel<PermisosDeUsuario>>(
      `${this.api}perfiles/usuarios/${usuarioId}`,
      dto,
    );
  }

  /** Cierra todas las sesiones abiertas del usuario (caja.usuarios:CERRAR_SESIONES). */
  cerrarSesiones(usuarioId: number): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(
      `${this.api}usuarios/${usuarioId}/cerrar-sesiones`,
      {},
    );
  }

  // ── Bitácora y autorizaciones (V192) ──────────────────────
  bitacora(filtro: BitacoraFiltro): Observable<ResponseModel<BitacoraPagina>> {
    return this.http.post<ResponseModel<BitacoraPagina>>(
      `${this.api}bitacora/page`,
      filtro,
    );
  }

  /** Cuánto pasa la venta el límite del usuario (lo mismo que revisa el back al guardar). */
  evaluarVenta(venta: unknown): Observable<ResponseModel<ExcesoVenta>> {
    return this.http.post<ResponseModel<ExcesoVenta>>(
      `${this.api}autorizaciones/venta/evaluar`,
      venta,
    );
  }

  // Cajero: código que le dictó el supervisor, o aprobación remota.
  usarCodigo(req: UsarCodigo): Observable<ResponseModel<AutorizacionDada>> {
    return this.http.post<ResponseModel<AutorizacionDada>>(
      `${this.api}autorizaciones/usar-codigo`,
      req,
    );
  }

  solicitarAutorizacion(
    req: SolicitarAutorizacion,
  ): Observable<ResponseModel<EstadoSolicitud>> {
    return this.http.post<ResponseModel<EstadoSolicitud>>(
      `${this.api}autorizaciones/solicitudes`,
      req,
    );
  }

  estadoSolicitud(id: number): Observable<ResponseModel<EstadoSolicitud>> {
    return this.http.get<ResponseModel<EstadoSolicitud>>(
      `${this.api}autorizaciones/solicitudes/${id}`,
    );
  }

  // Supervisor: generar código y responder solicitudes.
  generarCodigo(): Observable<ResponseModel<CodigoGenerado>> {
    return this.http.post<ResponseModel<CodigoGenerado>>(
      `${this.api}autorizaciones/codigo`,
      {},
    );
  }

  solicitudesPendientes(): Observable<ResponseModel<SolicitudPendiente[]>> {
    return this.http.get<ResponseModel<SolicitudPendiente[]>>(
      `${this.api}autorizaciones/pendientes`,
    );
  }

  aprobarSolicitud(id: number): Observable<ResponseModel<EstadoSolicitud>> {
    return this.http.post<ResponseModel<EstadoSolicitud>>(
      `${this.api}autorizaciones/solicitudes/${id}/aprobar`,
      {},
    );
  }

  rechazarSolicitud(id: number): Observable<ResponseModel<EstadoSolicitud>> {
    return this.http.post<ResponseModel<EstadoSolicitud>>(
      `${this.api}autorizaciones/solicitudes/${id}/rechazar`,
      {},
    );
  }

  // ── Registro ──────────────────────────────────────────────
  historial(): Observable<ResponseModel<CambioLog[]>> {
    return this.http.get<ResponseModel<CambioLog[]>>(
      `${this.api}perfiles/historial`,
    );
  }

  bloqueos(dias: number): Observable<ResponseModel<BloqueoLog[]>> {
    return this.http.get<ResponseModel<BloqueoLog[]>>(
      `${this.api}perfiles/bloqueos`,
      {
        params: new HttpParams().set('dias', dias),
      },
    );
  }

  modo(): Observable<ResponseModel<{ modo: ModoControl }>> {
    return this.http.get<ResponseModel<{ modo: ModoControl }>>(
      `${this.api}perfiles/modo`,
    );
  }
}
