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
  PrestacionModel,
  TipoPrestacion,
} from '../../../core/models/prestacion.model';
import { MedioPagoNomina } from '../../../core/models/nomina.model';
import { EmpleadoTableModel } from '../../../core/models/nomina.model';
import { CuentaBancariaModel } from '../../../core/models/cuenta-bancaria.model';
import { AlertService } from '../../../shared/pipes/alert.service';

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
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './prestaciones.component.html',
  styleUrls: ['./prestaciones.component.scss'],
})
export class PrestacionesComponent implements OnInit {
  public items: PrestacionModel[] = [];
  public loading = true;

  // Nueva
  public showForm = false;
  public saving = false;
  public empleados: EmpleadoTableModel[] = [];
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

  // Liquidación definitiva
  public showDefinitiva = false;
  public savingDef = false;
  public defEmpleadoId: number | null = null;
  public defFechaRetiro: Date | null = null;
  public defMotivo: string | null = null;
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
  public pagoId: number | null = null;
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
      const res = await lastValueFrom(this.prestacionService.listar());
      this.items = res?.data ?? [];
    } catch {
      this.items = [];
    } finally {
      this.loading = false;
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
    if (this.empleados.length === 0) {
      try {
        const res = await lastValueFrom(
          this.nominaService.pageEmpleados({
            page: 0,
            rows: 500,
            search: null,
          }),
        );
        this.empleados = res?.data?.content ?? [];
      } catch {
        this.empleados = [];
      }
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
    this.showDefinitiva = true;
    if (this.empleados.length === 0) {
      try {
        const res = await lastValueFrom(
          this.nominaService.pageEmpleados({
            page: 0,
            rows: 500,
            search: null,
          }),
        );
        this.empleados = res?.data?.content ?? [];
      } catch {
        this.empleados = [];
      }
    }
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

  async aprobar(p: PrestacionModel): Promise<void> {
    try {
      await lastValueFrom(this.prestacionService.aprobar(p.id));
      this.alertService.showSuccess('Aprobada', 'Prestación aprobada');
      await this.load();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo aprobar',
      );
    }
  }

  anular(p: PrestacionModel): void {
    this.confirm.confirm({
      message: `¿Anular la ${p.tipo.toLowerCase()} de ${p.empleadoNombre}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.prestacionService.anular(p.id));
          this.alertService.showSuccess('Anulada', 'Prestación anulada');
          await this.load();
        } catch (err: any) {
          this.alertService.showError(
            'Error',
            err?.error?.message ?? 'No se pudo anular',
          );
        }
      },
    });
  }

  // ── Pago ──
  async abrirPago(p: PrestacionModel): Promise<void> {
    this.pagoId = p.id;
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
    if (this.pagoId == null) return;
    if (this.medioPago === 'TRANSFERENCIA' && this.cuentaBancariaId == null) {
      this.alertService.showWarn(
        'Requerido',
        'Selecciona la cuenta bancaria de origen',
      );
      return;
    }
    this.pagando = true;
    try {
      await lastValueFrom(
        this.prestacionService.pagar(this.pagoId, {
          medioPago: this.medioPago,
          cuentaBancariaId:
            this.medioPago === 'TRANSFERENCIA' ? this.cuentaBancariaId : null,
        }),
      );
      this.alertService.showSuccess('Pagada', 'Prestación pagada');
      this.showPago = false;
      await this.load();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo pagar',
      );
    } finally {
      this.pagando = false;
    }
  }

  // ── Helpers ──
  private fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }
  formatMonto(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
  tipoLabel(t: TipoPrestacion): string {
    const m: Record<TipoPrestacion, string> = {
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
      PAGADA: 'info',
      ANULADA: 'danger',
    };
    return m[e];
  }
}
