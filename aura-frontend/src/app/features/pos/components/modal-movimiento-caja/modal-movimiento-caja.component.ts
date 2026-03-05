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
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateMovimientoCajaDto,
  MovimientoCajaDto,
  TipoMovimiento,
  TurnoCajaModel,
} from '../../../../core/models/caja.model';
import { TurnoCajaService } from '../../../../core/services/caja.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { CuentaCobrarService } from '../../../cuentas/services/cuenta-cobrar.service';
import { CuentaPagarService } from '../../../cuentas/services/cuenta-pagar.service';
import { CuentaCobrarTableModel } from '../../../cuentas/models/cuenta-cobrar.model';
import { CuentaPagarTableModel } from '../../../cuentas/models/cuenta-pagar.model';

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
    AutoCompleteModule,
  ],
  providers: [MessageService],
  templateUrl: './modal-movimiento-caja.component.html',
  styleUrls: ['./modal-movimiento-caja.component.scss'],
})
export class ModalMovimientoCajaComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() turno: TurnoCajaModel | null = null;
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

  cuentaSearch = '';
  cuentasSugeridas: (CuentaCobrarTableModel | CuentaPagarTableModel)[] = [];
  cuentaSeleccionada: CuentaCobrarTableModel | CuentaPagarTableModel | null =
    null;
  loadingCuentas = false;

  constructor(
    private readonly turnoCajaService: TurnoCajaService,
    private readonly cuentaCobrarService: CuentaCobrarService,
    private readonly cuentaPagarService: CuentaPagarService,
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
    this.cuentaSearch = '';
    this.cuentasSugeridas = [];
    this.cuentaSeleccionada = null;
  }

  get formInvalid(): boolean {
    return !this.concepto.trim() || !this.monto || this.monto <= 0;
  }

  onTipoChange(): void {
    this.cuentaSeleccionada = null;
    this.cuentaSearch = '';
    this.cuentasSugeridas = [];
    this.cdr.markForCheck();
    this.concepto = '';
    this.monto = null;
  }

  async buscarCuentas(event: { query: string }): Promise<void> {
    const query = event.query?.trim() ?? '';
    if (query.length < 2) {
      this.cuentasSugeridas = [];
      this.cdr.markForCheck();
      return;
    }

    this.loadingCuentas = true;
    try {
      if (this.tipo === 'INGRESO') {
        const res = await lastValueFrom(
          this.cuentaCobrarService.page({
            page: 0,
            rows: 20,
            search: query,
            estado: 'activa',
          }),
        );
        this.cuentasSugeridas = res?.data?.content ?? [];
      } else {
        const res = await lastValueFrom(
          this.cuentaPagarService.page({
            page: 0,
            rows: 20,
            search: query,
            params: { estado: 'activa' },
          }),
        );
        this.cuentasSugeridas = res?.data?.content ?? [];
      }
    } catch {
      this.cuentasSugeridas = [];
    } finally {
      this.loadingCuentas = false;
      this.cdr.markForCheck();
    }
  }

  onSelectCuenta(event: any): void {
    const cuenta = event.value as
      | CuentaCobrarTableModel
      | CuentaPagarTableModel;
    this.cuentaSeleccionada = cuenta;

    const numeroCuenta = cuenta.numeroCuenta;
    const nombreTercero =
      'clienteNombre' in cuenta ? cuenta.clienteNombre : cuenta.proveedorNombre;
    const nombreCaja = this.turno?.cajaNombre ?? 'Caja';
    const tipoLabel =
      this.tipo === 'INGRESO' ? 'Abono a Cuenta' : 'Pago a Cuenta';

    this.concepto = `Movimiento de caja (${nombreCaja}), ${tipoLabel}: ${numeroCuenta} - ${nombreTercero}`;
    this.cdr.markForCheck();
  }

  get cuentaLabel(): string {
    if (!this.cuentaSeleccionada) return '';
    const numero = this.cuentaSeleccionada.numeroCuenta;
    const nombre =
      'clienteNombre' in this.cuentaSeleccionada
        ? this.cuentaSeleccionada.clienteNombre
        : this.cuentaSeleccionada.proveedorNombre;
    return `${numero} - ${nombre}`;
  }

  async confirmar(): Promise<void> {
    if (this.formInvalid || !this.turno?.id) return;
    this.isSubmitting = true;
    try {
      const dto: CreateMovimientoCajaDto = {
        tipo: this.tipo,
        concepto: this.concepto.trim(),
        monto: this.monto!,
      };
      const res = await lastValueFrom(
        this.turnoCajaService.registrarMovimiento(this.turno!.id, dto),
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
