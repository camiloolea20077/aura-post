import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../shared/utils/responde.models';
import {
  ConfiguracionEmpresaModel,
  PuestaEnMarchaModel,
  ResumenFinancieroModel,
  TableroComercialModel,
} from '../models/tablero-inicio.model';

/** Inicio por línea de uso: qué tablero ve la empresa y sus cifras. */
@Injectable({ providedIn: 'root' })
export class TableroInicioService {
  private readonly base = `${environment.apiUrl}tablero`;

  constructor(private readonly http: HttpClient) {}

  configuracion(): Observable<ResponseModel<ConfiguracionEmpresaModel>> {
    return this.http.get<ResponseModel<ConfiguracionEmpresaModel>>(`${environment.apiUrl}empresa/configuracion`);
  }

  financiero(): Observable<ResponseModel<ResumenFinancieroModel>> {
    return this.http.get<ResponseModel<ResumenFinancieroModel>>(`${this.base}/financiero`);
  }

  comercial(): Observable<ResponseModel<TableroComercialModel>> {
    return this.http.get<ResponseModel<TableroComercialModel>>(`${this.base}/comercial`);
  }

  puestaEnMarcha(): Observable<ResponseModel<PuestaEnMarchaModel>> {
    return this.http.get<ResponseModel<PuestaEnMarchaModel>>(`${this.base}/puesta-en-marcha`);
  }
}
