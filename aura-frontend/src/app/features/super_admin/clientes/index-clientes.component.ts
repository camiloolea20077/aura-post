import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ClienteService } from './cliente.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  ClienteModel,
  ClientesResumen,
  EstadoMembresia,
  GuardarSuscripcionDto,
  MetodoPago,
  RegistrarPagoDto,
  SuscripcionPagoModel,
  TipoPlan,
} from './cliente.model';

type Sev = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-index-clientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputNumberModule,
    CalendarModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './index-clientes.component.html',
  styleUrls: ['./index-clientes.component.scss'],
})
export class IndexClientesComponent implements OnInit {
  clientes: ClienteModel[] = [];
  resumen: ClientesResumen | null = null;
  loading = false;

  // Filtros
  search = '';
  filtroPlan: TipoPlan | 'TODOS' = 'TODOS';
  filtroEstado: string = 'TODOS';

  readonly planOpts = [
    { label: 'Todos los planes', value: 'TODOS' },
    { label: 'Mensual', value: 'MENSUAL' },
    { label: 'Pago único', value: 'UNICO' },
  ];
  readonly estadoFiltroOpts = [
    { label: 'Todos los estados', value: 'TODOS' },
    { label: 'Activa', value: 'ACTIVA' },
    { label: 'Vencida', value: 'VENCIDA' },
    { label: 'En prueba', value: 'PRUEBA' },
    { label: 'Suspendida', value: 'SUSPENDIDA' },
    { label: 'Cancelada', value: 'CANCELADA' },
    { label: 'Sin membresía', value: 'SIN_MEMBRESIA' },
  ];
  readonly tipoPlanOpts = [
    { label: 'Mensual', value: 'MENSUAL' },
    { label: 'Pago único', value: 'UNICO' },
  ];
  readonly estadoOpts = [
    { label: 'Activa', value: 'ACTIVA' },
    { label: 'En prueba', value: 'PRUEBA' },
    { label: 'Suspendida', value: 'SUSPENDIDA' },
    { label: 'Cancelada', value: 'CANCELADA' },
  ];
  readonly metodoOpts = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Tarjeta', value: 'TARJETA' },
    { label: 'Pasarela', value: 'PASARELA' },
    { label: 'Otro', value: 'OTRO' },
  ];

  // Dialog membresía
  showMembresia = false;
  savingMembresia = false;
  editCliente: ClienteModel | null = null;
  form = this.emptyForm();
  formFechaInicio: Date | null = null;
  formProximoPago: Date | null = null;

  // Dialog pago
  showPago = false;
  savingPago = false;
  pagoCliente: ClienteModel | null = null;
  pago = this.emptyPago();
  pagoFecha: Date | null = null;
  pagoDesde: Date | null = null;
  pagoHasta: Date | null = null;

  // Dialog historial
  showHistorial = false;
  historial: SuscripcionPagoModel[] = [];
  historialCliente: ClienteModel | null = null;

  constructor(
    private readonly service: ClienteService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const [cli, res] = await Promise.all([
        lastValueFrom(this.service.listar()),
        lastValueFrom(this.service.resumen()),
      ]);
      this.clientes = cli?.data ?? [];
      this.resumen = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los clientes');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  get filtrados(): ClienteModel[] {
    const q = this.search.trim().toLowerCase();
    return this.clientes.filter((c) => {
      if (q) {
        const hay =
          c.razonSocial?.toLowerCase().includes(q) ||
          c.nombreComercial?.toLowerCase().includes(q) ||
          c.nit?.toLowerCase().includes(q);
        if (!hay) return false;
      }
      if (this.filtroPlan !== 'TODOS' && c.tipoPlan !== this.filtroPlan)
        return false;
      if (this.filtroEstado !== 'TODOS' && c.estadoEfectivo !== this.filtroEstado)
        return false;
      return true;
    });
  }

  // ── Membresía ────────────────────────────────────────────────
  abrirMembresia(c: ClienteModel): void {
    this.editCliente = c;
    this.form = {
      tipoPlan: (c.tipoPlan as TipoPlan) ?? 'MENSUAL',
      estado: (c.estado as EstadoMembresia) ?? 'ACTIVA',
      valor: c.valor ?? 0,
      moneda: c.moneda ?? 'COP',
      contactoNombre: c.contactoNombre ?? null,
      contactoEmail: c.contactoEmail ?? null,
      contactoTelefono: c.contactoTelefono ?? null,
      notas: null,
    };
    this.formFechaInicio = this.parse(c.fechaInicio);
    this.formProximoPago = this.parse(c.fechaProximoPago);
    this.showMembresia = true;
    this.cdr.markForCheck();
  }

  async guardarMembresia(): Promise<void> {
    if (!this.editCliente) return;
    this.savingMembresia = true;
    this.cdr.markForCheck();
    const dto: GuardarSuscripcionDto = {
      ...this.form,
      fechaInicio: this.toISO(this.formFechaInicio),
      fechaProximoPago:
        this.form.tipoPlan === 'UNICO' ? null : this.toISO(this.formProximoPago),
    };
    try {
      await lastValueFrom(
        this.service.guardarSuscripcion(this.editCliente.empresaId, dto),
      );
      this.alertService.showSuccess('Guardada', 'Membresía actualizada');
      this.showMembresia = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo guardar',
      );
    } finally {
      this.savingMembresia = false;
      this.cdr.markForCheck();
    }
  }

  // ── Pago ─────────────────────────────────────────────────────
  abrirPago(c: ClienteModel): void {
    this.pagoCliente = c;
    this.pago = this.emptyPago();
    this.pago.monto = c.valor ?? 0;
    this.pagoFecha = new Date();
    this.pagoDesde = null;
    this.pagoHasta = null;
    this.showPago = true;
    this.cdr.markForCheck();
  }

  async guardarPago(): Promise<void> {
    if (!this.pagoCliente || !this.pagoFecha || !this.pago.monto) {
      this.alertService.showWarn('Requerido', 'Ingresa fecha y monto del pago');
      return;
    }
    this.savingPago = true;
    this.cdr.markForCheck();
    const dto: RegistrarPagoDto = {
      fechaPago: this.toISO(this.pagoFecha)!,
      monto: this.pago.monto,
      metodo: this.pago.metodo,
      periodoDesde: this.toISO(this.pagoDesde),
      periodoHasta: this.toISO(this.pagoHasta),
      referencia: this.pago.referencia,
      observacion: this.pago.observacion,
      avanzarProximoPago: this.pago.avanzarProximoPago,
    };
    try {
      await lastValueFrom(
        this.service.registrarPago(this.pagoCliente.empresaId, dto),
      );
      this.alertService.showSuccess('Registrado', 'Pago registrado');
      this.showPago = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo registrar el pago',
      );
    } finally {
      this.savingPago = false;
      this.cdr.markForCheck();
    }
  }

  // ── Historial ────────────────────────────────────────────────
  async abrirHistorial(c: ClienteModel): Promise<void> {
    this.historialCliente = c;
    this.historial = [];
    this.showHistorial = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.pagos(c.empresaId));
      this.historial = res?.data ?? [];
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el historial');
    }
  }

  async eliminarPago(p: SuscripcionPagoModel): Promise<void> {
    if (!confirm('¿Eliminar este pago del historial?')) return;
    try {
      await lastValueFrom(this.service.eliminarPago(p.id));
      this.alertService.showSuccess('Eliminado', 'Pago eliminado');
      if (this.historialCliente) await this.abrirHistorial(this.historialCliente);
      await this.cargar();
    } catch {
      this.alertService.showError('Error', 'No se pudo eliminar');
    }
  }

  // ── Helpers ──────────────────────────────────────────────────
  estadoSeverity(estado: string): Sev {
    const m: Record<string, Sev> = {
      ACTIVA: 'success',
      VENCIDA: 'danger',
      PRUEBA: 'info',
      SUSPENDIDA: 'warn',
      CANCELADA: 'secondary',
      SIN_MEMBRESIA: 'contrast',
    };
    return m[estado] ?? 'secondary';
  }

  diasLabel(dias: number | null): string {
    if (dias === null) return '';
    if (dias < 0) return `${-dias}d vencido`;
    if (dias === 0) return 'vence hoy';
    return `en ${dias}d`;
  }

  planLabel(plan: string | null): string {
    if (plan === 'MENSUAL') return 'Mensual';
    if (plan === 'UNICO') return 'Pago único';
    return '—';
  }

  formatMonto(v: number | null | undefined, moneda = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda || 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private toISO(d: Date | null): string | null {
    if (!d) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private parse(s: string | null): Date | null {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }

  private emptyForm() {
    return {
      tipoPlan: 'MENSUAL' as TipoPlan,
      estado: 'ACTIVA' as EstadoMembresia,
      valor: 0 as number | null,
      moneda: 'COP' as string | null,
      contactoNombre: null as string | null,
      contactoEmail: null as string | null,
      contactoTelefono: null as string | null,
      notas: null as string | null,
    };
  }

  private emptyPago() {
    return {
      monto: 0 as number | null,
      metodo: 'TRANSFERENCIA' as MetodoPago | null,
      referencia: null as string | null,
      observacion: null as string | null,
      avanzarProximoPago: true,
    };
  }
}
