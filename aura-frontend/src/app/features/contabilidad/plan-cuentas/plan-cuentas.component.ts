import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  PlanCuentaModel,
  CreatePlanCuentaDto,
} from '../../../core/models/contabilidad.model';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-plan-cuentas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    TagModule,
    ToastModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    CheckboxModule,
  ],
  providers: [MessageService],
  templateUrl: './plan-cuentas.component.html',
  styleUrls: ['./plan-cuentas.component.scss'],
})
export class PlanCuentasComponent implements OnInit {
  cuentas: PlanCuentaModel[] = [];
  loading = false;
  showDialog = false;
  saving = false;
  editId: number | null = null;
  search = '';

  form: CreatePlanCuentaDto = this.emptyForm();

  readonly tipoOpts = [
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Pasivo', value: 'PASIVO' },
    { label: 'Patrimonio', value: 'PATRIMONIO' },
    { label: 'Ingreso', value: 'INGRESO' },
    { label: 'Gasto', value: 'GASTO' },
    { label: 'Costo', value: 'COSTO' },
    { label: 'Orden', value: 'ORDEN' },
  ];

  readonly naturalezaOpts = [
    { label: 'Débito', value: 'DEBITO' },
    { label: 'Crédito', value: 'CREDITO' },
  ];

  readonly nivelOpts = [1, 2, 3, 4, 5].map((n) => ({
    label: `Nivel ${n}`,
    value: n,
  }));

  get cuentasFiltradas(): PlanCuentaModel[] {
    if (!this.search.trim()) return this.cuentas;
    const q = this.search.toLowerCase();
    return this.cuentas.filter(
      (c) =>
        c.codigo.toLowerCase().includes(q) ||
        c.nombre.toLowerCase().includes(q),
    );
  }

  get padreOpts() {
    return [
      { label: '— Sin padre —', value: null },
      ...this.cuentas.map((c) => ({
        label: `${c.codigo} - ${c.nombre}`,
        value: c.id,
      })),
    ];
  }

  constructor(
    private readonly service: ContabilidadService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.listarPlan());
      this.cuentas = res?.data ?? [];
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo cargar el plan de cuentas',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async seedPUC(): Promise<void> {
    if (
      !confirm(
        '¿Cargar el PUC básico colombiano? Solo se agregará si el plan está vacío.',
      )
    )
      return;
    try {
      await lastValueFrom(this.service.seedPUC());
      await this.cargar();
      this.alertService.showSuccess(
        'PUC cargado',
        'Plan de cuentas básico listo',
      );
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el PUC');
    }
  }

  abrirNuevo(): void {
    this.editId = null;
    this.form = this.emptyForm();
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  abrirEditar(c: PlanCuentaModel): void {
    this.editId = c.id;
    this.form = {
      codigo: c.codigo,
      nombre: c.nombre,
      tipo: c.tipo,
      naturaleza: c.naturaleza,
      nivel: c.nivel,
      padreId: c.padreId ?? null,
      auxiliar: c.auxiliar,
      codigoDian: c.codigoDian ?? '',
    };
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (!this.form.codigo || !this.form.nombre || !this.form.tipo) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.editId) {
        await lastValueFrom(
          this.service.actualizarCuenta(this.editId, this.form),
        );
        this.alertService.showSuccess('Actualizado', '');
      } else {
        await lastValueFrom(this.service.crearCuenta(this.form));
        this.alertService.showSuccess('Cuenta creada', '');
      }
      this.showDialog = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo guardar',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  async eliminar(c: PlanCuentaModel): Promise<void> {
    if (!confirm(`¿Desactivar la cuenta "${c.codigo} - ${c.nombre}"?`)) return;
    try {
      await lastValueFrom(this.service.eliminarCuenta(c.id));
      await this.cargar();
      this.alertService.showSuccess('Cuenta desactivada', '');
    } catch {
      this.alertService.showError('Error', 'No se pudo desactivar');
    }
  }

  tipoSeverity(
    tipo: string,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const map: Record<
      string,
      'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'
    > = {
      ACTIVO: 'info',
      PASIVO: 'danger',
      PATRIMONIO: 'warn',
      INGRESO: 'success',
      GASTO: 'secondary',
      COSTO: 'contrast',
      ORDEN: 'secondary',
    };
    return map[tipo] ?? 'secondary';
  }

  private emptyForm(): CreatePlanCuentaDto {
    return {
      codigo: '',
      nombre: '',
      tipo: '',
      naturaleza: 'DEBITO',
      nivel: 1,
      padreId: null,
      auxiliar: false,
      codigoDian: '',
    };
  }
}
