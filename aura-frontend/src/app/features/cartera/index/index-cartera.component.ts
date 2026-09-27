import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { CalendarModule } from 'primeng/calendar';
import { Router } from '@angular/router';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import { ViewChild } from '@angular/core';
import { AgendaCobroComponent } from '../agenda/agenda-cobro.component';
import { TableroCarteraComponent } from '../tablero/tablero-cartera.component';
import { AutorizacionesCreditoComponent } from '../autorizaciones/autorizaciones-credito.component';
import { AcuerdoDetalleDialogComponent } from '../acuerdos/acuerdo-detalle-dialog.component';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  AcuerdoPagoModel,
  ClienteCarteraModel,
  CreateGestionCobroDto,
  ESTADOS_ACUERDO,
  EstadoAcuerdo,
  CreateTerceroCreditoDto,
  CuentaVencidaAlertaModel,
  EdadCarteraModel,
  ReciboCajaTableModel,
  ESTADOS_CREDITO,
  NIVELES_RIESGO,
  RESULTADOS_GESTION,
  TabCartera,
  TIPOS_GESTION,
} from '../../../core/models/cartera.model';

@Component({
  selector: 'app-index-cartera',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    InputNumberModule,
    DropdownModule,
    CheckboxModule,
    TextareaModule,
    CalendarModule,
    AgendaCobroComponent,
    TableroCarteraComponent,
    AutorizacionesCreditoComponent,
    AcuerdoDetalleDialogComponent,
  ],
  providers: [MessageService, CurrencyPipe],
  templateUrl: './index-cartera.component.html',
  styleUrls: ['./index-cartera.component.scss'],
})
export class IndexCarteraComponent implements OnInit {
  // ── Tab activo ────────────────────────────────────────────────────
  tab: TabCartera = 'dashboard';


  // ── Alertas ───────────────────────────────────────────────────────
  alertas: CuentaVencidaAlertaModel[] = [];
  loadingAlertas = false;

  // ── Edades ────────────────────────────────────────────────────────
  edades: EdadCarteraModel[] = [];
  loadingEdades = false;

  // ── Clientes ──────────────────────────────────────────────────────
  clientes: ClienteCarteraModel[] = [];
  totalClientes = 0;
  rowsClientes = 20;
  loadingClientes = false;
  searchClientes = '';
  private searchTimer?: ReturnType<typeof setTimeout>;

