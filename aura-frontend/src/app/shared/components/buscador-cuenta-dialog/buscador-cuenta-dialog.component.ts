import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { PlanCuentaModel } from '../../../core/models/contabilidad.model';

export type MovimientoFiltro = 'TODAS' | 'MOVIMIENTO' | 'AGRUPA';

interface CriteriosCuenta {
  texto: string;
  codigo: string;
  nombre: string;
  clase: string | null;
  tipo: PlanCuentaModel['tipo'] | null;
  naturaleza: PlanCuentaModel['naturaleza'] | null;
  movimiento: MovimientoFiltro;
  inactivas: boolean;
}

const VACIOS: CriteriosCuenta = {
  texto: '',
  codigo: '',
  nombre: '',
  clase: null,
  tipo: null,
  naturaleza: null,
  movimiento: 'TODAS',
  inactivas: false,
};

/** Sin tildes y en minúsculas: "deposito" encuentra "Depósito". */
export function normalizarCuenta(v: string | null | undefined): string {
  return (v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Buscador avanzado de cuentas del PUC, el par del de terceros y productos.
 *
 * Recibe ya la lista de cuentas que el campo admite (el autocomplete la arma:
 * todo el plan, las de un prefijo o las que la pantalla permite) y filtra en
 * memoria por código, nombre, clase, tipo, naturaleza y si recibe movimiento.
 *
 * Cuando el campo exige una cuenta de movimiento, las agrupadoras se listan
 * igual —para ubicarse— pero al hacer clic en una se muestran sus hijas en
 * vez de elegirla.
 */
@Component({
  selector: 'app-buscador-cuenta-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, InputTextModule, TableModule, TooltipModule],
  templateUrl: './buscador-cuenta-dialog.component.html',
  styleUrls: ['./buscador-cuenta-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorCuentaDialogComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() header = 'Buscar cuenta contable';
  /** Las cuentas entre las que se busca. */
  @Input() cuentas: PlanCuentaModel[] = [];
  /** Todo el plan, para mostrar el camino (clase › grupo › cuenta). */
  @Input() plan: PlanCuentaModel[] = [];
  /** Solo se pueden elegir cuentas que reciben movimiento. */
  @Input() soloMovimiento = true;
  /** Texto con que abre (lo que el usuario venía escribiendo). */
  @Input() textoInicial = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() cuentaSelected = new EventEmitter<PlanCuentaModel>();

  criterios: CriteriosCuenta = { ...VACIOS };
  panelAbierto = true;
  resultados: PlanCuentaModel[] = [];
  primeraFila = 0;
  private debounce: any = null;
  private porId = new Map<number, PlanCuentaModel>();

  readonly claseOpts = [
    { label: '1 · Activo', value: '1' },
    { label: '2 · Pasivo', value: '2' },
    { label: '3 · Patrimonio', value: '3' },
    { label: '4 · Ingresos', value: '4' },
    { label: '5 · Gastos', value: '5' },
    { label: '6 · Costo de ventas', value: '6' },
    { label: '7 · Costos de producción', value: '7' },
    { label: '8 · Orden deudoras', value: '8' },
    { label: '9 · Orden acreedoras', value: '9' },
  ];
  readonly tipoOpts = ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO', 'COSTO', 'ORDEN'].map((t) => ({
    label: t.charAt(0) + t.slice(1).toLowerCase(),
    value: t,
  }));
  readonly naturalezaOpts = [
    { label: 'Débito', value: 'DEBITO' },
    { label: 'Crédito', value: 'CREDITO' },
  ];

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['plan']) this.porId = new Map(this.plan.map((c) => [c.id, c]));
    if (ch['visible'] && this.visible) {
      this.criterios = { ...VACIOS, texto: this.textoInicial ?? '' };
      this.filtrar();
    } else if (ch['cuentas'] && this.visible) {
      this.filtrar();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.debounce);
  }

  get criteriosActivos(): number {
    const c = this.criterios;
    return [c.texto, c.codigo, c.nombre].filter((t) => t.trim()).length +
      [c.clase, c.tipo, c.naturaleza].filter(Boolean).length +
      (c.movimiento !== 'TODAS' ? 1 : 0) +
      (c.inactivas ? 1 : 0);
  }

  togglePanel(): void {
    this.panelAbierto = !this.panelAbierto;
  }

  buscarConPausa(): void {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.filtrar(), 200);
  }

  setMovimiento(m: MovimientoFiltro): void {
    this.criterios.movimiento = m;
    this.filtrar();
  }

  limpiar(): void {
    this.criterios = { ...VACIOS };
    this.filtrar();
  }

  filtrar(): void {
    const c = this.criterios;
    const texto = normalizarCuenta(c.texto.trim());
    const nombre = normalizarCuenta(c.nombre.trim());
    const codigo = c.codigo.trim();
    this.resultados = this.cuentas.filter((x) => {
      if (!c.inactivas && x.activa === false) return false;
      if (c.clase && !x.codigo.startsWith(c.clase)) return false;
      if (c.tipo && x.tipo !== c.tipo) return false;
      if (c.naturaleza && x.naturaleza !== c.naturaleza) return false;
      if (c.movimiento === 'MOVIMIENTO' && !x.auxiliar) return false;
      if (c.movimiento === 'AGRUPA' && x.auxiliar) return false;
      if (codigo && !x.codigo.startsWith(codigo)) return false;
      if (nombre && !normalizarCuenta(x.nombre).includes(nombre)) return false;
      if (texto && !x.codigo.startsWith(texto) && !normalizarCuenta(x.nombre).includes(texto)) return false;
      return true;
    });
    this.primeraFila = 0;
    this.cdr.markForCheck();
  }

  /** "1 Activo › 11 Disponible › 1105 Caja" para ubicar la cuenta. */
  camino(c: PlanCuentaModel): string {
    const partes: string[] = [];
    let p = c.padreId != null ? this.porId.get(c.padreId) : undefined;
    let guard = 0;
    while (p && guard++ < 8) {
      partes.unshift(`${p.codigo} ${p.nombre}`);
      p = p.padreId != null ? this.porId.get(p.padreId) : undefined;
    }
    return partes.join(' › ');
  }

  elegible(c: PlanCuentaModel): boolean {
    return !this.soloMovimiento || !!c.auxiliar;
  }

  clic(c: PlanCuentaModel): void {
    if (this.elegible(c)) {
      this.cuentaSelected.emit(c);
      this.close();
      return;
    }
    // Agrupadora: se baja a sus cuentas.
    this.criterios = { ...VACIOS, codigo: c.codigo };
    this.filtrar();
  }

  sangria(c: PlanCuentaModel): string {
    return `${Math.max(0, (c.nivel ?? 1) - 1) * 0.6}rem`;
  }

  close(): void {
    clearTimeout(this.debounce);
    this.visible = false;
    this.visibleChange.emit(false);
    this.cdr.markForCheck();
  }
}
