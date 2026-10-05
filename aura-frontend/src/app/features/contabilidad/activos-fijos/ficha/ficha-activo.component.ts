import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { ActivoFijoService } from '../../../../core/services/activo-fijo.service';
import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import {
  ActivoFijoModel,
  AdicionActivoModel,
  DepreciacionPeriodoModel,
  MantenimientoActivoModel,
  ProyeccionDepreciacionModel,
  CATEGORIA_ACTIVO_OPTIONS,
  METODO_DEPRECIACION_OPTIONS,
} from '../../../../core/models/activo-fijo.model';

import { PuedeDirective } from '../../../../shared/directives/puede.directive';
/**
 * Ficha de un activo fijo: resumen, depreciación (historial y proyección),
 * adiciones que se capitalizan y mantenimientos.
 */
import { CuentaAutocompleteComponent } from '../../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';

@Component({
  selector: 'app-ficha-activo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CuentaAutocompleteComponent,
    PuedeDirective,
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TabViewModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    TerceroAutocompleteComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './ficha-activo.component.html',
  styleUrls: ['./ficha-activo.component.scss'],
})
export class FichaActivoComponent implements OnInit {
  id!: number;
  activo: ActivoFijoModel | null = null;
  loading = true;
  activeTab = 0;

  historial: DepreciacionPeriodoModel[] = [];
  proyeccion: ProyeccionDepreciacionModel[] = [];
  adiciones: AdicionActivoModel[] = [];
  mantenimientos: MantenimientoActivoModel[] = [];

  // Nueva adición
  adicion = this.adicionVacia();
  adicionFecha: Date = new Date();
  guardandoAdicion = false;
  cuentasContrapartida: { label: string; value: number }[] = [];

