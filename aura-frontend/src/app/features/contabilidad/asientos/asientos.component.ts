import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { CentroCostoService } from '../../../core/services/centro-costo.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  AsientoContableModel, BalanceGeneralModel,
  CreateAsientoDto, CreateAsientoDetalleDto, PlanCuentaModel,
  EstadoResultadosModel, FlujoCajaModel, LibroMayorLineaModel,
} from '../../../core/models/contabilidad.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import { CentroCostoDto } from '../../../core/models/centro-costo.model';

@Component({
  selector: 'app-asientos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, CalendarModule, DropdownModule,
    DialogModule, TabViewModule, TagModule, ToastModule, TooltipModule,
    InputTextModule, InputNumberModule, SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './asientos.component.html',
  styleUrls: ['./asientos.component.scss'],
})
export class AsientosComponent implements OnInit {
  readonly Math = Math;

  // ── Libro Diario ─────────────────────────────────────────────────
  asientos: AsientoContableModel[] = [];
  totalRows = 0;
  loading = false;
  rangoFechas: Date[] = [
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(),
  ];
  tipoOrigenFiltro: string | null = null;
  page = 0;
  rows = 20;

  // ── Estado de Resultados ─────────────────────────────────────────
  estadoResultados: EstadoResultadosModel | null = null;
  loadingPyG = false;
  rangoFechasPyG: Date[] = [
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(),
  ];

  // ── Libro Mayor ──────────────────────────────────────────────────
  libroMayorLineas: LibroMayorLineaModel[] = [];
  loadingMayor = false;
  cuentaMayorId: number | null = null;
  rangoFechasMayor: Date[] = [
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(),
  ];

  // ── Flujo de Caja ────────────────────────────────────────────────
  flujoCaja: FlujoCajaModel | null = null;
  loadingFlujo = false;
  rangoFechasFlujo: Date[] = [
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(),
  ];

  // ── Balance ──────────────────────────────────────────────────────
  balance: BalanceGeneralModel | null = null;
  loadingBalance = false;
  showBalance = false;

  // ── Detalle ──────────────────────────────────────────────────────
  asientoDetalle: AsientoContableModel | null = null;
  showDetalle = false;

  // ── Crear asiento ────────────────────────────────────────────────
  showCrear = false;
  saving = false;
  cuentas: PlanCuentaModel[] = [];
  formAsiento: CreateAsientoDto = this.emptyForm();

  // Selectores para líneas de detalle
  terceroOpts: { label: string; value: number }[] = [];
  centroCostoOpts: { label: string; value: number }[] = [];

  readonly tipoOrigenOpts = [
    { label: 'Todos', value: null },
    { label: 'Manual', value: 'MANUAL' },
    { label: 'Venta', value: 'VENTA' },
    { label: 'Compra', value: 'COMPRA' },
    { label: 'Gasto', value: 'GASTO' },
    { label: 'Nómina', value: 'NOMINA' },
    { label: 'Tesorería', value: 'TESORERIA' },
  ];

  get cuentasAuxOpts() {
    return this.cuentas
      .filter((c) => c.auxiliar && c.activa)
      .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
  }

  get cuentasMayorOpts() {
    return this.cuentas
      .filter((c) => c.activa)
      .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
  }

  get totalDebito(): number {
    return this.formAsiento.detalles.reduce((s, d) => s + (d.debito || 0), 0);
  }

  get totalCredito(): number {
    return this.formAsiento.detalles.reduce((s, d) => s + (d.credito || 0), 0);
  }

  get asientoCuadrado(): boolean {
    return Math.abs(this.totalDebito - this.totalCredito) < 0.01 && this.totalDebito > 0;
  }

  get libroMayorTotalDebito(): number {
    return this.libroMayorLineas.reduce((s, l) => s + (l.debito || 0), 0);
  }

  get libroMayorTotalCredito(): number {
    return this.libroMayorLineas.reduce((s, l) => s + (l.credito || 0), 0);
  }

  constructor(
    private readonly service: ContabilidadService,
    private readonly terceroService: TerceroService,
    private readonly ccService: CentroCostoService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarCuentas();
    this.cargarSelectores();
  }

  // ── Libro Diario ─────────────────────────────────────────────────

  async cargar(): Promise<void> {
    if (!this.rangoFechas[0] || !this.rangoFechas[1]) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const desde = this.toISO(this.rangoFechas[0]);
      const hasta = this.toISO(this.rangoFechas[1]);
      const res = await lastValueFrom(
        this.service.listarAsientos(desde, hasta, this.tipoOrigenFiltro, this.page, this.rows),
      );
      this.asientos = res?.data ?? [];
      this.totalRows = this.asientos[0]?.totalRows ?? 0;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar los asientos');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async cargarCuentas(): Promise<void> {
    const res = await lastValueFrom(this.service.listarPlan()).catch(() => null);
    this.cuentas = res?.data ?? [];
    this.cdr.markForCheck();
  }

