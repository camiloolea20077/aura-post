import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { TurnoCajaService } from '../../../core/services/caja.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { aFechaHoraLocal } from '../../../shared/utils/fecha.util';
import { TurnoCajaModel } from '../../../core/models/caja.model';
import {
  CreateReciboCajaDto,
  FichaFacturaModel,
  METODOS_RECIBO,
  ReciboCajaModel,
} from '../../../core/models/cartera.model';

interface LineaRecibo {
  factura: FichaFacturaModel;
  aplicar: number | null;
}

/** Dónde entró el efectivo. */
type DestinoEfectivo = 'CAJA' | 'OTRO_DIA' | 'CUENTA';

/**
 * Registrar pago: un valor recibido del cliente repartido entre sus facturas.
 * Por defecto reparte de la más vieja a la más nueva; el usuario puede
 * corregir factura por factura. Lo que no se aplique queda como anticipo.
 */
@Component({
  selector: 'app-recibo-caja-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './recibo-caja-dialog.component.html',
  styleUrls: ['./recibo-caja-dialog.component.scss'],
})
export class ReciboCajaDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() terceroId: number | null = null;
  @Input() clienteNombre = '';
  @Input() facturas: FichaFacturaModel[] = [];
  /** Si viene, arranca pagando solo esta factura. */
  @Input() facturaInicialId: number | null = null;
  @Output() registrado = new EventEmitter<ReciboCajaModel>();

  readonly metodos = METODOS_RECIBO;

  valorRecibido: number | null = null;
  fechaPago: Date = new Date();
  metodo = 'EFECTIVO';
  destinoEfectivo: DestinoEfectivo = 'CAJA';
  cuentaContableId: number | null = null;
  referencia = '';
  observaciones = '';
  lineas: LineaRecibo[] = [];
  /** El usuario tocó un valor a mano: ya no se reparte solo. */
  manual = false;

  turnoActivo: TurnoCajaModel | null = null;
  turnosAbiertos: TurnoCajaModel[] = [];
  turnoId: number | null = null;
  sucursalId: number | null = null;
  cuentasOpts: { label: string; value: number }[] = [];

  guardando = false;
  resultado: ReciboCajaModel | null = null;
  /** El pago no puede fecharse en el futuro. */
  fechaMax = new Date();

  constructor(
    private readonly carteraService: CarteraService,
    private readonly turnoService: TurnoCajaService,
    private readonly contabilidadService: ContabilidadService,
    private readonly indexDB: IndexDBService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) this.reiniciar();
  }

  private reiniciar(): void {
    this.resultado = null;
    this.guardando = false;
    this.fechaPago = new Date();
    this.fechaMax = new Date();
    this.metodo = 'EFECTIVO';
    this.destinoEfectivo = 'CAJA';
    this.cuentaContableId = null;
    this.referencia = '';
    this.observaciones = '';
    this.manual = false;
    this.lineas = this.facturas.map((f) => ({ factura: f, aplicar: null }));

    const inicial = this.facturas.find((f) => f.id === this.facturaInicialId);
    if (inicial) {
      this.valorRecibido = inicial.saldoPendiente;
      this.manual = true;
      this.lineas.forEach((l) => (l.aplicar = l.factura.id === inicial.id ? inicial.saldoPendiente : null));
    } else {
      this.valorRecibido = null;
    }
    this.cargarCajaYCuentas();
  }

  private async cargarCajaYCuentas(): Promise<void> {
    this.sucursalId = await this.indexDB.getSucursalDefault();
    try {
      const res = await lastValueFrom(this.turnoService.turnoActivo());
      this.turnoActivo = res?.data ?? null;
    } catch {
      this.turnoActivo = null;
    }
    this.turnoId = this.turnoActivo?.id ?? null;
    if (!this.turnoActivo) {
      // El administrador no tiene turno propio: puede recibir en la caja abierta del punto.
      try {
        const res = await lastValueFrom(this.turnoService.abiertos(this.sucursalId ?? undefined));
        this.turnosAbiertos = res?.data ?? [];
      } catch {
        this.turnosAbiertos = [];
      }
      if (this.turnosAbiertos.length === 1) this.turnoId = this.turnosAbiertos[0].id;
    }
    if (!this.cuentasOpts.length) {
      try {
        const res = await lastValueFrom(this.contabilidadService.listarPlan());
        this.cuentasOpts = (res?.data ?? [])
          .filter((c) => c.activa && c.auxiliar && c.esMedioPago)
          .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
      } catch {
        this.cuentasOpts = [];
      }
    }
    if (this.turnoId == null) this.destinoEfectivo = 'CUENTA';
    this.cdr.markForCheck();
  }

  // ── Reparto ─────────────────────────────────────────────────────────
  onValorRecibido(): void {
    if (!this.manual) this.repartir();
  }

  /** De la factura más vieja a la más nueva, hasta agotar el valor. */
  repartir(): void {
    let resto = this.valorRecibido ?? 0;
    for (const l of this.lineas) {
      const va = Math.min(resto, l.factura.saldoPendiente);
      l.aplicar = va > 0 ? this.redondear(va) : null;
      resto = this.redondear(resto - va);
    }
    this.manual = false;
    this.cdr.markForCheck();
  }

  limpiar(): void {
    this.lineas.forEach((l) => (l.aplicar = null));
    this.manual = true;
    this.cdr.markForCheck();
  }

  onAplicarManual(l: LineaRecibo): void {
    this.manual = true;
    if (l.aplicar != null && l.aplicar > l.factura.saldoPendiente) l.aplicar = l.factura.saldoPendiente;
    this.cdr.markForCheck();
  }

  pagarCompleta(l: LineaRecibo): void {
    l.aplicar = l.factura.saldoPendiente;
    this.manual = true;
    if ((this.valorRecibido ?? 0) < this.totalAplicado) this.valorRecibido = this.totalAplicado;
    this.cdr.markForCheck();
  }

  get totalAplicado(): number {
    return this.redondear(this.lineas.reduce((s, l) => s + (l.aplicar ?? 0), 0));
  }

  get sobrante(): number {
    return this.redondear((this.valorRecibido ?? 0) - this.totalAplicado);
  }

  get saldoTotal(): number {
    return this.facturas.reduce((s, f) => s + f.saldoPendiente, 0);
  }

  get esEfectivo(): boolean {
    return this.metodo === 'EFECTIVO';
  }

  get entraACaja(): boolean {
    return this.esEfectivo && this.destinoEfectivo === 'CAJA';
  }

  /** Por qué no se puede guardar todavía; null si todo está bien. */
  get bloqueo(): string | null {
    if (!this.valorRecibido || this.valorRecibido <= 0) return 'Escriba el valor que entregó el cliente';
    if (this.sobrante < 0) return 'Lo aplicado supera el valor recibido';
    if (this.entraACaja && this.turnoId == null) return 'No hay caja abierta: elija otra opción';
    if (this.entraACaja && this.sobrante > 0)
      return 'En efectivo a la caja entregue el cambio: no puede quedar sobrante';
    if (this.esEfectivo && this.destinoEfectivo === 'CUENTA' && !this.cuentaContableId)
      return 'Elija la cuenta donde entró el dinero';
    return null;
  }

  setMetodo(m: string): void {
    this.metodo = m;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (this.bloqueo || !this.terceroId) return;
    this.guardando = true;
    this.cdr.markForCheck();
    const otroDia = this.esEfectivo && this.destinoEfectivo === 'OTRO_DIA';
    const dto: CreateReciboCajaDto = {
      terceroId: this.terceroId,
      valorRecibido: this.valorRecibido!,
      metodoPago: this.metodo,
      referencia: this.referencia.trim() || null,
      cuentaContableId:
        this.esEfectivo && this.destinoEfectivo !== 'CUENTA' ? null : this.cuentaContableId,
      turnoCajaId: this.entraACaja ? this.turnoId : null,
      sucursalId: this.sucursalId,
      cajaOtroDia: otroDia,
      fechaPago: aFechaHoraLocal(this.fechaPago),
      observaciones: this.observaciones.trim() || null,
      aplicaciones: this.lineas
        .filter((l) => (l.aplicar ?? 0) > 0)
        .map((l) => ({ cuentaCobrarId: l.factura.id, monto: l.aplicar! })),
    };
    try {
      const res = await lastValueFrom(this.carteraService.crearRecibo(dto));
      this.resultado = res.data;
      this.registrado.emit(res.data);
    } catch (err: any) {
      this.alert.showError('No se pudo registrar el pago', err?.error?.message ?? err?.message ?? '');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  async imprimir(): Promise<void> {
    if (!this.resultado) return;
    try {
      const blob = await lastValueFrom(this.carteraService.reciboPdf(this.resultado.id));
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      this.alert.showError('Error', 'No se pudo generar el PDF del recibo');
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  etiquetaDias(f: FichaFacturaModel): string {
    if (f.fechaVencimiento == null) return 'Sin vencimiento';
    if (f.diasVencida > 0) return `Vencida ${f.diasVencida} d`;
    if (f.diasVencida === 0) return 'Vence hoy';
    return `Vence en ${-f.diasVencida} d`;
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private redondear(v: number): number {
    return Math.round(v * 100) / 100;
  }
}
