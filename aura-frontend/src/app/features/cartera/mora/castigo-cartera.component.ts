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
  CandidatoCastigoModel,
  CastigoModel,
  DeterioroSugeridoModel,
  PoliticaCarteraModel,
} from '../../../core/models/cartera-mora.model';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../shared/pipes/fecha-es.pipe';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import { PoliticaCarteraDialogComponent } from './politica-cartera-dialog.component';

/**
 * Cartera C9: deterioro sugerido (lo que falta provisionar según los tramos de
 * la política) y castigo de facturas incobrables. El castigo saca la factura de
 * la cartera activa sin borrar su historial y se puede anular.
 */
@Component({
  selector: 'app-castigo-cartera',
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
  templateUrl: './castigo-cartera.component.html',
  styleUrls: ['./mora.scss'],
})
export class CastigoCarteraComponent implements OnInit {
  // Deterioro
  deterioro: DeterioroSugeridoModel | null = null;
  cargandoDeterioro = false;
  verFacturasDeterioro = false;
  proponiendo = false;

  // Candidatos
  candidatos: CandidatoCastigoModel[] = [];
  cargandoCandidatos = false;
  /** null = los días de la política. */
  dias: number | null = null;
  seleccion: CandidatoCastigoModel[] = [];

  // Castigar
  castigarVisible = false;
  fecha: Date = new Date();
  motivoCastigo = '';
  castigando = false;

  // Historial
  castigos: CastigoModel[] = [];
  totalCastigos = 0;
  rowsCastigos = 20;
  cargandoCastigos = false;
  search = '';
  private searchTimer?: ReturnType<typeof setTimeout>;

  // Anular
  anularVisible = false;
  anularCastigo: CastigoModel | null = null;
  motivoAnular = '';
  anulando = false;

  politicaVisible = false;
  /** La pestaña de intereses solo existe si la empresa los cobra: avisa al padre. */
  @Output() politicaCambiada = new EventEmitter<boolean>();
  readonly hoy = new Date();

  constructor(
    private readonly service: CarteraMoraService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarDeterioro();
    this.cargarCandidatos();
    this.cargarCastigos(0);
  }

  recargar(): void {
    this.cargarDeterioro();
    this.cargarCandidatos();
    this.cargarCastigos(0);
  }

  // ── Deterioro ─────────────────────────────────────────────────────
  async cargarDeterioro(): Promise<void> {
    this.cargandoDeterioro = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.deterioro());
      this.deterioro = res.data;
    } catch {
      this.alert.showError('Error', 'No se pudo calcular el deterioro');
    } finally {
      this.cargandoDeterioro = false;
      this.cdr.markForCheck();
    }
  }

  get tramosTexto(): string {
    const t = this.deterioro?.tramos ?? {};
    const partes = Object.entries(t)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([d, p]) => `${d}+ días: ${p} %`);
    return partes.length ? partes.join(' · ') : 'Sin tramos en la política';
  }

  get puedeProponer(): boolean {
    const d = this.deterioro;
    return !!d && d.borradoresPendientes === 0 && d.ajuste > 0;
  }

  async proponer(): Promise<void> {
    if (!this.puedeProponer) return;
    this.proponiendo = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.proponerDeterioro());
      this.alert.showSuccess('Deterioro propuesto', res.message ?? '');
      this.cargarDeterioro();
    } catch (err: any) {
      this.alert.showError('No se pudo proponer', err?.error?.message ?? '');
    } finally {
      this.proponiendo = false;
      this.cdr.markForCheck();
    }
  }

  // ── Candidatos ────────────────────────────────────────────────────
  async cargarCandidatos(): Promise<void> {
    this.cargandoCandidatos = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.candidatosCastigo(this.dias));
      this.candidatos = res.data ?? [];
      this.seleccion = [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las facturas candidatas');
    } finally {
      this.cargandoCandidatos = false;
      this.cdr.markForCheck();
    }
  }

  get totalSeleccion(): number {
    return this.seleccion.reduce((acc, c) => acc + (c.saldo ?? 0), 0);
  }

  abrirCastigar(): void {
    if (!this.seleccion.length) return;
    this.fecha = new Date();
    this.motivoCastigo = '';
    this.castigarVisible = true;
  }

  async castigar(): Promise<void> {
    if (this.motivoCastigo.trim().length < 10) return;
    this.castigando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.castigar({
          cuentaCobrarIds: this.seleccion.map((c) => c.cuentaCobrarId),
          fecha: aFechaLocal(this.fecha),
          motivo: this.motivoCastigo.trim(),
        }),
      );
      this.alert.showSuccess('Listo', res.message ?? 'Cartera castigada');
      this.castigarVisible = false;
      this.recargar();
    } catch (err: any) {
      this.alert.showError('No se pudo castigar', err?.error?.message ?? '');
    } finally {
      this.castigando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Historial ─────────────────────────────────────────────────────
  async cargarCastigos(page: number): Promise<void> {
    this.cargandoCastigos = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.castigos({ page, rows: this.rowsCastigos, search: this.search || null }),
      );
      this.castigos = res.data?.content ?? [];
      this.totalCastigos = res.data?.totalElements ?? 0;
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar los castigos');
    } finally {
      this.cargandoCastigos = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.cargarCastigos(0), 400);
  }

  onPage(event: any): void {
    this.rowsCastigos = event.rows;
    this.cargarCastigos(Math.floor(event.first / event.rows));
  }

  abrirAnular(c: CastigoModel): void {
    this.anularCastigo = c;
    this.motivoAnular = '';
    this.anularVisible = true;
  }

  async anular(): Promise<void> {
    if (!this.anularCastigo || !this.motivoAnular.trim()) return;
    this.anulando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.anularCastigo(this.anularCastigo.id, this.motivoAnular.trim()));
      this.alert.showSuccess('Listo', res.message ?? 'Castigo anulado');
      this.anularVisible = false;
      this.recargar();
    } catch (err: any) {
      this.alert.showError('No se pudo anular', err?.error?.message ?? '');
    } finally {
      this.anulando = false;
      this.cdr.markForCheck();
    }
  }

  onPoliticaGuardada(p: PoliticaCarteraModel): void {
    this.politicaCambiada.emit(!!p?.interesActivo);
    this.recargar();
  }

  verFicha(terceroId: number): void {
    this.router.navigate(['/cartera/cliente', terceroId]);
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
