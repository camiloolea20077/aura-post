import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CarteraMoraService } from '../../../core/services/cartera-mora.service';
import {
  CalculoInteresModel,
  InteresClienteModel,
  InteresMoraModel,
  PoliticaCarteraModel,
} from '../../../core/models/cartera-mora.model';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../shared/pipes/fecha-es.pipe';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import { PoliticaCarteraDialogComponent } from './politica-cartera-dialog.component';

/**
 * Cartera C5: interés de mora causado a hoy por cliente y los cobros ya
 * facturados. El interés no es ingreso hasta que se factura: al facturarlo se
 * crea una cuenta por cobrar aparte (DB 1305 · CR 4210).
 */
@Component({
  selector: 'app-intereses-mora',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    CheckboxModule,
    TextareaModule,
    TooltipModule,
    FechaEsPipe,
    PoliticaCarteraDialogComponent,
  ],
  templateUrl: './intereses-mora.component.html',
  styleUrls: ['./mora.scss'],
})
export class InteresesMoraComponent implements OnInit {
  calculo: CalculoInteresModel | null = null;
  cargandoCalculo = false;
  /** Clientes con el detalle por factura desplegado. */
  abiertos = new Set<number>();

  // Cobros facturados
  cobros: InteresMoraModel[] = [];
  totalCobros = 0;
  rowsCobros = 20;
  cargandoCobros = false;
  search = '';
  private searchTimer?: ReturnType<typeof setTimeout>;

  politicaVisible = false;
  /** La pestaña de intereses solo existe si la empresa los cobra: avisa al padre. */
  @Output() politicaCambiada = new EventEmitter<boolean>();

  // Facturar
  facturarVisible = false;
  cliente: InteresClienteModel | null = null;
  seleccion = new Set<number>();
  fecha: Date = new Date();
  plazoDias: number | null = 0;
  observaciones = '';
  facturando = false;

  // Anular
  anularVisible = false;
  anularCobro: InteresMoraModel | null = null;
  motivo = '';
  anulando = false;

  readonly hoy = new Date();

  constructor(
    private readonly service: CarteraMoraService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarCalculo();
    this.cargarCobros(0);
  }

  async cargarCalculo(): Promise<void> {
    this.cargandoCalculo = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.calcularIntereses());
      this.calculo = res.data;
    } catch {
      this.alert.showError('Error', 'No se pudo calcular el interés de mora');
    } finally {
      this.cargandoCalculo = false;
      this.cdr.markForCheck();
    }
  }

  async cargarCobros(page: number): Promise<void> {
    this.cargandoCobros = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.intereses({ page, rows: this.rowsCobros, search: this.search || null }),
      );
      this.cobros = res.data?.content ?? [];
      this.totalCobros = res.data?.totalElements ?? 0;
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar los cobros de intereses');
    } finally {
      this.cargandoCobros = false;
      this.cdr.markForCheck();
    }
  }

  recargar(): void {
    this.cargarCalculo();
    this.cargarCobros(0);
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.cargarCobros(0), 400);
  }

  onPage(event: any): void {
    this.rowsCobros = event.rows;
    this.cargarCobros(Math.floor(event.first / event.rows));
  }

  toggleCliente(id: number): void {
    const s = new Set(this.abiertos);
    s.has(id) ? s.delete(id) : s.add(id);
    this.abiertos = s;
  }

  onPoliticaGuardada(p: PoliticaCarteraModel): void {
    this.politicaCambiada.emit(!!p?.interesActivo);
    this.recargar();
  }

  verFicha(terceroId: number): void {
    this.router.navigate(['/cartera/cliente', terceroId]);
  }

  // ── Facturar ──────────────────────────────────────────────────────
  abrirFacturar(c: InteresClienteModel): void {
    this.cliente = c;
    this.seleccion = new Set(c.cuentas.filter((x) => x.valor > 0).map((x) => x.cuentaCobrarId));
    this.fecha = new Date();
    this.plazoDias = 0;
    this.observaciones = '';
    this.facturarVisible = true;
  }

  toggleCuenta(id: number): void {
    const s = new Set(this.seleccion);
    s.has(id) ? s.delete(id) : s.add(id);
    this.seleccion = s;
  }

  get totalSeleccion(): number {
    if (!this.cliente) return 0;
    return this.cliente.cuentas
      .filter((c) => this.seleccion.has(c.cuentaCobrarId))
      .reduce((acc, c) => acc + (c.valor ?? 0), 0);
  }

  async facturar(): Promise<void> {
    if (!this.cliente || !this.seleccion.size) return;
    this.facturando = true;
    this.cdr.markForCheck();
    try {
      const todas = this.seleccion.size === this.cliente.cuentas.length;
      const res = await lastValueFrom(
        this.service.facturarIntereses({
          terceroId: this.cliente.terceroId,
          fecha: aFechaLocal(this.fecha),
          plazoDias: this.plazoDias ?? 0,
          cuentaCobrarIds: todas ? null : [...this.seleccion],
          observaciones: this.observaciones.trim() || null,
        }),
      );
      this.alert.showSuccess('Intereses facturados', res.message ?? '');
      this.facturarVisible = false;
      this.recargar();
    } catch (err: any) {
      this.alert.showError('No se pudo facturar', err?.error?.message ?? '');
    } finally {
      this.facturando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Anular ────────────────────────────────────────────────────────
  abrirAnular(c: InteresMoraModel): void {
    this.anularCobro = c;
    this.motivo = '';
    this.anularVisible = true;
  }

  async anular(): Promise<void> {
    if (!this.anularCobro || !this.motivo.trim()) return;
    this.anulando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.anularInteres(this.anularCobro.id, this.motivo.trim()));
      this.alert.showSuccess('Listo', 'Cobro de intereses anulado');
      this.anularVisible = false;
      this.recargar();
    } catch (err: any) {
      this.alert.showError('No se pudo anular', err?.error?.message ?? '');
    } finally {
      this.anulando = false;
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
