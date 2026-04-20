import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { lastValueFrom } from 'rxjs';

import { ComisionService } from '../../../../core/services/comision.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ComisionVentaModel,
  TecnicoDto,
  TipoLiquidacion,
} from '../../../../core/models/comision.model';

@Component({
  selector: 'app-form-liquidacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    DropdownModule,
    CalendarModule,
    TableModule,
    SelectButtonModule,
    CheckboxModule,
  ],
  templateUrl: './form-liquidacion.component.html',
  styleUrls: ['./form-liquidacion.component.scss'],
})
export class FormLiquidacionComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  frm: FormGroup;
  loading = false;
  loadingTecnicos = false;
  loadingPendientes = false;

  tipo: TipoLiquidacion = 'TECNICO';
  tecnicos: TecnicoDto[] = [];
  ventasPendientes: ComisionVentaModel[] = [];
  seleccionados = new Set<number>(); // IDs de comisiones marcadas

  readonly tipoOptions = [
    { label: 'Técnico', value: 'TECNICO' },
    { label: 'Vendedor', value: 'VENDEDOR' },
  ];

  get totalSeleccionado(): number {
    return this.ventasPendientes
      .filter(v => this.seleccionados.has(v.id))
      .reduce((sum, v) => sum + v.valorTecnico, 0);
  }

  get todosSeleccionados(): boolean {
    return this.ventasPendientes.length > 0 &&
      this.ventasPendientes.every(v => this.seleccionados.has(v.id));
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly comisionService: ComisionService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      tecnicoId:    [null, Validators.required],
      fechaDesde:   [null],
      fechaHasta:   [null],
      observaciones: [null],
    });

    this.frm.get('tecnicoId')!.valueChanges.subscribe((id) => {
      if (id) this.recargarPendientes();
      else    this.limpiarPendientes();
    });

    // Recargar al cambiar fechas
    this.frm.get('fechaDesde')!.valueChanges.subscribe(() => {
      if (this.frm.get('tecnicoId')!.value) this.recargarPendientes();
    });
    this.frm.get('fechaHasta')!.valueChanges.subscribe(() => {
      if (this.frm.get('tecnicoId')!.value) this.recargarPendientes();
    });
  }

  async ngOnChanges(): Promise<void> {
    if (!this.visible) return;
    this.tipo = 'TECNICO';
    await this.loadUsuarios();
    this.frm.reset();
    this.limpiarPendientes();
    this.cdr.markForCheck();
  }

  async onTipoChange(): Promise<void> {
    this.frm.get('tecnicoId')!.setValue(null);
    this.limpiarPendientes();
    await this.loadUsuarios();
  }

  private limpiarPendientes(): void {
    this.ventasPendientes = [];
    this.seleccionados.clear();
    this.cdr.markForCheck();
  }

  private async loadUsuarios(): Promise<void> {
    this.loadingTecnicos = true;
    try {
      const obs = this.tipo === 'VENDEDOR'
        ? this.comisionService.listVendedores()
        : this.comisionService.listTecnicos();
      const res = await lastValueFrom(obs);
      this.tecnicos = res?.data ?? [];
    } catch {
      const label = this.tipo === 'VENDEDOR' ? 'vendedores' : 'técnicos';
      this.alertService.showError('Error', `No se pudieron cargar los ${label}`);
    } finally {
      this.loadingTecnicos = false;
      this.cdr.markForCheck();
    }
  }

  private async recargarPendientes(): Promise<void> {
    const personaId = this.frm.get('tecnicoId')!.value;
    if (!personaId) return;

    const raw = this.frm.value;
    const desde = raw.fechaDesde ? this.formatDate(raw.fechaDesde) : null;
    const hasta = raw.fechaHasta ? this.formatDate(raw.fechaHasta) : null;

    this.loadingPendientes = true;
    this.cdr.markForCheck();
    try {
      const obs = this.tipo === 'VENDEDOR'
        ? this.comisionService.getVentasPendientesVendedor(personaId, desde, hasta)
        : this.comisionService.getVentasPendientes(personaId, desde, hasta);
      const res = await lastValueFrom(obs);
      this.ventasPendientes = res?.data ?? [];
      // Seleccionar todas por defecto
      this.seleccionados = new Set(this.ventasPendientes.map(v => v.id));
    } catch {
      this.ventasPendientes = [];
      this.seleccionados.clear();
    } finally {
      this.loadingPendientes = false;
      this.cdr.markForCheck();
    }
  }

  toggleSeleccion(id: number): void {
    if (this.seleccionados.has(id)) this.seleccionados.delete(id);
    else                             this.seleccionados.add(id);
    this.cdr.markForCheck();
  }

  toggleTodos(): void {
    if (this.todosSeleccionados) {
      this.seleccionados.clear();
    } else {
      this.seleccionados = new Set(this.ventasPendientes.map(v => v.id));
    }
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      return;
    }
    if (this.seleccionados.size === 0) {
      this.alertService.showError('Sin selección', 'Selecciona al menos una comisión para liquidar');
      return;
    }

    const raw = this.frm.value;
    const fechaDesde = raw.fechaDesde ? this.formatDate(raw.fechaDesde) : new Date().toISOString().split('T')[0];
    const fechaHasta = raw.fechaHasta ? this.formatDate(raw.fechaHasta) : new Date().toISOString().split('T')[0];

    const dto = {
      ...(this.tipo === 'VENDEDOR'
        ? { vendedorId: raw.tecnicoId }
        : { tecnicoId: raw.tecnicoId }),
      fechaDesde,
      fechaHasta,
      tipo: this.tipo,
      comisionIds: Array.from(this.seleccionados),
      observaciones: raw.observaciones || null,
    };

    this.loading = true;
    try {
      await lastValueFrom(this.comisionService.createLiquidacion(dto));
      this.alertService.showSuccess('Creada', 'Liquidación generada correctamente');
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alertService.showError('Error', err?.message ?? 'No se pudo crear la liquidación');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const c = this.frm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
