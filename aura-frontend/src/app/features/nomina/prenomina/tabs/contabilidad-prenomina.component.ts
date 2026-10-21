import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import { ProyeccionContableModel } from '../../../../core/models/nomina-documento.model';
import { NominaDocumentoService } from '../../../../core/services/nomina-documento.service';

/**
 * Pestaña Contabilidad: el asiento que se generaría con lo liquidado, agrupado
 * por cuenta, antes de confirmar la nómina. No guarda nada.
 */
@Component({
  selector: 'app-contabilidad-prenomina',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TableModule, TagModule],
  templateUrl: './contabilidad-prenomina.component.html',
  styleUrls: ['./prenomina-tabs.scss'],
})
export class ContabilidadPrenominaComponent implements OnChanges {
  @Input({ required: true }) documentoId!: number;
  /** Cambia al liquidar o confirmar: la proyección se recalcula. */
  @Input() version = 0;

  proyeccion: ProyeccionContableModel | null = null;
  cargando = true;

  constructor(
    private readonly service: NominaDocumentoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    void this.cargar();
  }

  /** ¿Débitos y créditos iguales (al centavo)? */
  get cuadra(): boolean {
    const p = this.proyeccion;
    return !!p && Math.abs((p.totalDebito ?? 0) - (p.totalCredito ?? 0)) < 0.005;
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.contabilidad(this.documentoId));
      this.proyeccion = res?.data ?? null;
    } catch {
      this.proyeccion = null;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }
}
