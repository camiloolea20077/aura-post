import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { TrasladoFondosService } from '../../../core/services/traslado-fondos.service';
import { TurnoCajaService } from '../../../core/services/caja.service';
import { PlanCuentaModel } from '../../../core/models/contabilidad.model';
import {
  CONCEPTOS_TRASLADO,
  ConceptoTraslado,
  CreateTrasladoFondosDto,
  EXTREMOS_TRASLADO,
  ExtremoTraslado,
  TrasladoFondosModel,
} from '../../../core/models/traslado-fondos.model';

type Opcion = { label: string; value: number };

/**
 * Traslados de dinero entre bolsillos de la empresa.
 *
 * <p>Constituir y reembolsar la caja menor, consignar el efectivo del día al
 * banco y mover plata entre cuentas son el mismo hecho económico: cambia dónde
 * está el dinero, no cuánto hay. Por eso comparten pantalla y documento.
 *
 * <p>El caso que motivó todo esto es la caja menor: una vez constituida, el
 * administrador paga sus gastos contra esa cuenta y deja de descuadrarle el
 * arqueo al cajero del punto de venta.
 */
@Component({
  selector: 'app-index-traslados-fondos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './index-traslados-fondos.component.html',
  styleUrls: ['./index-traslados-fondos.component.scss'],
})
export class IndexTrasladosFondosComponent implements OnInit {
  traslados: TrasladoFondosModel[] = [];
  loading = false;
  isSubmitting = false;
  dialogVisible = false;

  frm!: FormGroup;
  filtros!: FormGroup;

  readonly conceptosOpts = CONCEPTOS_TRASLADO;
  readonly extremosOpts = EXTREMOS_TRASLADO;

  sucursalesOpts: Opcion[] = [];
  turnosOpts: Opcion[] = [];
  bancosOpts: Opcion[] = [];
  cuentasOpts: Opcion[] = [];

  constructor(
    private readonly trasladoService: TrasladoFondosService,
    private readonly turnoService: TurnoCajaService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly contabilidadService: ContabilidadService,
    private readonly indexDB: IndexDBService,
    private readonly alertService: AlertService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    this.initForms();
    await Promise.all([
      this.loadSucursales(),
      this.loadTurnos(),
      this.loadBancos(),
      this.loadCuentas(),
    ]);
    await this.buscar();
  }

  private initForms(): void {
    const hoy = new Date();
    const primeroDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    this.filtros = this.fb.group({
      desde: [primeroDelMes],
      hasta: [hoy],
      concepto: [null],
    });

    this.frm = this.fb.group({
      fecha: [new Date(), Validators.required],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      concepto: [
        'CONSTITUCION_CAJA_MENOR' as ConceptoTraslado,
        Validators.required,
      ],
      sucursalId: [null],

      origenTipo: ['CAJA' as ExtremoTraslado, Validators.required],
      origenTurnoCajaId: [null],
      origenCuentaBancoId: [null],
      origenCuentaId: [null],

      destinoTipo: ['CUENTA' as ExtremoTraslado, Validators.required],
      destinoTurnoCajaId: [null],
      destinoCuentaBancoId: [null],
      destinoCuentaId: [null],

      observacion: [''],
    });
  }

  // ── Catálogos ───────────────────────────────────────────────────────────

  private async loadSucursales(): Promise<void> {
    const list = await this.indexDB.getSucursales();
    this.sucursalesOpts = list.map((s) => ({ label: s.nombre, value: s.id }));
    if (list.length > 0) this.frm.patchValue({ sucursalId: list[0].id });
  }

