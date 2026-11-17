import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { lastValueFrom } from 'rxjs';

import { ConceptoService } from '../../../core/services/concepto.service';
import { NominaCatalogoService } from '../../../core/services/nomina-catalogo.service';
import {
  BuscarConceptoParams,
  CLASE_CONCEPTO_OPTS,
  ClaseConcepto,
  ConceptoModel,
  ENTRADA_CONCEPTO_OPTS,
  EntradaConcepto,
  etiquetaOpcion,
  OpcionConcepto,
} from '../../../core/models/concepto.model';
import { AlertService } from '../../pipes/alert.service';

/**
 * Buscador avanzado de conceptos de nómina, para agregarlos en lote.
 *
 * Lo usan las pestañas Conceptos y Novedades permitidas del cargo y de la
 * vinculación. Busca en el servidor por número, nombre o tipo, filtra por clase,
 * tipo, grupo y entrada, y deja marcar varios (la selección se conserva al
 * cambiar de página). Los ya agregados se ven en gris y no se pueden marcar.
 *
 * Uso:
 * ```html
 * <app-concepto-buscador [(visible)]="mostrar" [yaAgregados]="numeros" (agregar)="onAgregar($event)" />
 * ```
 */
@Component({
  selector: 'app-concepto-buscador',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    CheckboxModule,
  ],
  templateUrl: './concepto-buscador.component.html',
  styleUrls: ['./concepto-buscador.component.scss'],
})
export class ConceptoBuscadorComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() header = 'Agregar conceptos';
  /** Números de los conceptos que ya están en la lista: se muestran deshabilitados. */
  @Input() yaAgregados: number[] = [];
  /**
   * Entrada con la que abre filtrado: 'NINGUNA' para conceptos fijos del cargo,
   * null para novedades (cualquier entrada). El usuario puede cambiarla.
   */
  @Input() entradaInicial: EntradaConcepto | null = null;

  /** Conceptos marcados al confirmar. */
  @Output() agregar = new EventEmitter<ConceptoModel[]>();

  items: ConceptoModel[] = [];
  totalRecords = 0;
  readonly rows = 10;
  loading = false;
  private primero = 0;
  private pausa: ReturnType<typeof setTimeout> | null = null;
  /** Número de la última búsqueda: una respuesta vieja que llega tarde se descarta. */
  private consulta = 0;

  busqueda = '';
  filtroClase: ClaseConcepto | null = null;
  filtroTipo: number | null = null;
  filtroGrupo: number | null = null;
  filtroEntrada: EntradaConcepto | null = null;

  readonly claseOpts = CLASE_CONCEPTO_OPTS;
  readonly entradaOpts = ENTRADA_CONCEPTO_OPTS;
  tipoOpts: OpcionConcepto<number>[] = [];
  grupoOpts: OpcionConcepto<number>[] = [];

  /** Selección por id: sobrevive al cambio de página y de filtros. */
  private readonly seleccion = new Map<number, ConceptoModel>();

  constructor(
    private readonly service: ConceptoService,
    private readonly catalogos: NominaCatalogoService,
    private readonly alert: AlertService,
  ) {}

  get cantidadSeleccionada(): number {
    return this.seleccion.size;
  }

  onShow(): void {
    this.seleccion.clear();
    this.busqueda = '';
    this.filtroClase = null;
    this.filtroTipo = null;
    this.filtroGrupo = null;
    this.filtroEntrada = this.entradaInicial;
    if (!this.tipoOpts.length) void this.cargarFiltros();
    void this.cargar({ first: 0, rows: this.rows });
  }

  private async cargarFiltros(): Promise<void> {
    try {
      const [tipos, grupos] = await Promise.all([
        lastValueFrom(this.service.tipos()),
        lastValueFrom(this.catalogos.activos('grupos-concepto')),
      ]);
      this.tipoOpts = (tipos.data ?? []).map((t) => ({ label: t.nombre, value: t.id }));
      this.grupoOpts = (grupos.data ?? []).map((g) => ({ label: g.nombre, value: g.id }));
    } catch {
      // Sin estos filtros el buscador sigue funcionando por texto y clase.
    }
  }

  async cargar(evento: TableLazyLoadEvent): Promise<void> {
    this.primero = evento.first ?? 0;
    this.loading = true;
    const esta = ++this.consulta;
    const params: BuscarConceptoParams = {
      clase: this.filtroClase,
      tipoId: this.filtroTipo,
      grupoId: this.filtroGrupo,
      entrada: this.filtroEntrada,
    };
    try {
      const res = await lastValueFrom(
        this.service.buscar({
          page: Math.floor(this.primero / this.rows),
          rows: this.rows,
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
      this.alert.showError('Conceptos', 'No se pudo buscar.');
    } finally {
      if (esta === this.consulta) this.loading = false;
    }
  }

  /** Busca al dejar de escribir (300 ms), desde la primera página. */
  buscarConPausa(): void {
    if (this.pausa) clearTimeout(this.pausa);
    this.pausa = setTimeout(() => this.filtrar(), 300);
  }

  filtrar(): void {
    void this.cargar({ first: 0, rows: this.rows });
  }

  yaEsta(c: ConceptoModel): boolean {
    return this.yaAgregados.includes(c.numero);
  }

  marcado(c: ConceptoModel): boolean {
    return this.seleccion.has(c.id);
  }

  alternar(c: ConceptoModel): void {
    if (this.yaEsta(c)) return;
    if (this.seleccion.has(c.id)) this.seleccion.delete(c.id);
    else this.seleccion.set(c.id, c);
  }

  textoClase(c: ConceptoModel): string {
    return etiquetaOpcion(CLASE_CONCEPTO_OPTS, c.clase);
  }

  textoEntrada(c: ConceptoModel): string {
    return etiquetaOpcion(ENTRADA_CONCEPTO_OPTS, c.entrada);
  }

  confirmar(): void {
    const elegidos = [...this.seleccion.values()].sort((a, b) => a.numero - b.numero);
    this.agregar.emit(elegidos);
    this.cerrar();
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
