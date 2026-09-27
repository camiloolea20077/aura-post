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

import { lastValueFrom } from 'rxjs';

import { TerceroTableModel } from '../../../core/models/tercero.model';
import { TerceroService } from '../../../core/services/tercero.service';
import {
  BuscadorTerceroDialogComponent,
  RolTercero,
} from '../buscador-tercero-dialog/buscador-tercero-dialog.component';

/** Lo que se muestra en el input una vez elegido. */
interface Elegido {
  id: number;
  label: string;
}

/**
 * Selector de tercero: se escribe y va sugiriendo (autocomplete contra el
 * servidor) y la lupa dentro del input abre el buscador avanzado paginado.
 *
 *   ┌──────────────────────────────────────────────┬────┐
 *   │ 900123456 — Proveedor S.A.S.              ×  │ 🔍 │
 *   └──────────────────────────────────────────────┴────┘
 *
 * Úsalo en TODO campo que elige un tercero (cliente, proveedor, empleado,
 * banco, beneficiario), nunca un `p-dropdown` con la lista precargada: esa
 * lista viene con tope (500 en /selector, 20–50 en los de rol) y el filtro del
 * dropdown solo busca en lo descargado.
 *
 * Funciona con `formControlName` / `ngModel` (el valor es el id del tercero) y
 * también suelto con `[terceroId]` + `(seleccionado)`.
 *
 *   <app-tercero-autocomplete formControlName="proveedorId" rol="PROVEEDOR"
 *       [label]="compra?.proveedorNombre" (seleccionado)="onProveedor($event)" />
 *
 * El texto del elegido NO se busca en una lista local: llega en `label`
 * (el nombre que ya trae el registro al editar) o, si no llega, se consulta el
 * tercero por id.
 */
@Component({
  selector: 'app-tercero-autocomplete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, AutoCompleteModule, TooltipModule, BuscadorTerceroDialogComponent],
  templateUrl: './tercero-autocomplete.component.html',
  styleUrls: ['./tercero-autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TerceroAutocompleteComponent),
      multi: true,
    },
  ],
})
export class TerceroAutocompleteComponent implements ControlValueAccessor, OnChanges {
  /** Restringe sugerencias y buscador a un rol. */
  @Input() rol: RolTercero | null = null;
  /** El buscador avanzado no deja cambiar el rol. Por defecto sí, si hay rol. */
  @Input() rolFijo: boolean | null = null;
  @Input() placeholder = 'Escriba nombre o documento…';
  /** Título del buscador avanzado. */
  @Input() header: string | null = null;
  /** Texto del tercero ya elegido (al editar un registro). */
  @Input() label: string | null = null;
  /** Uso suelto (sin formulario): id elegido. */
  @Input() terceroId: number | null = null;
  @Input() disabled = false;
  @Input() showClear = true;
  /** Solo si el contenedor recorta el panel (p. ej. dentro de un p-dialog). */
  @Input() appendTo: any = null;

  /** Emite el tercero completo al elegirlo, o null al limpiar. */
  @Output() seleccionado = new EventEmitter<TerceroTableModel | null>();

  /** Lo que tiene el input: el elegido, o el texto mientras se escribe. */
  valor: Elegido | string | null = null;
  sugerencias: TerceroTableModel[] = [];
  buscadorVisible = false;
  private id: number | null = null;

  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private readonly service: TerceroService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get tituloBuscador(): string {
    if (this.header) return this.header;
    switch (this.rol) {
      case 'CLIENTE':
        return 'Buscar cliente';
      case 'PROVEEDOR':
        return 'Buscar proveedor';
      case 'EMPLEADO':
        return 'Buscar empleado';
      case 'BANCO':
        return 'Buscar banco';
      default:
        return 'Buscar tercero';
    }
  }

  get rolBloqueado(): boolean {
    return this.rolFijo ?? !!this.rol;
  }

  get hayElegido(): boolean {
    return this.valor !== null && typeof this.valor !== 'string';
  }

  ngOnChanges(ch: SimpleChanges): void {
    // Uso suelto: el id llega por [terceroId]. Con formulario llega por writeValue.
    if (ch['terceroId'] || ch['label']) {
      // Suelto se admite texto sin id: hay registros viejos que guardaron solo
      // el nombre (p. ej. el banco del empleado).
      this.fijar(ch['terceroId'] ? this.terceroId ?? null : this.id, this.label, true);
    }
  }

