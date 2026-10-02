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
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  AsientoContableModel, CreateSaldosInicialesDto, PlanCuentaModel,
} from '../../../core/models/contabilidad.model';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
import { FuenteSaldoInicial } from '../../../core/models/contador.model';

interface LineaSaldo {
  cuentaId: number | null;
  /** Saldo en la naturaleza de la cuenta; negativo = al lado contrario. */
  saldo: number;
  terceroId?: number | null;
  terceroNombre?: string | null;
  /** De qué auxiliar vino la línea (inventario, activos…); vacío = digitada. */
  fuente?: FuenteSaldoInicial | null;
  descripcion?: string | null;
}

const FUENTES: { value: FuenteSaldoInicial; label: string; icon: string }[] = [
  { value: 'BANCOS', label: 'Bancos', icon: 'pi pi-building-columns' },
  { value: 'INVENTARIO', label: 'Inventario', icon: 'pi pi-box' },
  { value: 'ACTIVOS', label: 'Activos fijos', icon: 'pi pi-desktop' },
  { value: 'DIFERIDOS', label: 'Diferidos', icon: 'pi pi-calendar-clock' },
  { value: 'CARTERA', label: 'Cartera (clientes)', icon: 'pi pi-users' },
  { value: 'PROVEEDORES', label: 'Proveedores', icon: 'pi pi-truck' },
];

@Component({
  selector: 'app-saldos-iniciales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, DropdownModule, InputTextModule, InputNumberModule, TagModule,
    ConfirmDialogModule, CalendarModule,
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

  fechaApertura: Date = new Date();
  cuentaAjusteId: number | null = null;
  lineas: LineaSaldo[] = [{ cuentaId: null, saldo: 0 }];

  readonly fuentes = FUENTES;
  /** Fuentes ya traídas: no se duplican. */
  cargadas = new Set<FuenteSaldoInicial>();
  trayendo: FuenteSaldoInicial | null = null;

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

  // Un saldo negativo va al lado contrario de la naturaleza (depreciación
  // acumulada en una cuenta de activo, sobregiro en un banco).
  lineDebito(line: LineaSaldo): number {
    if (!this.cuenta(line.cuentaId)) return 0;
    const s = line.saldo || 0;
    return this.esDebito(line) ? Math.max(s, 0) : Math.max(-s, 0);
  }

  lineCredito(line: LineaSaldo): number {
    if (!this.cuenta(line.cuentaId)) return 0;
    const s = line.saldo || 0;
    return this.esDebito(line) ? Math.max(-s, 0) : Math.max(s, 0);
  }

  /** Trae las líneas que propone un auxiliar (inventario, activos, cartera…). */
  async traer(fuente: FuenteSaldoInicial): Promise<void> {
    if (this.cargadas.has(fuente)) {
      this.alert.showWarn('Ya está', 'Esa fuente ya se trajo; quita sus líneas si quieres volver a traerla.');
      return;
    }
    this.trayendo = fuente;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.sugerenciasSaldoInicial(fuente));
      const nuevas: LineaSaldo[] = (res?.data ?? []).map((s) => {
        const c = this.cuenta(s.cuentaId);
        const neto = (s.debito || 0) - (s.credito || 0);
        return {
          cuentaId: s.cuentaId,
          saldo: c?.naturaleza === 'CREDITO' ? -neto : neto,
          terceroId: s.terceroId,
          terceroNombre: s.terceroNombre,
          fuente,
          descripcion: s.descripcion,
        };
      });
      if (!nuevas.length) {
        this.alert.showWarn('Sin saldos', 'Ese auxiliar no tiene saldos para traer.');
        return;
      }
      // Reemplaza la línea vacía inicial.
      this.lineas = [...this.lineas.filter((l) => l.cuentaId || l.saldo), ...nuevas];
      this.cargadas.add(fuente);
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudieron traer los saldos');
    } finally {
      this.trayendo = null;
      this.cdr.markForCheck();
    }
  }

  quitarFuente(fuente: FuenteSaldoInicial): void {
    this.lineas = this.lineas.filter((l) => l.fuente !== fuente);
    if (!this.lineas.length) this.lineas = [{ cuentaId: null, saldo: 0 }];
    this.cargadas.delete(fuente);
    this.cdr.markForCheck();
  }

  fuenteLabel(f?: FuenteSaldoInicial | null): string {
    return FUENTES.find((x) => x.value === f)?.label ?? '';
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

  guardar(): void {
    const validas = this.lineas.filter((l) => l.cuentaId && l.saldo);
    if (validas.length === 0) {
      this.alert.showError('Validación', 'Ingresa al menos un saldo inicial.');
      return;
    }
    const dif = Math.round(this.diferencia * 100) / 100;
    if (dif === 0) {
      this.enviar(validas, false);
      return;
    }
    // La diferencia es patrimonio solo si el usuario lo confirma: un saldo
    // mal digitado no puede esconderse en la 3705.
    const ajuste = this.patrimonioOpts.find((o) => o.value === this.cuentaAjusteId)?.label
      ?? 'Resultados de ejercicios anteriores (3705)';
    this.confirmationService.confirm({
      header: 'Los saldos no cuadran',
      message: `La diferencia de ${this.formatCOP(Math.abs(dif))} se registrará en ${ajuste}. ¿Es patrimonio de la empresa?`,
      acceptLabel: 'Sí, es patrimonio',
      rejectLabel: 'Revisar saldos',
      accept: () => this.enviar(validas, true),
    });
  }

  private async enviar(validas: LineaSaldo[], aceptarDiferencia: boolean): Promise<void> {
    const dto: CreateSaldosInicialesDto = {
      fechaApertura: aFechaLocal(this.fechaApertura),
      cuentaAjusteId: this.cuentaAjusteId ?? null,
      aceptarDiferencia,
      lineas: validas.map((l) => ({
        cuentaId: l.cuentaId!,
        debito: this.lineDebito(l),
        credito: this.lineCredito(l),
        terceroId: l.terceroId ?? null,
      })),
    };
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.guardarApertura(dto));
      this.alert.showSuccess('Saldos iniciales cargados', 'Se creó el asiento de apertura.');
      this.lineas = [{ cuentaId: null, saldo: 0 }];
      this.cargadas.clear();
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
