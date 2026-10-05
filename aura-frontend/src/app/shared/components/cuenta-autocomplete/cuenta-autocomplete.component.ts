import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';

import { PlanCuentaModel } from '../../../core/models/contabilidad.model';
import { PlanCuentasCacheService } from '../../../core/services/plan-cuentas-cache.service';
import {
  BuscadorCuentaDialogComponent,
  normalizarCuenta,
} from '../buscador-cuenta-dialog/buscador-cuenta-dialog.component';

interface Elegido {
  key: number | string;
  label: string;
}

/**
 * Selector de cuenta contable: se escribe código o nombre y va sugiriendo, y
 * la lupa dentro del input abre el buscador avanzado del PUC.
 *
 *   ┌──────────────────────────────────────────────┬────┐
 *   │ 11050501 — Caja general                   ×  │ 🔍 │
 *   └──────────────────────────────────────────────┴────┘
 *
 * Úsalo en TODO campo que elige una cuenta del plan, nunca un `p-dropdown`
 * con el plan precargado (2.000+ cuentas no caben en una lista).
 *
 * Qué cuentas admite:
 *  - `[opciones]`: la lista que la pantalla ya arma (con `optionValue`, por
 *    defecto `value`); se busca solo entre esas. Sirve para no repetir el
 *    filtro de cada pantalla (cuentas de ingreso, medios de pago…).
 *  - sin opciones: todo el plan, recortado por `prefijos` y `soloMovimiento`.
 *
 * El valor del control es el id de la cuenta, o su código con `valor="codigo"`
 * (filtros de reportes como "cuenta desde / hasta").
 *
 *   <app-cuenta-autocomplete formControlName="cuentaIngresoId" [prefijos]="['4']" />
 *   <app-cuenta-autocomplete [(ngModel)]="l.cuentaId" [opciones]="cuentasAuxOpts" />
 *   <app-cuenta-autocomplete [(ngModel)]="desde" valor="codigo" [soloMovimiento]="false" [textoLibre]="true" />
 */
@Component({
  selector: 'app-cuenta-autocomplete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, AutoCompleteModule, TooltipModule, BuscadorCuentaDialogComponent],
  templateUrl: './cuenta-autocomplete.component.html',
  styleUrls: ['./cuenta-autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CuentaAutocompleteComponent),
      multi: true,
    },
  ],
})
export class CuentaAutocompleteComponent implements ControlValueAccessor, OnChanges {
  /** Lista que la pantalla permite. Sin ella se usa todo el plan. */
  @Input() opciones: any[] | null | undefined = null;
  /** Campo de cada opción con el id (o el código) de la cuenta. */
  @Input() optionValue = 'value';
  /** Qué guarda el control: el id de la cuenta o su código. */
  @Input() valor: 'id' | 'codigo' = 'id';
  /** Solo cuentas que reciben movimiento (sin opciones). */
  @Input() soloMovimiento = true;
  /** Solo cuentas cuyo código empiece por alguno de estos (sin opciones). */
  @Input() prefijos: string[] | string | null = null;
  /** Con valor="codigo": acepta un código escrito aunque no se elija de la lista. */
  @Input() textoLibre = false;
  @Input() placeholder = 'Código o nombre de la cuenta…';
  @Input() header = 'Buscar cuenta contable';
  @Input() disabled = false;
  @Input() showClear = true;
  /** Solo si el contenedor recorta el panel (p. ej. una tabla con scroll). */
  @Input() appendTo: any = null;

  /** Emite la cuenta elegida, o null al limpiar. */
  @Output() seleccionado = new EventEmitter<PlanCuentaModel | null>();

  valorInput: Elegido | string | null = null;
  sugerencias: PlanCuentaModel[] = [];
  buscadorVisible = false;
  textoBuscador = '';
  plan: PlanCuentaModel[] = [];
  admitidas: PlanCuentaModel[] = [];

