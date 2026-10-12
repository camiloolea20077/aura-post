import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmpresaConfig {
  id?: number;
  razonSocial?: string;
  nombreComercial?: string;
  nit?: string;
  dv?: string;
  correo?: string;
  logoUrl?: string;
  telefono?: string;
  direccion?: string;
  municipio?: string;
  facturaElectronica?: boolean;
  resolucionNumero?: string;
  resolucionPrefijo?: string;
  resolucionDesde?: number;
  resolucionHasta?: number;
  resolucionFechaDesde?: string;
  resolucionFechaHasta?: string;
  factusNumberingRangeId?: number | null;
  factusNominaNumberingRangeId?: string | null;
  /** Lo decide el back: SUPER_ADMIN o acción especial caja.usuarios:EDITAR_EMPRESA. */
  puedeEditar?: boolean;
  /** La empresa es una firma contable. */
  esFirmaContable?: boolean;
  sucursalId?: number;
  sucursalNombre?: string;
  sucursalDireccion?: string;
  sucursalTelefono?: string;
  sucursalCiudad?: string;
  sucursalPrefijoFacturacion?: string;
}
/** Todo lo que el administrador edita desde "Mi perfil" (PUT /empresa/datos). */
export interface EmpresaDatosUpdate {
  nombreComercial: string | null;
  logoUrl: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  municipio: string | null;
  resolucionNumero: string | null;
  resolucionPrefijo: string | null;
  resolucionDesde: number | null;
  resolucionHasta: number | null;
  /** AAAA-MM-DD */
  resolucionFechaDesde: string | null;
  resolucionFechaHasta: string | null;
  factusNumberingRangeId: number | null;
  factusNominaNumberingRangeId: string | null;
}

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  constructor(private http: HttpClient) {}

  getConfig(): Observable<{ data: EmpresaConfig }> {
    return this.http.get<any>(`${environment.apiUrl}empresa`);
  }

  /**
   * Contacto de la empresa desde "Mi perfil". El back exige rol ADMIN o
   * SUPER_ADMIN: para los demás responde 403.
   */
  actualizarContacto(dto: {
    telefono?: string | null;
    correo?: string | null;
    direccion?: string | null;
    municipio?: string | null;
  }): Observable<{ data: EmpresaConfig }> {
    return this.http.put<any>(`${environment.apiUrl}empresa/contacto`, dto);
  }

  /**
   * Nombre comercial, logo, contacto, resolución y rangos de Factus. El back
   * exige SUPER_ADMIN o la acción especial caja.usuarios:EDITAR_EMPRESA (403).
   */
  actualizarDatos(dto: EmpresaDatosUpdate): Observable<{ data: EmpresaConfig }> {
    return this.http.put<any>(`${environment.apiUrl}empresa/datos`, dto);
  }
}
