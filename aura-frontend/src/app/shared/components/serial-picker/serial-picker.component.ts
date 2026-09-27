import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { lastValueFrom } from 'rxjs';

import { SerialProductoService } from '../../../core/services/serial-producto.service';
import { SerialProductoTableModel } from '../../../core/models/serial-producto.model';

export interface SerialesElegidos {
  ids: number[];
  seriales: string[];
}

/**
 * Elige qué seriales salen (POS, merma, obsequio, traslado, nota crédito) o
 * cuáles devuelve el cliente (con ventaDetalleId). Se escanea o se marca en la
 * lista; tiene que haber uno por unidad.
 */
@Component({
  selector: 'app-serial-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule],
  templateUrl: './serial-picker.component.html',
  styleUrls: ['./serial-picker.component.scss'],
})
export class SerialPickerComponent implements OnChanges {
  @Input() visible = false;
  @Input() productoId: number | null = null;
  @Input() productoNombre = '';
  @Input() sucursalId: number | null = null;
  /** Unidades de la línea: seriales que hay que elegir. */
  @Input() cantidad = 0;
  @Input() seleccionados: number[] = [];
  /** Devolución: los seriales vendidos en esta línea en vez de los disponibles. */
  @Input() ventaDetalleId: number | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmar = new EventEmitter<SerialesElegidos>();

  cargando = false;
  lista: SerialProductoTableModel[] = [];
  marcados = new Set<number>();
  filtro = '';
  aviso: string | null = null;

  constructor(
    private readonly service: SerialProductoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    if (this.visible) this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando = true;
    this.filtro = '';
    this.aviso = null;
    this.marcados = new Set(this.seleccionados ?? []);
    this.cdr.markForCheck();
    try {
      const res = this.ventaDetalleId
        ? await lastValueFrom(this.service.vendidosEnLinea(this.ventaDetalleId))
        : this.productoId && this.sucursalId
          ? await lastValueFrom(this.service.disponibles(this.productoId, this.sucursalId))
          : null;
      this.lista = res?.data ?? [];
    } catch {
      this.lista = [];
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  get unidades(): number {
    return Math.max(0, Math.round(this.cantidad || 0));
  }

  get filtrados(): SerialProductoTableModel[] {
    const q = this.filtro.trim().toUpperCase();
    return q ? this.lista.filter((s) => s.serial.toUpperCase().includes(q)) : this.lista;
  }

  alternar(s: SerialProductoTableModel): void {
    if (this.marcados.has(s.id)) {
      this.marcados.delete(s.id);
    } else {
      if (this.marcados.size >= this.unidades) {
        this.aviso = `Ya elegiste ${this.unidades}: quita uno antes de agregar otro.`;
        this.cdr.markForCheck();
        return;
      }
      this.marcados.add(s.id);
    }
    this.aviso = null;
    this.marcados = new Set(this.marcados);
    this.cdr.markForCheck();
  }

  /** Escáner o texto + Enter: marca el serial exacto. */
  onEnter(): void {
    const q = this.filtro.trim().toUpperCase();
    if (!q) return;
    const s = this.lista.find((x) => x.serial.trim().toUpperCase() === q);
    if (!s) {
      this.aviso = `El serial ${this.filtro.trim()} no está ${this.ventaDetalleId ? 'en esta venta' : 'disponible'}.`;
    } else if (!this.marcados.has(s.id)) {
      this.alternar(s);
    }
    this.filtro = '';
    this.cdr.markForCheck();
  }

  aceptar(): void {
    const ids = [...this.marcados];
    const seriales = this.lista.filter((s) => this.marcados.has(s.id)).map((s) => s.serial);
    this.confirmar.emit({ ids, seriales });
    this.cerrar();
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
