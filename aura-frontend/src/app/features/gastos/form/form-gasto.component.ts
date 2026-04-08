import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DividerModule } from 'primeng/divider';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { GastoService } from '../../../core/services/gasto.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import {
  CATEGORIAS_GASTO,
  CreateGastoDto,
  GastoTableModel,
  TIPO_DOC_SOPORTE_OPTIONS,
} from '../../../core/models/gasto.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import { PlanCuentaModel } from '../../../core/models/contabilidad.model';

@Component({
  selector: 'app-form-gasto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    CalendarModule,
    ToastModule,
    ToggleButtonModule,
    DividerModule,
    AutoCompleteModule,
  ],
  providers: [MessageService],
  templateUrl: './form-gasto.component.html',
  styleUrls: ['./form-gasto.component.scss'],
})
export class FormGastoComponent implements OnChanges {
  @Input() visible = false;
  @Input() gastoToEdit: GastoTableModel | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // Campos base
  sucursalId: number | null = null;
  sucursalesOpts: { label: string; value: number }[] = [];
  categoria = '';
  descripcion = '';
  monto: number | null = null;
  fecha: Date = new Date();
  deducible = false;
  saving = false;

  // Tercero autocomplete
  terceroSugerencias: TerceroTableModel[] = [];
  terceroSeleccionado: TerceroTableModel | null = null;

  // Cuenta contable
  cuentasOpts: { label: string; value: number }[] = [];
  cuentaContableId: number | null = null;

  // Campos tributarios
  baseIva = 0;
  tarifaIva = 0;
  valorIva = 0;
  baseRetefuente = 0;
  tarifaRetefuente = 0;
  valorRetefuente = 0;
  baseReteica = 0;
  tarifaReteica = 0;
  valorReteica = 0;
  tipoDocSoporte: string | null = null;
  numeroDocSoporte: string | null = null;

  readonly categoriasOpts = CATEGORIAS_GASTO.map((c) => ({
    label: c.label,
    value: c.value,
    deducible: c.deducible,
  }));
  readonly tipoDocOpts = TIPO_DOC_SOPORTE_OPTIONS;

  get modoEdicion(): boolean { return this.gastoToEdit != null; }
  get header(): string { return this.modoEdicion ? 'Editar gasto' : 'Registrar gasto'; }

  constructor(
    private readonly gastoService: GastoService,
    private readonly alertService: AlertService,
    private readonly indexDB: IndexDBService,
    private readonly terceroService: TerceroService,
    private readonly contabilidadService: ContabilidadService,
    public readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['visible']?.currentValue) {
      await Promise.all([this.loadSucursales(), this.loadCuentas()]);
      if (this.modoEdicion && this.gastoToEdit) {
        this.cargarEdicion(this.gastoToEdit);
      }
      this.cdr.markForCheck();
    }
  }

  private async loadSucursales(): Promise<void> {
    const list = await this.indexDB.getSucursales();
    this.sucursalesOpts = list.map((s) => ({ label: s.nombre, value: s.id }));
    if (!this.sucursalId && list.length > 0) this.sucursalId = list[0].id;
  }

  private async loadCuentas(): Promise<void> {
    try {
      const res = await lastValueFrom(this.contabilidadService.listarPlan());
      this.cuentasOpts = (res?.data ?? []).map((c: PlanCuentaModel) => ({
        label: `${c.codigo} - ${c.nombre}`,
        value: c.id,
      }));
    } catch { this.cuentasOpts = []; }
  }

  private cargarEdicion(g: GastoTableModel): void {
    this.categoria = g.categoria;
    this.descripcion = g.descripcion ?? '';
    this.monto = g.monto;
    this.fecha = g.fecha ? new Date(g.fecha + 'T00:00:00') : new Date();
    this.deducible = g.deducible;
  }

  onCategoriaChange(val: string): void {
    this.categoria = val;
    const cat = CATEGORIAS_GASTO.find((c) => c.value === val);
    if (cat != null) this.deducible = cat.deducible;
    this.cdr.markForCheck();
  }

  async buscarTerceros(event: { query: string }): Promise<void> {
    try {
      const res = await lastValueFrom(this.terceroService.proveedores(event.query));
      this.terceroSugerencias = res?.data ?? [];
    } catch { this.terceroSugerencias = []; }
    this.cdr.markForCheck();
  }

  recalcularIva(): void {
    this.valorIva = +(this.baseIva * (this.tarifaIva / 100)).toFixed(2);
    this.cdr.markForCheck();
  }

  recalcularRetefuente(): void {
    this.valorRetefuente = +(this.baseRetefuente * (this.tarifaRetefuente / 100)).toFixed(2);
    this.cdr.markForCheck();
  }

  recalcularReteica(): void {
    this.valorReteica = +(this.baseReteica * (this.tarifaReteica / 100)).toFixed(2);
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    if (!this.sucursalId || !this.categoria || !this.monto) {
      this.alertService.showWarn('Campos requeridos', 'Completa sucursal, categoría y monto.');
      return;
    }
    const dto: CreateGastoDto = {
      sucursalId: this.sucursalId,
      categoria: this.categoria,
      descripcion: this.descripcion.trim() || null,
      monto: this.monto,
      fecha: this.fecha ? this.fecha.toISOString().split('T')[0] : null,
      deducible: this.deducible,
      terceroId: this.terceroSeleccionado?.id ?? null,
      cuentaContableId: this.cuentaContableId,
      centroCostoId: null,
      periodoContableId: null,
      baseIva: this.baseIva,
      tarifaIva: this.tarifaIva,
      valorIva: this.valorIva,
      baseRetefuente: this.baseRetefuente,
      tarifaRetefuente: this.tarifaRetefuente,
      valorRetefuente: this.valorRetefuente,
      baseReteica: this.baseReteica,
      tarifaReteica: this.tarifaReteica,
      valorReteica: this.valorReteica,
      tipoDocSoporte: this.tipoDocSoporte,
      numeroDocSoporte: this.numeroDocSoporte?.trim() || null,
    };
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.modoEdicion && this.gastoToEdit) {
        await lastValueFrom(this.gastoService.update(this.gastoToEdit.id, dto));
        this.alertService.showSuccess('Actualizado', 'Gasto actualizado.');
      } else {
        await lastValueFrom(this.gastoService.create(dto));
        this.alertService.showSuccess('Registrado', 'Gasto registrado.');
      }
      this.saved.emit();
      this.close();
    } catch {
      this.alertService.showError('Error', 'No se pudo guardar el gasto.');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.resetForm();
    this.visible = false;
    this.closed.emit();
  }

  private resetForm(): void {
    this.categoria = '';
    this.descripcion = '';
    this.monto = null;
    this.fecha = new Date();
    this.deducible = false;
    this.terceroSeleccionado = null;
    this.cuentaContableId = null;
    this.baseIva = 0; this.tarifaIva = 0; this.valorIva = 0;
    this.baseRetefuente = 0; this.tarifaRetefuente = 0; this.valorRetefuente = 0;
    this.baseReteica = 0; this.tarifaReteica = 0; this.valorReteica = 0;
    this.tipoDocSoporte = null;
    this.numeroDocSoporte = null;
  }
}
