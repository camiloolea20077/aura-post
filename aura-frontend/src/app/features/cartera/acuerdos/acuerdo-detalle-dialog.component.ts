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
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { lastValueFrom } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  AcuerdoCuotaModel,
  AcuerdoPagoModel,
  ESTADOS_ACUERDO,
  ESTADOS_CUOTA,
} from '../../../core/models/cartera.model';

/** Detalle de un acuerdo de pago: avance por cuota, facturas incluidas y anulación. */
@Component({
  selector: 'app-acuerdo-detalle-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, TextareaModule, SkeletonModule],
  templateUrl: './acuerdo-detalle-dialog.component.html',
  styleUrls: ['./acuerdo-detalle-dialog.component.scss'],
})
export class AcuerdoDetalleDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() acuerdoId: number | null = null;
  /** Desde la ficha del cliente no tiene sentido el botón "Ver ficha". */
  @Input() mostrarFicha = true;
  @Output() cambiado = new EventEmitter<AcuerdoPagoModel>();

  acuerdo: AcuerdoPagoModel | null = null;
  cargando = false;

  anulando = false;
  pidiendoMotivo = false;
  motivo = '';

  constructor(
    private readonly carteraService: CarteraService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] || changes['acuerdoId']) && this.visible && this.acuerdoId) this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.acuerdoId) return;
    this.cargando = true;
    this.pidiendoMotivo = false;
    this.motivo = '';
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.carteraService.acuerdo(this.acuerdoId));
      this.acuerdo = res.data;
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo cargar el acuerdo');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  get vivo(): boolean {
    return this.acuerdo?.estado === 'VIGENTE' || this.acuerdo?.estado === 'INCUMPLIDO';
  }

  get avancePct(): number {
    const a = this.acuerdo;
    if (!a || a.valorTotal <= 0) return 0;
    return Math.min(100, Math.round((a.valorPagado / a.valorTotal) * 100));
  }

  estadoAcuerdo(a: AcuerdoPagoModel) {
    return ESTADOS_ACUERDO[a.estado];
  }

  estadoCuota(q: AcuerdoCuotaModel) {
    return ESTADOS_CUOTA[q.estado];
  }

  etiquetaCuota(q: AcuerdoCuotaModel): string {
    if (q.estado === 'PAGADA') return '';
    if (q.diasVencida > 0) return `hace ${q.diasVencida} d`;
    if (q.diasVencida === 0) return 'vence hoy';
    return `en ${-q.diasVencida} d`;
  }

  async imprimir(): Promise<void> {
    if (!this.acuerdo) return;
    try {
      const blob = await lastValueFrom(this.carteraService.acuerdoPdf(this.acuerdo.id));
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      this.alert.showError('Error', 'No se pudo generar el PDF del acuerdo');
    }
  }

  verFicha(): void {
    if (!this.acuerdo) return;
    const id = this.acuerdo.terceroId;
    this.cerrar();
    this.router.navigate(['/cartera/cliente', id]);
  }

  async anular(): Promise<void> {
    if (!this.acuerdo || !this.motivo.trim()) return;
    this.anulando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.carteraService.anularAcuerdo(this.acuerdo.id, this.motivo.trim()));
      this.acuerdo = res.data;
      this.pidiendoMotivo = false;
      this.alert.showSuccess('Acuerdo anulado', 'Las facturas recuperaron su vencimiento original');
      this.cambiado.emit(res.data);
    } catch (err: any) {
      this.alert.showError('No se pudo anular', err?.error?.message ?? '');
    } finally {
      this.anulando = false;
      this.cdr.markForCheck();
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
