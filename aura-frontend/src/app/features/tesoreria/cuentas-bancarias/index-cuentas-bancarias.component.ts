import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CuentaBancariaModel,
  CreateCuentaBancariaDto,
  TipoCuenta,
  TIPOS_CUENTA,
} from '../../../core/models/cuenta-bancaria.model';

@Component({
  selector: 'app-index-cuentas-bancarias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    DialogModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './index-cuentas-bancarias.component.html',
  styleUrls: ['./index-cuentas-bancarias.component.scss'],
})
export class IndexCuentasBancariasComponent implements OnInit {
  cuentas: CuentaBancariaModel[] = [];
  loading = false;

  // ── Modal ─────────────────────────────────────────────────────────
  showModal = false;
  editId: number | null = null;
  saving = false;
  form: CreateCuentaBancariaDto = this.emptyForm();

  // ── Opciones ──────────────────────────────────────────────────────
  readonly tiposOpts = TIPOS_CUENTA.map((t) => ({ label: t.label, value: t.value }));
  readonly tiposMeta = TIPOS_CUENTA;

  constructor(
    private readonly service: CuentaBancariaService,
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
      const res = await lastValueFrom(this.service.list());
      this.cuentas = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar las cuentas bancarias');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────
  abrirNueva(): void {
    this.editId = null;
    this.form = this.emptyForm();
    this.showModal = true;
    this.cdr.markForCheck();
  }

  abrirEditar(c: CuentaBancariaModel): void {
    this.editId = c.id;
    this.form = {
      nombre: c.nombre,
      tipo: c.tipo,
      banco: c.banco,
      numeroCuenta: c.numeroCuenta,
      titular: c.titular,
      saldoInicial: c.saldoInicial,
    };
    this.showModal = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (!this.form.nombre?.trim() || !this.form.tipo) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.editId) {
        await lastValueFrom(this.service.update(this.editId, this.form));
        this.alertService.showSuccess('Cuenta actualizada', '');
      } else {
        await lastValueFrom(this.service.create(this.form));
        this.alertService.showSuccess('Cuenta creada', '');
      }
      this.showModal = false;
      this.cargar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.message ?? 'No se pudo guardar la cuenta');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  async toggleActiva(c: CuentaBancariaModel): Promise<void> {
    try {
      await lastValueFrom(this.service.toggle(c.id));
      c.activa = !c.activa;
      this.alertService.showSuccess(
        c.activa ? 'Cuenta activada' : 'Cuenta desactivada', ''
      );
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cambiar el estado');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getTipoMeta(tipo: TipoCuenta) {
    return this.tiposMeta.find((t) => t.value === tipo) ?? this.tiposMeta[4];
  }

  formatCOP(val: number | null | undefined): string {
    if (val == null) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  }

  maskCuenta(num: string | null): string {
    if (!num) return '—';
    if (num.length <= 4) return num;
    return '**** ' + num.slice(-4);
  }

  get requiereBanco(): boolean {
    return this.form.tipo === 'BANCO';
  }

  private emptyForm(): CreateCuentaBancariaDto {
    return {
      nombre: '',
      tipo: 'BANCO',
      banco: null,
      numeroCuenta: null,
      titular: null,
      saldoInicial: 0,
    };
  }
}
