import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { TesoreriaService } from '../../../core/services/tesoreria.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  TesoreriaMovimientoModel,
  CreateMovimientoDto,
  CATEGORIAS_EGRESO,
  CATEGORIA_LABELS,
} from '../../../core/models/tesoreria.model';
import { CuentaBancariaModel } from '../../../core/models/cuenta-bancaria.model';

@Component({
  selector: 'app-index-egresos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, InputNumberModule,
    DropdownModule, CalendarModule, TableModule, TagModule,
    ToastModule, TooltipModule, DialogModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-egresos.component.html',
  styleUrls: ['./index-egresos.component.scss'],
})
export class IndexEgresosComponent implements OnInit {
  movimientos: TesoreriaMovimientoModel[] = [];
  cuentas: CuentaBancariaModel[] = [];
  loading = false;

  // ── Filtros ───────────────────────────────────────────────────────
  rangoFechas: Date[] = [
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(),
  ];
  cuentaFiltroId: number | null = null;

  // ── Modal ─────────────────────────────────────────────────────────
  showModal = false;
  saving = false;
  form: CreateMovimientoDto = this.emptyForm();

  readonly categoriasOpts = CATEGORIAS_EGRESO;
  readonly cuentasOpts = () =>
    this.cuentas.filter((c) => c.activa).map((c) => ({ label: c.nombre, value: c.id }));

  get totalPeriodo(): number {
    return this.movimientos.reduce((s, m) => s + m.monto, 0);
  }

  constructor(
    private readonly service: TesoreriaService,
    private readonly cuentaService: CuentaBancariaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarCuentas().then(() => this.cargar());
  }

  async cargarCuentas(): Promise<void> {
    const res = await lastValueFrom(this.cuentaService.list()).catch(() => null);
    this.cuentas = res?.data ?? [];
  }

  async cargar(): Promise<void> {
    if (!this.rangoFechas[0] || !this.rangoFechas[1]) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const desde = this.toISO(this.rangoFechas[0]);
      const hasta = this.toISO(this.rangoFechas[1]);
      const res = await lastValueFrom(
        this.service.listarEgresos(desde, hasta, this.cuentaFiltroId),
      );
      this.movimientos = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los egresos');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────
  abrirNuevo(): void {
    this.form = this.emptyForm();
    this.showModal = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (!this.form.cuentaBancariaId || !this.form.monto || !this.form.concepto?.trim() || !this.form.categoria) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.crearEgreso(this.form));
      this.alertService.showSuccess('Egreso registrado', '');
      this.showModal = false;
      this.cargar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.message ?? 'No se pudo guardar');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  async anular(m: TesoreriaMovimientoModel): Promise<void> {
    try {
      await lastValueFrom(this.service.anular(m.id));
      this.alertService.showSuccess('Egreso anulado', '');
      this.cargar();
    } catch {
      this.alertService.showError('Error', 'No se pudo anular');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────
  categoriaLabel(v: string | null): string {
    return v ? (CATEGORIA_LABELS[v] ?? v) : '—';
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
  }

  toISO(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private emptyForm(): CreateMovimientoDto {
    return {
      cuentaBancariaId: null!,
      monto: null!,
      concepto: '',
      beneficiario: null,
      referencia: null,
      fecha: this.toISO(new Date()),
      categoria: '',
    };
  }
}
