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

export type TipoPersona = 'NATURAL' | 'JURIDICA';

export interface CrearGestionado {
  tipoPersona: TipoPersona;
  /** NIT, o CC para persona natural sin RUT. */
  tipoDocumento: string;
  /** Jurídica; la natural la arma el backend con nombres y apellidos. */
  razonSocial: string | null;
  nombres: string | null;
  apellidos: string | null;
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

/** Identidad tributaria de un gestionado; el NIT no se cambia. */
export interface IdentidadGestionado {
  nit?: string;
  tipoPersona: TipoPersona;
  tipoDocumento: string;
  razonSocial: string | null;
  nombres: string | null;
  apellidos: string | null;
  nombreComercial: string | null;
  /** Vacío = lo calcula el backend con el NIT. */
  dv: string | null;
}

export type ServicioElectronico = 'FACTURA_VENTA' | 'NOMINA_ELECTRONICA' | 'DOCUMENTO_SOPORTE';

/** Solicitud de activación de documentos electrónicos de un gestionado (V228). */
export interface SolicitudActivacion {
  id: number;
  clienteEmpresaId: number;
  clienteNombre: string;
  clienteNit: string;
  firmaEmpresaId: number;
  firmaNombre: string;
  firmaNit: string;
  servicios: ServicioElectronico[];
  observacion: string | null;
  estado: 'PENDIENTE' | 'ATENDIDA' | 'RECHAZADA' | 'CANCELADA';
  solicitadoAt: string;
  respondidoAt: string | null;
  motivo: string | null;
  solicitadoPorNombre: string | null;
  facturaElectronicaActiva: boolean;
}

/** Estado electrónico del gestionado: lo activa Aura, los rangos los pone la firma en Mi perfil. */
export interface EstadoElectronica {
  activa: boolean;
  resolucion: boolean;
  rangoFactura: boolean;
  rangoNomina: boolean;
  ultima: SolicitudActivacion | null;
}

export const SERVICIOS_ELECTRONICOS: { codigo: ServicioElectronico; nombre: string; descripcion: string }[] = [
  { codigo: 'FACTURA_VENTA', nombre: 'Factura electrónica de venta', descripcion: 'Facturas, notas crédito y débito ante la DIAN' },
  { codigo: 'NOMINA_ELECTRONICA', nombre: 'Nómina electrónica', descripcion: 'Documento de nómina electrónica de cada empleado' },
  { codigo: 'DOCUMENTO_SOPORTE', nombre: 'Documento soporte', descripcion: 'Compras y gastos a quien no factura' },
];

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

  /** Tipo de persona, nombre, documento y DV del gestionado. */
  identidad(clienteId: number): Observable<ResponseModel<IdentidadGestionado>> {
    return this.http.get<ResponseModel<IdentidadGestionado>>(`${this.api}/gestionados/${clienteId}/identidad`);
  }

  cambiarIdentidad(clienteId: number, dto: IdentidadGestionado): Observable<ResponseModel<IdentidadGestionado>> {
    return this.http.put<ResponseModel<IdentidadGestionado>>(`${this.api}/gestionados/${clienteId}/identidad`, dto);
  }

  // ── Documentos electrónicos del gestionado ──────────────────────
  estadoElectronica(clienteId: number): Observable<ResponseModel<EstadoElectronica>> {
    return this.http.get<ResponseModel<EstadoElectronica>>(`${this.api}/gestionados/${clienteId}/electronica`);
  }

  /** Pide a Aura que active los documentos electrónicos; le llega a la campana de la plataforma. */
  solicitarElectronica(
    clienteId: number,
    servicios: ServicioElectronico[],
    observacion: string | null,
  ): Observable<ResponseModel<EstadoElectronica>> {
    return this.http.post<ResponseModel<EstadoElectronica>>(
      `${this.api}/gestionados/${clienteId}/electronica/solicitud`,
      { servicios, observacion },
    );
  }

  cancelarElectronica(clienteId: number): Observable<ResponseModel<EstadoElectronica>> {
    return this.http.delete<ResponseModel<EstadoElectronica>>(`${this.api}/gestionados/${clienteId}/electronica/solicitud`);
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