  // ── Recibos de caja ───────────────────────────────────────────────
  recibos: ReciboCajaTableModel[] = [];
  totalRecibos = 0;
  rowsRecibos = 20;
  loadingRecibos = false;
  searchRecibos = '';
  estadoRecibos: string | null = null;
  readonly estadosRecibo = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: 'ACTIVO' },
    { label: 'Anulados', value: 'ANULADO' },
  ];
  private searchRecibosTimer?: ReturnType<typeof setTimeout>;

  // ── Acuerdos de pago ──────────────────────────────────────────────
  acuerdos: AcuerdoPagoModel[] = [];
  totalAcuerdos = 0;
  rowsAcuerdos = 20;
  loadingAcuerdos = false;
  searchAcuerdos = '';
  estadoAcuerdos: EstadoAcuerdo | null = null;
  readonly estadosAcuerdoFiltro = [
    { label: 'Todos', value: null },
    { label: 'Vigentes', value: 'VIGENTE' },
    { label: 'Incumplidos', value: 'INCUMPLIDO' },
    { label: 'Cumplidos', value: 'CUMPLIDO' },
    { label: 'Anulados', value: 'ANULADO' },
  ];
  acuerdoDetalleId: number | null = null;
  acuerdoDetalleVisible = false;
  private searchAcuerdosTimer?: ReturnType<typeof setTimeout>;

  // ── Modal crédito ─────────────────────────────────────────────────
  showCreditoModal = false;
  creditoEditId: number | null = null;
  clienteSeleccionado: ClienteCarteraModel | null = null;
  creditoForm: CreateTerceroCreditoDto = {
    terceroId: 0,
    cupoCreditoInicial: 0,
    plazoDias: 30,
    estadoCredito: 'ACTIVO',
    requiereAutorizacion: false,
    diasMoraTolerancia: 30,
  };
  savingCredito = false;

  // ── Modal gestión cobro ───────────────────────────────────────────
  showGestionModal = false;
  gestionForm: CreateGestionCobroDto = {
    terceroId: 0,
    tipoGestion: '',
    resultado: null,
    nota: null,
    montoPrometido: null,
  };
  savingGestion = false;
  cuentaSeleccionadaId: number | null = null;
  fechaPromesa: Date | null = null;
  readonly hoy = new Date();

  // ── Opciones ──────────────────────────────────────────────────────
  readonly tiposGestion = TIPOS_GESTION;
  readonly resultadosGestion = RESULTADOS_GESTION;
  readonly estadosCredito = ESTADOS_CREDITO;
  readonly nivelesRiesgo = NIVELES_RIESGO;

  constructor(
    private readonly carteraService: CarteraService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  @ViewChild(AgendaCobroComponent) agendaCmp?: AgendaCobroComponent;
  @ViewChild(TableroCarteraComponent) tableroCmp?: TableroCarteraComponent;
  @ViewChild(AutorizacionesCreditoComponent) autorizacionesCmp?: AutorizacionesCreditoComponent;
  pendientesAutorizacion = 0;

  ngOnInit(): void {
    this.contarAutorizaciones();
    // La campana abre la pestaña que corresponde al aviso.
    const estado = history.state;
    const desdeCampana: TabCartera[] = ['agenda', 'autorizaciones', 'alertas', 'acuerdos'];
    if (desdeCampana.includes(estado?.tab)) {
      history.replaceState({ ...estado, tab: null }, '');
      this.setTab(estado.tab);
      return;
    }
  }

  // ── Navegación tabs ───────────────────────────────────────────────
  setTab(t: TabCartera): void {
    this.tab = t;
    if (t === 'alertas' && !this.alertas.length) this.cargarAlertas();
    if (t === 'edades' && !this.edades.length) this.cargarEdades();
    if (t === 'clientes' && !this.clientes.length) this.cargarClientes(0);
    if (t === 'recibos' && !this.recibos.length) this.cargarRecibos(0);
    if (t === 'acuerdos' && !this.acuerdos.length) this.cargarAcuerdos(0);
    this.cdr.markForCheck();
  }

  // ── Carga datos ───────────────────────────────────────────────────
  async cargarAlertas(): Promise<void> {
    this.loadingAlertas = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.carteraService.alertas(100));
      this.alertas = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar las alertas');
    } finally {
      this.loadingAlertas = false;
      this.cdr.markForCheck();
    }
  }

  async cargarEdades(): Promise<void> {
    this.loadingEdades = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.carteraService.edades());
      this.edades = res?.data ?? [];
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar las edades de cartera',
      );
    } finally {
      this.loadingEdades = false;
      this.cdr.markForCheck();
    }
  }

  async cargarClientes(page: number): Promise<void> {
    this.loadingClientes = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.carteraService.clientes(
          page,
          this.rowsClientes,
          this.searchClientes || undefined,
        ),
      );
      this.clientes = res?.data?.content ?? [];
      this.totalClientes = res?.data?.totalElements ?? 0;
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar los clientes',
      );
    } finally {
      this.loadingClientes = false;
      this.cdr.markForCheck();
    }
  }

  onSearchClientes(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.cargarClientes(0), 400);
  }

  onPageClientes(event: any): void {
    const page = Math.floor(event.first / event.rows);
    this.rowsClientes = event.rows;
    this.cargarClientes(page);
  }

  verFicha(terceroId: number): void {
    this.router.navigate(['/cartera/cliente', terceroId]);
  }

  // ── Recibos de caja ───────────────────────────────────────────────
  async cargarRecibos(page: number): Promise<void> {
    this.loadingRecibos = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.carteraService.recibos({
          page,
          rows: this.rowsRecibos,
          estado: this.estadoRecibos,
          search: this.searchRecibos || null,
        }),
      );
      this.recibos = res?.data?.content ?? [];
      this.totalRecibos = res?.data?.totalElements ?? 0;
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los recibos');
    } finally {
      this.loadingRecibos = false;
      this.cdr.markForCheck();
    }
  }

  onSearchRecibos(): void {
    clearTimeout(this.searchRecibosTimer);
    this.searchRecibosTimer = setTimeout(() => this.cargarRecibos(0), 400);
  }

  onPageRecibos(event: any): void {
    this.rowsRecibos = event.rows;
    this.cargarRecibos(Math.floor(event.first / event.rows));
  }

  async imprimirRecibo(id: number): Promise<void> {
    try {
      const blob = await lastValueFrom(this.carteraService.reciboPdf(id));
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el PDF del recibo');
    }
  }

  // ── Acuerdos de pago ──────────────────────────────────────────────
  async cargarAcuerdos(page: number): Promise<void> {
    this.loadingAcuerdos = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.carteraService.acuerdos({
          page,
          rows: this.rowsAcuerdos,
          estado: this.estadoAcuerdos,
          search: this.searchAcuerdos || null,
        }),
      );
      this.acuerdos = res?.data?.content ?? [];
      this.totalAcuerdos = res?.data?.totalElements ?? 0;
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los acuerdos de pago');
    } finally {
      this.loadingAcuerdos = false;
      this.cdr.markForCheck();
    }
  }

  onSearchAcuerdos(): void {
    clearTimeout(this.searchAcuerdosTimer);
    this.searchAcuerdosTimer = setTimeout(() => this.cargarAcuerdos(0), 400);
  }

  onPageAcuerdos(event: any): void {
    this.rowsAcuerdos = event.rows;
    this.cargarAcuerdos(Math.floor(event.first / event.rows));
  }

  verAcuerdo(a: AcuerdoPagoModel): void {
    this.acuerdoDetalleId = a.id;
    this.acuerdoDetalleVisible = true;
    this.cdr.markForCheck();
  }

  estadoAcuerdo(a: AcuerdoPagoModel): { label: string; color: string } {
    const colores: Record<EstadoAcuerdo, string> = {
      VIGENTE: '#2563eb',
      INCUMPLIDO: '#ef4444',
      CUMPLIDO: '#10b981',
      ANULADO: '#94a3b8',
    };
    return { label: ESTADOS_ACUERDO[a.estado].label, color: colores[a.estado] };
  }

  avanceAcuerdo(a: AcuerdoPagoModel): number {
    return a.valorTotal > 0 ? Math.min(100, Math.round((a.valorPagado / a.valorTotal) * 100)) : 0;
  }

  // ── Modal crédito ─────────────────────────────────────────────────
  abrirCreditoNuevo(cliente: ClienteCarteraModel): void {
    this.clienteSeleccionado = cliente;
    this.creditoEditId = null;
    this.creditoForm = {
      terceroId: cliente.terceroId,
      cupoCreditoInicial: 0,
      plazoDias: 30,
      estadoCredito: 'ACTIVO',
      requiereAutorizacion: false,
      diasMoraTolerancia: 30,
    };
    this.showCreditoModal = true;
    this.cdr.markForCheck();
  }

  abrirCreditoEditar(cliente: ClienteCarteraModel): void {
    this.clienteSeleccionado = cliente;
    this.creditoEditId = cliente.creditoId;
    this.creditoForm = {
      terceroId: cliente.terceroId,
      cupoCreditoInicial: cliente.cupoCreditoActual ?? 0,
      plazoDias: cliente.plazoDias ?? 30,
      estadoCredito: cliente.estadoCredito ?? 'ACTIVO',
      requiereAutorizacion: false,
      diasMoraTolerancia: 30,
    };
    this.showCreditoModal = true;
    this.cdr.markForCheck();
  }

  async guardarCredito(): Promise<void> {
    this.savingCredito = true;
    this.cdr.markForCheck();
    try {
      if (this.creditoEditId) {
        await lastValueFrom(
          this.carteraService.actualizarCredito(
            this.creditoEditId,
            this.creditoForm,
          ),
        );
        this.alertService.showSuccess('Crédito actualizado', '');
      } else {
        await lastValueFrom(this.carteraService.abrirCredito(this.creditoForm));
        this.alertService.showSuccess('Crédito configurado', '');
      }
      this.showCreditoModal = false;
      this.cargarClientes(0);
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo guardar el crédito',
      );
    } finally {
      this.savingCredito = false;
      this.cdr.markForCheck();
    }
  }

  // ── Modal gestión cobro ───────────────────────────────────────────
  abrirGestion(terceroId: number, cuentaId?: number): void {
    this.gestionForm = {
      terceroId,
      cuentaCobrarId: cuentaId ?? null,
      tipoGestion: '',
      resultado: null,
      nota: null,
      montoPrometido: null,
    };
    this.fechaPromesa = null;
    this.showGestionModal = true;
    this.cdr.markForCheck();
  }

  async guardarGestion(): Promise<void> {
    if (!this.gestionForm.tipoGestion) return;
    this.savingGestion = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.carteraService.registrarGestion({
          ...this.gestionForm,
          fechaPromesaPago:
            this.gestionForm.resultado === 'PROMESA_PAGO' && this.fechaPromesa
              ? aFechaLocal(this.fechaPromesa)
              : null,
        }),
      );
      this.alertService.showSuccess('Gestión registrada', '');
      this.showGestionModal = false;
      if (this.tab === 'alertas') this.cargarAlertas();
      if (this.tab === 'clientes') this.cargarClientes(0);
      if (this.tab === 'agenda') this.agendaCmp?.cargar();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? err?.message ?? 'No se pudo registrar la gestión',
      );
    } finally {
      this.savingGestion = false;
      this.cdr.markForCheck();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────
  formatCOP(val: number | null | undefined): string {
    if (val == null) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  }

  getNivelRiesgoColor(nivel: string | null): string {
    return NIVELES_RIESGO.find((n) => n.value === nivel)?.color ?? '#94a3b8';
  }

  getEstadoCreditoColor(estado: string | null): string {
    return ESTADOS_CREDITO.find((e) => e.value === estado)?.color ?? '#94a3b8';
  }

  getScoreColor(score: number): string {
    if (score >= 800) return '#10b981';
    if (score >= 600) return '#f59e0b';
    if (score >= 400) return '#ef4444';
    return '#7f1d1d';
  }

  getMoraColor(dias: number): string {
    if (dias === 0) return '#10b981';
    if (dias <= 30) return '#f59e0b';
    if (dias <= 60) return '#ef4444';
    return '#7f1d1d';
  }

  sumEdad(
    campo: 'corriente' | 'dias31a60' | 'dias61a90' | 'mas90dias' | 'total',
  ): number {
    return this.edades.reduce((acc, e) => acc + (e[campo] ?? 0), 0);
  }

  refreshTab(): void {
    if (this.tab === 'dashboard') this.tableroCmp?.cargar();
    if (this.tab === 'alertas') this.cargarAlertas();
    if (this.tab === 'edades') this.cargarEdades();
    if (this.tab === 'clientes') this.cargarClientes(0);
    if (this.tab === 'recibos') this.cargarRecibos(0);
    if (this.tab === 'acuerdos') this.cargarAcuerdos(0);
    if (this.tab === 'agenda') this.agendaCmp?.cargar();
    if (this.tab === 'autorizaciones') this.autorizacionesCmp?.cargar();
  }

  irAReglas(): void {
    this.router.navigate(['/cartera/reglas']);
  }

  private async contarAutorizaciones(): Promise<void> {
    try {
      const res = await lastValueFrom(this.carteraService.solicitudes('PENDIENTE'));
      this.pendientesAutorizacion = res.data?.length ?? 0;
      this.cdr.markForCheck();
    } catch {
      /* la pestaña funciona igual sin el contador */
    }
  }
}