  // Nuevo mantenimiento
  mant = this.mantVacio();
  mantFecha: Date = new Date();
  mantProximo: Date | null = null;
  guardandoMant = false;
  readonly tiposMant = [
    { label: 'Preventivo', value: 'PREVENTIVO' },
    { label: 'Correctivo', value: 'CORRECTIVO' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: ActivoFijoService,
    private readonly contabilidad: ContabilidadService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
    this.cargarCuentas();
  }

  get vigente(): boolean {
    return this.activo?.estado === 'ACTIVO' || this.activo?.estado === 'DEPRECIADO';
  }

  categoriaLabel(v?: string | null): string {
    return CATEGORIA_ACTIVO_OPTIONS.find((o) => o.value === v)?.label ?? v ?? '';
  }

  metodoLabel(v?: string | null): string {
    return METODO_DEPRECIACION_OPTIONS.find((o) => o.value === v)?.label ?? v ?? '';
  }

  estadoSeverity(e?: string): 'success' | 'warn' | 'info' | 'danger' {
    return ({ ACTIVO: 'success', DEPRECIADO: 'warn', VENDIDO: 'info', DADO_DE_BAJA: 'danger' } as const)[
      (e ?? 'ACTIVO') as 'ACTIVO'
    ] ?? 'info';
  }

  /** Qué parte del costo ya se depreció, para la barra. */
  get porcentajeDepreciado(): number {
    const costo = (this.activo?.costoTotal ?? 0) - (this.activo?.valorResidual ?? 0);
    if (!this.activo || costo <= 0) return 0;
    return Math.min(100, Math.round((this.activo.depreciacionAcumulada / costo) * 100));
  }

  volver(): void {
    this.router.navigate(['/contabilidad/activos-fijos']);
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const [a, h, p, ad, m] = await Promise.all([
        lastValueFrom(this.service.getById(this.id)),
        lastValueFrom(this.service.historialDepreciacion(this.id)),
        lastValueFrom(this.service.proyeccion(this.id)),
        lastValueFrom(this.service.adiciones(this.id)),
        lastValueFrom(this.service.mantenimientos(this.id)),
      ]);
      this.activo = a?.data ?? null;
      this.historial = h?.data ?? [];
      this.proyeccion = p?.data ?? [];
      this.adiciones = ad?.data ?? [];
      this.mantenimientos = m?.data ?? [];
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo cargar el activo');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarCuentas(): Promise<void> {
    try {
      const res = await lastValueFrom(this.contabilidad.listarPlan());
      // La adición se paga de caja/banco (11) o queda debiéndose (22, 23).
      this.cuentasContrapartida = (res?.data ?? [])
        .filter((c) => c.auxiliar && c.activa && /^(11|22|23)/.test(c.codigo ?? ''))
        .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
      this.cdr.markForCheck();
    } catch {
      /* sin plan de cuentas no se registran adiciones */
    }
  }

  // ── Adiciones ─────────────────────────────────────────────────
  async guardarAdicion(): Promise<void> {
    if (!this.adicion.descripcion.trim() || !this.adicion.valor || !this.adicion.cuentaContrapartidaId) {
      this.alert.showWarn('Datos incompletos', 'Describe la mejora, su valor y de qué cuenta sale el pago.');
      return;
    }
    this.guardandoAdicion = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.registrarAdicion(this.id, { ...this.adicion, fecha: aFechaLocal(this.adicionFecha) }),
      );
      this.alert.showSuccess('Adición registrada', 'El costo del activo subió y quedó contabilizado.');
      this.adicion = this.adicionVacia();
      this.adicionFecha = new Date();
      await this.cargar();
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo registrar la adición');
    } finally {
      this.guardandoAdicion = false;
      this.cdr.markForCheck();
    }
  }

  // ── Mantenimientos ────────────────────────────────────────────
  async guardarMantenimiento(): Promise<void> {
    if (!this.mant.descripcion.trim()) {
      this.alert.showWarn('Falta la descripción', 'Describe qué se le hizo al activo.');
      return;
    }
    this.guardandoMant = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.registrarMantenimiento(this.id, {
          ...this.mant,
          fecha: aFechaLocal(this.mantFecha),
          proximo: this.mantProximo ? aFechaLocal(this.mantProximo) : null,
        }),
      );
      this.alert.showSuccess('Mantenimiento registrado', '');
      this.mant = this.mantVacio();
      this.mantFecha = new Date();
      this.mantProximo = null;
      this.mantenimientos = (await lastValueFrom(this.service.mantenimientos(this.id)))?.data ?? [];
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo registrar el mantenimiento');
    } finally {
      this.guardandoMant = false;
      this.cdr.markForCheck();
    }
  }

  eliminarMantenimiento(m: MantenimientoActivoModel): void {
    this.confirm.confirm({
      header: 'Eliminar mantenimiento',
      message: `¿Eliminar "${m.descripcion}"?`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminarMantenimiento(this.id, m.id!));
          this.mantenimientos = this.mantenimientos.filter((x) => x.id !== m.id);
          this.cdr.markForCheck();
        } catch (e: any) {
          this.alert.showError('Error', e?.error?.message ?? 'No se pudo eliminar');
        }
      },
    });
  }

  // ── Retiro ────────────────────────────────────────────────────
  anularRetiro(): void {
    this.confirm.confirm({
      header: 'Anular retiro',
      message:
        'Se reversa el asiento de la baja o la venta y el activo vuelve a estar vigente. ¿Continuar?',
      acceptLabel: 'Anular retiro',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await lastValueFrom(this.service.anularRetiro(this.id));
          this.alert.showSuccess('Retiro anulado', 'El activo vuelve a estar vigente.');
          await this.cargar();
        } catch (e: any) {
          this.alert.showError('Error', e?.error?.message ?? 'No se pudo anular el retiro');
        }
      },
    });
  }

  private adicionVacia(): AdicionActivoModel {
    return { fecha: '', descripcion: '', valor: 0, mesesAdicionales: 0, cuentaContrapartidaId: null, terceroId: null };
  }

  private mantVacio(): MantenimientoActivoModel {
    return { fecha: '', tipo: 'PREVENTIVO', descripcion: '', costo: 0, terceroId: null, proximo: null };
  }
}