  private key: number | string | null = null;
  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private readonly cache: PlanCuentasCacheService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.cargar();
  }

  get hayElegido(): boolean {
    return this.valorInput !== null && typeof this.valorInput !== 'string';
  }

  /** En el buscador las agrupadoras solo se pueden elegir si el campo lo permite. */
  get exigeMovimiento(): boolean {
    if (this.opciones) return this.admitidas.length > 0 && this.admitidas.every((c) => c.auxiliar);
    return this.soloMovimiento;
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['opciones'] || ch['prefijos'] || ch['soloMovimiento'] || ch['optionValue']) {
      // Muchas pantallas arman las opciones con un getter: llega un arreglo
      // nuevo en cada ciclo aunque sea el mismo contenido. Solo se rearma si
      // de verdad cambió.
      const firma = this.firma();
      if (firma === this.ultimaFirma) return;
      this.ultimaFirma = firma;
      this.armarAdmitidas();
      this.mostrar();
    }
  }

  private ultimaFirma = '';

  private firma(): string {
    const pref = Array.isArray(this.prefijos) ? this.prefijos.join(',') : this.prefijos ?? '';
    const ops = this.opciones
      ? this.opciones.length + ':' + this.opciones.map((o) => o?.[this.optionValue] ?? o?.id).join(',')
      : 'plan';
    return `${ops}|${pref}|${this.soloMovimiento}|${this.optionValue}|${this.plan.length}`;
  }

  // ── ControlValueAccessor ───────────────────────────────────────────
  writeValue(v: number | string | null): void {
    this.key = v === undefined || v === '' ? null : v;
    this.mostrar();
  }

  registerOnChange(fn: (v: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(d: boolean): void {
    this.disabled = d;
    this.cdr.markForCheck();
  }

  // ── Autocomplete ───────────────────────────────────────────────────
  buscar(ev: AutoCompleteCompleteEvent): void {
    const q = normalizarCuenta((ev.query ?? '').trim());
    const activas = this.admitidas.filter((c) => c.activa !== false);
    const porCodigo = activas.filter((c) => c.codigo.startsWith(q));
    const porNombre = q
      ? activas.filter((c) => !c.codigo.startsWith(q) && normalizarCuenta(c.nombre).includes(q))
      : [];
    this.sugerencias = [...porCodigo, ...porNombre].slice(0, 40);
    this.cdr.markForCheck();
  }

  onSelect(ev: AutoCompleteSelectEvent): void {
    this.elegir(ev.value as PlanCuentaModel);
  }

  onBlur(): void {
    this.onTouched();
    if (typeof this.valorInput !== 'string') return;
    const texto = this.valorInput.trim();
    if (this.textoLibre && this.valor === 'codigo' && /^\d+$/.test(texto)) {
      // Un prefijo escrito a mano ("13") sirve como filtro aunque no se elija.
      this.key = texto;
      this.onChange(texto);
      this.mostrar();
      return;
    }
    // Escribió sin elegir: vuelve a mostrarse lo elegido.
    this.mostrar();
  }

  abrirBuscador(): void {
    if (this.disabled) return;
    this.textoBuscador = typeof this.valorInput === 'string' ? this.valorInput : '';
    this.buscadorVisible = true;
    this.cdr.markForCheck();
  }

  limpiar(): void {
    if (this.disabled) return;
    this.key = null;
    this.valorInput = null;
    this.onChange(null);
    this.onTouched();
    this.seleccionado.emit(null);
    this.cdr.markForCheck();
  }

  etiqueta(c: PlanCuentaModel): string {
    return c.codigo ? `${c.codigo} — ${c.nombre}` : c.nombre;
  }

  elegir(c: PlanCuentaModel): void {
    this.key = this.valor === 'codigo' ? c.codigo : this.claveOpcion(c);
    this.valorInput = { key: this.key!, label: this.etiqueta(c) };
    this.onChange(this.key);
    this.onTouched();
    this.seleccionado.emit(c);
    this.cdr.markForCheck();
  }

  // ── Internos ───────────────────────────────────────────────────────
  private async cargar(): Promise<void> {
    try {
      this.plan = await this.cache.cuentas();
    } catch {
      this.plan = [];
    }
    this.ultimaFirma = this.firma();
    this.armarAdmitidas();
    this.mostrar();
  }

  /** Mapa opción→cuenta: la id de la opción puede no ser la de la cuenta si la opción no es del plan. */
  private claveDeOpcion = new Map<number, number | string>();

  private claveOpcion(c: PlanCuentaModel): number | string {
    return this.claveDeOpcion.get(c.id) ?? c.id;
  }

  private armarAdmitidas(): void {
    this.claveDeOpcion.clear();
    if (this.opciones) {
      const porId = new Map(this.plan.map((c) => [c.id, c]));
      const porCodigo = new Map(this.plan.map((c) => [c.codigo, c]));
      const lista: PlanCuentaModel[] = [];
      let sintetica = -1;
      for (const o of this.opciones) {
        const v = o?.[this.optionValue] ?? o?.id;
        if (v === null || v === undefined) continue;
        const c = this.valor === 'codigo' ? porCodigo.get(String(v)) : porId.get(Number(v));
        if (c) {
          lista.push(c);
          continue;
        }
        // Opción que no está en el plan cargado (lista de otro endpoint): se
        // muestra con su texto.
        const texto: string = o?.label ?? o?.nombre ?? String(v);
        const m = /^(\d+)\s*[-—·]\s*(.*)$/.exec(texto);
        const falsa = {
          id: sintetica--,
          codigo: o?.codigo ?? (m ? m[1] : ''),
          nombre: o?.nombre ?? (m ? m[2] : texto),
          tipo: o?.tipo ?? 'ACTIVO',
          naturaleza: o?.naturaleza ?? 'DEBITO',
          nivel: o?.nivel ?? 4,
          padreId: null,
          activa: true,
          auxiliar: true,
        } as PlanCuentaModel;
        this.claveDeOpcion.set(falsa.id, v);
        lista.push(falsa);
      }
      this.admitidas = lista;
    } else {
      const pref = this.prefijos == null ? [] : Array.isArray(this.prefijos) ? this.prefijos : [this.prefijos];
      this.admitidas = this.plan.filter(
        (c) =>
          (!this.soloMovimiento || c.auxiliar) &&
          (pref.length === 0 || pref.some((p) => c.codigo.startsWith(p))),
      );
    }
    this.cdr.markForCheck();
  }

  /** Pinta en el input la cuenta del valor actual. */
  private mostrar(): void {
    if (this.key === null || this.key === undefined) {
      this.valorInput = null;
      this.cdr.markForCheck();
      return;
    }
    const k = this.key;
    let c: PlanCuentaModel | undefined;
    if (this.valor === 'codigo') {
      c = this.plan.find((x) => x.codigo === String(k));
    } else {
      c =
        this.admitidas.find((x) => this.claveOpcion(x) === k || x.id === Number(k)) ??
        this.plan.find((x) => x.id === Number(k));
    }
    this.valorInput = {
      key: k,
      label: c ? this.etiqueta(c) : this.plan.length ? `${k}` : '…',
    };
    this.cdr.markForCheck();
  }
}
