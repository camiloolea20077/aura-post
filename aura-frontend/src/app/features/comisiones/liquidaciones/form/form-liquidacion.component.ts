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
import { lastValueFrom } from 'rxjs';

import { ComisionService } from '../../../../core/services/comision.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ComisionVentaModel,
  TecnicoDto,
} from '../../../../core/models/comision.model';

@Component({
  selector: 'app-form-liquidacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    DropdownModule,
    CalendarModule,
    TableModule,
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

  tecnicos: TecnicoDto[] = [];
  ventasPendientes: ComisionVentaModel[] = [];
  totalPendiente = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly comisionService: ComisionService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      tecnicoId: [null, Validators.required],
      fechaDesde: [null, Validators.required],
      fechaHasta: [null, Validators.required],
      observaciones: [null],
    });

    this.frm.get('tecnicoId')!.valueChanges.subscribe((id) => {
      if (id) this.cargarPendientes(id);
      else {
        this.ventasPendientes = [];
        this.totalPendiente = 0;
        this.cdr.markForCheck();
      }
    });
  }

  async ngOnChanges(): Promise<void> {
    if (!this.visible) return;
    await this.loadTecnicos();
    this.frm.reset();
    this.ventasPendientes = [];
    this.totalPendiente = 0;
    this.cdr.markForCheck();
  }

  private async loadTecnicos(): Promise<void> {
    this.loadingTecnicos = true;
    try {
      const res = await lastValueFrom(this.comisionService.listTecnicos());
      this.tecnicos = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los técnicos');
    } finally {
      this.loadingTecnicos = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarPendientes(tecnicoId: number): Promise<void> {
    this.loadingPendientes = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.comisionService.getVentasPendientes(tecnicoId),
      );
      this.ventasPendientes = res?.data ?? [];
      this.totalPendiente = this.ventasPendientes.reduce(
        (sum, v) => sum + v.valorTecnico,
        0,
      );
    } catch {
      this.ventasPendientes = [];
      this.totalPendiente = 0;
    } finally {
      this.loadingPendientes = false;
      this.cdr.markForCheck();
    }
  }

  async save(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      return;
    }
    if (this.ventasPendientes.length === 0) {
      this.alertService.showError('Sin servicios', 'Este técnico no tiene comisiones pendientes');
      return;
    }

    const raw = this.frm.value;
    const dto = {
      tecnicoId: raw.tecnicoId,
      fechaDesde: this.formatDate(raw.fechaDesde),
      fechaHasta: this.formatDate(raw.fechaHasta),
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
