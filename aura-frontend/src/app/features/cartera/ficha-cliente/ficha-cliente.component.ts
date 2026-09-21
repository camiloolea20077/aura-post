import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { lastValueFrom } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import {
  AcuerdoPagoModel,
  CreateGestionCobroDto,
  ESTADOS_ACUERDO,
  ESTADOS_CREDITO,
  ESTADOS_PROMESA,
  EstadoPromesa,
  FichaAnticipoModel,
  FichaClienteCarteraModel,
  FichaFacturaModel,
  NIVELES_RIESGO,
  ReciboCajaModel,
  ReciboCajaTableModel,
  RESULTADOS_GESTION,
  TIPOS_GESTION,
} from '../../../core/models/cartera.model';
import { ReciboCajaDialogComponent } from '../recibo-caja/recibo-caja-dialog.component';
import { AcuerdoPagoDialogComponent } from '../acuerdos/acuerdo-pago-dialog.component';
import { AcuerdoDetalleDialogComponent } from '../acuerdos/acuerdo-detalle-dialog.component';

type TabFicha = 'facturas' | 'pagos' | 'recibos' | 'gestiones' | 'anticipos' | 'credito' | 'acuerdos';

/** Ficha del cliente: lo que debe, cómo paga y qué se ha hecho para cobrarle. */
@Component({
  selector: 'app-ficha-cliente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    CalendarModule,
    TextareaModule,
    TooltipModule,
    SkeletonModule,
    ReciboCajaDialogComponent,
    AcuerdoPagoDialogComponent,
    AcuerdoDetalleDialogComponent,
  ],
  templateUrl: './ficha-cliente.component.html',
  styleUrls: ['./ficha-cliente.component.scss'],
})
export class FichaClienteComponent implements OnInit {
  terceroId = 0;
  ficha: FichaClienteCarteraModel | null = null;
  cargando = false;
  tab: TabFicha = 'facturas';

  // Registrar pago
  reciboVisible = false;
  facturaInicialId: number | null = null;

  // Acuerdos de pago
  acuerdoVisible = false;
  acuerdoDetalleVisible = false;
  acuerdoDetalleId: number | null = null;

  // Gestión de cobro
  gestionVisible = false;
  guardandoGestion = false;
  gestion: CreateGestionCobroDto = this.gestionVacia();
  fechaPromesa: Date | null = null;
  readonly tiposGestion = TIPOS_GESTION;
  readonly resultadosGestion = RESULTADOS_GESTION;
  readonly hoy = new Date();

  // Anular recibo
  anularVisible = false;
  reciboAnular: ReciboCajaTableModel | null = null;
  motivoAnulacion = '';
  anulando = false;

