import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

interface Denominacion {
  valor: number;
  tipo: 'billete' | 'moneda';
  /** Color del billete, para reconocerlo de un vistazo. */
  color: string;
}

/** Billetes y monedas colombianos en circulación. */
const DENOMINACIONES: Denominacion[] = [
  { valor: 100000, tipo: 'billete', color: '#a78bfa' },
  { valor: 50000, tipo: 'billete', color: '#f472b6' },
  { valor: 20000, tipo: 'billete', color: '#fb923c' },
  { valor: 10000, tipo: 'billete', color: '#f87171' },
  { valor: 5000, tipo: 'billete', color: '#a3a3a3' },
  { valor: 2000, tipo: 'billete', color: '#38bdf8' },
  { valor: 1000, tipo: 'moneda', color: '#d4a017' },
  { valor: 500, tipo: 'moneda', color: '#d4a017' },
  { valor: 200, tipo: 'moneda', color: '#cbd5e1' },
  { valor: 100, tipo: 'moneda', color: '#cbd5e1' },
  { valor: 50, tipo: 'moneda', color: '#cbd5e1' },
];

interface Conteo {
  cantidades: Record<number, number>;
  otros: number;
}

const claveConteo = (turnoId: number) => `aura-conteo-turno-${turnoId}`;

/** Borra el conteo guardado de un turno (al cerrarlo). */
export function olvidarConteo(turnoId: number | null | undefined): void {
  if (!turnoId) return;
  try {
    localStorage.removeItem(claveConteo(turnoId));
  } catch {
    /* sin almacenamiento: nada que borrar */
  }
}

/**
 * Calculadora de efectivo para el arqueo: cantidad de cada billete y moneda,
 * más "otros" (vales, cheques). Emite el total.
 *
 * El conteo se guarda en el navegador por turno: si se cierra el diálogo o se
 * recarga la página a mitad del arqueo, no hay que volver a contar.
 */
@Component({
  selector: 'app-contador-efectivo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, InputNumberModule],
  templateUrl: './contador-efectivo.component.html',
  styleUrls: ['./contador-efectivo.component.scss'],
})
export class ContadorEfectivoComponent implements OnChanges {
  /** Para guardar el conteo de este turno en el navegador. */
  @Input() turnoId: number | null = null;
  @Input() disabled = false;
  @Output() totalChange = new EventEmitter<number>();

  readonly billetes = DENOMINACIONES.filter((d) => d.tipo === 'billete');
  readonly monedas = DENOMINACIONES.filter((d) => d.tipo === 'moneda');

  cantidades: Record<number, number> = {};
  otros = 0;

  constructor(private readonly cdr: ChangeDetectorRef) {
    this.vaciar();
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['turnoId']) {
      this.restaurar();
      // Al abrir solo avisa si traía un conteo guardado: así no borra un total
      // que el cajero haya escrito a mano.
      if (this.total > 0) this.emitir();
    }
  }

  // ── Cálculos ────────────────────────────────────────────
  subtotal(d: Denominacion): number {
    return (this.cantidades[d.valor] ?? 0) * d.valor;
  }

  get totalBilletes(): number {
    return this.billetes.reduce((a, d) => a + this.subtotal(d), 0);
  }

  get totalMonedas(): number {
    return this.monedas.reduce((a, d) => a + this.subtotal(d), 0);
  }

  get total(): number {
    return this.totalBilletes + this.totalMonedas + (this.otros || 0);
  }

  get piezas(): number {
    return DENOMINACIONES.reduce((a, d) => a + (this.cantidades[d.valor] ?? 0), 0);
  }

  // ── Cambios ─────────────────────────────────────────────
  sumar(d: Denominacion, n: number): void {
    if (this.disabled) return;
    const actual = this.cantidades[d.valor] ?? 0;
    this.cantidades = { ...this.cantidades, [d.valor]: Math.max(0, actual + n) };
    this.alCambiar();
  }

  onCantidad(d: Denominacion, v: number | null): void {
    this.cantidades = { ...this.cantidades, [d.valor]: Math.max(0, Math.floor(v ?? 0)) };
    this.alCambiar();
  }

  onOtros(v: number | null): void {
    this.otros = Math.max(0, v ?? 0);
    this.alCambiar();
  }

  limpiar(): void {
    if (this.disabled) return;
    this.vaciar();
    this.alCambiar();
  }

  /** Borra lo guardado en el navegador (al cerrar el turno). */
  olvidar(): void {
    olvidarConteo(this.turnoId);
  }

  private alCambiar(): void {
    this.guardar();
    this.emitir();
    this.cdr.markForCheck();
  }

  private emitir(): void {
    this.totalChange.emit(this.total);
  }

  private vaciar(): void {
    this.cantidades = Object.fromEntries(DENOMINACIONES.map((d) => [d.valor, 0]));
    this.otros = 0;
  }

  // ── Persistencia en el navegador ────────────────────────
  private clave(): string {
    return claveConteo(this.turnoId!);
  }

  private guardar(): void {
    if (!this.turnoId) return;
    try {
      const c: Conteo = { cantidades: this.cantidades, otros: this.otros };
      localStorage.setItem(this.clave(), JSON.stringify(c));
    } catch {
      /* modo privado o almacenamiento lleno: el conteo sigue en pantalla */
    }
  }

  private restaurar(): void {
    this.vaciar();
    if (!this.turnoId) return;
    try {
      const raw = localStorage.getItem(this.clave());
      if (!raw) return;
      const c = JSON.parse(raw) as Conteo;
      for (const d of DENOMINACIONES) {
        const n = Number(c?.cantidades?.[d.valor] ?? 0);
        this.cantidades[d.valor] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
      }
      const o = Number(c?.otros ?? 0);
      this.otros = Number.isFinite(o) && o > 0 ? o : 0;
    } catch {
      this.vaciar();
    }
  }

  // ── Formato ─────────────────────────────────────────────
  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
  }

  etiqueta(d: Denominacion): string {
    return d.valor >= 1000 ? `${d.valor / 1000}.000` : String(d.valor);
  }

  trackValor = (_: number, d: Denominacion) => d.valor;
}
