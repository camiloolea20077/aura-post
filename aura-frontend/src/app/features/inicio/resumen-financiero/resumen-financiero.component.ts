import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ResumenFinancieroModel } from '../../../core/models/tablero-inicio.model';
import { TableroInicioService } from '../../../core/services/tablero-inicio.service';

/**
 * Disponible (caja y bancos, desde el mayor) y cartera por cobrar y por pagar.
 * Si recibe los datos los pinta; si no, los pide.
 */
@Component({
  selector: 'app-resumen-financiero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './resumen-financiero.component.html',
  styleUrls: ['./resumen-financiero.component.scss'],
})
export class ResumenFinancieroComponent implements OnInit {
  private readonly service = inject(TableroInicioService);

  @Input() set datos(v: ResumenFinancieroModel | null | undefined) {
    if (v) {
      this.resumen.set(v);
      this.recibido = true;
    }
  }

  readonly resumen = signal<ResumenFinancieroModel | null>(null);
  readonly error = signal(false);
  private recibido = false;

  async ngOnInit(): Promise<void> {
    if (this.recibido) return;
    try {
      const res = await lastValueFrom(this.service.financiero());
      this.resumen.set(res?.data ?? null);
    } catch {
      this.error.set(true);
    }
  }

  cop(v: number | null | undefined): string {
    return (v ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}
