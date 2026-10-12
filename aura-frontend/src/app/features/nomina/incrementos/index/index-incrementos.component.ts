import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  IncrementoModel,
  TEXTO_ESTADO_INCREMENTO,
  severidadEstadoIncremento,
  textoIncremento,
} from '../../../../core/models/nomina-incremento.model';
import { NominaIncrementoService } from '../../../../core/services/nomina-incremento.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';

/** Incrementos salariales: listado; cada uno se abre en su página con la vista previa. */
@Component({
  selector: 'app-index-incrementos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    FechaEsPipe,
  ],
  templateUrl: './index-incrementos.component.html',
  styleUrls: ['./index-incrementos.component.scss'],
})
export class IndexIncrementosComponent implements OnInit {
  filas: IncrementoModel[] = [];
  totalFilas = 0;
  cargando = true;
  busqueda = '';
  pagina = 0;
  tamano = 10;

  readonly severidad = severidadEstadoIncremento;
  readonly textoIncremento = textoIncremento;

  constructor(
    private readonly service: NominaIncrementoService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.page({ page: this.pagina, rows: this.tamano, search: this.busqueda || null }),
      );
      this.filas = res?.data?.content ?? [];
      this.totalFilas = res?.data?.totalElements ?? 0;
    } catch {
      this.filas = [];
      this.totalFilas = 0;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onPagina(e: { first: number; rows: number }): void {
    this.pagina = e.first / e.rows;
    this.tamano = e.rows;
    void this.cargar();
  }

  buscar(): void {
    this.pagina = 0;
    void this.cargar();
  }

  limpiarBusqueda(): void {
    if (!this.busqueda) return;
    this.busqueda = '';
    this.buscar();
  }

  nuevo(): void {
    void this.router.navigate(['/nomina/incrementos/nuevo']);
  }

  abrir(i: IncrementoModel): void {
    void this.router.navigate(['/nomina/incrementos', i.id]);
  }

  textoEstado(i: IncrementoModel): string {
    return TEXTO_ESTADO_INCREMENTO[i.estado];
  }
}
