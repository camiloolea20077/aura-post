import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { PlanCuentaModel } from '../models/contabilidad.model';
import { ContabilidadService } from './contabilidad.service';

/**
 * El plan de cuentas en memoria para los buscadores de cuenta.
 *
 * Una pantalla puede tener cinco o seis campos de cuenta; sin esto cada uno
 * bajaba el plan completo (1.000–2.500 cuentas). Se baja una vez y se reusa
 * por unos minutos; la pantalla del plan de cuentas lo invalida al crear,
 * editar, borrar o cargar el PUC.
 */
@Injectable({ providedIn: 'root' })
export class PlanCuentasCacheService {
  private datos: Promise<PlanCuentaModel[]> | null = null;
  private cargadoEn = 0;
  private readonly VIGENCIA_MS = 5 * 60 * 1000;

  constructor(private readonly service: ContabilidadService) {}

  cuentas(): Promise<PlanCuentaModel[]> {
    if (!this.datos || Date.now() - this.cargadoEn > this.VIGENCIA_MS) {
      this.cargadoEn = Date.now();
      this.datos = lastValueFrom(this.service.listarPlan())
        .then((r) => [...(r?.data ?? [])].sort((a, b) => a.codigo.localeCompare(b.codigo)))
        .catch((e) => {
          this.datos = null;
          throw e;
        });
    }
    return this.datos;
  }

  invalidar(): void {
    this.datos = null;
  }
}
