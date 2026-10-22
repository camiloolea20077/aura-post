import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  DocumentoNominaModel,
  nominaPagada,
  severidadEstadoDocumento,
  textoEstadoDocumento,
} from '../../../../core/models/nomina-documento.model';
import { NominaDocumentoService } from '../../../../core/services/nomina-documento.service';
import { NominaComprobantesService } from '../../../../core/services/nomina-comprobantes.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';
import { PantallaDocumento, pantallaDocumento } from '../prenomina.util';

/**
 * Prenóminas: un documento por tipo de comprobante con sus empleados, la
 * liquidación y el detalle, que se revisa antes de confirmar la nómina.
 */
@Component({
  selector: 'app-index-prenomina',
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
  templateUrl: './index-prenomina.component.html',
  styleUrls: ['./index-prenomina.component.scss'],
})
export class IndexPrenominaComponent implements OnInit {
  filas: DocumentoNominaModel[] = [];
  totalFilas = 0;
  cargando = true;
  busqueda = '';
  pagina = 0;
  tamano = 10;

  readonly severidad = severidadEstadoDocumento;
  readonly textoEstado = textoEstadoDocumento;
  readonly pagada = nominaPagada;
  /** Prenómina o nómina, según la ruta. */
  readonly pantalla: PantallaDocumento;

  constructor(
    private readonly service: NominaDocumentoService,
    private readonly comprobantes: NominaComprobantesService,
    private readonly alert: AlertService,
    private readonly router: Router,
    route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.pantalla = pantallaDocumento(route.snapshot.data['clase']);
  }

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.pagina,
          rows: this.tamano,
          search: this.busqueda || null,
          params: { claseDocumento: this.pantalla.clase },
        }),
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

  nueva(): void {
    void this.router.navigate([this.pantalla.ruta, 'nueva']);
  }

  abrir(d: DocumentoNominaModel): void {
    void this.router.navigate([this.pantalla.ruta, d.id]);
  }

  /** Documento cuyos comprobantes se están armando (spinner del botón). */
  descargando: number | null = null;

  /** Comprobantes de pago de todos los empleados de la nómina, uno por hoja. */
  async descargarComprobantes(d: DocumentoNominaModel): Promise<void> {
    this.descargando = d.id;
    this.cdr.markForCheck();
    try {
      const total = await this.comprobantes.descargarTodos(d);
      if (!total) this.alert.showWarn('Comprobantes', 'La nómina no tiene empleados liquidados.');
    } catch (err: any) {
      this.alert.showError('Comprobantes', err?.error?.message ?? 'No se pudieron generar los comprobantes.');
    } finally {
      this.descargando = null;
      this.cdr.markForCheck();
    }
  }
}
