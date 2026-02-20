import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MotivoMermaModel,
  MotivoMermaTableModel,
  CreateMotivoMermaDto,
  MermaModel,
  MermaTableModel,
  CreateMermaDto,
  MermaPageableDto,
} from '../models/merma.model';

@Injectable({ providedIn: 'root' })
export class MermaService {
  private readonly base = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  // ─── Motivos ───────────────────────────────────────────────
  pageMotivos(pageable: MermaPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}motivos-merma/page`, pageable);
  }

  getAllMotivos(): Observable<any> {
    return this.http.get<any>(`${this.base}motivos-merma`);
  }

  createMotivo(dto: CreateMotivoMermaDto): Observable<any> {
    return this.http.post<any>(`${this.base}motivos-merma`, dto);
  }

  updateMotivo(id: number, dto: CreateMotivoMermaDto): Observable<any> {
    return this.http.put<any>(`${this.base}motivos-merma/${id}`, dto);
  }

  deleteMotivo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}motivos-merma/${id}`);
  }

  // ─── Mermas ────────────────────────────────────────────────
  page(pageable: MermaPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}mermas/page`, pageable);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}mermas/${id}`);
  }

  create(dto: CreateMermaDto): Observable<any> {
    return this.http.post<any>(`${this.base}mermas`, dto);
  }

  anular(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}mermas/${id}/anular`, {});
  }
}
