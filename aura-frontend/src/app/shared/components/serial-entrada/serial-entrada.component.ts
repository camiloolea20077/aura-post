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
import { InputNumberModule } from 'primeng/inputnumber';

/**
 * Seriales que llegan en una compra: uno por unidad. Se escanean uno tras otro
 * con Enter, se pega una lista o se genera un consecutivo.
 */
@Component({
  selector: 'app-serial-entrada',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule],
  templateUrl: './serial-entrada.component.html',
  styleUrls: ['./serial-entrada.component.scss'],
})
export class SerialEntradaComponent implements OnChanges {
  @Input() visible = false;
  @Input() productoNombre = '';
  /** Unidades de la línea en unidad base: seriales que tienen que llegar. */
  @Input() cantidad = 0;
  @Input() seriales: string[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmar = new EventEmitter<string[]>();

  lista: string[] = [];
  nuevo = '';
  pegado = '';
  mostrarPegar = false;
  prefijo = '';
  desde: number | null = 1;
  aviso: string | null = null;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    if (this.visible) {
      this.lista = [...(this.seriales ?? [])];
      this.nuevo = '';
      this.pegado = '';
      this.mostrarPegar = false;
      this.aviso = null;
    }
  }

  get unidades(): number {
    return Math.max(0, Math.round(this.cantidad || 0));
  }

  get faltan(): number {
    return Math.max(0, this.unidades - this.lista.length);
  }

  agregar(texto: string): boolean {
    const s = (texto ?? '').trim();
    if (!s) return false;
    if (this.lista.some((x) => x.toUpperCase() === s.toUpperCase())) {
      this.aviso = `El serial ${s} ya está en la lista.`;
      return false;
    }
    if (this.lista.length >= this.unidades) {
      this.aviso = `La línea tiene ${this.unidades} unidades: ya están todos los seriales.`;
      return false;
    }
    this.lista = [...this.lista, s];
    this.aviso = null;
    return true;
  }

  onEnter(): void {
    if (this.agregar(this.nuevo)) this.nuevo = '';
    this.cdr.markForCheck();
  }

  pegarLista(): void {
    const partes = this.pegado.split(/[\n,;\t]+/);
    let agregados = 0;
    for (const p of partes) if (this.agregar(p)) agregados++;
    if (agregados) {
      this.pegado = '';
      this.mostrarPegar = false;
    }
    this.cdr.markForCheck();
  }

  generar(): void {
    const inicio = Math.max(0, Math.round(this.desde ?? 1));
    const ancho = Math.max(3, String(inicio + this.faltan).length);
    let n = inicio;
    let intentos = 0;
    while (this.faltan > 0 && intentos < 10000) {
      this.agregar(`${this.prefijo}${String(n).padStart(ancho, '0')}`);
      n++;
      intentos++;
    }
    this.cdr.markForCheck();
  }

  quitar(i: number): void {
    this.lista = this.lista.filter((_, k) => k !== i);
    this.aviso = null;
    this.cdr.markForCheck();
  }

  aceptar(): void {
    this.confirmar.emit([...this.lista]);
    this.cerrar();
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
