import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import { CalendarioDiaModel, JornadaConfigModel } from '../models/laboral.model';

@Injectable({ providedIn: 'root' })
export class LaboralService {
  private readonly api = `${environment.apiUrl}laboral`;

  constructor(private readonly http: HttpClient) {}

  // ── Jornada / recargos ──────────────────────────────────────
  jornadaList(): Observable<ResponseModel<JornadaConfigModel[]>> {
    return this.http.get<ResponseModel<JornadaConfigModel[]>>(`${this.api}/jornada`);
  }

  jornadaVigente(fecha: string): Observable<ResponseModel<JornadaConfigModel>> {
    return this.http.get<ResponseModel<JornadaConfigModel>>(
      `${this.api}/jornada/vigente?fecha=${fecha}`,
    );
  }

  jornadaGuardar(dto: JornadaConfigModel): Observable<ResponseModel<JornadaConfigModel>> {
    return this.http.post<ResponseModel<JornadaConfigModel>>(`${this.api}/jornada`, dto);
  }

  jornadaEliminar(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.api}/jornada/${id}`);
  }

  // ── Calendario ──────────────────────────────────────────────
  calendarioList(desde: string, hasta: string): Observable<ResponseModel<CalendarioDiaModel[]>> {
    return this.http.get<ResponseModel<CalendarioDiaModel[]>>(
      `${this.api}/calendario?desde=${desde}&hasta=${hasta}`,
    );
  }

  calendarioGuardar(dto: CalendarioDiaModel): Observable<ResponseModel<CalendarioDiaModel>> {
    return this.http.post<ResponseModel<CalendarioDiaModel>>(`${this.api}/calendario`, dto);
  }

  calendarioAnular(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.api}/calendario/${id}`);
  }

  cargarFestivos(anio: number): Observable<ResponseModel<number>> {
    return this.http.post<ResponseModel<number>>(
      `${this.api}/calendario/cargar-festivos/${anio}`,
      {},
    );
  }
}
