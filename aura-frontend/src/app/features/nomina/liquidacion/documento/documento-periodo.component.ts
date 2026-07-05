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
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { NominaService } from '../../../../core/services/nomina.service';
import { NominaPdfService } from '../../../../core/services/nomina-pdf.service';
import {
  EmpresaConfig,
  EmpresaService,
} from '../../../../core/services/empresa.service';
import { CuentaBancariaService } from '../../../../core/services/cuenta-bancaria.service';
import { CuentaBancariaModel } from '../../../../core/models/cuenta-bancaria.model';
import {
  EstadoNomina,
  MedioPagoNomina,
  PeriodoResumenModel,
} from '../../../../core/models/nomina.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-documento-periodo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    TableModule,
    TagModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    SkeletonModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './documento-periodo.component.html',
  styleUrls: ['./documento-periodo.component.scss'],
})
export class DocumentoPeriodoComponent implements OnChanges {
  @Input() visible = false;
  @Input() periodoId: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() verNomina = new EventEmitter<number>();
  @Output() pagado = new EventEmitter<void>();

  public loading = false;
  public data: PeriodoResumenModel | null = null;
  public activeTab = 0;
  public generandoPdf = false;
  public liquidando = false;
  private empresa: EmpresaConfig | null = null;

  // Pago del período
  public showPago = false;
  public pagando = false;
  public medioPago: MedioPagoNomina = 'TRANSFERENCIA';
  public cuentaBancariaId: number | null = null;
  public cuentas: CuentaBancariaModel[] = [];
  public mediosPago = [
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Efectivo', value: 'EFECTIVO' },
  ];

  constructor(
    private readonly nominaService: NominaService,
    private readonly nominaPdf: NominaPdfService,
    private readonly empresaService: EmpresaService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['periodoId'] && this.periodoId != null) {
      this.cargar();
    }
  }

  async cargar(): Promise<void> {
    if (this.periodoId == null) return;
    this.loading = true;
    this.activeTab = 0;
    try {
      const res = await lastValueFrom(
        this.nominaService.getResumenPeriodo(this.periodoId),
      );
      this.data = res?.data ?? null;
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo cargar el documento de nómina',
      );
      this.data = null;
    } finally {
      this.loading = false;
    }
  }

  onHide(): void {
    this.data = null;
    this.closed.emit();
  }

  /** El período aún no ha sido liquidado. */
  get puedeLiquidar(): boolean {
    return this.data?.estado === 'ABIERTO';
  }

  liquidarTodos(): void {
    if (this.periodoId == null) return;
    this.confirmationService.confirm({
      header: 'Liquidar nómina',
      message: '¿Liquidar la nómina para todos los empleados activos de este período?',
      icon: 'pi pi-bolt',
      acceptLabel: 'Sí, liquidar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        this.liquidando = true;
        try {
          await lastValueFrom(this.nominaService.liquidarTodos(this.periodoId!));
          this.alertService.showSuccess('Liquidado', 'Nómina liquidada para los empleados activos');
          await this.cargar();
          this.pagado.emit(); // refresca la lista de períodos por detrás
        } catch (err: any) {
          this.alertService.showError('Error', err?.error?.message ?? 'No se pudo liquidar la nómina');
        } finally {
          this.liquidando = false;
        }
      },
    });
  }

  abrirEmpleado(nominaId: number): void {
    this.verNomina.emit(nominaId);
  }

  private async getEmpresa(): Promise<EmpresaConfig> {
    if (!this.empresa) {
      const res = await lastValueFrom(this.empresaService.getConfig());
      this.empresa = res?.data ?? {};
    }
    return this.empresa;
  }

  /** PDF de dispersión: tabla de empleados del período. */
  async descargarDispersion(): Promise<void> {
    if (!this.data) return;
    this.generandoPdf = true;
    try {
      const empresa = await this.getEmpresa();
      await this.nominaPdf.dispersion(this.data, empresa);
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el PDF');
    } finally {
      this.generandoPdf = false;
    }
  }

  /** Desprendible horizontal de un empleado (carga la nómina completa). */
  async descargarDesprendible(nominaId: number): Promise<void> {
    this.generandoPdf = true;
    try {
      const [empresa, nomRes] = await Promise.all([
        this.getEmpresa(),
        lastValueFrom(this.nominaService.getNominaById(nominaId)),
      ]);
      const nomina = nomRes?.data;
      if (!nomina) throw new Error('sin datos');
      await this.nominaPdf.desprendible(nomina, empresa);
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo generar el desprendible',
      );
    } finally {
      this.generandoPdf = false;
    }
  }

  get hayAprobadas(): boolean {
    return !!this.data?.empleados.some((e) => e.estado === 'APROBADO');
  }

  get cuentasOpts() {
    return this.cuentas.map((c) => ({
      label: `${c.nombre}${c.banco ? ' · ' + c.banco : ''}${c.numeroCuenta ? ' · ' + c.numeroCuenta : ''}`,
      value: c.id,
    }));
  }

  async abrirPago(): Promise<void> {
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
    if (this.periodoId == null) return;
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
        this.nominaService.pagarPeriodo(this.periodoId, {
          medioPago: this.medioPago,
          cuentaBancariaId:
            this.medioPago === 'TRANSFERENCIA' ? this.cuentaBancariaId : null,
        }),
      );
      this.alertService.showSuccess(
        'Pagado',
        'Nóminas aprobadas del período pagadas',
      );
      this.showPago = false;
      await this.cargar();
      this.pagado.emit();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo pagar el período',
      );
    } finally {
      this.pagando = false;
    }
  }

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatMonto(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  formatCantidad(v: number): string {
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(
      v ?? 0,
    );
  }

  estadoLabel(e: EstadoNomina | string): string {
    const m: Record<string, string> = {
      BORRADOR: 'Borrador',
      APROBADO: 'Aprobado',
      PAGADO: 'Pagado',
      ANULADO: 'Anulado',
      ABIERTO: 'Abierto',
      LIQUIDADO: 'Liquidado',
    };
    return m[e] ?? e;
  }

  estadoSeverity(e: EstadoNomina | string): TagSeverity {
    const m: Record<string, TagSeverity> = {
      BORRADOR: 'warn',
      APROBADO: 'success',
      PAGADO: 'info',
      ANULADO: 'danger',
      ABIERTO: 'success',
      LIQUIDADO: 'info',
    };
    return m[e];
  }
}
