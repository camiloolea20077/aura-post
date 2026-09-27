import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { lastValueFrom } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { AgendaCobroModel, RESULTADOS_GESTION } from '../../../core/models/cartera.model';

/**
 * "Cobrar hoy": lo que el cobrador tiene que atender, de lo más urgente a lo
 * que puede esperar. Las promesas llegan ya evaluadas contra los pagos.
 */
@Component({
  selector: 'app-agenda-cobro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipModule, SkeletonModule],
  templateUrl: './agenda-cobro.component.html',
  styleUrls: ['./agenda-cobro.component.scss'],
})
export class AgendaCobroComponent implements OnInit {
  /** Pide al padre abrir su modal de gestión. */
  @Output() gestionar = new EventEmitter<{ terceroId: number; cuentaId?: number | null }>();

  agenda: AgendaCobroModel | null = null;
  cargando = false;
  dias = 7;
  readonly ventanas = [7, 15, 30];

  constructor(
    private readonly carteraService: CarteraService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.carteraService.agenda(this.dias));
      this.agenda = res.data;
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la agenda de cobro');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  setDias(d: number): void {
    if (this.dias === d) return;
    this.dias = d;
    this.cargar();
  }

  get pendientesTotal(): number {
    const a = this.agenda;
    if (!a) return 0;
    return a.promesasHoy.length + a.promesasIncumplidas.length + a.vencidosSinGestion.length;
  }

  get cumplimientoPct(): number | null {
    const r = this.agenda?.resumen;
    if (!r || !r.promesasResueltasMes) return null;
    return Math.round((r.promesasCumplidasMes / r.promesasResueltasMes) * 100);
  }

  verFicha(terceroId: number): void {
    this.router.navigate(['/cartera/cliente', terceroId]);
  }

  gestion(terceroId: number, cuentaId?: number | null): void {
    this.gestionar.emit({ terceroId, cuentaId });
  }

  whatsapp(telefono: string | null, nombre: string, texto: string): string | null {
    const digitos = (telefono ?? '').replace(/\D/g, '');
    if (digitos.length < 7) return null;
    const numero = digitos.length === 10 ? '57' + digitos : digitos;
    return `https://wa.me/${numero}?text=${encodeURIComponent(`Hola ${nombre}, ${texto}`)}`;
  }

  pctPagado(pagado: number, prometido: number): number {
    return prometido > 0 ? Math.min(100, Math.round((pagado / prometido) * 100)) : 0;
  }

  etiquetaResultado(v: string | null): string {
    return RESULTADOS_GESTION.find((r) => r.value === v)?.label ?? v ?? 'Sin gestión';
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
