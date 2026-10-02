import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { CarteraService } from '../../../../core/services/cartera.service';
import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { SolicitudCreditoModel } from '../../../../core/models/cartera.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  CreateVentaPagoDto,
  MetodoPago,
  METODOS_PAGO,
  PagoUI,
} from '../../../../core/models/venta.model';
import { CuentaBancariaModel } from '../../../../core/models/cuenta-bancaria.model';
import { ValidacionCreditoModel } from '../../../../core/models/cartera.model';

@Component({
  selector: 'app-modal-pago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss'],
})
export class ModalPagoComponent implements OnChanges, OnDestroy {
  @Input() displayModal = false;
  @Input() total = 0;
  @Input() subtotal = 0;
  @Input() impuestosTotal = 0;
  @Input() pagosPrev: PagoUI[] = [];

  // ── Nuevos inputs ────────────────────────────────────────────────
  @Input() cuentasBancarias: CuentaBancariaModel[] = [];
  @Input() creditoInfo: ValidacionCreditoModel | null = null;
  @Input() clienteNombre: string | null = null;
  @Input() clienteId: number | null = null;

  // ── Autorización para pasar el cupo ──────────────────────────────
  solicitud: SolicitudCreditoModel | null = null;
  solicitando = false;
  observacionSolicitud = '';
  private sondeo: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly carteraService: CarteraService,
    private readonly contabilidadService: ContabilidadService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    // Se cargan al crear el POS, no al abrir el cobro: así ya están cuando el
    // cajero abre el modal.
    this.cargarFormasEmpresa();
  }

  /** Códigos de formas de pago de la empresa que piden cuenta bancaria. */
  private formasConBanco = new Set<string>();
  private formasCargadas = false;

  /**
   * Formas con recargo que paga el cliente (Sistecrédito 5 %…). El monto que
   * se escribe es la parte de la venta; el servidor le suma el recargo y lo
   * agrega como línea de la venta. Aquí solo se muestra, con el mismo redondeo.
   */
  private recargos = new Map<string, { pct: number; nombre: string }>();

  recargoPct(metodo: string): number {
    return this.recargos.get(metodo)?.pct ?? 0;
  }

  recargoDe(p: { metodoPago: string; monto: number | null }): number {
    const pct = this.recargoPct(p.metodoPago);
    return pct > 0 && (p.monto ?? 0) > 0 ? Math.round(((p.monto ?? 0) * pct) / 100) : 0;
  }

  get pagosConRecargo(): { nombre: string; pct: number; valor: number }[] {
    return this.pagos
      .map((p) => ({ nombre: this.recargos.get(p.metodoPago)?.nombre ?? '', pct: this.recargoPct(p.metodoPago), valor: this.recargoDe(p) }))
      .filter((r) => r.valor > 0);
  }

  get totalRecargos(): number {
    return this.pagos.reduce((s, p) => s + this.recargoDe(p), 0);
  }

  /**
   * Suma a los métodos de siempre las formas de pago que la empresa creó en
   * Contabilidad › Parametrización (ADDI, Sistecrédito…). Su cuenta la
   * resuelve el backend al contabilizar la venta.
   */
  private async cargarFormasEmpresa(): Promise<void> {
    if (this.formasCargadas) return;
    try {
      const res = await lastValueFrom(this.contabilidadService.listarFormasPago());
      const base = new Set(METODOS_PAGO.map((m) => m.value as string));
      const extras = (res?.data ?? [])
        .filter((f) => f.activo !== false && !base.has(f.codigo) && f.codigo !== 'CREDITO')
        .map((f) => ({ label: f.nombre, value: f.codigo as MetodoPago, icon: 'pi pi-wallet', color: '#0EA5E9' }));
      (res?.data ?? []).filter((f) => f.requiereCuentaBancaria).forEach((f) => this.formasConBanco.add(f.codigo));
      (res?.data ?? [])
        .filter((f) => f.activo !== false && Number(f.recargoPorcentaje) > 0)
        .forEach((f) => this.recargos.set(f.codigo, { pct: Number(f.recargoPorcentaje), nombre: f.nombre }));
      if (extras.length) {
        // CREDITO queda de último, como siempre.
        const sinCredito = METODOS_PAGO.filter((m) => m.value !== 'CREDITO');
        const credito = METODOS_PAGO.filter((m) => m.value === 'CREDITO');
        this.metodos = [...sinCredito, ...extras, ...credito];
      }
      this.formasCargadas = true;
      // El POS es OnPush: sin esto los botones nuevos no se pintan hasta el
      // siguiente clic dentro del modal.
      this.cdr.markForCheck();
    } catch {
      /* sin conexión: quedan los métodos de siempre y se reintenta al abrir */
    }
  }

  @Output() modalClosed = new EventEmitter<void>();
  @Output() ventaConfirmada = new EventEmitter<{
    pagos: CreateVentaPagoDto[];
    descuentoGeneral: number;
  }>();

  public pagos: PagoUI[] = [];
  public isSubmitting = false;
  public descuentoGeneral = 0;

  metodos: { label: string; value: MetodoPago; icon: string; color: string }[] = [...METODOS_PAGO];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && !this.displayModal) this.detenerSondeo();
    if (changes['creditoInfo'] && this.displayModal) {
      this.solicitud = null;
      this.observacionSolicitud = '';
      // Si ya había una solicitud enviada para este cliente, se sigue esperando.
      if (this.creditoInfo?.solicitudPendienteId) this.esperar(this.creditoInfo.solicitudPendienteId);
    }
    if (changes['displayModal'] && this.displayModal) {
      this.cargarFormasEmpresa();
      this.pagos = this.pagosPrev.length
        ? [...this.pagosPrev.map((p) => ({ ...p }))]
        : [{ metodoPago: 'EFECTIVO', monto: this.total, referencia: null, cuentaBancariaId: null }];
      this.isSubmitting = false;
    }
  }

  get totalConDescuento(): number {
    return Math.max(0, this.total - (this.descuentoGeneral ?? 0));
  }

  get totalPagado(): number {
    return this.pagos.reduce((s, p) => s + (p.monto ?? 0), 0);
  }
  get faltante(): number {
    return this.totalConDescuento - this.totalPagado;
  }
  get vuelto(): number {
    return Math.max(0, this.totalPagado - this.totalConDescuento);
  }

  get cuadra(): boolean {
    return this.totalPagado >= this.totalConDescuento;
  }

  get tieneCredito(): boolean {
    return this.pagos.some((p) => p.metodoPago === 'CREDITO');
  }

  get creditoBloqueado(): boolean {
    return this.tieneCredito && this.creditoInfo !== null && !this.creditoInfo.permitido;
  }

  esCreditoSeleccionable(): boolean {
    return this.creditoInfo === null || this.creditoInfo.permitido;
  }

  get cuentasOpts(): { label: string; value: number }[] {
    return this.cuentasBancarias
      .filter((c) => c.activa)
      .map((c) => ({
        label: `${c.nombre}${c.banco ? ' — ' + c.banco : ''}`,
        value: c.id,
      }));
  }

  requiereCuenta(m: MetodoPago): boolean {
    return m === 'TRANSFERENCIA' || m === 'NEQUI' || m === 'DAVIPLATA' || this.formasConBanco.has(m);
  }

  // ¿Hay una línea a crédito distinta a la indicada? (evita dos créditos)
  creditoEnOtraLinea(pago: PagoUI): boolean {
    return this.pagos.some((p) => p !== pago && p.metodoPago === 'CREDITO');
  }

  // El crédito siempre representa "lo que falta": total − pagos de contado.
  // Se recalcula cada vez que cambian los demás montos.
  private recalcularCredito(): void {
    const credito = this.pagos.find((p) => p.metodoPago === 'CREDITO');
    if (!credito) return;
    const otros = this.pagos
      .filter((p) => p !== credito)
      .reduce((s, p) => s + (p.monto ?? 0), 0);
    credito.monto = Math.max(this.totalConDescuento - otros, 0);
  }

  onMontoChange(): void {
    this.recalcularCredito();
  }

  setMetodo(pago: PagoUI, m: MetodoPago): void {
    // No permitir dos líneas a crédito
    if (m === 'CREDITO' && this.creditoEnOtraLinea(pago)) return;
    pago.metodoPago = m;
    pago.cuentaBancariaId = null;
    if (m === 'CREDITO') {
      pago.monto = 0; // se completa con el resto en recalcularCredito()
    }
    this.recalcularCredito();
  }

  addPago(): void {
    this.pagos.push({
      metodoPago: 'EFECTIVO',
      monto: Math.max(this.faltante, 0) || null,
      referencia: null,
      cuentaBancariaId: null,
    });
    this.recalcularCredito();
  }

  removePago(i: number): void {
    if (this.pagos.length > 1) this.pagos.splice(i, 1);
    this.recalcularCredito();
  }

  distribuirRestante(pago: PagoUI): void {
    const otros = this.pagos
      .filter((p) => p !== pago && p.metodoPago !== 'CREDITO')
      .reduce((s, p) => s + (p.monto ?? 0), 0);
    pago.monto = Math.max(this.totalConDescuento - otros, 0);
    this.recalcularCredito();
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);

  confirmar(): void {
    if (!this.cuadra || this.isSubmitting || this.creditoBloqueado) return;
    const dtos: CreateVentaPagoDto[] = this.pagos
      .filter((p) => (p.monto ?? 0) > 0)
      .map((p) => ({
        metodoPago: p.metodoPago,
        monto: p.monto!,
        referencia: p.referencia || null,
        cuentaBancariaId: p.cuentaBancariaId ?? null,
      }));
    this.isSubmitting = true;
    this.ventaConfirmada.emit({
      pagos: dtos,
      descuentoGeneral: this.descuentoGeneral,
    });
  }

  ngOnDestroy(): void {
    this.detenerSondeo();
  }

  get puedeSolicitarAutorizacion(): boolean {
    return !!this.creditoInfo && !this.creditoInfo.permitido && this.creditoInfo.requiereAutorizacion && !!this.clienteId;
  }

  async solicitarAutorizacion(): Promise<void> {
    if (!this.creditoInfo || !this.clienteId) return;
    this.solicitando = true;
    try {
      const res = await lastValueFrom(
        this.carteraService.solicitarAutorizacion(
          this.clienteId,
          this.creditoInfo.montoSolicitado,
          this.observacionSolicitud.trim() || null,
        ),
      );
      this.esperar(res.data.id);
      this.solicitud = res.data;
    } catch (err: any) {
      this.solicitud = null;
      this.errorSolicitud = err?.error?.message ?? 'No se pudo enviar la solicitud';
    } finally {
      this.solicitando = false;
    }
  }

  errorSolicitud: string | null = null;

  /** Pregunta cada 5 segundos si un administrador ya respondió. */
  private esperar(id: number): void {
    this.detenerSondeo();
    this.errorSolicitud = null;
    const revisar = async () => {
      try {
        const res = await lastValueFrom(this.carteraService.solicitud(id));
        this.solicitud = res.data;
        if (res.data.estado === 'APROBADA' && this.clienteId && this.creditoInfo) {
          this.detenerSondeo();
          const v = await lastValueFrom(this.carteraService.validarVenta(this.clienteId, this.creditoInfo.montoSolicitado));
          if (v.data) this.creditoInfo = v.data;
        } else if (res.data.estado !== 'PENDIENTE') {
          this.detenerSondeo();
        }
      } catch {
        /* se reintenta en la siguiente vuelta */
      }
    };
    revisar();
    this.sondeo = setInterval(revisar, 5000);
  }

  private detenerSondeo(): void {
    if (this.sondeo) clearInterval(this.sondeo);
    this.sondeo = null;
  }

  closeModal(): void {
    this.detenerSondeo();
    this.modalClosed.emit();
    this.descuentoGeneral = 0;
  }

  metodoInfo(m: MetodoPago) {
    return this.metodos.find((x) => x.value === m) ?? this.metodos[0];
  }

  getCreditoColor(): string {
    if (!this.creditoInfo) return '#64748b';
    if (!this.creditoInfo.permitido) return '#dc2626';
    if ((this.creditoInfo.saldoDisponible ?? 0) < 0) return '#f59e0b';
    return '#10b981';
  }
}