  // ── ControlValueAccessor ───────────────────────────────────────────
  writeValue(id: number | null): void {
    this.fijar(id ?? null, this.label);
  }

  registerOnChange(fn: (v: number | null) => void): void {
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
  async buscar(ev: AutoCompleteCompleteEvent): Promise<void> {
    const q = (ev.query ?? '').trim();
    try {
      this.sugerencias = await this.consultar(q);
    } catch {
      this.sugerencias = [];
    }
    this.cdr.markForCheck();
  }

  /** Por rol, el endpoint que ya filtra en el servidor; sin rol, la paginación general. */
  private async consultar(q: string): Promise<TerceroTableModel[]> {
    switch (this.rol) {
      case 'CLIENTE':
        return (await lastValueFrom(this.service.clientes(q))).data ?? [];
      case 'PROVEEDOR':
        return (await lastValueFrom(this.service.proveedores(q))).data ?? [];
      case 'BANCO':
        return (await lastValueFrom(this.service.bancos(q))).data ?? [];
      default: {
        const res = await lastValueFrom(this.service.page({ page: 0, rows: 15, search: q || null }));
        const items: TerceroTableModel[] = res?.data?.content ?? [];
        return this.rol === 'EMPLEADO' ? items.filter((t) => t.esEmpleado) : items;
      }
    }
  }

  onSelect(ev: AutoCompleteSelectEvent): void {
    this.elegir(ev.value as TerceroTableModel);
  }

  onBlur(): void {
    this.onTouched();
    // Escribió sin elegir: se vuelve a mostrar el elegido (o se vacía).
    if (typeof this.valor === 'string') {
      this.valor = this.id !== null || this.label ? { id: this.id ?? 0, label: this.label ?? '' } : null;
      this.cdr.markForCheck();
    }
  }

  // ── Buscador avanzado ──────────────────────────────────────────────
  abrirBuscador(): void {
    if (this.disabled) return;
    this.buscadorVisible = true;
    this.cdr.markForCheck();
  }

  onElegidoEnBuscador(t: TerceroTableModel): void {
    this.elegir(t);
  }

  limpiar(): void {
    if (this.disabled) return;
    this.id = null;
    this.valor = null;
    this.label = null;
    this.onChange(null);
    this.onTouched();
    this.seleccionado.emit(null);
    this.cdr.markForCheck();
  }

  // ── Internos ───────────────────────────────────────────────────────
  etiqueta(t: TerceroTableModel): string {
    return `${t.numeroDocumento} — ${t.nombreCompleto}`;
  }

  roles(t: TerceroTableModel): string {
    const r: string[] = [];
    if (t.esCliente) r.push('Cliente');
    if (t.esProveedor) r.push('Proveedor');
    if (t.esEmpleado) r.push('Empleado');
    if (t.esBanco) r.push('Banco');
    return r.join(' · ');
  }

  private elegir(t: TerceroTableModel): void {
    this.id = t.id;
    this.label = this.etiqueta(t);
    this.valor = { id: t.id, label: this.label };
    this.onChange(t.id);
    this.onTouched();
    this.seleccionado.emit(t);
    this.cdr.markForCheck();
  }

  /** Muestra un id que viene de afuera; si no trae texto, lo consulta. */
  private fijar(id: number | null, label: string | null, soloTexto = false): void {
    this.id = id;
    if (id === null) {
      this.valor = soloTexto && label ? { id: 0, label } : null;
      this.cdr.markForCheck();
      return;
    }
    if (label) {
      this.valor = { id, label };
      this.cdr.markForCheck();
      return;
    }
    this.valor = { id, label: '…' };
    this.cdr.markForCheck();
    lastValueFrom(this.service.getById(id))
      .then((res) => {
        const t = res?.data;
        if (!t || this.id !== id) return;
        const nombre =
          t.razonSocial?.trim() || [t.nombres, t.apellidos].filter(Boolean).join(' ').trim();
        this.label = `${t.numeroDocumento} — ${nombre}`;
        this.valor = { id, label: this.label };
        this.cdr.markForCheck();
      })
      .catch(() => {
        if (this.id === id) {
          this.valor = { id, label: `Tercero #${id}` };
          this.cdr.markForCheck();
        }
      });
  }
}
