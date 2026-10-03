import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

/** Una conversión: "1 Paca = 24 und", "1 Libra = 0,5 kg". */
export interface FilaConversion {
  id?: number | null;
  nombre: string;
  /** Cuántas unidades base equivale 1 de esta conversión. */
  factor: number | null;
  codigoBarras: string | null;
  /** Precio de venta de 1 de esta conversión; vacío = unidad base × factor. */
  precio: number | null;
  /** Costo de 1 de esta conversión (lo que cobra el proveedor). */
  costo: number | null;
  seVende: boolean;
}

export interface Utilidad {
  /** % sobre el precio de venta sin IVA (margen). */
  pct: number;
  /** % sobre el costo (lo que se le "monta" al costo). */
  sobreCosto: number;
  /** Pesos que quedan por unidad vendida, sin IVA. */
  valor: number;
}

interface Sugerida {
  nombre: string;
  factor: number | null;
}

/** Conversiones típicas según la unidad en que se cuenta el producto. */
const SUGERIDAS: { unidades: string[]; opciones: Sugerida[] }[] = [
  {
    unidades: ['und', 'un', 'unid', 'unidad', 'u'],
    opciones: [
      { nombre: 'Paca', factor: null },
      { nombre: 'Caja', factor: null },
      { nombre: 'Display', factor: null },
      { nombre: 'Docena', factor: 12 },
      { nombre: 'Six pack', factor: 6 },
    ],
  },
  {
    unidades: ['kg', 'kilo', 'kilogramo'],
    opciones: [
      { nombre: 'Libra', factor: 0.5 },
      { nombre: 'Arroba', factor: 12.5 },
      { nombre: 'Bulto', factor: 50 },
      { nombre: 'Gramo', factor: 0.001 },
    ],
  },
  {
    unidades: ['g', 'gr', 'gramo'],
    opciones: [
      { nombre: 'Kilo', factor: 1000 },
      { nombre: 'Libra', factor: 500 },
    ],
  },
  {
    unidades: ['lb', 'libra'],
    opciones: [
      { nombre: 'Kilo', factor: 2 },
      { nombre: 'Arroba', factor: 25 },
      { nombre: 'Bulto', factor: 100 },
    ],
  },
  {
    unidades: ['l', 'lt', 'litro'],
    opciones: [
      { nombre: 'Galón', factor: 3.785 },
      { nombre: 'Mililitro', factor: 0.001 },
      { nombre: 'Caneca', factor: null },
    ],
  },
  {
    unidades: ['ml', 'mililitro'],
    opciones: [
      { nombre: 'Litro', factor: 1000 },
      { nombre: 'Galón', factor: 3785 },
    ],
  },
  {
    unidades: ['m', 'mt', 'metro'],
    opciones: [
      { nombre: 'Rollo', factor: null },
      { nombre: 'Yarda', factor: 0.9144 },
      { nombre: 'Centímetro', factor: 0.01 },
    ],
  },
  {
    unidades: ['mes', 'mensual'],
    opciones: [
      { nombre: 'Año', factor: 12 },
      { nombre: 'Semestre', factor: 6 },
      { nombre: 'Trimestre', factor: 3 },
    ],
  },
];

/**
 * Sección "Unidades y conversiones" del producto, como la de World Office: la
 * unidad en que se cuenta el inventario y todas sus equivalencias en una
 * tabla. Con ellas se compra y se vende en cualquiera ("llegaron 4 pacas y 2
 * cervezas", "vendo 2 libras").
 *
 * No guarda nada: el formulario del producto manda la lista al guardar.
 */
@Component({
  selector: 'app-conversiones-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InputNumberModule, InputTextModule, CheckboxModule,
    RadioButtonModule, ButtonModule, TooltipModule],
  templateUrl: './conversiones-producto.component.html',
  styleUrls: ['./conversiones-producto.component.scss'],
})
export class ConversionesProductoComponent {
  /** Formulario del producto: de aquí salen y aquí se escriben precio y costo base. */
  @Input({ required: true }) form!: FormGroup;
  /** Abreviatura de la unidad de inventario (und, kg, m, mes…). */
  @Input() unidad = 'und';
  /** Un gasto o un activo no se venden: se ocultan las columnas de venta. */
  @Input() seVendeItem = true;
  /** Nombre de la unidad de inventario (Caja, Paca, Unidad…), para detectar empaques. */
  @Input() unidadNombre = '';

