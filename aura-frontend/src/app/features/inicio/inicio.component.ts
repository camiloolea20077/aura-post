import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

import { PermisosUsuario } from '../../core/models/permisos.model';
import { IndexDBService } from '../../core/services/index-db.service';
import { TableroInicioService } from '../../core/services/tablero-inicio.service';
import { StateStore } from '../../core/store/state';
import { CentroContabilidadComponent } from '../contabilidad/centro/centro-contabilidad.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { CentroRrhhComponent } from '../nomina/centro/centro-rrhh.component';
import { PuestaEnMarchaComponent } from './puesta-en-marcha/puesta-en-marcha.component';
import { ResumenFinancieroComponent } from './resumen-financiero/resumen-financiero.component';
import { TableroComercialComponent } from './tablero-comercial/tablero-comercial.component';

type Linea = 'POS' | 'COMERCIAL' | 'CONTABILIDAD' | 'NOMINA';

interface Pestana {
  linea: Linea;
  label: string;
  icon: string;
}

const PESTANAS: Record<Linea, Pestana> = {
  POS: { linea: 'POS', label: 'Punto de venta', icon: 'pi-shopping-cart' },
  COMERCIAL: { linea: 'COMERCIAL', label: 'Comercial', icon: 'pi-briefcase' },
  CONTABILIDAD: { linea: 'CONTABILIDAD', label: 'Contabilidad', icon: 'pi-calculator' },
  NOMINA: { linea: 'NOMINA', label: 'Nómina', icon: 'pi-users' },
};
const ORDEN: Linea[] = ['POS', 'COMERCIAL', 'CONTABILIDAD', 'NOMINA'];
const CLAVE_PESTANA = 'aura.inicio.pestana';

/**
 * Inicio (/dashboard): muestra el tablero de las líneas de uso de la empresa
 * (docs/PLAN_PERFIL_EMPRESA.md del back). Una empresa de solo contabilidad ve
 * el centro contable, no un POS en ceros. Con varias líneas, pestañas.
 *
 * Las líneas salen del back (GET empresa/configuracion); si falla, de lo que
 * trajo el login; si tampoco, POS (el comportamiento de siempre). Una pestaña
 * solo aparece si el perfil puede ver lo que muestra.
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  // Sin OnPush: <app-dashboard> (POS) es Default y llena campos sueltos tras
  // sus peticiones; bajo un padre OnPush nunca se repintaba y quedaba vacío.
  imports: [
    CommonModule,
    DashboardComponent,
    CentroContabilidadComponent,
    CentroRrhhComponent,
    TableroComercialComponent,
    ResumenFinancieroComponent,
    PuestaEnMarchaComponent,
  ],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
})
export class InicioComponent implements OnInit {
  private readonly tableroService = inject(TableroInicioService);
  private readonly indexDB = inject(IndexDBService);
  private readonly store = inject(StateStore);

  readonly listo = signal(false);
  readonly pestanas = signal<Pestana[]>([]);
  readonly activa = signal<Linea | null>(null);
  /** La empresa declaró líneas pero el perfil no puede ver ninguno de sus tableros. */
  readonly soloResumen = computed(() => this.listo() && this.pestanas().length === 0);

  async ngOnInit(): Promise<void> {
    const [lineas, inicio] = await this.resolverLineas();
    const permisos = await this.store.asegurarPermisos().catch(() => null);
    const visibles = ORDEN.filter((l) => lineas.includes(l) && this.puedeVer(l, permisos)).map(
      (l) => PESTANAS[l],
    );
    this.pestanas.set(visibles);

    const recordada = this.leerPestana();
    const elegida =
      [recordada, inicio].find((l) => !!l && visibles.some((p) => p.linea === l)) ?? visibles[0]?.linea ?? null;
    this.activa.set(elegida as Linea | null);
    this.listo.set(true);
  }

  elegir(linea: Linea): void {
    this.activa.set(linea);
    try {
      localStorage.setItem(CLAVE_PESTANA, linea);
    } catch {
      // Sin almacenamiento solo se pierde el recuerdo de la pestaña.
    }
  }

  private async resolverLineas(): Promise<[Linea[], Linea | null]> {
    try {
      const res = await lastValueFrom(this.tableroService.configuracion());
      const cfg = res?.data;
      if (cfg?.lineas?.length) return [cfg.lineas as Linea[], (cfg.inicioResuelto as Linea) ?? null];
    } catch {
      // Se cae a lo que trajo el login.
    }
    const auth = await this.indexDB.loadDataAuthDB();
    const lineas = (auth?.lineas ?? []).filter((l): l is Linea => ORDEN.includes(l as Linea));
    return lineas.length ? [lineas, (auth?.inicio as Linea) ?? null] : [['POS'], 'POS'];
  }

  /** Cada tablero pide datos de su módulo: sin permiso daría error, así que no se muestra. */
  private puedeVer(linea: Linea, p: PermisosUsuario | null): boolean {
    if (!p || p.accesoTotal) return true;
    const ver = (prefijo: string) =>
      Object.entries(p.permisos ?? {}).some(([clave, acciones]) => clave.startsWith(prefijo) && acciones.includes('VER'));
    switch (linea) {
      case 'CONTABILIDAD':
        return ver('contabilidad.');
      case 'NOMINA':
        return ver('recursos-humanos.');
      default:
        return true;
    }
  }

  private leerPestana(): Linea | null {
    try {
      return localStorage.getItem(CLAVE_PESTANA) as Linea | null;
    } catch {
      return null;
    }
  }
}
