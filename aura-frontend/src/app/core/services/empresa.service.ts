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
  sucursalId?: number;
  sucursalNombre?: string;
  sucursalDireccion?: string;
  sucursalTelefono?: string;
  sucursalCiudad?: string;
  sucursalPrefijoFacturacion?: string;
}
@Injectable({ providedIn: 'root' })
export class EmpresaService {
  constructor(private http: HttpClient) {}

  getConfig(): Observable<{ data: EmpresaConfig }> {
    return this.http.get<any>(`${environment.apiUrl}empresa`);
  }
}
