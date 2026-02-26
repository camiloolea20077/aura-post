import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  CreateVentaPagoDto,
  MetodoPago,
  METODOS_PAGO,
  PagoUI,
} from '../../../../core/models/venta.model';

@Component({
  selector: 'app-modal-pago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    DividerModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss'],
})
export class ModalPagoComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() total = 0;
  @Input() pagosPrev: PagoUI[] = [];
  @Output() modalClosed = new EventEmitter<void>();
  @Output() ventaConfirmada = new EventEmitter<CreateVentaPagoDto[]>();

  public pagos: PagoUI[] = [];
  public isSubmitting = false;

  readonly metodos = METODOS_PAGO;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.pagos = this.pagosPrev.length
        ? [...this.pagosPrev.map((p) => ({ ...p }))]
        : [{ metodoPago: 'EFECTIVO', monto: this.total, referencia: null }];
      this.isSubmitting = false;
    }
  }

  get totalPagado(): number {
    return this.pagos.reduce((s, p) => s + (p.monto ?? 0), 0);
  }
  get faltante(): number {
    return this.total - this.totalPagado;
  }
  get vuelto(): number {
    return this.totalPagado - this.total;
  }
  get cuadra(): boolean {
    return this.totalPagado >= this.total;
  }

  // ✅ NUEVO: Detectar si hay CREDITO
  get tieneCredito(): boolean {
    return this.pagos.some((p) => p.metodoPago === 'CREDITO');
  }

  setMetodo(pago: PagoUI, m: MetodoPago): void {
    pago.metodoPago = m;
    // ✅ Si es CREDITO, llenar monto automáticamente
    if (m === 'CREDITO') {
      pago.monto = this.total;
    }
  }

  addPago(): void {
    this.pagos.push({
      metodoPago: 'EFECTIVO',
      monto: Math.max(this.faltante, 0) || null,
      referencia: null,
    });
  }

  removePago(i: number): void {
    if (this.pagos.length > 1) this.pagos.splice(i, 1);
  }

  distribuirRestante(pago: PagoUI): void {
    const otros = this.pagos
      .filter((p) => p !== pago)
      .reduce((s, p) => s + (p.monto ?? 0), 0);
    pago.monto = Math.max(this.total - otros, 0);
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);

  confirmar(): void {
    if (!this.cuadra || this.isSubmitting) return;
    const dtos: CreateVentaPagoDto[] = this.pagos
      .filter((p) => (p.monto ?? 0) > 0)
      .map((p) => ({
        metodoPago: p.metodoPago,
        monto: p.monto!,
        referencia: p.referencia || null,
      }));
    this.isSubmitting = true;
    this.ventaConfirmada.emit(dtos);
  }

  closeModal(): void {
    this.modalClosed.emit();
  }

  metodoInfo(m: MetodoPago) {
    return this.metodos.find((x) => x.value === m) ?? this.metodos[0];
  }
}