  // Cruzar anticipo
  cruceVisible = false;
  anticipoCruce: FichaAnticipoModel | null = null;
  cruceFacturaId: number | null = null;
  cruceMonto: number | null = null;
  cruzando = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly carteraService: CarteraService,
    private readonly terceroService: TerceroService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.terceroId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.carteraService.ficha(this.terceroId));
      this.ficha = res.data;
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo cargar la ficha del cliente');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  setTab(t: TabFicha): void {
    this.tab = t;
    this.cdr.markForCheck();
  }

  volver(): void {
    this.router.navigate(['/cartera']);
  }

  // ── Resumen ─────────────────────────────────────────────────────────
  get usoCupoPct(): number {
    const c = this.ficha?.cliente.cupoCredito;
    if (!c || c <= 0) return 0;
    return Math.min(100, Math.round(((this.ficha?.resumen.saldoTotal ?? 0) / c) * 100));
  }

  get edades(): { label: string; valor: number; clase: string }[] {
    const r = this.ficha?.resumen;
    if (!r) return [];
    return [
      { label: 'Por vencer', valor: r.edadPorVencer, clase: 'e0' },
      { label: '1–30 días', valor: r.edad1a30, clase: 'e1' },
      { label: '31–60 días', valor: r.edad31a60, clase: 'e2' },
      { label: '61–90 días', valor: r.edad61a90, clase: 'e3' },
      { label: '+90 días', valor: r.edadMas90, clase: 'e4' },
    ];
  }

  edadPct(valor: number): number {
    const total = this.ficha?.resumen.saldoTotal ?? 0;
    return total > 0 ? (valor / total) * 100 : 0;
  }

  get semaforo(): { texto: string; clase: string } {
    const r = this.ficha?.resumen;
    const estado = this.ficha?.cliente.estadoCredito;
    if (estado === 'BLOQUEADO') return { texto: 'Crédito bloqueado', clase: 'danger' };
    if (estado === 'SUSPENDIDO') return { texto: 'Crédito suspendido', clase: 'warn' };
    if (!r || r.saldoTotal <= 0) return { texto: 'Sin deuda', clase: 'ok' };
    if (r.diasMoraMaximo > 60) return { texto: `Mora de ${r.diasMoraMaximo} días`, clase: 'danger' };
    if (r.diasMoraMaximo > 0) return { texto: `Mora de ${r.diasMoraMaximo} días`, clase: 'warn' };
    return { texto: 'Al día', clase: 'ok' };
  }

  colorEstadoCredito(estado: string | null): string {
    return ESTADOS_CREDITO.find((e) => e.value === estado)?.color ?? '#94a3b8';
  }

  colorRiesgo(nivel: string | null): string {
    return NIVELES_RIESGO.find((n) => n.value === nivel)?.color ?? '#94a3b8';
  }

  etiquetaDias(f: FichaFacturaModel): string {
    if (f.fechaVencimiento == null) return 'Sin vencimiento';
    if (f.diasVencida > 0) return `Vencida hace ${f.diasVencida} d`;
    if (f.diasVencida === 0) return 'Vence hoy';
    return `Vence en ${-f.diasVencida} d`;
  }

  estadoPromesa(e: EstadoPromesa | null): { label: string; clase: string } | null {
    return e ? ESTADOS_PROMESA[e] : null;
  }

  /** Promesa vigente del cliente, para mostrarla arriba. */
  get promesaPendiente() {
    return this.ficha?.gestiones.find((g) => g.estadoPromesa === 'PENDIENTE') ?? null;
  }

  etiquetaHistorial(tipo: string): string {
    const m: Record<string, string> = {
      APERTURA: 'Crédito abierto',
      AUMENTO_CUPO: 'Subió el cupo',
      REDUCCION_CUPO: 'Bajó el cupo',
      SUSPENSION: 'Crédito suspendido',
      BLOQUEO: 'Crédito bloqueado',
      DESBLOQUEO: 'Crédito desbloqueado',
      MORA_DETECTADA: 'Suspendido por mora',
      NORMALIZACION: 'Crédito normalizado',
      ALERTA: 'Alerta',
    };
    return m[tipo] ?? tipo.replace(/_/g, ' ').toLowerCase();
  }

  iconoHistorial(tipo: string): string {
    if (tipo.includes('AUMENTO') || tipo === 'NORMALIZACION' || tipo === 'DESBLOQUEO') return 'pi-arrow-up';
    if (tipo.includes('REDUCCION')) return 'pi-arrow-down';
    if (tipo === 'BLOQUEO') return 'pi-lock';
    if (tipo === 'SUSPENSION' || tipo === 'MORA_DETECTADA') return 'pi-pause';
    if (tipo === 'ALERTA') return 'pi-bell';
    return 'pi-credit-card';
  }

  claseHistorial(tipo: string): string {
    if (tipo.includes('AUMENTO') || tipo === 'NORMALIZACION' || tipo === 'DESBLOQUEO' || tipo === 'APERTURA') return 'ok';
    if (tipo === 'BLOQUEO') return 'danger';
    if (tipo.includes('REDUCCION') || tipo === 'SUSPENSION' || tipo === 'MORA_DETECTADA') return 'warn';
    return 'info';
  }

  etiquetaTipoGestion(v: string): string {
    return TIPOS_GESTION.find((t) => t.value === v)?.label ?? v;
  }

  etiquetaResultado(v: string | null): string {
    return RESULTADOS_GESTION.find((t) => t.value === v)?.label ?? v ?? '';
  }

  iconoGestion(v: string): string {
    const m: Record<string, string> = {
      LLAMADA: 'pi-phone',
      EMAIL: 'pi-envelope',
      VISITA: 'pi-map-marker',
      NOTA: 'pi-pencil',
      ACUERDO_PAGO: 'pi-file-edit',
      MENSAJE: 'pi-comment',
    };
    return m[v] ?? 'pi-circle';
  }

  // ── Acuerdos de pago ────────────────────────────────────────────────
  /** Facturas con saldo que todavía no están en un acuerdo. */
  get facturasSinAcuerdo(): number {
    return (this.ficha?.facturas ?? []).filter((f) => !f.acuerdoId).length;
  }

  /** El acuerdo vivo más urgente, para mostrarlo arriba. */
  get acuerdoVivo(): AcuerdoPagoModel | null {
    return this.ficha?.acuerdos?.find((a) => a.estado === 'INCUMPLIDO' || a.estado === 'VIGENTE') ?? null;
  }

  estadoAcuerdo(a: AcuerdoPagoModel): { label: string; clase: string } {
    return ESTADOS_ACUERDO[a.estado];
  }

  avanceAcuerdo(a: AcuerdoPagoModel): number {
    return a.valorTotal > 0 ? Math.min(100, Math.round((a.valorPagado / a.valorTotal) * 100)) : 0;
  }

  nuevoAcuerdo(): void {
    this.acuerdoVisible = true;
    this.cdr.markForCheck();
  }

  onAcuerdoCreado(_a: AcuerdoPagoModel): void {
    this.tab = 'acuerdos';
    this.cargar();
  }

  verAcuerdo(id: number): void {
    this.acuerdoDetalleId = id;
    this.acuerdoDetalleVisible = true;
    this.cdr.markForCheck();
  }

  // ── Pago ────────────────────────────────────────────────────────────
  registrarPago(facturaId: number | null = null): void {
    this.facturaInicialId = facturaId;
    this.reciboVisible = true;
    this.cdr.markForCheck();
  }

  onReciboRegistrado(_r: ReciboCajaModel): void {
    this.cargar();
  }

  async imprimirRecibo(id: number): Promise<void> {
    try {
      const blob = await lastValueFrom(this.carteraService.reciboPdf(id));
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      this.alert.showError('Error', 'No se pudo generar el PDF del recibo');
    }
  }

  async estadoCuenta(): Promise<void> {
    try {
      const blob = await lastValueFrom(this.terceroService.getEstadoCuentaPdf(this.terceroId));
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      this.alert.showError('Error', 'No se pudo generar el estado de cuenta');
    }
  }

  async recalcularScore(): Promise<void> {
    try {
      await lastValueFrom(this.carteraService.recalcularScore(this.terceroId));
      this.alert.showSuccess('Score actualizado', '');
      this.cargar();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo recalcular el score');
    }
  }

  // ── Anular recibo ───────────────────────────────────────────────────
  pedirAnulacion(r: ReciboCajaTableModel): void {
    this.reciboAnular = r;
    this.motivoAnulacion = '';
    this.anularVisible = true;
    this.cdr.markForCheck();
  }

  async anularRecibo(): Promise<void> {
    if (!this.reciboAnular || !this.motivoAnulacion.trim()) return;
    this.anulando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.carteraService.anularRecibo(this.reciboAnular.id, this.motivoAnulacion.trim()));
      this.alert.showSuccess('Recibo anulado', `${this.reciboAnular.numero}: las facturas recuperaron su saldo`);
      this.anularVisible = false;
      this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo anular', err?.error?.message ?? '');
    } finally {
      this.anulando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Gestión de cobro ────────────────────────────────────────────────
  private gestionVacia(): CreateGestionCobroDto {
    return {
      terceroId: 0,
      cuentaCobrarId: null,
      tipoGestion: 'LLAMADA',
      resultado: null,
      nota: null,
      fechaPromesaPago: null,
      montoPrometido: null,
    };
  }

  abrirGestion(facturaId: number | null = null): void {
    this.gestion = { ...this.gestionVacia(), terceroId: this.terceroId, cuentaCobrarId: facturaId };
    this.fechaPromesa = null;
    this.gestionVisible = true;
    this.cdr.markForCheck();
  }

  get facturasOpts(): { label: string; value: number }[] {
    return (this.ficha?.facturas ?? []).map((f) => ({
      label: `${f.numeroCuenta} · ${this.formatCOP(f.saldoPendiente)}`,
      value: f.id,
    }));
  }

  get gestionInvalida(): boolean {
    if (!this.gestion.tipoGestion) return true;
    return this.gestion.resultado === 'PROMESA_PAGO' && (!this.fechaPromesa || !this.gestion.montoPrometido);
  }

  async guardarGestion(): Promise<void> {
    if (this.gestionInvalida) return;
    this.guardandoGestion = true;
    this.cdr.markForCheck();
    const promesa = this.gestion.resultado === 'PROMESA_PAGO';
    try {
      await lastValueFrom(
        this.carteraService.registrarGestion({
          ...this.gestion,
          fechaPromesaPago: promesa && this.fechaPromesa ? aFechaLocal(this.fechaPromesa) : null,
          montoPrometido: promesa ? this.gestion.montoPrometido : null,
        }),
      );
      this.alert.showSuccess('Gestión registrada', '');
      this.gestionVisible = false;
      this.tab = 'gestiones';
      this.cargar();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo registrar la gestión');
    } finally {
      this.guardandoGestion = false;
      this.cdr.markForCheck();
    }
  }

  // ── Cruzar anticipo ─────────────────────────────────────────────────
  abrirCruce(a: FichaAnticipoModel): void {
    this.anticipoCruce = a;
    const primera = this.ficha?.facturas[0] ?? null;
    this.cruceFacturaId = primera?.id ?? null;
    this.cruceMonto = primera ? Math.min(a.saldo, primera.saldoPendiente) : null;
    this.cruceVisible = true;
    this.cdr.markForCheck();
  }

  onCruceFactura(): void {
    const f = this.ficha?.facturas.find((x) => x.id === this.cruceFacturaId);
    if (f && this.anticipoCruce) this.cruceMonto = Math.min(this.anticipoCruce.saldo, f.saldoPendiente);
  }

  get cruceMaximo(): number {
    const f = this.ficha?.facturas.find((x) => x.id === this.cruceFacturaId);
    return Math.min(this.anticipoCruce?.saldo ?? 0, f?.saldoPendiente ?? 0);
  }

  async cruzar(): Promise<void> {
    if (!this.anticipoCruce || !this.cruceFacturaId || !this.cruceMonto) return;
    this.cruzando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.carteraService.cruzarAnticipo(this.anticipoCruce.id, this.cruceFacturaId, this.cruceMonto),
      );
      this.alert.showSuccess('Anticipo aplicado', 'El saldo a favor se descontó de la factura');
      this.cruceVisible = false;
      this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo aplicar', err?.error?.message ?? err?.error?.detail ?? '');
    } finally {
      this.cruzando = false;
      this.cdr.markForCheck();
    }
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
