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
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CuentaCobrarModel,
  AbonoCobrarModel,
  CreateAbonoCobrarDto,
  MetodoPago,
} from '../models/cuenta-cobrar.model';
import { CuentaCobrarService } from '../services/cuenta-cobrar.service';
import { TurnoCajaModel } from '../../../core/models/caja.model';
import {
  CajaService,
  TurnoCajaService,
} from '../../../core/services/caja.service';
import { ModalTirillaComponent } from '../../pos/components/modal-tirilla/modal-tirilla.component';
import { VentaService } from '../../../core/services/venta.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { VentaModel } from '../../../core/models/venta.model';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-detalle-cuenta-cobrar',
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
    ModalTirillaComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './detalle-cuenta-cobrar.component.html',
  styleUrls: ['./detalle-cuenta-cobrar.component.scss'],
})
export class DetalleCuentaCobrarComponent implements OnInit {
  @Input() visible = false;
  @Input() cuenta: CuentaCobrarModel | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  showAbonoForm = false;
  loadingAbono = false;
  abonoForm: FormGroup;
  turnoActivo: TurnoCajaModel | null = null;
  loadingTurno = false;

  // Tirilla POS
  showTirilla = false;
  loadingTirilla = false;
  ventaImpresion: VentaModel | null = null;
  qrDataTirilla: string | null = null;
  cufeCodeTirilla: string | null = null;

  metodosPago = [
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Transferencia', value: 'transferencia' },
    { label: 'Consignación', value: 'consignacion' },
    { label: 'Cheque', value: 'cheque' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: CuentaCobrarService,
    private readonly cajaService: TurnoCajaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly ventaService: VentaService,
    private readonly empresaService: EmpresaService,
    private readonly indexDBService: IndexDBService,
  ) {
    this.abonoForm = this.fb.group({
      monto: [null, [Validators.required, Validators.min(1)]],
      metodoPago: ['efectivo', Validators.required],
      referencia: [null],
      fechaPago: [new Date(), Validators.required],
    });
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

  async imprimirRecibo(abono: AbonoCobrarModel): Promise<void> {
    try {
      const blob = await lastValueFrom(
        this.service.descargarAbonoPdf(abono.id),
      );
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'width=800,height=600');
    } catch (err: any) {
      this.alert.showError('Error', 'No se pudo generar el recibo de caja');
    }
  }

  async imprimirTirilla(): Promise<void> {
    if (!this.cuenta?.ventaId) {
      this.alert.showError(
        'Sin venta asociada',
        'Esta cuenta no tiene una venta relacionada para imprimir la tirilla',
      );
      return;
    }

    this.loadingTirilla = true;
    this.qrDataTirilla = null;
    this.cufeCodeTirilla = null;

    try {
      // Cargar venta + empresa + cajero en paralelo
      const [ventaRes, empresaRes, auth] = await Promise.all([
        lastValueFrom(this.ventaService.getById(this.cuenta.ventaId)),
        lastValueFrom(this.empresaService.getConfig()),
        this.indexDBService.loadDataAuthDB(),
      ]);

      const empresa = empresaRes?.data;
      const ventaFull = ventaRes?.data;

      this.ventaImpresion = {
        ...ventaFull,
        // Datos empresa
        logoUrl: empresa?.logoUrl ?? '',
        razonSocial: empresa?.razonSocial ?? '',
        empresaNombre: empresa?.razonSocial ?? '',
        empresaNit: empresa?.nit ?? '',
        empresaDireccion: empresa?.direccion ?? '',
        empresaEmail: empresa?.correo ?? '',
        empresaTelefono: empresa?.telefono ?? '',
        municipio: empresa?.municipio ?? '',
        // Cajero del usuario logueado
        cajeroNombre: auth?.nombreCompleto ?? '',
        // Resolución FE
        resolucionNumero: empresa?.resolucionNumero ?? null,
        resolucionPrefijo: empresa?.resolucionPrefijo ?? null,
        resolucionDesde: empresa?.resolucionDesde ?? null,
        resolucionHasta: empresa?.resolucionHasta ?? null,
        resolucionFechaDesde: empresa?.resolucionFechaDesde ?? null,
        resolucionFechaHasta: empresa?.resolucionFechaHasta ?? null,
      } as unknown as VentaModel;

      // Si la venta tiene FE, usar los datos que ya vienen del backend
      if (ventaFull?.cufe) {
        this.qrDataTirilla = ventaFull.qrData ?? null;
        this.cufeCodeTirilla = ventaFull.cufe;
      }

      this.showTirilla = true;
      this.cdr.markForCheck();
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la venta');
    } finally {
      this.loadingTirilla = false;
      this.cdr.markForCheck();
    }
  }

  onTirillaClose(): void {
    this.showTirilla = false;
    this.ventaImpresion = null;
  }
  ngOnInit(): void {
    this.loadTurnoActivo();
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
      referencia: null,
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

    const dto: CreateAbonoCobrarDto = {
      monto: formValue.monto,
      metodoPago: formValue.metodoPago as MetodoPago,
      referencia: formValue.referencia || null,
      fechaPago: formValue.fechaPago.toISOString(),
      turnoCajaId: this.turnoActivo?.id ?? null,
    };

    try {
      await lastValueFrom(this.service.createAbono(this.cuenta.id, dto));
      this.alert.showSuccess(
        'Abono registrado',
        'El abono ha sido registrado exitosamente',
      );
      this.showAbonoForm = false;
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message || 'No se pudo registrar el abono',
      );
    } finally {
      this.loadingAbono = false;
      this.cdr.markForCheck();
    }
  }

  confirmDeleteAbono(abono: AbonoCobrarModel): void {
    this.confirm.confirm({
      message: `¿Eliminar el abono de <b>${this.formatCOP(abono.monto)}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAbono(abono),
    });
  }

  async deleteAbono(abono: AbonoCobrarModel): Promise<void> {
    if (!this.cuenta) return;

    try {
      await lastValueFrom(this.service.deleteAbono(this.cuenta.id, abono.id));
      this.alert.showSuccess('Abono eliminado', 'El abono ha sido eliminado');
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message || 'No se pudo eliminar el abono',
      );
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
