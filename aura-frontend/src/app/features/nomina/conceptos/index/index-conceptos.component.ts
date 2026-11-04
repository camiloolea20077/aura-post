import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { ConceptoService } from '../../../../core/services/concepto.service';
import { NominaCatalogoService } from '../../../../core/services/nomina-catalogo.service';
import {
  BuscarConceptoParams,
  CLASE_CONCEPTO_OPTS,
  ClaseConcepto,
  ConceptoModel,
  ENTRADA_CONCEPTO_OPTS,
  etiquetaOpcion,
  OpcionConcepto,
  REDONDEO_MODO_OPTS,
  REDONDEO_PRECISION_OPTS,
} from '../../../../core/models/concepto.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { FormConceptoComponent } from '../form/form-concepto.component';
import { textoCalculo, severidadClase } from '../concepto.util';

/**
 * Catálogo de conceptos de nómina.
 *
 * Lista los conceptos visibles para la empresa (los de ley y los propios, con la
 * precedencia resuelta en el backend), paginados y filtrados en el servidor.
 * Editar abre la página del concepto con sus pestañas; "Nueva vigencia" cambia
 * la tarifa de un concepto propio desde una fecha.
 */
@Component({
  selector: 'app-index-conceptos',
  standalone: true,
  imports: [
    PuedeDirective,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    FormConceptoComponent,
  ],
  templateUrl: './index-conceptos.component.html',
  styleUrls: ['./index-conceptos.component.scss'],
})
export class IndexConceptosComponent implements OnInit {
  items: ConceptoModel[] = [];
  totalRecords = 0;
  rowSize = 10;
  loading = true;
  private ultimoEvento: TableLazyLoadEvent = { first: 0, rows: 10 };
  /** Número de la última búsqueda: una respuesta vieja que llega tarde se descarta. */
  private consulta = 0;
  private pausa: ReturnType<typeof setTimeout> | null = null;

  busqueda = '';
  filtroClase: ClaseConcepto | null = null;
  filtroTipo: number | null = null;
  filtroGrupo: number | null = null;
  verInactivos = false;

  readonly claseOpts = CLASE_CONCEPTO_OPTS;
  readonly estadoOpts: OpcionConcepto<boolean>[] = [
    { label: 'Solo activos', value: false },
    { label: 'Activos e inactivos', value: true },
  ];
  tipoOpts: OpcionConcepto<number>[] = [];
  grupoOpts: OpcionConcepto<number>[] = [];

  showVigencia = false;
  seleccionado: ConceptoModel | null = null;

  readonly severidadClase = severidadClase;
  readonly textoCalculo = textoCalculo;

  constructor(
    private readonly service: ConceptoService,
    private readonly catalogos: NominaCatalogoService,
    private readonly router: Router,
    private readonly alert: AlertService,
  ) {}

  ngOnInit(): void {
    void this.cargarFiltros();
  }

  /** Tipos y grupos para los filtros. */
  private async cargarFiltros(): Promise<void> {
    try {
      const [tipos, grupos] = await Promise.all([
        lastValueFrom(this.service.tipos()),
        lastValueFrom(this.catalogos.activos('grupos-concepto')),
      ]);
      this.tipoOpts = (tipos.data ?? []).map((t) => ({
        label: t.nombre,
        value: t.id,
      }));
      this.grupoOpts = (grupos.data ?? []).map((g) => ({
        label: g.nombre,
        value: g.id,
      }));
    } catch {
      // Sin filtros de tipo y grupo la tabla sigue funcionando.
    }
  }

  async cargar(evento: TableLazyLoadEvent): Promise<void> {
    this.ultimoEvento = evento;
    this.rowSize = evento.rows ?? this.rowSize;
    this.loading = true;
    const esta = ++this.consulta;
    const params: BuscarConceptoParams = {
      clase: this.filtroClase,
      tipoId: this.filtroTipo,
      grupoId: this.filtroGrupo,
      incluirInactivos: this.verInactivos,
    };
    try {
      const res = await lastValueFrom(
        this.service.buscar({
          page: Math.floor((evento.first ?? 0) / this.rowSize),
          rows: this.rowSize,
          search: this.busqueda.trim() || null,
          params,
        }),
      );
      if (esta !== this.consulta) return;
      this.items = res.data?.content ?? [];
      this.totalRecords = res.data?.totalElements ?? 0;
    } catch {
      if (esta !== this.consulta) return;
      this.items = [];
      this.totalRecords = 0;
      this.alert.showError('Conceptos', 'No se pudieron cargar los conceptos.');
    } finally {
      if (esta === this.consulta) this.loading = false;
    }
  }

  /** Busca al dejar de escribir (300 ms), desde la primera página. */
  buscarConPausa(): void {
    if (this.pausa) clearTimeout(this.pausa);
    this.pausa = setTimeout(() => this.filtrar(), 300);
  }

  /** Vuelve a la primera página con los filtros actuales. */
  filtrar(): void {
    void this.cargar({ ...this.ultimoEvento, first: 0 });
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.filtrar();
  }

  nuevo(): void {
    void this.router.navigate(['/nomina/conceptos/nuevo']);
  }

  editar(c: ConceptoModel): void {
    void this.router.navigate(['/nomina/conceptos', c.id]);
  }

  /** Solo los conceptos propios cambian de tarifa; los de ley los fija la ley. */
  puedeNuevaVigencia(c: ConceptoModel): boolean {
    return !c.esGlobal && !c.deLey;
  }

  nuevaVigencia(c: ConceptoModel): void {
    this.seleccionado = c;
    this.showVigencia = true;
  }

  onVigenciaGuardada(): void {
    this.showVigencia = false;
    this.filtrar();
  }

  textoEntrada(c: ConceptoModel): string {
    return etiquetaOpcion(ENTRADA_CONCEPTO_OPTS, c.entrada);
  }

  textoClase(c: ConceptoModel): string {
    return etiquetaOpcion(CLASE_CONCEPTO_OPTS, c.clase);
  }

  textoRedondeo(c: ConceptoModel): string {
    if (c.redondeoPrecision === 'NINGUNO') return 'No redondea';
    return `${etiquetaOpcion(REDONDEO_PRECISION_OPTS, c.redondeoPrecision)} - ${etiquetaOpcion(REDONDEO_MODO_OPTS, c.redondeoModo)}`;
  }
}