  private async loadTurnos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.turnoService.abiertos());
      this.turnosOpts = (res?.data ?? []).map((t) => ({
        label: `${t.cajaNombre ?? 'Caja'} — ${t.usuarioNombre ?? ''}`.trim(),
        value: t.id,
      }));
    } catch {
      this.turnosOpts = [];
    }
  }

  private async loadBancos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.cuentaBancariaService.list());
      this.bancosOpts = (res?.data ?? [])
        .filter((c) => c.activa)
        .map((c) => ({ label: c.nombre, value: c.id }));
    } catch {
      this.bancosOpts = [];
    }
  }

  /**
   * Solo cuentas habilitadas como medio de pago: aquí está la CAJA MENOR. La
   * lista la decide el contador con el flag del plan de cuentas, no un filtro
   * por tipo — filtrar por ACTIVO dejaría pasar inventarios y cartera.
   */
  private async loadCuentas(): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.contabilidadService.listarMediosPago(),
      );
      this.cuentasOpts = (res?.data ?? []).map((c: PlanCuentaModel) => ({
        label: `${c.codigo} - ${c.nombre}`,
        value: c.id,
      }));
    } catch {
      this.cuentasOpts = [];
    }
  }

  // ── Listado ─────────────────────────────────────────────────────────────

  async buscar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const f = this.filtros.getRawValue();
      const res = await lastValueFrom(
        this.trasladoService.listar(
          this.aIso(f.desde),
          this.aIso(f.hasta),
          f.concepto ?? undefined,
        ),
      );
      this.traslados = res?.data ?? [];
    } catch {
      this.traslados = [];
      this.alertService.showError(
        'Error',
        'No se pudieron cargar los traslados.',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private aIso(fecha: Date | null): string | undefined {
    if (fecha == null) return undefined;
    // toISOString() convierte a UTC y en Colombia (UTC-5) devuelve el día
    // anterior. Se arma a mano para que la fecha que se ve sea la que se manda.
    const y = fecha.getFullYear();
    const m = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const d = `${fecha.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ── Formulario ──────────────────────────────────────────────────────────

  abrirDialog(): void {
    this.frm.reset({
      fecha: new Date(),
      monto: null,
      concepto: 'CONSTITUCION_CAJA_MENOR',
      sucursalId: this.sucursalesOpts[0]?.value ?? null,
      origenTipo: 'CAJA',
      destinoTipo: 'CUENTA',
      observacion: '',
    });
    this.dialogVisible = true;
    this.cdr.markForCheck();
  }

  get origenTipo(): ExtremoTraslado {
    return this.frm.get('origenTipo')?.value;
  }

  get destinoTipo(): ExtremoTraslado {
    return this.frm.get('destinoTipo')?.value;
  }

  /** El hint del concepto elegido, para que la pantalla explique qué hace. */
  get hintConcepto(): string {
    return (
      this.conceptosOpts.find(
        (c) => c.value === this.frm.get('concepto')?.value,
      )?.hint ?? ''
    );
  }

  /** Cambiar de tipo limpia los identificadores del anterior. */
  onTipoChange(lado: 'origen' | 'destino'): void {
    const tipo = lado === 'origen' ? this.origenTipo : this.destinoTipo;
    this.frm.patchValue(
      {
        [`${lado}TurnoCajaId`]:
          tipo === 'CAJA' ? this.frm.get(`${lado}TurnoCajaId`)?.value : null,
        [`${lado}CuentaBancoId`]:
          tipo === 'BANCO' ? this.frm.get(`${lado}CuentaBancoId`)?.value : null,
        [`${lado}CuentaId`]:
          tipo === 'CUENTA' ? this.frm.get(`${lado}CuentaId`)?.value : null,
      },
      { emitEvent: false },
    );
    this.cdr.markForCheck();
  }

  /**
   * Verifica que el extremo tenga informado lo que su tipo exige.
   *
   * <p>El backend lo valida igual, pero avisar aquí ahorra el viaje y dice
   * exactamente cuál de los dos lados está incompleto.
   */
  private extremoIncompleto(lado: 'origen' | 'destino'): boolean {
    const v = this.frm.getRawValue();
    const tipo = lado === 'origen' ? v.origenTipo : v.destinoTipo;
    if (tipo === 'CAJA') {
      // Puede ir vacío: el backend infiere la caja si hay exactamente una
      // abierta en la sucursal, y falla pidiendo elegir si hay más de una.
      return false;
    }
    if (tipo === 'BANCO') {
      return !v[`${lado}CuentaBancoId`];
    }
    return !v[`${lado}CuentaId`];
  }

  async guardar(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      this.alertService.showWarn(
        'Campos requeridos',
        'Completa la fecha y el monto.',
      );
      return;
    }
    if (this.extremoIncompleto('origen')) {
      this.alertService.showWarn(
        'Falta el origen',
        'Indica de dónde sale el dinero.',
      );
      return;
    }
    if (this.extremoIncompleto('destino')) {
      this.alertService.showWarn(
        'Falta el destino',
        'Indica a dónde entra el dinero.',
      );
      return;
    }

    const v = this.frm.getRawValue();
    // De cada extremo viaja SOLO el identificador de su tipo. Mandar dos haría
    // que el backend rechace el traslado por datos incoherentes.
    const dto: CreateTrasladoFondosDto = {
      sucursalId: v.sucursalId,
      fecha: this.aIso(v.fecha) ?? null,
      monto: v.monto,
      concepto: v.concepto,
      observacion: v.observacion?.trim() || null,
      responsableId: null,

      origenTipo: v.origenTipo,
      origenTurnoCajaId: v.origenTipo === 'CAJA' ? v.origenTurnoCajaId : null,
      origenCuentaBancoId:
        v.origenTipo === 'BANCO' ? v.origenCuentaBancoId : null,
      origenCuentaId: v.origenTipo === 'CUENTA' ? v.origenCuentaId : null,

      destinoTipo: v.destinoTipo,
      destinoTurnoCajaId:
        v.destinoTipo === 'CAJA' ? v.destinoTurnoCajaId : null,
      destinoCuentaBancoId:
        v.destinoTipo === 'BANCO' ? v.destinoCuentaBancoId : null,
      destinoCuentaId: v.destinoTipo === 'CUENTA' ? v.destinoCuentaId : null,
    };

    this.isSubmitting = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.trasladoService.crear(dto));
      this.alertService.showSuccess(
        'Registrado',
        'Traslado de fondos registrado.',
      );
      this.dialogVisible = false;
      await this.buscar();
      // El traslado pudo abrir o mover una caja: recargar para que el próximo
      // no ofrezca un turno que ya no existe.
      await this.loadTurnos();
    } catch (e: unknown) {
      const msg =
        (e as { error?: { message?: string } })?.error?.message ??
        'No se pudo registrar el traslado.';
      this.alertService.showError('Error', msg);
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  etiquetaConcepto(valor: string): string {
    return this.conceptosOpts.find((c) => c.value === valor)?.label ?? valor;
  }
}
