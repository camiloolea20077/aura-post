import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ResponseModel } from '../../../../shared/utils/responde.models';
import { IFilterTable } from '../../../../shared/utils/filter-table';
import {
  ImportarLineasResultado,
  NotaContableFiltro,
  NotaContableModel,
  NotaContableSoporteModel,
  NotaPlantillaModel,
  SaveNotaContableDto,
  SaveNotaPlantillaDto,
} from '../models/nota-contable.model';

@Injectable({ providedIn: 'root' })
export class NotaContableService {
  private readonly base = `${environment.apiUrl}contabilidad/notas`;

  constructor(private readonly http: HttpClient) {}

  page(filtro: IFilterTable<NotaContableFiltro>): Observable<ResponseModel<any>> {
    return this.http.post<ResponseModel<any>>(`${this.base}/page`, filtro);
  }

  getById(id: number): Observable<ResponseModel<NotaContableModel>> {
    return this.http.get<ResponseModel<NotaContableModel>>(`${this.base}/${id}`);
  }

  create(dto: SaveNotaContableDto): Observable<ResponseModel<NotaContableModel>> {
    return this.http.post<ResponseModel<NotaContableModel>>(this.base, dto);
  }

  update(id: number, dto: SaveNotaContableDto): Observable<ResponseModel<NotaContableModel>> {
    return this.http.put<ResponseModel<NotaContableModel>>(`${this.base}/${id}`, dto);
  }

  contabilizar(id: number): Observable<ResponseModel<NotaContableModel>> {
    return this.http.post<ResponseModel<NotaContableModel>>(`${this.base}/${id}/contabilizar`, {});
  }

  eliminar(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.base}/${id}`);
  }

  anular(id: number, motivo: string): Observable<ResponseModel<NotaContableModel>> {
    return this.http.patch<ResponseModel<NotaContableModel>>(`${this.base}/${id}/anular`, { motivo });
  }

  /** Devuelve la reversión (la nota nueva). */
  reversar(id: number, fecha: string, concepto: string | null): Observable<ResponseModel<NotaContableModel>> {
    return this.http.post<ResponseModel<NotaContableModel>>(`${this.base}/${id}/reversar`, { fecha, concepto });
  }

  pdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' });
  }

  subirSoporte(id: number, file: File): Observable<ResponseModel<NotaContableSoporteModel>> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ResponseModel<NotaContableSoporteModel>>(`${this.base}/${id}/soportes`, fd);
  }

  eliminarSoporte(id: number, soporteId: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.base}/${id}/soportes/${soporteId}`);
  }

  /** Interpreta líneas pegadas desde Excel; no guarda nada. */
  importarLineas(texto: string): Observable<ResponseModel<ImportarLineasResultado>> {
    return this.http.post<ResponseModel<ImportarLineasResultado>>(`${this.base}/importar-lineas`, { texto });
  }

  // ── Plantillas ─────────────────────────────────────────────────────
  plantillas(): Observable<ResponseModel<NotaPlantillaModel[]>> {
    return this.http.get<ResponseModel<NotaPlantillaModel[]>>(`${this.base}/plantillas`);
  }

  plantilla(id: number): Observable<ResponseModel<NotaPlantillaModel>> {
    return this.http.get<ResponseModel<NotaPlantillaModel>>(`${this.base}/plantillas/${id}`);
  }

  crearPlantilla(dto: SaveNotaPlantillaDto): Observable<ResponseModel<NotaPlantillaModel>> {
    return this.http.post<ResponseModel<NotaPlantillaModel>>(`${this.base}/plantillas`, dto);
  }

  actualizarPlantilla(id: number, dto: SaveNotaPlantillaDto): Observable<ResponseModel<NotaPlantillaModel>> {
    return this.http.put<ResponseModel<NotaPlantillaModel>>(`${this.base}/plantillas/${id}`, dto);
  }

  eliminarPlantilla(id: number): Observable<ResponseModel<void>> {
    return this.http.delete<ResponseModel<void>>(`${this.base}/plantillas/${id}`);
  }
}
