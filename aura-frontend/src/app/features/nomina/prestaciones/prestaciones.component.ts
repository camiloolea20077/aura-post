import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { PrestacionService } from '../../../core/services/prestacion.service';
import { NominaService } from '../../../core/services/nomina.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { NominaPdfService } from '../../../core/services/nomina-pdf.service';
import {
  EmpresaConfig,
  EmpresaService,
} from '../../../core/services/empresa.service';
import {
  CrearPrestacionDto,
  EstadoPrestacion,
  LotePrestacionModel,
  PrestacionModel,
  TipoPrestacion,
} from '../../../core/models/prestacion.model';
import { MedioPagoNomina } from '../../../core/models/nomina.model';
import { CuentaBancariaModel } from '../../../core/models/cuenta-bancaria.model';
import { AlertService } from '../../../shared/pipes/alert.service';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-prestaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './prestaciones.component.html',
  styleUrls: ['./prestaciones.component.scss'],
})
export class PrestacionesComponent implements OnInit {
  public lotes: LotePrestacionModel[] = [];
  public loading = true;

  // Detalle de un lote (desglose por concepto)
  public showDetalle = false;
  public loadingDetalle = false;
  public detalleLoteSel: LotePrestacionModel | null = null;
  public detalleFilas: PrestacionModel[] = [];

  // Nueva
  public showForm = false;
  public saving = false;
  public empleados: { id: number; nombreCompleto: string }[] = [];
  public form = {
    empleadoId: null as number | null,
    tipo: 'PRIMA' as TipoPrestacion,
    fechaDesde: null as Date | null,
    fechaHasta: null as Date | null,
    observacion: '',
  };
  public tipos = [
    { label: 'Prima de servicios', value: 'PRIMA' },
    { label: 'Vacaciones', value: 'VACACIONES' },
    { label: 'Cesantías', value: 'CESANTIAS' },
    { label: 'Intereses de cesantías', value: 'INTERESES_CESANTIAS' },
  ];

  // Generar en lote (F4): prima/cesantías para todos los activos
  public showLote = false;
  public savingLote = false;
  public formLote = {
    tipo: 'PRIMA' as TipoPrestacion,
    fechaDesde: null as Date | null,
    fechaHasta: null as Date | null,
    observacion: '',
  };

  // Liquidación definitiva
  public showDefinitiva = false;
  public savingDef = false;
  public defEmpleadoId: number | null = null;
  public defFechaRetiro: Date | null = null;
  public defMotivo: string | null = null;
  public defCesantiasCorte: Date | null = null;
  public motivos = [
    { label: 'Renuncia', value: 'RENUNCIA' },
    {
      label: 'Despido SIN justa causa (con indemnización)',
      value: 'DESPIDO_SIN_JUSTA_CAUSA',
    },
    { label: 'Despido con justa causa', value: 'DESPIDO_CON_JUSTA_CAUSA' },
    { label: 'Mutuo acuerdo', value: 'MUTUO_ACUERDO' },
    { label: 'Terminación de contrato', value: 'FIN_CONTRATO' },
  ];

  // Pago
  public showPago = false;
  public pagando = false;
  public pagoLote: string | null = null;
  public medioPago: MedioPagoNomina = 'TRANSFERENCIA';
  public cuentaBancariaId: number | null = null;
  public cuentas: CuentaBancariaModel[] = [];
  public mediosPago = [
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Efectivo', value: 'EFECTIVO' },
  ];

  private empresa: EmpresaConfig | null = null;

  constructor(
    private readonly prestacionService: PrestacionService,
    private readonly nominaService: NominaService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly nominaPdf: NominaPdfService,
    private readonly empresaService: EmpresaService,
    private readonly alertService: AlertService,
    private readonly confirm: ConfirmationService,
  ) {}

