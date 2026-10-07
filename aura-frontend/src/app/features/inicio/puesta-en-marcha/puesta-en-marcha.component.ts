import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { PuestaEnMarchaModel } from '../../../core/models/tablero-inicio.model';
import { TableroInicioService } from '../../../core/services/tablero-inicio.service';

/**
 * Lo que le falta configurar a la empresa para operar, por línea de uso. Se
 * calcula en el back cada vez; desaparece sola cuando está todo listo.
 */
@Component({
  selector: 'app-puesta-en-marcha',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './puesta-en-marcha.component.html',
  styleUrls: ['./puesta-en-marcha.component.scss'],
})
export class PuestaEnMarchaComponent implements OnInit {
  private readonly service = inject(TableroInicioService);

  readonly datos = signal<PuestaEnMarchaModel | null>(null);
  readonly abierta = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.puestaEnMarcha());
      this.datos.set(res?.data ?? null);
    } catch {
      // Sin la lista el inicio sigue funcionando: no se muestra.
      this.datos.set(null);
    }
  }

  alternar(): void {
    this.abierta.update((v) => !v);
  }
}
