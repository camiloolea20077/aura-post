import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  ActualizarArchivoNube,
  ActualizarCarpetaNube,
  CrearCarpetaNube,
  NubeArchivo,
  NubeCarpeta,
  NubeContenido,
  NubeEvento,
  NubePapelera,
  NubeUso,
  SolicitudEspacioPlataforma,
} from '../models/nube.model';

/**
 * Nube de documentos (/api/nube). La empresa sale del token en el back: ninguna
 * llamada manda una empresa.
 */
@Injectable({ providedIn: 'root' })
export class NubeService {
  private readonly api = `${environment.apiUrl}nube`;
  private readonly apiPlataforma = `${environment.apiUrl}platform/nube`;

  constructor(private readonly http: HttpClient) {}

  // ── Carpetas ──

  contenido(carpetaId: number | null): Observable<ResponseModel<NubeContenido>> {
    let params = new HttpParams();
    if (carpetaId != null) params = params.set('carpetaId', carpetaId);
    return this.http.get<ResponseModel<NubeContenido>>(`${this.api}/contenido`, { params });
  }

  crearCarpeta(dto: CrearCarpetaNube): Observable<ResponseModel<NubeCarpeta>> {
    return this.http.post<ResponseModel<NubeCarpeta>>(`${this.api}/carpetas`, dto);
  }

  actualizarCarpeta(id: number, dto: ActualizarCarpetaNube): Observable<ResponseModel<NubeCarpeta>> {
    return this.http.put<ResponseModel<NubeCarpeta>>(`${this.api}/carpetas/${id}`, dto);
  }

  eliminarCarpeta(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/carpetas/${id}`);
  }

  // ── Archivos ──

  subir(carpetaId: number | null, archivos: File[]): Observable<ResponseModel<NubeArchivo[]>> {
    const form = new FormData();
    archivos.forEach((a) => form.append('archivos', a, a.name));
    let params = new HttpParams();
    if (carpetaId != null) params = params.set('carpetaId', carpetaId);
    return this.http.post<ResponseModel<NubeArchivo[]>>(`${this.api}/archivos`, form, { params });
  }

  /** El archivo como blob (vista=true solo cambia lo que anota la bitácora). */
  descargar(id: number, vista = false): Observable<Blob> {
    return this.http.get(`${this.api}/archivos/${id}/descargar`, {
      params: new HttpParams().set('vista', vista),
      responseType: 'blob',
    });
  }

  actualizarArchivo(id: number, dto: ActualizarArchivoNube): Observable<ResponseModel<NubeArchivo>> {
    return this.http.put<ResponseModel<NubeArchivo>>(`${this.api}/archivos/${id}`, dto);
  }

  eliminarArchivo(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/archivos/${id}`);
  }

  // ── Papelera ──

  papelera(): Observable<ResponseModel<NubePapelera>> {
    return this.http.get<ResponseModel<NubePapelera>>(`${this.api}/papelera`);
  }

  restaurar(tipo: 'carpeta' | 'archivo', id: number): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(`${this.api}/papelera/${tipo}/${id}/restaurar`, {});
  }

  eliminarDefinitivo(tipo: 'carpeta' | 'archivo', id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.api}/papelera/${tipo}/${id}`);
  }

  // ── Espacio, términos y bitácora ──

  uso(): Observable<ResponseModel<NubeUso>> {
    return this.http.get<ResponseModel<NubeUso>>(`${this.api}/uso`);
  }

  aceptarTerminos(version: string): Observable<ResponseModel<NubeUso>> {
    return this.http.post<ResponseModel<NubeUso>>(`${this.api}/terminos`, { version });
  }

  solicitarEspacio(cuotaSolicitadaMb: number): Observable<ResponseModel<NubeUso>> {
    return this.http.post<ResponseModel<NubeUso>>(`${this.api}/solicitudes-espacio`, { cuotaSolicitadaMb });
  }

  eventos(archivoId: number | null): Observable<ResponseModel<NubeEvento[]>> {
    let params = new HttpParams();
    if (archivoId != null) params = params.set('archivoId', archivoId);
    return this.http.get<ResponseModel<NubeEvento[]>>(`${this.api}/eventos`, { params });
  }

  // ── Plataforma ──

  solicitudesPlataforma(): Observable<ResponseModel<SolicitudEspacioPlataforma[]>> {
    return this.http.get<ResponseModel<SolicitudEspacioPlataforma[]>>(`${this.apiPlataforma}/solicitudes-espacio`);
  }

  contarSolicitudesPlataforma(): Observable<ResponseModel<number>> {
    return this.http.get<ResponseModel<number>>(`${this.apiPlataforma}/solicitudes-espacio/pendientes`);
  }

  aprobarSolicitud(id: number, cuotaMb: number | null, observacion: string | null): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(`${this.apiPlataforma}/solicitudes-espacio/${id}/aprobar`, {
      cuotaMb,
      observacion,
    });
  }

  rechazarSolicitud(id: number, observacion: string): Observable<ResponseModel<void>> {
    return this.http.post<ResponseModel<void>>(`${this.apiPlataforma}/solicitudes-espacio/${id}/rechazar`, {
      observacion,
    });
  }
}
