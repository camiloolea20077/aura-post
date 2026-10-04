import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CategoriaContableProductoModel,
  TipoCategoriaContable,
} from '../../../core/models/producto.model';

import { PuedeDirective } from '../../../shared/directives/puede.directive';
interface TipoCategoriaOpcion {
  value: TipoCategoriaContable;
  label: string;
  /** Qué representa la "cuenta de la compra" en este tipo. */
  cuentaCompra: string;
  prefijosCompra: string[];
  /** Mercancía y servicios se venden: llevan ingreso y costo. */
  seVende: boolean;
  deprecia: boolean;
  difiere: boolean;
}

/** Clase del PUC que valida el backend para cada tipo (CategoriaContableProductoServiceImpl). */
const TIPOS: TipoCategoriaOpcion[] = [
  { value: 'BIEN', label: 'Mercancía', cuentaCompra: 'Inventario', prefijosCompra: ['14'], seVende: true, deprecia: false, difiere: false },
  { value: 'INSUMO', label: 'Insumo', cuentaCompra: 'Inventario', prefijosCompra: ['14'], seVende: true, deprecia: false, difiere: false },
  { value: 'SERVICIO', label: 'Servicio', cuentaCompra: 'Costo de la compra', prefijosCompra: ['5', '6', '7'], seVende: true, deprecia: false, difiere: false },
  { value: 'GASTO', label: 'Gasto', cuentaCompra: 'Gasto', prefijosCompra: ['5'], seVende: false, deprecia: false, difiere: false },
  { value: 'DOTACION', label: 'Dotación', cuentaCompra: 'Gasto de dotación', prefijosCompra: ['5'], seVende: false, deprecia: false, difiere: false },
  { value: 'ACTIVO_FIJO', label: 'Activo fijo', cuentaCompra: 'Cuenta del activo', prefijosCompra: ['15'], seVende: false, deprecia: true, difiere: false },
  { value: 'INTANGIBLE', label: 'Intangible', cuentaCompra: 'Cuenta del intangible', prefijosCompra: ['16'], seVende: false, deprecia: true, difiere: false },
  { value: 'DIFERIDO', label: 'Diferido', cuentaCompra: 'Cuenta del diferido', prefijosCompra: ['17'], seVende: false, deprecia: false, difiere: true },
];

type Opcion = { label: string; value: number };

/**
 * Categorías contables de producto: la plantilla de cuentas de cada
 * clasificación del catálogo (mercancía, activo fijo, gasto, diferido…).
 * Un producto con categoría usa sus cuentas; sin categoría, las de la empresa.
 */
import { CuentaAutocompleteComponent } from '../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';

@Component({
  selector: 'app-categorias-contables',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CuentaAutocompleteComponent,
    PuedeDirective,
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    DialogModule,
    TagModule,
    TooltipModule,
    CheckboxModule,
  ],
  templateUrl: './categorias-contables.component.html',
  styleUrls: ['./categorias-contables.component.scss'],
})
export class CategoriasContablesComponent implements OnInit {
  readonly tipos = TIPOS;

  todas: CategoriaContableProductoModel[] = [];
  rows: CategoriaContableProductoModel[] = [];
  loading = false;
  search = '';
  tipoFiltro: TipoCategoriaContable | null = null;

  showDialog = false;
  saving = false;
  editId: number | null = null;
  form: Partial<CategoriaContableProductoModel> = this.emptyForm();

  private auxiliares: { id: number; codigo: string; nombre: string }[] = [];
  cuentasIngreso: Opcion[] = [];
  cuentasCosto: Opcion[] = [];
  cuentasCompra: Opcion[] = [];
  cuentasDepreciacion: Opcion[] = [];
  cuentasGastoDepreciacion: Opcion[] = [];

  constructor(
    private readonly contabilidad: ContabilidadService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarCuentas();
    this.cargar();
  }

  get tipoActual(): TipoCategoriaOpcion {
    return TIPOS.find((t) => t.value === this.form.tipo) ?? TIPOS[0];
  }

