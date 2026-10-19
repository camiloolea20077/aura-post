import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import { ResumenLote } from '../../../../core/models/correo.model';
import { CorreoService } from '../../../../core/services/correo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

/** Cada cuánto se revisa el avance de la cola. */
const REVISAR_CADA_MS = 3000;

/**
 * Recordatorio de pago por correo a todos los clientes con facturas vencidas
 * (docs/PLAN_CUENTA_COBRO_CORREO.md §6). El servidor arma el estado de cuenta de
 * cada uno y los envía en cola; aquí se ve el avance, quién no tiene correo y qué falló.
 */
@Component({
  selector: 'app-envio-cobros',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, ProgressBarModule, TagModule, TextareaModule],
  templateUrl: './envio-cobros.component.html',
  styleUrls: ['./envio-cobros.component.scss'],
})
export class EnvioCobrosComponent implements OnDestroy {
  private readonly correos = inject(CorreoService);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  /** Clientes vencidos que muestra la agenda (orientativo: el servidor vuelve a calcularlos). */
  @Input() clientesVencidos = 0;
  @Output() visibleChange = new EventEmitter<boolean>();

  asunto = '';
  mensaje = '';
  disponible = true;
  cargando = false;
  fase: 'preparar' | 'encolando' | 'enviando' | 'listo' = 'preparar';
  sinCorreo: string[] = [];
  resumen: ResumenLote | null = null;
  private loteId: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  get progreso(): number {
    const r = this.resumen;
    if (!r || !r.total) return this.fase === 'listo' ? 100 : 0;
    return Math.round(((r.enviados + r.fallidos) / r.total) * 100);
  }

  get fallidos() {
    return (this.resumen?.filas ?? []).filter((f) => f.estado === 'FALLIDO');
  }

  async alAbrir(): Promise<void> {
    this.fase = 'preparar';
    this.sinCorreo = [];
    this.resumen = null;
    this.loteId = null;
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const s = (await lastValueFrom(this.correos.sugerenciaCobroMasivo()))?.data;
      this.asunto = s?.asunto ?? 'Recordatorio de pago';
      this.mensaje = s?.mensaje ?? '';
      this.disponible = s?.disponible ?? false;
    } catch (err: any) {
      this.alert.showError('No se pudo preparar el envío', err?.error?.message ?? 'Intente de nuevo.');
      this.cerrar();
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  async enviar(): Promise<void> {
    if (!this.asunto.trim()) return;
    this.fase = 'encolando';
    this.cdr.markForCheck();
    try {
      const r = (await lastValueFrom(this.correos.cobrarVencidos(this.asunto.trim(), this.mensaje.trim() || null)))?.data;
      this.loteId = r?.loteId ?? null;
      this.sinCorreo = r?.sinCorreo ?? [];
      this.fase = r && r.encolados > 0 ? 'enviando' : 'listo';
      if (this.fase === 'enviando') await this.revisar();
    } catch (err: any) {
      this.alert.showError('No se pudo enviar', err?.error?.message ?? 'Intente de nuevo.');
      this.fase = 'preparar';
    } finally {
      this.cdr.markForCheck();
    }
  }

  private async revisar(): Promise<void> {
    if (!this.loteId) return;
    try {
      this.resumen = (await lastValueFrom(this.correos.resumenLoteCobro(this.loteId)))?.data ?? null;
    } catch {
      // Un fallo al consultar no detiene el envío.
    }
    if (this.resumen && this.resumen.pendientes === 0) this.fase = 'listo';
    else if (this.visible) this.timer = setTimeout(() => this.revisar(), REVISAR_CADA_MS);
    this.cdr.markForCheck();
  }

  cerrar(): void {
    if (this.timer) clearTimeout(this.timer);
    this.visible = false;
    this.visibleChange.emit(false);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
