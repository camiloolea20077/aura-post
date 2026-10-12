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

import { ProcesoDocumentoModel } from '../../../../core/models/nomina-documento.model';
import { ProcesoError } from '../../../../core/models/proceso.model';
import { NominaDocumentoService } from '../../../../core/services/nomina-documento.service';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';
import { leerErroresProceso } from '../prenomina.util';

/** Pestaña Traza: cada corrida de liquidación del documento, quién la lanzó y cómo terminó. */
@Component({
  selector: 'app-traza-prenomina',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TableModule, TagModule, FechaEsPipe],
  templateUrl: './traza-prenomina.component.html',
  styleUrls: ['./prenomina-tabs.scss'],
})
export class TrazaPrenominaComponent implements OnChanges {
  @Input({ required: true }) documentoId!: number;
  /** Cambia cada vez que termina una liquidación. */
  @Input() version = 0;

  procesos: ProcesoDocumentoModel[] = [];
  cargando = true;

  constructor(
    private readonly service: NominaDocumentoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.traza(this.documentoId));
      this.procesos = res?.data ?? [];
    } catch {
      this.procesos = [];
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  errores(p: ProcesoDocumentoModel): ProcesoError[] {
    return leerErroresProceso(p.errores);
  }

  severidad(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    if (estado === 'COMPLETADO') return 'success';
    if (estado === 'COMPLETADO_CON_ERRORES') return 'warn';
    if (estado === 'FALLIDO') return 'danger';
    return 'info';
  }

  texto(estado: string): string {
    const textos: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      EN_PROCESO: 'En proceso',
      COMPLETADO: 'Completado',
      COMPLETADO_CON_ERRORES: 'Con errores',
      FALLIDO: 'Falló',
      REVERSADO: 'Reversado',
    };
    return textos[estado] ?? estado;
  }
}
