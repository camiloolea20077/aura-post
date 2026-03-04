import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateMovimientoCajaDto,
  MovimientoCajaDto,
  TipoMovimiento,
} from '../../../../core/models/caja.model';
import { TurnoCajaService } from '../../../../core/services/caja.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-modal-movimiento-caja',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './modal-movimiento-caja.component.html',
  styleUrls: ['./modal-movimiento-caja.component.scss'],
})
export class ModalMovimientoCajaComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() turnoId!: number;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() movimientoRegistrado = new EventEmitter<MovimientoCajaDto>();

  tipoOptions: { label: string; value: TipoMovimiento; icon: string }[] = [
    { label: 'Ingreso', value: 'INGRESO', icon: 'pi pi-arrow-down' },
    { label: 'Egreso', value: 'EGRESO', icon: 'pi pi-arrow-up' },
  ];

  tipo: TipoMovimiento = 'INGRESO';
  concepto = '';
  monto: number | null = null;
  isSubmitting = false;

  constructor(
    private readonly turnoCajaService: TurnoCajaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.reset();
    }
  }

  private reset(): void {
    this.tipo = 'INGRESO';
    this.concepto = '';
    this.monto = null;
    this.isSubmitting = false;
  }

  get formInvalid(): boolean {
    return !this.concepto.trim() || !this.monto || this.monto <= 0;
  }

  async confirmar(): Promise<void> {
    if (this.formInvalid || !this.turnoId) return;
    this.isSubmitting = true;
    try {
      const dto: CreateMovimientoCajaDto = {
        tipo: this.tipo,
        concepto: this.concepto.trim(),
        monto: this.monto!,
      };
      const res = await lastValueFrom(
        this.turnoCajaService.registrarMovimiento(this.turnoId, dto),
      );
      if (res?.data) {
        this.alertService.showSuccess(
          this.tipo === 'INGRESO' ? 'Ingreso registrado' : 'Egreso registrado',
          `${dto.concepto} — ${this.formatCOP(dto.monto)}`,
        );
        this.movimientoRegistrado.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo registrar el movimiento.',
      );
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  closeModal(): void {
    this.reset();
    this.modalClosed.emit();
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }
}
