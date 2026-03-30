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
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  CreateVentaPagoDto,
  MetodoPago,
  METODOS_PAGO,
  PagoUI,
} from '../../../../core/models/venta.model';
import { CuentaBancariaModel } from '../../../../core/models/cuenta-bancaria.model';
import { ValidacionCreditoModel } from '../../../../core/models/cartera.model';

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
    DropdownModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss'],
})
export class ModalPagoComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() total = 0;
  @Input() subtotal = 0;
  @Input() impuestosTotal = 0;
  @Input() pagosPrev: PagoUI[] = [];

  // ── Nuevos inputs ────────────────────────────────────────────────
  @Input() cuentasBancarias: CuentaBancariaModel[] = [];
  @Input() creditoInfo: ValidacionCreditoModel | null = null;
  @Input() clienteNombre: string | null = null;

  @Output() modalClosed = new EventEmitter<void>();
  @Output() ventaConfirmada = new EventEmitter<{
    pagos: CreateVentaPagoDto[];
    descuentoGeneral: number;
  }>();

  public pagos: PagoUI[] = [];
  public isSubmitting = false;
  public descuentoGeneral = 0;

  readonly metodos = METODOS_PAGO;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.pagos = this.pagosPrev.length
        ? [...this.pagosPrev.map((p) => ({ ...p }))]
        : [{ metodoPago: 'EFECTIVO', monto: this.total, referencia: null, cuentaBancariaId: null }];
      this.isSubmitting = false;
    }
  }

  get totalConDescuento(): number {
    return Math.max(0, this.total - (this.descuentoGeneral ?? 0));
  }

  get totalPagado(): number {
    return this.pagos.reduce((s, p) => s + (p.monto ?? 0), 0);
  }
  get faltante(): number {
    return this.totalConDescuento - this.totalPagado;
  }
  get vuelto(): number {
    return Math.max(0, this.totalPagado - this.totalConDescuento);
  }

  get cuadra(): boolean {
    return this.totalPagado >= this.totalConDescuento;
  }

  get tieneCredito(): boolean {
    return this.pagos.some((p) => p.metodoPago === 'CREDITO');
  }

  get creditoBloqueado(): boolean {
    return this.tieneCredito && this.creditoInfo !== null && !this.creditoInfo.permitido;
  }

  esCreditoSeleccionable(): boolean {
    return this.creditoInfo === null || this.creditoInfo.permitido;
  }

  get cuentasOpts(): { label: string; value: number }[] {
    return this.cuentasBancarias
      .filter((c) => c.activa)
      .map((c) => ({
        label: `${c.nombre}${c.banco ? ' — ' + c.banco : ''}`,
        value: c.id,
      }));
  }

  requiereCuenta(m: MetodoPago): boolean {
    return m === 'TRANSFERENCIA' || m === 'NEQUI' || m === 'DAVIPLATA';
  }

  setMetodo(pago: PagoUI, m: MetodoPago): void {
    pago.metodoPago = m;
    pago.cuentaBancariaId = null;
    if (m === 'CREDITO') {
      pago.monto = this.total;
    }
  }

  addPago(): void {
    this.pagos.push({
      metodoPago: 'EFECTIVO',
      monto: Math.max(this.faltante, 0) || null,
      referencia: null,
      cuentaBancariaId: null,
    });
  }

  removePago(i: number): void {
    if (this.pagos.length > 1) this.pagos.splice(i, 1);
  }

  distribuirRestante(pago: PagoUI): void {
    const otros = this.pagos
      .filter((p) => p !== pago)
      .reduce((s, p) => s + (p.monto ?? 0), 0);
    pago.monto = Math.max(this.totalConDescuento - otros, 0);
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);

  confirmar(): void {
    if (!this.cuadra || this.isSubmitting || this.creditoBloqueado) return;
    const dtos: CreateVentaPagoDto[] = this.pagos
      .filter((p) => (p.monto ?? 0) > 0)
      .map((p) => ({
        metodoPago: p.metodoPago,
        monto: p.monto!,
        referencia: p.referencia || null,
        cuentaBancariaId: p.cuentaBancariaId ?? null,
      }));
    this.isSubmitting = true;
    this.ventaConfirmada.emit({
      pagos: dtos,
      descuentoGeneral: this.descuentoGeneral,
    });
  }

  closeModal(): void {
    this.modalClosed.emit();
    this.descuentoGeneral = 0;
  }

  metodoInfo(m: MetodoPago) {
    return this.metodos.find((x) => x.value === m) ?? this.metodos[0];
  }

  getCreditoColor(): string {
    if (!this.creditoInfo) return '#64748b';
    if (!this.creditoInfo.permitido) return '#dc2626';
    if ((this.creditoInfo.saldoDisponible ?? 0) < 0) return '#f59e0b';
    return '#10b981';
  }
}
