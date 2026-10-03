import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  AutoComplete,
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';

import { lastValueFrom } from 'rxjs';

import { ProductoTableModel } from '../../../core/models/producto.model';
import { ProductoService } from '../../../core/services/producto.service';
import { BuscadorProductoDialogComponent } from '../buscador-producto-dialog/buscador-producto-dialog.component';

interface Elegido {
  id: number;
  label: string;
}

/**
 * Selector de producto, igual al de terceros: se escribe y va sugiriendo
 * (nombre, SKU o código de barras contra el servidor) y la lupa dentro del
 * input abre el buscador avanzado con criterios (categoría, marca, clase).
 *
 *   <app-producto-autocomplete [productoId]="l.productoId" [label]="l.productoNombre"
 *       appendTo="body" (seleccionado)="onProducto(i, $event)" />
 *
 * Un código de barras escrito completo + Enter elige el producto sin abrir la lista.
 */
@Component({
  selector: 'app-producto-autocomplete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, AutoCompleteModule, TooltipModule, BuscadorProductoDialogComponent],
  templateUrl: './producto-autocomplete.component.html',
  styleUrls: ['./producto-autocomplete.component.scss'],
})
export class ProductoAutocompleteComponent implements OnChanges {
  @Input() placeholder = 'Nombre, SKU o código…';
  @Input() header = 'Buscar producto';
  /** Texto del producto ya elegido. */
  @Input() label: string | null = null;
  @Input() productoId: number | null = null;
  @Input() disabled = false;
  /** Solo si el contenedor recorta el panel (tablas con scroll, diálogos). */
  @Input() appendTo: any = null;

  /** Emite el producto al elegirlo, o null al limpiar. */
  @Output() seleccionado = new EventEmitter<ProductoTableModel | null>();

  @ViewChild(AutoComplete) private ac?: AutoComplete;

  valor: Elegido | string | null = null;
  /**
   * Con un producto elegido se muestra su nombre como texto que baja en varias
   * líneas (un input no deja partir el texto); al tocarlo se vuelve a buscar.
   */
  editando = false;
  sugerencias: ProductoTableModel[] = [];
  buscadorVisible = false;
  textoBuscador = '';

  constructor(
    private readonly service: ProductoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get hayElegido(): boolean {
    return this.valor !== null && typeof this.valor !== 'string';
  }

  get textoElegido(): string {
    return this.valor && typeof this.valor !== 'string' ? this.valor.label : '';
  }

  get mostrarTexto(): boolean {
    return this.hayElegido && !this.editando;
  }

  /** Pasa del nombre al buscador, con el cursor puesto. */
  editar(): void {
    if (this.disabled) return;
    this.editando = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      const input = this.ac?.inputEL?.nativeElement as HTMLInputElement | undefined;
      input?.focus();
      input?.select();
    });
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['productoId'] || ch['label']) {
      this.valor = this.productoId ? { id: this.productoId, label: this.label ?? `Producto #${this.productoId}` } : null;
    }
  }

  async buscar(ev: AutoCompleteCompleteEvent): Promise<void> {
    const q = (ev.query ?? '').trim();
    try {
      const res = await lastValueFrom(
        this.service.page({ page: 0, rows: 12, search: q || null, order_by: 'p.nombre', order: 'ASC', params: { activo: true } }),
      );
      this.sugerencias = res?.data?.content ?? [];
    } catch {
      this.sugerencias = [];
    }
    this.cdr.markForCheck();
  }

  onSelect(ev: AutoCompleteSelectEvent): void {
    this.elegir(ev.value as ProductoTableModel);
  }

  /** Enter con un código exacto (lector de barras): elige directo. */
  async onEnter(): Promise<void> {
    if (typeof this.valor !== 'string') return;
    const q = this.valor.trim();
    if (!q) return;
    const exacto = this.sugerencias.find(
      (p) => p.codigoBarras?.toLowerCase() === q.toLowerCase() || p.sku?.toLowerCase() === q.toLowerCase(),
    );
    if (exacto) {
      this.elegir(exacto);
      return;
    }
    try {
      const res = await lastValueFrom(this.service.search(q));
      const lista: ProductoTableModel[] = res?.data ?? [];
      const hit = lista.find((p) => p.codigoBarras === q || p.sku === q) ?? (lista.length === 1 ? lista[0] : null);
      if (hit) this.elegir(hit);
    } catch {
      /* se queda la lista de sugerencias */
    }
  }

  onBlur(): void {
    this.editando = false;
    if (typeof this.valor === 'string') {
      this.valor = this.productoId ? { id: this.productoId, label: this.label ?? '' } : null;
      this.cdr.markForCheck();
    }
  }

  abrirBuscador(): void {
    if (this.disabled) return;
    this.textoBuscador = typeof this.valor === 'string' ? this.valor : '';
    this.buscadorVisible = true;
    this.cdr.markForCheck();
  }

  limpiar(): void {
    if (this.disabled) return;
    this.valor = null;
    this.seleccionado.emit(null);
    this.cdr.markForCheck();
  }

  meta(p: ProductoTableModel): string {
    return [p.sku, p.codigoBarras, p.categoriaNombre, p.unidadAbreviatura].filter(Boolean).join(' · ');
  }

  elegir(p: ProductoTableModel): void {
    this.editando = false;
    this.valor = { id: p.id, label: p.nombre + (p.sku ? ` [${p.sku}]` : '') };
    this.seleccionado.emit(p);
    this.cdr.markForCheck();
  }
}
