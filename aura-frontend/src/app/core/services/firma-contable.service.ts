import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';

/** Un cliente de la firma (vínculo firma→cliente activo). */
export interface ClienteFirma {
  id: number;
  firmaEmpresaId: number;
  firmaNombre: string;
  firmaNit: string;
  clienteEmpresaId: number;
  clienteNombre: string;
  clienteNit: string;
  perfilId: number | null;
  desde: string;
  usuarios: number;
  /** CLIENTE_PAGA (usa Aura y paga) o GESTIONADO (lo creó la firma y lo paga ella). */
  modalidad: 'CLIENTE_PAGA' | 'GESTIONADO';
}

export interface ResumenFirma {
  cupo: number;
  gestionados: number;
  clientes: ClienteFirma[];
}

export interface PaqueteGestionado {
  codigo: 'CONTABILIDAD' | 'FACTURACION' | 'COMPRAS' | 'NOMINA';
  nombre: string;
  descripcion: string;
}

export interface CrearGestionado {
  razonSocial: string;
  nombreComercial: string | null;
  nit: string;
  dv: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  municipio: string | null;
  municipioId: number | null;
  paquetes: string[];
  usuarioConsulta: {
    nombres: string;
    apellidos: string | null;
    tipoDocumento: string;
    documento: string;
    email: string;
    password: string;
  } | null;
}

export interface FirmaEncontrada {
  id: number;
  razonSocial: string;
  nombreComercial: string | null;
  nit: string;
  dv: string | null;
  logoUrl: string | null;
}

export interface SolicitudFirma {
  id: number;
  clienteEmpresaId: number;
  clienteNombre: string;
  clienteNit: string;
  firmaEmpresaId: number;
  firmaNombre: string;
  firmaNit: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';
  solicitadoAt: string;
  respondidoAt: string | null;
  motivo: string | null;
}

/** La firma con acceso a esta empresa y sus usuarios que entran. */
export interface AccesoFirma {
  firma: ClienteFirma;
  usuarios: { id: number; username: string; nombre: string | null }[];
}

/**
 * Firma contable desde las empresas (docs/PLAN_FIRMA_CONTABLE.md): F4 en la firma
 * (qué clientes atiende cada usuario) y F5 en el cliente (quién tiene acceso).
 */
@Injectable({ providedIn: 'root' })
export class FirmaContableService {
  private readonly api = `${environment.apiUrl}firma`;

  constructor(private readonly http: HttpClient) {}

  /** Clientes de la firma; vacío si la empresa no es firma. */
  clientes(): Observable<ResponseModel<ClienteFirma[]>> {
    return this.http.get<ResponseModel<ClienteFirma[]>>(`${this.api}/clientes`);
  }

  /** Vínculos (clientes) que atiende el usuario. */
  clientesDeUsuario(usuarioId: number): Observable<ResponseModel<number[]>> {
    return this.http.get<ResponseModel<number[]>>(`${this.api}/usuarios/${usuarioId}/clientes`);
  }

  asignarClientes(usuarioId: number, vinculoIds: number[]): Observable<ResponseModel<number[]>> {
    return this.http.put<ResponseModel<number[]>>(`${this.api}/usuarios/${usuarioId}/clientes`, { vinculoIds });
  }

  /** null si ninguna firma tiene acceso. */
  acceso(): Observable<ResponseModel<AccesoFirma | null>> {
    return this.http.get<ResponseModel<AccesoFirma | null>>(`${this.api}/acceso`);
  }

  quitarAcceso(): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.api}/acceso`);
  }

  // ── Clientes gestionados (la firma los crea; cupo) ──────────────
  resumen(): Observable<ResponseModel<ResumenFirma>> {
    return this.http.get<ResponseModel<ResumenFirma>>(`${this.api}/gestionados`);
  }

  paquetes(): Observable<ResponseModel<PaqueteGestionado[]>> {
    return this.http.get<ResponseModel<PaqueteGestionado[]>>(`${this.api}/gestionados/paquetes`);
  }

  crearGestionado(dto: CrearGestionado): Observable<ResponseModel<ClienteFirma>> {
    return this.http.post<ResponseModel<ClienteFirma>>(`${this.api}/gestionados`, dto);
  }

  paquetesDe(clienteId: number): Observable<ResponseModel<string[]>> {
    return this.http.get<ResponseModel<string[]>>(`${this.api}/gestionados/${clienteId}/paquetes`);
  }

  cambiarPaquetes(clienteId: number, paquetes: string[]): Observable<ResponseModel<string[]>> {
    return this.http.put<ResponseModel<string[]>>(`${this.api}/gestionados/${clienteId}/paquetes`, { paquetes });
  }

  // ── Solicitudes cliente → firma ─────────────────────────────────
  buscarFirma(nit: string): Observable<ResponseModel<FirmaEncontrada>> {
    return this.http.get<ResponseModel<FirmaEncontrada>>(`${this.api}/buscar`, { params: { nit } });
  }

  miSolicitud(): Observable<ResponseModel<SolicitudFirma | null>> {
    return this.http.get<ResponseModel<SolicitudFirma | null>>(`${this.api}/solicitud`);
  }

  solicitar(firmaEmpresaId: number): Observable<ResponseModel<SolicitudFirma>> {
    return this.http.post<ResponseModel<SolicitudFirma>>(`${this.api}/solicitud`, { firmaEmpresaId });
  }

  cancelarSolicitud(): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.api}/solicitud`);
  }

  solicitudesRecibidas(): Observable<ResponseModel<SolicitudFirma[]>> {
    return this.http.get<ResponseModel<SolicitudFirma[]>>(`${this.api}/solicitudes`);
  }

  aceptar(id: number): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(`${this.api}/solicitudes/${id}/aceptar`, {});
  }

  rechazar(id: number, motivo: string | null): Observable<ResponseModel<boolean>> {
    return this.http.post<ResponseModel<boolean>>(`${this.api}/solicitudes/${id}/rechazar`, { motivo });
  }
}
