import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CuentaPagarModel,
  AbonoPagarModel,
  CreateAbonoPagarDto,
  MetodoPago,
} from '../models/cuenta-pagar.model';
import { CuentaPagarService } from '../services/cuenta-pagar.service';
import { TurnoCajaModel } from '../../../core/models/caja.model';
import {
  CajaService,
  TurnoCajaService,
} from '../../../core/services/caja.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';

import { aFechaHoraLocal, aFechaLocal } from '../../../shared/utils/fecha.util';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-detalle-cuenta-pagar',
  standalone: true,
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
  providers: [MessageService, ConfirmationService],
  templateUrl: './detalle-cuenta-pagar.component.html',
  styleUrls: ['./detalle-cuenta-pagar.component.scss'],
})
export class DetalleCuentaPagarComponent implements OnInit {
  @Input() visible = false;
  @Input() cuenta: CuentaPagarModel | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  showAbonoForm = false;
  loadingAbono = false;
  abonoForm: FormGroup;
  turnoActivo: TurnoCajaModel | null = null;
  loadingTurno = false;

  metodosPago = [
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Transferencia', value: 'transferencia' },
    { label: 'Consignación', value: 'consignacion' },
    { label: 'Cheque', value: 'cheque' },
  ];

  cuentasBancariasOpts: { label: string; value: number }[] = [];
  /** Cuentas de fondo para pagar cuando no hay caja abierta. */
  cuentasPagoOpts: { label: string; value: number }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: CuentaPagarService,
    private readonly cajaService: TurnoCajaService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly contabilidadService: ContabilidadService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.abonoForm = this.fb.group({
      monto: [null, [Validators.required, Validators.min(1)]],
      metodoPago: ['efectivo', Validators.required],
      referencia: [null],
      banco: [null],
      cuentaBancariaId: [null as number | null],
      cuentaContableId: [null as number | null],
      fechaPago: [new Date(), Validators.required],
    });
  }

  /**
   * El pago en efectivo necesita una caja abierta. Si el usuario no tiene turno
   * (el caso del administrador), el backend busca el de la sucursal y, si no
   * hay ninguno, rechaza el abono. Ahí es donde entra la cuenta contable.
   */
  get sinCajaAbierta(): boolean {
    return this.esEfectivo && !this.turnoActivo;
  }

  /** Sin cuenta bancaria cuando el abono es en efectivo. */
  get esEfectivo(): boolean {
    return this.abonoForm.get('metodoPago')?.value === 'efectivo';
  }

  onMetodoChange(): void {
    if (this.esEfectivo) {
      this.abonoForm.patchValue({ cuentaBancariaId: null });
    }
  }

  /**
   * Solo cuentas auxiliares de activo o pasivo: de ahí sale la plata. Ofrecer
   * cuentas de gasto produciría un asiento invertido.
   */
  private async loadCuentasPago(): Promise<void> {
    try {
      const res = await lastValueFrom(this.contabilidadService.listarPlan());
      this.cuentasPagoOpts = (res?.data ?? [])
        .filter((c) => c.activa && c.auxiliar && (c.tipo === 'ACTIVO' || c.tipo === 'PASIVO'))
        .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
      this.cdr.markForCheck();
    } catch {
      this.cuentasPagoOpts = [];
    }
  }

  private async loadCuentasBancarias(): Promise<void> {
    try {
      const res = await lastValueFrom(this.cuentaBancariaService.list());
      this.cuentasBancariasOpts = (res?.data ?? [])
        .filter((c) => c.activa)
        .map((c) => ({ label: c.nombre, value: c.id }));
      this.cdr.markForCheck();
    } catch {
      this.cuentasBancariasOpts = [];
    }
  }

  async imprimirFactura(): Promise<void> {
    if (!this.cuenta) return;
    try {
      const blob = await lastValueFrom(
        this.service.descargarPdf(this.cuenta.id),
      );
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      this.alert.showError('Error', 'No se pudo generar la factura');
    }
  }

  async imprimirRecibo(abono: AbonoPagarModel): Promise<void> {
    try {
      const blob = await lastValueFrom(
        this.service.descargarAbonoPdf(abono.id),
      );
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'width=800,height=600');
    } catch (err: any) {
      this.alert.showError(
        'Error',
        'No se pudo generar el comprobante de pago',
      );
    }
  }
  ngOnInit(): void {
    this.loadTurnoActivo();
    this.loadCuentasBancarias();
    this.loadCuentasPago();
  }

  get progressPercent(): number {
    if (!this.cuenta || this.cuenta.totalDeuda === 0) return 0;
    return Math.round(
      (this.cuenta.totalAbonado / this.cuenta.totalDeuda) * 100,
    );
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
      cuentaContableId: null,
      referencia: null,
      banco: null,
      cuentaBancariaId: null,
      fechaPago: new Date(),
    });
    this.showAbonoForm = true;
    this.cdr.markForCheck();
  }

  private async loadTurnoActivo(): Promise<void> {
    this.loadingTurno = true;
    try {
      const res = await lastValueFrom(this.cajaService.turnoActivo());
      this.turnoActivo = res?.data ?? null;
    } catch {
      this.turnoActivo = null;
    } finally {
      this.loadingTurno = false;
      this.cdr.markForCheck();
    }
  }

  async saveAbono(): Promise<void> {
    if (this.abonoForm.invalid || !this.cuenta) {
      this.abonoForm.markAllAsTouched();
      return;
    }

    if (this.abonoForm.value.monto > this.cuenta.saldoPendiente) {
      this.alert.showError(
        'Error',
        'El monto no puede ser mayor al saldo pendiente',
      );
      return;
    }

    this.loadingAbono = true;
    const formValue = this.abonoForm.value;

    const dto: CreateAbonoPagarDto = {
      monto: formValue.monto,
      metodoPago: formValue.metodoPago as MetodoPago,
      referencia: formValue.referencia || null,
      banco: formValue.banco || null,
      cuentaBancariaId: this.esEfectivo ? null : formValue.cuentaBancariaId || null,
      cuentaContableId: this.esEfectivo ? formValue.cuentaContableId || null : null,
      fechaPago: aFechaHoraLocal(formValue.fechaPago),
      turnoCajaId: this.turnoActivo?.id ?? null,
    };

    try {
      await lastValueFrom(this.service.createAbono(this.cuenta.id, dto));
      this.alert.showSuccess(
        'Pago registrado',
        'El pago ha sido registrado exitosamente',
      );
      this.showAbonoForm = false;
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message || 'No se pudo registrar el pago',
      );
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
      this.alert.showError(
        'Error',
        err?.error?.message || 'No se pudo eliminar el pago',
      );
    }
  }

  isAbonoFromToday(fechaPago: string): boolean {
    const today = aFechaLocal(new Date());
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
