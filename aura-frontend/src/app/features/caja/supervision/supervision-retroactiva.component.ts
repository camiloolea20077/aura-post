import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import { SupervisionRetroactivaService } from '../../../core/services/supervision-retroactiva.service';
import {
  HALLAZGOS,
  MovimientoRetroactivoModel,
  SupervisionRetroactivaModel,
  TipoHallazgo,
} from '../../../core/models/supervision-retroactiva.model';

/**
 * Qué entró a las cajas sin ser del turno.
 *
 * <p>El resto del módulo evita que los documentos viejos descuadren un arqueo, o
 * deja el rastro cuando sí pasan. Esta pantalla es el otro lado: dónde el
 * administrador mira ese rastro sin abrir turno por turno.
 *
 * <p>Los contadores van arriba a propósito. Se abre para saber si hay algo que
 * revisar, no para leer una lista: con los cuatro en cero, se cierra y ya.
 */
@Component({
  selector: 'app-supervision-retroactiva',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './supervision-retroactiva.component.html',
  styleUrls: ['./supervision-retroactiva.component.scss'],
})
export class SupervisionRetroactivaComponent implements OnInit {
  filtros!: FormGroup;
  data: SupervisionRetroactivaModel | null = null;
  loading = false;

  /** Filtro por tipo de hallazgo; null muestra todos. */
  tipoFiltro: TipoHallazgo | null = null;

  readonly hallazgos = HALLAZGOS;

  readonly tipoOpts = [
    { label: 'Autorizados a mano', value: 'DOCUMENTO_AUTORIZADO' },
    { label: 'Correcciones de cierre', value: 'AJUSTE_CIERRE' },
    { label: 'Caja deducida', value: 'CAJA_INFERIDA' },
    { label: 'Salió otro día', value: 'SALIDA_CAJA_OTRO_DIA' },
    { label: 'Entró otro día', value: 'INGRESO_CAJA_OTRO_DIA' },
    { label: 'Documentos de otro día', value: 'PAGO_DE_OTRA_FECHA' },
  ];

  constructor(
    private readonly service: SupervisionRetroactivaService,
    private readonly alertService: AlertService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    const hoy = new Date();
    this.filtros = this.fb.group({
      desde: [new Date(hoy.getFullYear(), hoy.getMonth(), 1)],
      hasta: [hoy],
    });
    await this.buscar();
  }

  /** Se arma a mano: toISOString() pasa a UTC y en Colombia resta un día. */
  private aIso(f: Date | null): string | undefined {
    if (f == null) return undefined;
    const y = f.getFullYear();
    const m = `${f.getMonth() + 1}`.padStart(2, '0');
    const d = `${f.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async buscar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const f = this.filtros.getRawValue();
      const res = await lastValueFrom(
        this.service.listar(this.aIso(f.desde), this.aIso(f.hasta)),
      );
      this.data = res?.data ?? null;
    } catch {
      this.data = null;
      this.alertService.showError(
        'Error',
        'No se pudo cargar la supervisión de caja.',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  get movimientos(): MovimientoRetroactivoModel[] {
    const todos = this.data?.movimientos ?? [];
    return this.tipoFiltro
      ? todos.filter((m) => m.tipoHallazgo === this.tipoFiltro)
      : todos;
  }

  /** Nada que revisar: los cuatro contadores en cero. */
  get sinHallazgos(): boolean {
    return (this.data?.movimientos ?? []).length === 0;
  }

  /** Filtra la tabla al tocar una tarjeta, y la limpia si ya estaba activa. */
  filtrarPor(tipo: TipoHallazgo): void {
    this.tipoFiltro = this.tipoFiltro === tipo ? null : tipo;
    this.cdr.markForCheck();
  }

  formatCOP(v: number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  formatDia(f: string | null | undefined): string {
    if (!f) return '—';
    const [y, m, d] = f.slice(0, 10).split('-');
    const meses = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    return `${d} ${meses[+m - 1]} ${y}`;
  }

  /**
   * El template recibe las filas como `any` (pTemplate let-m), y TypeScript no
   * deja indexar el Record con eso. Estos dos metodos hacen la traduccion con
   * el tipo puesto, en vez de silenciarlo con un cast en la plantilla.
   */
  etiquetaHallazgo(tipo: TipoHallazgo): string {
    return HALLAZGOS[tipo]?.label ?? tipo;
  }

  severidadHallazgo(tipo: TipoHallazgo): 'warn' | 'info' | 'secondary' {
    return HALLAZGOS[tipo]?.severity ?? 'secondary';
  }

  /** "12 días" solo cuando hay desfase; en cero no aporta nada. */
  desfase(m: MovimientoRetroactivoModel): string | null {
    if (m.diasAtras == null || m.diasAtras <= 0) return null;
    return m.diasAtras === 1 ? '1 día' : `${m.diasAtras} días`;
  }
}
