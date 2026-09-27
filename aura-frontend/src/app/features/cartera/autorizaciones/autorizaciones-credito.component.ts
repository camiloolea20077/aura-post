import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { lastValueFrom } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { ESTADOS_SOLICITUD, SolicitudCreditoModel } from '../../../core/models/cartera.model';

/**
 * Bandeja de autorizaciones para vender por encima del cupo. Mientras está
 * abierta se refresca sola: del otro lado hay un cajero esperando.
 */
@Component({
  selector: 'app-autorizaciones-credito',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, TextareaModule, TooltipModule, SkeletonModule],
  templateUrl: './autorizaciones-credito.component.html',
  styleUrls: ['./autorizaciones-credito.component.scss'],
})
export class AutorizacionesCreditoComponent implements OnInit, OnDestroy {
  @Output() pendientesChange = new EventEmitter<number>();

  solicitudes: SolicitudCreditoModel[] = [];
  cargando = false;
  soloPendientes = true;
  readonly vigencias = [1, 4, 8, 24];
  vigencia: Record<number, number | undefined> = {};
  procesando: number | null = null;

  rechazoVisible = false;
  rechazo: SolicitudCreditoModel | null = null;
  motivo = '';

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly carteraService: CarteraService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.timer = setInterval(() => this.cargar(true), 20 * 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async cargar(silencioso = false): Promise<void> {
    if (!silencioso) {
      this.cargando = true;
      this.cdr.markForCheck();
    }
    try {
      const res = await lastValueFrom(this.carteraService.solicitudes(this.soloPendientes ? 'PENDIENTE' : null));
      this.solicitudes = res.data ?? [];
      const pendientes = this.solicitudes.filter((s) => s.estado === 'PENDIENTE').length;
      if (this.soloPendientes) this.pendientesChange.emit(pendientes);
    } catch {
      if (!silencioso) this.alert.showError('Error', 'No se pudieron cargar las autorizaciones');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  setFiltro(pendientes: boolean): void {
    if (this.soloPendientes === pendientes) return;
    this.soloPendientes = pendientes;
    this.cargar();
  }

  async aprobar(s: SolicitudCreditoModel): Promise<void> {
    this.procesando = s.id;
    this.cdr.markForCheck();
    try {
      const horas = this.vigencia[s.id] ?? 4;
      await lastValueFrom(this.carteraService.aprobarAutorizacion(s.id, horas));
      this.alert.showSuccess('Autorización aprobada', `${s.terceroNombre} puede comprar a crédito durante ${horas} h`);
      this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo aprobar', err?.error?.message ?? '');
    } finally {
      this.procesando = null;
      this.cdr.markForCheck();
    }
  }

  pedirRechazo(s: SolicitudCreditoModel): void {
    this.rechazo = s;
    this.motivo = '';
    this.rechazoVisible = true;
    this.cdr.markForCheck();
  }

  async rechazar(): Promise<void> {
    if (!this.rechazo || !this.motivo.trim()) return;
    this.procesando = this.rechazo.id;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.carteraService.rechazarAutorizacion(this.rechazo.id, this.motivo.trim()));
      this.alert.showSuccess('Autorización rechazada', 'El cajero verá el motivo');
      this.rechazoVisible = false;
      this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo rechazar', err?.error?.message ?? '');
    } finally {
      this.procesando = null;
      this.cdr.markForCheck();
    }
  }

  estado(s: SolicitudCreditoModel) {
    return ESTADOS_SOLICITUD[s.estado];
  }

  verFicha(terceroId: number): void {
    this.router.navigate(['/cartera/cliente', terceroId]);
  }

  haceCuanto(fecha: string): string {
    const min = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
    if (min < 1) return 'hace un momento';
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }
}
