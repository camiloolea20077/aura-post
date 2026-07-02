import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  AsientoContableModel, CreateSaldosInicialesDto, PlanCuentaModel,
} from '../../../core/models/contabilidad.model';

interface LineaSaldo {
  cuentaId: number | null;
  saldo: number;
}

@Component({
  selector: 'app-saldos-iniciales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, DropdownModule, InputTextModule, InputNumberModule, TagModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './saldos-iniciales.component.html',
  styleUrls: ['./saldos-iniciales.component.scss'],
})
export class SaldosInicialesComponent implements OnInit {
  loading = false;
  saving = false;

  apertura: AsientoContableModel | null = null;
  cuentas: PlanCuentaModel[] = [];
  cuentasOpts: { label: string; value: number }[] = [];
  patrimonioOpts: { label: string; value: number }[] = [];

  fechaApertura = new Date().toISOString().slice(0, 10);
  cuentaAjusteId: number | null = null;
  lineas: LineaSaldo[] = [{ cuentaId: null, saldo: 0 }];

  constructor(
    private readonly service: ContabilidadService,
    private readonly alert: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const [planRes, apRes] = await Promise.all([
        lastValueFrom(this.service.listarPlan()).catch(() => null),
        lastValueFrom(this.service.obtenerApertura()).catch(() => null),
      ]);
      this.cuentas = planRes?.data ?? [];
      this.cuentasOpts = this.cuentas
        .filter((c) => c.auxiliar && c.activa)
        .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
      this.patrimonioOpts = this.cuentas
        .filter((c) => c.auxiliar && c.activa && c.tipo === 'PATRIMONIO')
        .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
      this.apertura = apRes?.data ?? null;
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la información');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // ── Cálculo por naturaleza ───────────────────────────────────────
  private cuenta(id: number | null): PlanCuentaModel | undefined {
    return this.cuentas.find((c) => c.id === id);
  }

  esDebito(line: LineaSaldo): boolean {
    return this.cuenta(line.cuentaId)?.naturaleza === 'DEBITO';
  }

  lineDebito(line: LineaSaldo): number {
    return this.esDebito(line) ? (line.saldo || 0) : 0;
  }

  lineCredito(line: LineaSaldo): number {
    return !this.esDebito(line) && this.cuenta(line.cuentaId) ? (line.saldo || 0) : 0;
  }

  get totalDebito(): number {
    return this.lineas.reduce((s, l) => s + this.lineDebito(l), 0);
  }

  get totalCredito(): number {
    return this.lineas.reduce((s, l) => s + this.lineCredito(l), 0);
  }

  /** Diferencia = patrimonio que absorbe la cuenta de ajuste. */
  get diferencia(): number {
    return this.totalDebito - this.totalCredito;
  }

  agregarLinea(): void {
    this.lineas.push({ cuentaId: null, saldo: 0 });
    this.cdr.markForCheck();
  }

  quitarLinea(i: number): void {
    if (this.lineas.length <= 1) return;
    this.lineas.splice(i, 1);
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    const validas = this.lineas.filter((l) => l.cuentaId && l.saldo);
    if (validas.length === 0) {
      this.alert.showError('Validación', 'Ingresa al menos un saldo inicial.');
      return;
    }
    const dto: CreateSaldosInicialesDto = {
      fechaApertura: this.fechaApertura,
      cuentaAjusteId: this.cuentaAjusteId ?? null,
      lineas: validas.map((l) => ({
        cuentaId: l.cuentaId!,
        debito: this.lineDebito(l),
        credito: this.lineCredito(l),
      })),
    };
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.guardarApertura(dto));
      this.alert.showSuccess('Saldos iniciales cargados', 'Se creó el asiento de apertura.');
      this.lineas = [{ cuentaId: null, saldo: 0 }];
      await this.cargar();
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudieron cargar los saldos iniciales');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  rehacer(): void {
    this.confirmationService.confirm({
      message: '¿Eliminar la apertura actual para volver a cargar los saldos? Solo es posible si no hay otros movimientos.',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, rehacer',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminarApertura());
          this.alert.showSuccess('Apertura eliminada', 'Puedes cargar los saldos de nuevo.');
          await this.cargar();
        } catch (e: any) {
          this.alert.showError('Error', e?.error?.message ?? 'No se pudo eliminar la apertura');
        }
      },
    });
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }
}