  async descargarPdf(p: PrestacionModel): Promise<void> {
    try {
      if (!this.empresa) {
        const res = await lastValueFrom(this.empresaService.getConfig());
        this.empresa = res?.data ?? {};
      }
      await this.nominaPdf.prestacion(p, this.empresa);
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el PDF');
    }
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.prestacionService.listarLotes());
      this.lotes = res?.data ?? [];
    } catch {
      this.lotes = [];
    } finally {
      this.loading = false;
    }
  }

  /** Abre el desglose por concepto de un lote. */
  async verDetalle(l: LotePrestacionModel): Promise<void> {
    this.detalleLoteSel = l;
    this.showDetalle = true;
    this.loadingDetalle = true;
    this.detalleFilas = [];
    try {
      const res = await lastValueFrom(this.prestacionService.detalleLote(l.lote));
      this.detalleFilas = res?.data ?? [];
    } catch {
      this.detalleFilas = [];
    } finally {
      this.loadingDetalle = false;
    }
  }

  get empleadosOpts() {
    return this.empleados.map((e) => ({
      label: e.nombreCompleto,
      value: e.id,
    }));
  }
  get cuentasOpts() {
    return this.cuentas.map((c) => ({
      label: `${c.nombre}${c.banco ? ' · ' + c.banco : ''}${c.numeroCuenta ? ' · ' + c.numeroCuenta : ''}`,
      value: c.id,
    }));
  }

  // ── Nueva ──
  async abrirForm(): Promise<void> {
    this.form = {
      empleadoId: null,
      tipo: 'PRIMA',
      fechaDesde: null,
      fechaHasta: null,
      observacion: '',
    };
    this.showForm = true;
    await this.cargarEmpleados();
  }

  /** Solo empleados con contrato activo: los retirados no deben liquidarse. */
  private async cargarEmpleados(): Promise<void> {
    if (this.empleados.length > 0) return;
    try {
      const res = await lastValueFrom(
        this.nominaService.empleadosConContratoActivo(),
      );
      this.empleados = (res?.data ?? []).map((e) => ({
        id: e.id,
        nombreCompleto: `${e.nombres} ${e.apellidos}`,
      }));
    } catch {
      this.empleados = [];
    }
  }

  // ── Generar en lote (F4) ──
  abrirLote(): void {
    this.formLote = {
      tipo: 'PRIMA',
      fechaDesde: null,
      fechaHasta: null,
      observacion: '',
    };
    this.showLote = true;
  }

  async generarLote(): Promise<void> {
    if (!this.formLote.fechaDesde || !this.formLote.fechaHasta) {
      this.alertService.showWarn('Requerido', 'Indica el período (desde y hasta)');
      return;
    }
    this.savingLote = true;
    try {
      const res = await lastValueFrom(
        this.prestacionService.generarLote({
          tipo: this.formLote.tipo,
          fechaDesde: this.fmt(this.formLote.fechaDesde),
          fechaHasta: this.fmt(this.formLote.fechaHasta),
          observacion: this.formLote.observacion || null,
        }),
      );
      const n = res?.data?.length ?? 0;
      this.alertService.showSuccess(
        'Generado',
        `Lote generado para ${n} empleado(s)`,
      );
      this.showLote = false;
      await this.load();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo generar el lote',
      );
    } finally {
      this.savingLote = false;
    }
  }

  async guardar(): Promise<void> {
    if (
      this.form.empleadoId == null ||
      !this.form.fechaDesde ||
      !this.form.fechaHasta
    ) {
      this.alertService.showWarn(
        'Requerido',
        'Empleado, tipo y fechas son obligatorios',
      );
      return;
    }
    this.saving = true;
    try {
      const dto: CrearPrestacionDto = {
        empleadoId: this.form.empleadoId,
        tipo: this.form.tipo,
        fechaDesde: this.fmt(this.form.fechaDesde),
        fechaHasta: this.fmt(this.form.fechaHasta),
        observacion: this.form.observacion || null,
      };
      await lastValueFrom(this.prestacionService.crear(dto));
      this.alertService.showSuccess('Creada', 'Prestación calculada');
      this.showForm = false;
      await this.load();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo crear',
      );
    } finally {
      this.saving = false;
    }
  }

  // ── Liquidación definitiva ──
  async abrirDefinitiva(): Promise<void> {
    this.defEmpleadoId = null;
    this.defFechaRetiro = null;
    this.defMotivo = null;
    this.defCesantiasCorte = null;
    this.showDefinitiva = true;
    await this.cargarEmpleados();
  }

  async liquidarDefinitiva(): Promise<void> {
    if (this.defEmpleadoId == null) {
      this.alertService.showWarn('Requerido', 'Selecciona el empleado');
      return;
    }
    this.savingDef = true;
    try {
      const res = await lastValueFrom(
        this.prestacionService.liquidacionDefinitiva({
          empleadoId: this.defEmpleadoId,
          fechaRetiro: this.defFechaRetiro
            ? this.fmt(this.defFechaRetiro)
            : null,
          motivo: (this.defMotivo as any) ?? null,
          cesantiasCorteHasta: this.defCesantiasCorte
            ? this.fmt(this.defCesantiasCorte)
            : null,
        }),
      );
      const n = res?.data?.length ?? 0;
      this.alertService.showSuccess(
        'Calculada',
        `Liquidación definitiva: ${n} prestación(es) generada(s)`,
      );
      this.showDefinitiva = false;
      await this.load();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo liquidar',
      );
    } finally {
      this.savingDef = false;
    }
  }

  async aprobar(l: LotePrestacionModel): Promise<void> {
    try {
      await lastValueFrom(this.prestacionService.aprobarLote(l.lote));
      this.alertService.showSuccess('Aprobada', 'Liquidación aprobada');
      await this.refrescar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo aprobar');
    }
  }

  anular(l: LotePrestacionModel): void {
    const msg = l.definitiva
      ? `¿Anular la liquidación definitiva de ${l.empleadoNombre}? Se reactivará el empleado y su contrato.`
      : `¿Anular la ${l.tipoResumen.toLowerCase()} de ${l.empleadoNombre}?`;
    this.confirm.confirm({
      message: msg,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.prestacionService.anularLote(l.lote));
          this.alertService.showSuccess('Anulada', 'Liquidación anulada');
          await this.refrescar();
        } catch (err: any) {
          this.alertService.showError('Error', err?.error?.message ?? 'No se pudo anular');
        }
      },
    });
  }

  // ── Pago ──
  async abrirPago(l: LotePrestacionModel): Promise<void> {
    this.pagoLote = l.lote;
    this.medioPago = 'TRANSFERENCIA';
    this.cuentaBancariaId = null;
    this.showPago = true;
    if (this.cuentas.length === 0) {
      try {
        const res = await lastValueFrom(this.cuentaBancariaService.list());
        this.cuentas = (res?.data ?? []).filter((c) => c.activa);
      } catch {
        this.cuentas = [];
      }
    }
  }

  async confirmarPago(): Promise<void> {
    if (this.pagoLote == null) return;
    if (this.medioPago === 'TRANSFERENCIA' && this.cuentaBancariaId == null) {
      this.alertService.showWarn('Requerido', 'Selecciona la cuenta bancaria de origen');
      return;
    }
    this.pagando = true;
    try {
      await lastValueFrom(
        this.prestacionService.pagarLote(this.pagoLote, {
          medioPago: this.medioPago,
          cuentaBancariaId:
            this.medioPago === 'TRANSFERENCIA' ? this.cuentaBancariaId : null,
        }),
      );
      // B-07 — una transferencia queda PROGRAMADA hasta confirmar que el banco
      // pagó; el efectivo/cheque sí queda pagado de una.
      if (this.medioPago === 'TRANSFERENCIA') {
        this.alertService.showSuccess(
          'Programada',
          'Pago programado. Confírmalo cuando el banco haya hecho la transferencia.',
        );
      } else {
        this.alertService.showSuccess('Pagada', 'Liquidación pagada');
      }
      this.showPago = false;
      await this.refrescar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo pagar');
    } finally {
      this.pagando = false;
    }
  }

  /** B-07 — confirma una transferencia ya PROGRAMADA (el banco confirmó el pago). */
  async confirmarProgramado(l: LotePrestacionModel): Promise<void> {
    this.confirm.confirm({
      message: `¿Confirmar que el banco ya pagó la ${l.tipoResumen.toLowerCase()} de ${l.empleadoNombre}? Se descontará del banco y se contabilizará.`,
      header: 'Confirmar pago',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, el banco pagó',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await lastValueFrom(this.prestacionService.confirmarPagoLote(l.lote));
          this.alertService.showSuccess('Pagada', 'Pago confirmado');
          await this.refrescar();
        } catch (err: any) {
          this.alertService.showError('Error', err?.error?.message ?? 'No se pudo confirmar');
        }
      },
    });
  }

  /** Recarga el listado y, si está abierto, el detalle. */
  private async refrescar(): Promise<void> {
    await this.load();
    if (this.showDetalle && this.detalleLoteSel) {
      const actual = this.lotes.find((x) => x.lote === this.detalleLoteSel!.lote);
      if (actual) await this.verDetalle(actual);
    }
  }

  // ── Helpers ──
  private fmt(d: Date): string {
    return aFechaLocal(d);
  }
  formatMonto(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
  tipoLabel(t: string): string {
    const m: Record<string, string> = {
      PRIMA: 'Prima',
      VACACIONES: 'Vacaciones',
      CESANTIAS: 'Cesantías',
      INTERESES_CESANTIAS: 'Int. cesantías',
      INDEMNIZACION: 'Indemnización',
    };
    return m[t] ?? t;
  }
  estadoSeverity(e: EstadoPrestacion): TagSeverity {
    const m: Record<EstadoPrestacion, TagSeverity> = {
      BORRADOR: 'warn',
      APROBADA: 'success',
      PROGRAMADA: 'warn',
      PAGADA: 'info',
      ANULADA: 'danger',
    };
    return m[e];
  }
}
