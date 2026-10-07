import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { TableroComercialModel } from '../../../core/models/tablero-inicio.model';
import { TableroInicioService } from '../../../core/services/tablero-inicio.service';
import { FechaEsPipe } from '../../../shared/pipes/fecha-es.pipe';
import { ResumenFinancieroComponent } from '../resumen-financiero/resumen-financiero.component';

/** Inicio de la línea Comercial (ERP sin mostrador): lo facturado, comprado y pendiente del mes. */
@Component({
  selector: 'app-tablero-comercial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ResumenFinancieroComponent, FechaEsPipe],
  templateUrl: './tablero-comercial.component.html',
  styleUrls: ['./tablero-comercial.component.scss'],
})
export class TableroComercialComponent implements OnInit {
  private readonly service = inject(TableroInicioService);

  readonly datos = signal<TableroComercialModel | null>(null);
  readonly cargando = signal(true);
  readonly error = signal(false);
  readonly hoy = new Date();

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(false);
    try {
      const res = await lastValueFrom(this.service.comercial());
      this.datos.set(res?.data ?? null);
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  cop(v: number | null | undefined): string {
    return (v ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}
