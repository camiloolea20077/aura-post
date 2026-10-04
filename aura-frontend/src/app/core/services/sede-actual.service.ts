import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { SucursalDto } from '../models/sucursal.model';
import { StateStore } from '../store/state';
import { IndexDBService } from './index-db.service';
import { SucursalService } from './sucursal.service';

/**
 * La sede en la que se trabaja y las sedes que el usuario puede mirar.
 *
 * Una empresa (un NIT) tiene un solo catálogo y una sola contabilidad; las
 * pantallas de existencias (Inventario, Productos) muestran por defecto la sede
 * de la sesión (la del selector de la barra superior). "Todas las sedes" solo
 * se ofrece a quien tiene todas las sedes en su perfil (PLAN_PERMISOS P9).
 */
@Injectable({ providedIn: 'root' })
export class SedeActualService {
  private readonly indexDB = inject(IndexDBService);
  private readonly sucursalService = inject(SucursalService);
  private readonly store = inject(StateStore);

  /** Sede de la sesión: la elegida arriba, si no la principal, si no la primera. */
  async id(): Promise<number | null> {
    const auth = await this.indexDB.loadDataAuthDB();
    if (!auth) return null;
    return (
      auth.sucursalActualId ??
      auth.sucursales?.find((s) => s.esDefault)?.id ??
      auth.sucursales?.[0]?.id ??
      null
    );
  }

  /** Sedes que puede mirar y si puede ver todas juntas. */
  async opciones(): Promise<{ sedes: SucursalDto[]; todas: boolean }> {
    const [permisos, res] = await Promise.all([
      this.store.asegurarPermisos(),
      lastValueFrom(this.sucursalService.getActivas()).catch(() => null),
    ]);
    const todas = permisos?.todasLasSedes ?? true;
    let sedes = res?.data ?? [];
    if (!todas && permisos) sedes = sedes.filter((s) => permisos.sucursales.includes(s.id));
    return { sedes, todas };
  }
}
