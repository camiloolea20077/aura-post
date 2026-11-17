import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, debounceTime } from 'rxjs';

import { TecnicoDto } from '../../../core/models/comision.model';
import {
  EstadoOrdenServicio,
  FiltroOrdenesServicio,
  IndicadoresServicio,
  OrdenServicioFila,
} from '../../../core/models/servicio-tecnico.model';
import { ComisionService } from '../../../core/services/comision.service';
import { ServicioTecnicoService } from '../../../core/services/servicio-tecnico.service';
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  ESTADOS_SERVICIO,
  ORDEN_ESTADOS,
  RECORRIDO,
  TonoEstado,
  diasEnTaller,
  iconoEquipo,
  pasoDelRecorrido,
  textoDias,
  tonoEstado,
} from '../servicio-tecnico.util';

/** Tramo del tablero del taller: cada uno filtra la lista. */
interface Tramo {
  clave: string;
  label: string;
  valor: number;
  tono: TonoEstado;
}

@Component({
  selector: 'app-bandeja-servicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, InputTextModule, TableModule, TooltipModule, PuedeDirective],
  templateUrl: './bandeja-servicio.component.html',
  styleUrls: ['./bandeja-servicio.component.scss'],
})
export class BandejaServicioComponent implements OnInit {
  readonly estados = ESTADOS_SERVICIO;
  readonly recorrido = RECORRIDO;
  readonly iconoEquipo = iconoEquipo;
  readonly tono = tonoEstado;
  readonly paso = pasoDelRecorrido;
  readonly textoDias = textoDias;

  ordenes: OrdenServicioFila[] = [];
  total = 0;
  rows = 15;
  primera = 0;
  loading = false;
  indicadores: IndicadoresServicio | null = null;
  tramos: Tramo[] = [];

  search = '';
  /** Tramo del tablero activo (o null si el filtro se cambió a mano). */
  activo: string | null = 'ABIERTAS';
  filtro: FiltroOrdenesServicio = {
    estado: 'ABIERTAS',
    tecnicoId: null,
    soloMias: false,
    soloVencidas: false,
    desde: null,
    hasta: null,
  };

  readonly estadoOpts = [
    { label: 'En el taller', value: 'ABIERTAS' },
    { label: 'Todas', value: null },
    ...ORDEN_ESTADOS.map((e) => ({ label: ESTADOS_SERVICIO[e].label, value: e })),
  ];
  readonly verOpts = [
    { label: 'Todas las órdenes', value: false },
    { label: 'Mis órdenes', value: true },
  ];
  tecnicoOpts: { label: string; value: number | null }[] = [{ label: 'Todos los técnicos', value: null }];

  private readonly buscar$ = new Subject<void>();

  constructor(
    private readonly servicio: ServicioTecnicoService,
    private readonly comisiones: ComisionService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.buscar$.pipe(debounceTime(350)).subscribe(() => this.recargar());
    this.cargarIndicadores();
    this.comisiones.listTecnicos().subscribe({
      next: (r) => {
        this.tecnicoOpts = [
          { label: 'Todos los técnicos', value: null },
          ...(r.data ?? []).map((t: TecnicoDto) => ({ label: t.nombreCompleto, value: t.id })),
        ];
        this.cdr.markForCheck();
      },
    });
  }

  onLazy(e: TableLazyLoadEvent): void {
    this.primera = e.first ?? 0;
    this.rows = e.rows ?? this.rows;
    this.cargar();
  }

  onBuscar(): void {
    this.buscar$.next();
  }

  onFiltro(): void {
    this.activo = this.filtro.estado === 'ABIERTAS' && !this.filtro.soloVencidas ? 'ABIERTAS' : null;
    this.recargar();
  }

  /** Un tramo del tablero filtra la lista; tocarlo otra vez vuelve a "en el taller". */
  usarTramo(clave: string): void {
    const nuevo = this.activo === clave && clave !== 'ABIERTAS' ? 'ABIERTAS' : clave;
    this.activo = nuevo;
    const estado = nuevo === 'VENCIDAS' ? 'ABIERTAS' : nuevo === 'ENTREGADAS' ? 'ENTREGADO' : nuevo;
    this.filtro = { ...this.filtro, estado: estado as FiltroOrdenesServicio['estado'], soloVencidas: nuevo === 'VENCIDAS' };
    this.recargar();
  }

  /** Ancho de un tramo en la barra proporcional (mínimo visible si tiene algo). */
  ancho(t: Tramo): number {
    const total = this.tramos.reduce((s, x) => s + x.valor, 0);
    if (!total || !t.valor) return 0;
    return Math.max(4, (t.valor / total) * 100);
  }

  dias(o: OrdenServicioFila): number {
    return diasEnTaller(o.fechaRecibido);
  }

  etiqueta(e: EstadoOrdenServicio): string {
    return this.estados[e]?.label ?? e;
  }

  cerrada(e: EstadoOrdenServicio): boolean {
    return e === 'ENTREGADO' || e === 'CANCELADO';
  }

  recargar(): void {
    this.primera = 0;
    this.cargar();
    this.cargarIndicadores();
  }

  nueva(): void {
    this.router.navigate(['/servicio-tecnico/ordenes/nueva']);
  }

  abrir(o: OrdenServicioFila): void {
    this.router.navigate(['/servicio-tecnico/ordenes', o.id]);
  }

  private cargar(): void {
    this.loading = true;
    this.cdr.markForCheck();
    const page = Math.floor(this.primera / this.rows);
    this.servicio.listar(page, this.rows, this.search, this.filtro).subscribe({
      next: (r) => {
        this.ordenes = r.data?.content ?? [];
        this.total = r.data?.totalElements ?? 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.ordenes = [];
        this.total = 0;
        this.loading = false;
        // 206 = sin resultados en este backend: no es un error para mostrar.
        if (err?.status !== 206)
          this.alert.showError('Órdenes de servicio', err?.error?.message ?? 'No se pudieron cargar las órdenes.');
        this.cdr.markForCheck();
      },
    });
  }

  private cargarIndicadores(): void {
    this.servicio.indicadores().subscribe({
      next: (r) => {
        const k = r.data;
        this.indicadores = k;
        this.tramos = [
          { clave: 'RECIBIDO', label: 'Por revisar', valor: k.recibidas, tono: 'ingreso' },
          { clave: 'EN_BANCO', label: 'En el banco', valor: k.enProceso, tono: 'banco' },
          { clave: 'EN_ESPERA', label: 'Esperando', valor: k.esperandoCliente, tono: 'espera' },
          { clave: 'PARA_ENTREGAR', label: 'Para entregar', valor: k.listas, tono: 'listo' },
        ];
        this.cdr.markForCheck();
      },
    });
  }
}
