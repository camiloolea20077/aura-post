import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CuentaPagarModel,
  AbonoPagarModel,
  CreateAbonoPagarDto,
  MetodoPago,
} from '../models/cuenta-pagar.model';
import { CuentaPagarService } from '../services/cuenta-pagar.service';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-detalle-cuenta-pagar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './detalle-cuenta-pagar.component.html',
  styleUrls: ['./detalle-cuenta-pagar.component.scss'],
})
export class DetalleCuentaPagarComponent {
  @Input() visible = false;
  @Input() cuenta: CuentaPagarModel | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  showAbonoForm = false;
  loadingAbono = false;
  abonoForm: FormGroup;

  metodosPago = [
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Transferencia', value: 'transferencia' },
    { label: 'Consignación', value: 'consignacion' },
    { label: 'Cheque', value: 'cheque' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: CuentaPagarService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.abonoForm = this.fb.group({
      monto: [null, [Validators.required, Validators.min(1)]],
      metodoPago: ['efectivo', Validators.required],
      referencia: [null],
      banco: [null],
      fechaPago: [new Date(), Validators.required],
    });
  }

  get progressPercent(): number {
    if (!this.cuenta || this.cuenta.totalDeuda === 0) return 0;
    return Math.round((this.cuenta.totalAbonado / this.cuenta.totalDeuda) * 100);
  }

  get puedeRegistrarAbono(): boolean {
    return !!this.cuenta && this.cuenta.saldoPendiente > 0;
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  getSeverity(estado: string): TagSeverity {
    const map: Record<string, Exclude<TagSeverity, undefined>> = {
      pagada: 'success',
      activa: 'info',
      vencida: 'danger',
    };
    return map[estado] ?? 'secondary';
  }

  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pagada: 'Pagada',
      activa: 'Activa',
      vencida: 'Vencida',
    };
    return map[estado] ?? estado;
  }

  getMetodoLabel(metodo: string): string {
    const map: Record<string, string> = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      consignacion: 'Consignación',
      cheque: 'Cheque',
    };
    return map[metodo] ?? metodo;
  }

  openAbonoForm(): void {
    this.abonoForm.reset({
      monto: null,
      metodoPago: 'efectivo',
      referencia: null,
      banco: null,
      fechaPago: new Date(),
    });
    this.showAbonoForm = true;
    this.cdr.markForCheck();
  }

  async saveAbono(): Promise<void> {
    if (this.abonoForm.invalid || !this.cuenta) {
      this.abonoForm.markAllAsTouched();
      return;
    }

    if (this.abonoForm.value.monto > this.cuenta.saldoPendiente) {
      this.alert.showError('Error', 'El monto no puede ser mayor al saldo pendiente');
      return;
    }

    this.loadingAbono = true;
    const formValue = this.abonoForm.value;

    const dto: CreateAbonoPagarDto = {
      monto: formValue.monto,
      metodoPago: formValue.metodoPago as MetodoPago,
      referencia: formValue.referencia || null,
      banco: formValue.banco || null,
      fechaPago: formValue.fechaPago.toISOString(),
    };

    try {
      await lastValueFrom(this.service.createAbono(this.cuenta.id, dto));
      this.alert.showSuccess('Pago registrado', 'El pago ha sido registrado exitosamente');
      this.showAbonoForm = false;
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message || 'No se pudo registrar el pago');
    } finally {
      this.loadingAbono = false;
      this.cdr.markForCheck();
    }
  }

  confirmDeleteAbono(abono: AbonoPagarModel): void {
    this.confirm.confirm({
      message: `¿Eliminar el pago de <b>${this.formatCOP(abono.monto)}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAbono(abono),
    });
  }

  async deleteAbono(abono: AbonoPagarModel): Promise<void> {
    if (!this.cuenta) return;

    try {
      await lastValueFrom(this.service.deleteAbono(this.cuenta.id, abono.id));
      this.alert.showSuccess('Pago eliminado', 'El pago ha sido eliminado');
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message || 'No se pudo eliminar el pago');
    }
  }

  isAbonoFromToday(fechaPago: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return fechaPago.split('T')[0] === today;
  }

  close(): void {
    this.visible = false;
    this.showAbonoForm = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const control = this.abonoForm.get(field);
    return !!(control?.invalid && control?.touched);
  }
}