  async cargarSelectores(): Promise<void> {
    const [tercRes, ccRes] = await Promise.all([
      lastValueFrom(this.terceroService.terceros()).catch(() => null),
      lastValueFrom(this.ccService.list()).catch(() => null),
    ]);
    this.terceroOpts = (tercRes?.data ?? []).map((t: TerceroTableModel) => ({
      label: `${t.numeroDocumento} — ${t.nombreCompleto}`,
      value: t.id,
    }));
    this.centroCostoOpts = (ccRes?.data ?? []).map((cc: CentroCostoDto) => ({
      label: `${cc.codigo} — ${cc.nombre}`,
      value: cc.id,
    }));
    this.cdr.markForCheck();
  }

  onPage(event: any): void {
    this.page = event.first / event.rows;
    this.rows = event.rows;
    this.cargar();
  }

  async verDetalle(a: AsientoContableModel): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.obtenerAsiento(a.id));
      this.asientoDetalle = res?.data ?? null;
      this.showDetalle = true;
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el detalle');
    }
  }

  async anular(a: AsientoContableModel): Promise<void> {
    if (!confirm('¿Anular este asiento manual?')) return;
    try {
      await lastValueFrom(this.service.anularAsiento(a.id));
      a.estado = 'ANULADO';
      this.alertService.showSuccess('Asiento anulado', '');
      this.cdr.markForCheck();
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo anular');
    }
  }

  // ── Estado de Resultados (P&G) ────────────────────────────────────

  async cargarPyG(): Promise<void> {
    if (!this.rangoFechasPyG[0] || !this.rangoFechasPyG[1]) return;
    this.loadingPyG = true;
    this.cdr.markForCheck();
    try {
      const desde = this.toISO(this.rangoFechasPyG[0]);
      const hasta = this.toISO(this.rangoFechasPyG[1]);
      const res = await lastValueFrom(this.service.estadoResultados(desde, hasta));
      this.estadoResultados = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el estado de resultados');
    } finally {
      this.loadingPyG = false;
      this.cdr.markForCheck();
    }
  }

  // ── Libro Mayor ──────────────────────────────────────────────────

  async cargarLibroMayor(): Promise<void> {
    if (!this.cuentaMayorId || !this.rangoFechasMayor[0] || !this.rangoFechasMayor[1]) return;
    this.loadingMayor = true;
    this.cdr.markForCheck();
    try {
      const desde = this.toISO(this.rangoFechasMayor[0]);
      const hasta = this.toISO(this.rangoFechasMayor[1]);
      const res = await lastValueFrom(this.service.libroMayor(this.cuentaMayorId, desde, hasta));
      this.libroMayorLineas = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el libro mayor');
    } finally {
      this.loadingMayor = false;
      this.cdr.markForCheck();
    }
  }

  // ── Flujo de Caja ────────────────────────────────────────────────

  async cargarFlujoCaja(): Promise<void> {
    if (!this.rangoFechasFlujo[0] || !this.rangoFechasFlujo[1]) return;
    this.loadingFlujo = true;
    this.cdr.markForCheck();
    try {
      const desde = this.toISO(this.rangoFechasFlujo[0]);
      const hasta = this.toISO(this.rangoFechasFlujo[1]);
      const res = await lastValueFrom(this.service.flujoCaja(desde, hasta));
      this.flujoCaja = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el flujo de caja');
    } finally {
      this.loadingFlujo = false;
      this.cdr.markForCheck();
    }
  }

  // ── Balance ──────────────────────────────────────────────────────

  async verBalance(): Promise<void> {
    this.loadingBalance = true;
    this.showBalance = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.balanceGeneral(this.toISO(new Date())));
      this.balance = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el balance');
    } finally {
      this.loadingBalance = false;
      this.cdr.markForCheck();
    }
  }

  // ── Crear asiento ────────────────────────────────────────────────

  abrirCrear(): void {
    this.formAsiento = this.emptyForm();
    this.showCrear = true;
    this.cdr.markForCheck();
  }

  agregarLinea(): void {
    this.formAsiento.detalles.push({ cuentaId: 0, debito: 0, credito: 0, terceroId: null, centroCostoId: null });
    this.cdr.markForCheck();
  }

  quitarLinea(i: number): void {
    this.formAsiento.detalles.splice(i, 1);
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (!this.asientoCuadrado) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.crearAsiento(this.formAsiento));
      this.showCrear = false;
      this.alertService.showSuccess('Asiento creado', '');
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo crear el asiento');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  estadoSeverity(estado: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const m: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      CONTABILIZADO: 'success', BORRADOR: 'warn', ANULADO: 'danger',
    };
    return m[estado] ?? 'secondary';
  }

  tipoOrigenBadge(tipo: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const m: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      MANUAL: 'info', VENTA: 'success', COMPRA: 'warn',
      GASTO: 'danger', NOMINA: 'secondary', TESORERIA: 'contrast',
    };
    return m[tipo] ?? 'secondary';
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }

  toISO(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private emptyForm(): CreateAsientoDto {
    return {
      fecha: new Date().toISOString().slice(0, 10),
      descripcion: '',
      detalles: [
        { cuentaId: 0, debito: 0, credito: 0, terceroId: null, centroCostoId: null },
        { cuentaId: 0, debito: 0, credito: 0, terceroId: null, centroCostoId: null },
      ],
    };
  }
}