  /**
   * "1 Caja trae N unidades": el formulario pasa el inventario a contarse en
   * unidades y deja la caja como conversión que se compra y se vende.
   */
  @Output() contarEnUnidades = new EventEmitter<number>();
  cuantasTrae: number | null = null;

  /** Empaques: si el inventario se cuenta en uno de ellos, vender suelto obliga a cambiar la base. */
  private static readonly EMPAQUES = ['caja', 'paca', 'bulto', 'display', 'docena', 'six', 'fardo', 'canasta',
    'cubeta', 'blister', 'blíster', 'estuche', 'bolsa', 'pc', 'bl', 'cj'];

  get baseEsEmpaque(): boolean {
    const n = `${this.unidadNombre} ${this.unidad}`.toLowerCase();
    return ConversionesProductoComponent.EMPAQUES.some((e) => n.split(/[^a-záéíóúñ]+/).includes(e));
  }

  confirmarUnidades(): void {
    if (!this.cuantasTrae || this.cuantasTrae <= 1) return;
    this.contarEnUnidades.emit(this.cuantasTrae);
    this.cuantasTrae = null;
  }

  /** Solo en edición se puede "Pasar a unidad" una conversión ya guardada. */
  @Input() puedePasarAUnidad = false;

  @Input() filas: FilaConversion[] = [];
  @Output() filasChange = new EventEmitter<FilaConversion[]>();

  @Input() vendeSuelto = true;
  @Output() vendeSueltoChange = new EventEmitter<boolean>();

  /** Índice de la conversión en que se compra; -1 = en la unidad base. */
  @Input() compraEn = -1;
  @Output() compraEnChange = new EventEmitter<number>();

  @Output() pasarAUnidad = new EventEmitter<FilaConversion>();

  get sugeridas(): Sugerida[] {
    const u = (this.unidad ?? '').toLowerCase().replace('.', '');
    const grupo = SUGERIDAS.find((g) => g.unidades.includes(u)) ?? SUGERIDAS[0];
    return grupo.opciones.filter(
      (o) => !this.filas.some((f) => f.nombre.trim().toLowerCase() === o.nombre.toLowerCase()),
    );
  }

  get precioBase(): number {
    return Number(this.form.get('precio')?.value) || 0;
  }

  get costoBase(): number {
    return Number(this.form.get('costo')?.value) || 0;
  }

  // ── Filas ──────────────────────────────────────────────────────
  agregar(s?: Sugerida): void {
    const fila: FilaConversion = {
      id: null,
      nombre: s?.nombre ?? '',
      factor: s?.factor ?? null,
      codigoBarras: null,
      precio: null,
      costo: s?.factor ? this.redondear(this.costoBase * s.factor) : null,
      seVende: this.seVendeItem,
    };
    this.filas = [...this.filas, fila];
    this.filasChange.emit(this.filas);
  }

  quitar(i: number): void {
    this.filas = this.filas.filter((_, j) => j !== i);
    // La compra seguía en la que se quitó o en una posterior: se corre el índice.
    if (this.compraEn === i) this.setCompraEn(-1);
    else if (this.compraEn > i) this.setCompraEn(this.compraEn - 1);
    this.filasChange.emit(this.filas);
  }

  setCompraEn(i: number): void {
    this.compraEn = i;
    this.compraEnChange.emit(i);
    this.recalcularCostoBase();
  }

  setVendeSuelto(v: boolean): void {
    this.vendeSuelto = v;
    this.vendeSueltoChange.emit(v);
  }

  cambio(): void {
    this.filasChange.emit(this.filas);
  }

