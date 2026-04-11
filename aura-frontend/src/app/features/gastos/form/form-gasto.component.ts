import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { FieldsetModule } from 'primeng/fieldset';
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
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    DropdownModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    CalendarModule,
    ToastModule,
    AutoCompleteModule,
    TooltipModule,
    FieldsetModule,
  ],
  providers: [MessageService],
  templateUrl: './form-gasto.component.html',
  styleUrls: ['./form-gasto.component.scss'],
})
export class FormGastoComponent implements OnInit {
  private gastoToEdit: GastoTableModel | null = null;
  public frm!: FormGroup;

  loadingPage = false;
  isSubmitting = false;

  // Opciones de dropdowns
  sucursalesOpts: { label: string; value: number }[] = [];
  cuentasOpts: { label: string; value: number }[] = [];

  // Autocomplete tercero (objeto completo, fuera del form)
  terceroSugerencias: TerceroTableModel[] = [];
  terceroSeleccionado: TerceroTableModel | null = null;

  readonly categoriasOpts = CATEGORIAS_GASTO.map((c) => ({
    label: c.label,
    value: c.value,
    deducible: c.deducible,
  }));
  readonly tipoDocOpts = TIPO_DOC_SOPORTE_OPTIONS;

  get modoEdicion(): boolean { return this.gastoToEdit != null; }

  constructor(
    private readonly gastoService: GastoService,
    private readonly alertService: AlertService,
    private readonly indexDB: IndexDBService,
    private readonly terceroService: TerceroService,
    private readonly contabilidadService: ContabilidadService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
  ) {}

  async ngOnInit(): Promise<void> {
    this.initForm();
    const id = this.route.snapshot.params['id'];
    await Promise.all([this.loadSucursales(), this.loadCuentas()]);
    if (id) {
      await this.cargarParaEditar(+id);
    }
    this.cdr.markForCheck();
  }

  private initForm(): void {
    this.frm = this.fb.group({
      sucursalId:        [null, Validators.required],
      categoria:         ['',   Validators.required],
      monto:             [null, Validators.required],
      fecha:             [new Date()],
      deducible:         [false],
      tipoDocSoporte:    [null],
      numeroDocSoporte:  [''],
      descripcion:       [''],
      cuentaContableId:  [null],
      baseIva:           [0],
      tarifaIva:         [0],
      valorIva:          [{ value: 0, disabled: true }],
      baseRetefuente:    [0],
      tarifaRetefuente:  [0],
      valorRetefuente:   [{ value: 0, disabled: true }],
      baseReteica:       [0],
      tarifaReteica:     [0],
      valorReteica:      [{ value: 0, disabled: true }],
    });
  }

  private async loadSucursales(): Promise<void> {
    const list = await this.indexDB.getSucursales();
    this.sucursalesOpts = list.map((s) => ({ label: s.nombre, value: s.id }));
    if (list.length > 0) this.frm.patchValue({ sucursalId: list[0].id });
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

  private async cargarParaEditar(id: number): Promise<void> {
    this.loadingPage = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.gastoService.getById(id));
      const g = res?.data ?? null;
      this.gastoToEdit = g;
      if (g) {
        this.frm.patchValue({
          sucursalId:        g.sucursalId ?? null,
          categoria:         g.categoria,
          monto:             g.monto,
          fecha:             g.fecha ? new Date(g.fecha + 'T00:00:00') : new Date(),
          deducible:         g.deducible,
          descripcion:       g.descripcion ?? '',
          tipoDocSoporte:    g.tipoDocSoporte ?? null,
          numeroDocSoporte:  g.numeroDocSoporte ?? '',
          baseIva:           g.baseIva ?? 0,
          tarifaIva:         g.tarifaIva ?? 0,
          valorIva:          g.valorIva ?? 0,
          baseRetefuente:    g.baseRetefuente ?? 0,
          tarifaRetefuente:  g.tarifaRetefuente ?? 0,
          valorRetefuente:   g.valorRetefuente ?? 0,
          baseReteica:       g.baseReteica ?? 0,
          tarifaReteica:     g.tarifaReteica ?? 0,
          valorReteica:      g.valorReteica ?? 0,
        });
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el gasto.');
    } finally {
      this.loadingPage = false;
      this.cdr.markForCheck();
    }
  }

  onCategoriaChange(val: string): void {
    const cat = CATEGORIAS_GASTO.find((c) => c.value === val);
    if (cat != null) this.frm.patchValue({ deducible: cat.deducible });
    this.cdr.markForCheck();
  }

  recalcularIva(): void {
    const base    = this.frm.get('baseIva')?.value ?? 0;
    const tarifa  = this.frm.get('tarifaIva')?.value ?? 0;
    this.frm.get('valorIva')?.setValue(+(base * tarifa / 100).toFixed(2));
    this.cdr.markForCheck();
  }

  recalcularRetefuente(): void {
    const base   = this.frm.get('baseRetefuente')?.value ?? 0;
    const tarifa = this.frm.get('tarifaRetefuente')?.value ?? 0;
    this.frm.get('valorRetefuente')?.setValue(+(base * tarifa / 100).toFixed(2));
    this.cdr.markForCheck();
  }

  recalcularReteica(): void {
    const base   = this.frm.get('baseReteica')?.value ?? 0;
    const tarifa = this.frm.get('tarifaReteica')?.value ?? 0;
    this.frm.get('valorReteica')?.setValue(+(base * tarifa / 100).toFixed(2));
    this.cdr.markForCheck();
  }

  async buscarTerceros(event: { query: string }): Promise<void> {
    try {
      const res = await lastValueFrom(this.terceroService.proveedores(event.query));
      this.terceroSugerencias = res?.data ?? [];
    } catch { this.terceroSugerencias = []; }
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      this.alertService.showWarn('Campos requeridos', 'Completa sucursal, categoría y monto.');
      return;
    }
    const v = this.frm.getRawValue();
    const dto: CreateGastoDto = {
      sucursalId:        v.sucursalId,
      categoria:         v.categoria,
      descripcion:       v.descripcion?.trim() || null,
      monto:             v.monto,
      fecha:             v.fecha ? (v.fecha as Date).toISOString().split('T')[0] : null,
      deducible:         v.deducible,
      terceroId:         this.terceroSeleccionado?.id ?? null,
      cuentaContableId:  v.cuentaContableId,
      centroCostoId:     null,
      periodoContableId: null,
      tipoDocSoporte:    v.tipoDocSoporte,
      numeroDocSoporte:  v.numeroDocSoporte?.trim() || null,
      baseIva:           v.baseIva,
      tarifaIva:         v.tarifaIva,
      valorIva:          v.valorIva,
      baseRetefuente:    v.baseRetefuente,
      tarifaRetefuente:  v.tarifaRetefuente,
      valorRetefuente:   v.valorRetefuente,
      baseReteica:       v.baseReteica,
      tarifaReteica:     v.tarifaReteica,
      valorReteica:      v.valorReteica,
    };
    this.isSubmitting = true;
    this.cdr.markForCheck();
    try {
      if (this.modoEdicion && this.gastoToEdit) {
        await lastValueFrom(this.gastoService.update(this.gastoToEdit.id, dto));
        this.alertService.showSuccess('Actualizado', 'Gasto actualizado correctamente.');
      } else {
        await lastValueFrom(this.gastoService.create(dto));
        this.alertService.showSuccess('Registrado', 'Gasto registrado correctamente.');
      }
      this.router.navigate(['/gastos']);
    } catch {
      this.alertService.showError('Error', 'No se pudo guardar el gasto.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.router.navigate(['/gastos']);
  }
}
