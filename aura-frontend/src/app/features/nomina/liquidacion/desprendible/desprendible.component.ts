import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CertificadoService } from '../../../../core/services/certificado.service';
import {
  DesprendibleModel,
  LineaDesprendible,
  PasoTraza,
  parseTraza,
} from '../../../../core/models/desprendible.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

/**
 * Desprendible de pago de una nómina, con la traza de cada línea.
 *
 * La traza —"base 1.300.000 × 4% = 52.000"— es lo que convierte un número en una
 * explicación: es la diferencia entre "salud: 52.000" y poder responderle al
 * empleado de dónde salió.
 */
@Component({
  selector: 'app-desprendible',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './desprendible.component.html',
  styleUrls: ['./desprendible.component.scss'],
})
export class DesprendibleComponent implements OnChanges {
  @Input() visible = false;
  @Input() nominaId: number | null = null;
  @Output() closed = new EventEmitter<void>();

  desprendible: DesprendibleModel | null = null;
  loading = false;

  /** Índices de líneas cuya traza está desplegada, por sección. */
  private expandido = new Set<string>();

  constructor(
    private readonly service: CertificadoService,
    private readonly alert: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue && this.nominaId) {
      this.cargar();
    }
    if (changes['visible'] && !changes['visible'].currentValue) {
      this.desprendible = null;
      this.expandido.clear();
    }
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.desprendible(this.nominaId!),
      );
      this.desprendible = res?.data ?? null;
    } catch (err: any) {
      // 409 = la nómina no tiene detalle (se liquidó sin el motor nuevo).
      const msg = err?.error?.message ?? 'No se pudo cargar el desprendible.';
      this.alert.showError('Error', msg);
    } finally {
      this.loading = false;
    }
  }

  // ── Traza ───────────────────────────────────────────────────

  pasos(linea: LineaDesprendible): PasoTraza[] {
    return parseTraza(linea.traza);
  }

  tieneTraza(linea: LineaDesprendible): boolean {
    return this.pasos(linea).length > 0;
  }

  toggle(seccion: string, i: number): void {
    const k = `${seccion}-${i}`;
    if (this.expandido.has(k)) this.expandido.delete(k);
    else this.expandido.add(k);
  }

  estaExpandido(seccion: string, i: number): boolean {
    return this.expandido.has(`${seccion}-${i}`);
  }

  close(): void {
    this.closed.emit();
  }

  formatMonto(v: number | null): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }
}