  /**
   * Si se compra en una conversión, el costo que se escribe es el de ella y el
   * de la unidad base sale solo (costo ÷ lo que equivale): nadie divide a mano.
   */
  onCostoFila(i: number): void {
    if (i === this.compraEn) this.recalcularCostoBase();
    this.cambio();
  }

  onFactorFila(i: number): void {
    const f = this.filas[i];
    // Sin costo escrito, se propone costo base × factor.
    if (f.factor && f.factor > 0 && (f.costo == null || f.costo === 0) && i !== this.compraEn) {
      f.costo = this.redondear(this.costoBase * f.factor);
    }
    if (i === this.compraEn) this.recalcularCostoBase();
    this.cambio();
  }

  onCostoBase(): void {
    // Compra por unidad base: las conversiones siguen ese costo.
    if (this.compraEn === -1) {
      this.filas.forEach((f) => {
        if (f.factor && f.factor > 0) f.costo = this.redondear(this.costoBase * f.factor);
      });
      this.cambio();
    }
  }

  private recalcularCostoBase(): void {
    const f = this.filas[this.compraEn];
    if (!f || !f.factor || f.factor <= 0 || f.costo == null) return;
    const costo = Math.round((f.costo / f.factor) * 1_000_000) / 1_000_000;
    this.form.patchValue({ costo }, { emitEvent: false });
  }

  // ── Utilidad ───────────────────────────────────────────────────
  /**
   * % de utilidad sobre el precio de venta sin IVA (margen): de cada $100
   * que se venden, cuánto queda después del costo. Con el precio "IVA
   * incluido" se le saca el IVA primero; el IVA no es del negocio.
   */
  utilidad(precio: number | null | undefined, costo: number | null | undefined): Utilidad | null {
    const p = Number(precio) || 0;
    const c = Number(costo) || 0;
    if (p <= 0 || c <= 0) return null;
    const iva = Number(this.form.get('ivaPorcentaje')?.value) || 0;
    const incluido = !!this.form.get('ivaIncluido')?.value;
    const neto = incluido && iva > 0 ? p / (1 + iva / 100) : p;
    const valor = neto - c;
    return {
      pct: Math.round((valor / neto) * 1000) / 10,
      sobreCosto: Math.round((valor / c) * 1000) / 10,
      valor: Math.round(valor),
    };
  }

  get utilidadBase(): Utilidad | null {
    return this.utilidad(this.precioBase, this.costoBase);
  }

  utilidadFila(f: FilaConversion): Utilidad | null {
    if (!f.seVende || !f.factor) return null;
    const precio = f.precio ?? this.precioSugerido(f);
    const costo = f.costo ?? this.costoBase * f.factor;
    return this.utilidad(precio, costo);
  }

  nivelUtilidad(u: Utilidad): 'perdida' | 'baja' | 'buena' {
    return u.pct < 0 ? 'perdida' : u.pct < 15 ? 'baja' : 'buena';
  }

  tooltipUtilidad(u: Utilidad): string {
    const ganancia = u.valor.toLocaleString('es-CO');
    return u.valor < 0
      ? `Se pierden $${Math.abs(u.valor).toLocaleString('es-CO')} por cada una (sin IVA)`
      : `Ganas $${ganancia} por cada una (sin IVA) · ${u.sobreCosto} % sobre el costo`;
  }

  precioSugerido(f: FilaConversion): number {
    return f.factor ? Math.round(this.precioBase * f.factor) : 0;
  }

  /** "1 Paca = 24 und" en palabras, para la frase de ayuda. */
  get ejemplo(): string | null {
    const f = this.filas.find((x) => x.nombre && x.factor);
    if (!f) return null;
    const venta = this.seVendeItem
      ? ` y vender ${f.seVende ? `2 ${f.nombre}` : ''}${f.seVende && this.vendeSuelto ? ' y ' : ''}${this.vendeSuelto ? `3 ${this.unidad}` : ''}`
      : '';
    return `Puedes comprar "4 ${f.nombre} + 2 ${this.unidad}"${venta}.`;
  }

  private redondear(v: number): number {
    return Math.round(v * 100) / 100;
  }
}