  tipoLabel(tipo: TipoCategoriaContable): string {
    return TIPOS.find((t) => t.value === tipo)?.label ?? tipo;
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.contabilidad.listarCategoriasProducto());
      this.todas = res?.data ?? [];
      this.filtrar();
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las categorías contables');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  filtrar(): void {
    const q = this.search.trim().toLowerCase();
    this.rows = this.todas.filter(
      (c) =>
        (!this.tipoFiltro || c.tipo === this.tipoFiltro) &&
        (!q || c.nombre.toLowerCase().includes(q)),
    );
    this.cdr.markForCheck();
  }

  private async cargarCuentas(): Promise<void> {
    try {
      const res = await lastValueFrom(this.contabilidad.listarPlan());
      this.auxiliares = (res?.data ?? [])
        .filter((c) => c.auxiliar && c.activa)
        .map((c) => ({ id: c.id, codigo: c.codigo ?? '', nombre: c.nombre }));
      this.cuentasIngreso = this.opciones('4');
      this.cuentasCosto = this.opciones('5', '6', '7');
      this.cuentasDepreciacion = this.opciones('1592', '1597', '1598', '1698');
      this.cuentasGastoDepreciacion = this.opciones('51', '52', '72', '73');
      this.actualizarCuentasCompra();
    } catch {
      this.alert.showError('Error', 'No se pudo cargar el plan de cuentas');
    }
  }

  private opciones(...prefijos: string[]): Opcion[] {
    return this.auxiliares
      .filter((c) => prefijos.some((p) => c.codigo.startsWith(p)))
      .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
  }

  onTipoChange(): void {
    // La cuenta de la compra de otra clase ya no aplica al cambiar el tipo.
    const cuenta = this.auxiliares.find((c) => c.id === this.form.cuentaInventarioId);
    if (cuenta && !this.tipoActual.prefijosCompra.some((p) => cuenta.codigo.startsWith(p))) {
      this.form.cuentaInventarioId = null;
    }
    this.actualizarCuentasCompra();
  }

  private actualizarCuentasCompra(): void {
    // BIEN/INSUMO admiten toda la clase 1 en el back por compatibilidad, pero
    // lo correcto es inventario (14).
    this.cuentasCompra = this.opciones(...this.tipoActual.prefijosCompra);
    this.cdr.markForCheck();
  }

  abrirNueva(): void {
    this.editId = null;
    this.form = this.emptyForm();
    this.actualizarCuentasCompra();
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  abrirEditar(c: CategoriaContableProductoModel): void {
    this.editId = c.id;
    this.form = { ...c };
    this.actualizarCuentasCompra();
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (!this.form.nombre?.trim()) return;
    const tipo = this.tipoActual;
    // Lo que no aplica al tipo no se manda: el back lo validaría contra su clase.
    const dto: Partial<CategoriaContableProductoModel> = {
      nombre: this.form.nombre.trim(),
      tipo: tipo.value,
      activo: this.form.activo ?? true,
      cuentaInventarioId: this.form.cuentaInventarioId ?? null,
      cuentaIngresoId: tipo.seVende ? (this.form.cuentaIngresoId ?? null) : null,
      cuentaDevolucionId: tipo.seVende ? (this.form.cuentaDevolucionId ?? null) : null,
      cuentaCostoId: tipo.seVende || tipo.difiere ? (this.form.cuentaCostoId ?? null) : null,
      cuentaDepreciacionId: tipo.deprecia ? (this.form.cuentaDepreciacionId ?? null) : null,
      cuentaGastoDepreciacionId: tipo.deprecia ? (this.form.cuentaGastoDepreciacionId ?? null) : null,
      vidaUtilMeses: tipo.deprecia ? (this.form.vidaUtilMeses ?? null) : null,
      mesesDiferido: tipo.difiere ? (this.form.mesesDiferido ?? null) : null,
    };
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.editId) {
        await lastValueFrom(this.contabilidad.actualizarCategoriaProducto(this.editId, dto));
        this.alert.showSuccess('Actualizada', 'Categoría contable actualizada');
      } else {
        await lastValueFrom(this.contabilidad.crearCategoriaProducto(dto));
        this.alert.showSuccess('Creada', 'Categoría contable creada');
      }
      this.showDialog = false;
      await this.cargar();
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? e?.message ?? 'No se pudo guardar');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  // ── Copiar ────────────────────────────────────────────────────
  showCopiar = false;
  copiarOrigen: CategoriaContableProductoModel | null = null;
  copiarNombre = '';

  abrirCopiar(c: CategoriaContableProductoModel): void {
    this.copiarOrigen = c;
    this.copiarNombre = `${c.nombre} (copia)`;
    this.showCopiar = true;
    this.cdr.markForCheck();
  }

  async confirmarCopiar(): Promise<void> {
    if (!this.copiarOrigen || !this.copiarNombre.trim()) return;
    try {
      await lastValueFrom(this.contabilidad.copiarCategoriaProducto(this.copiarOrigen.id, this.copiarNombre.trim()));
      this.alert.showSuccess('Copiada', 'La categoría nueva quedó con las mismas cuentas.');
      this.showCopiar = false;
      await this.cargar();
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo copiar');
    }
    this.cdr.markForCheck();
  }

  private emptyForm(): Partial<CategoriaContableProductoModel> {
    return {
      nombre: '',
      tipo: 'ACTIVO_FIJO',
      activo: true,
      cuentaIngresoId: null,
      cuentaInventarioId: null,
      cuentaCostoId: null,
      cuentaDevolucionId: null,
      cuentaDepreciacionId: null,
      cuentaGastoDepreciacionId: null,
      vidaUtilMeses: null,
      mesesDiferido: null,
    };
  }
}
