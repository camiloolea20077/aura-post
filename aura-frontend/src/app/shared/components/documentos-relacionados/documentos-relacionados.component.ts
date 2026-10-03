import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TooltipModule } from 'primeng/tooltip';

import {
  DocumentoRelacionService,
  Relacionado,
  Relacionados,
  TipoDocumento,
} from '../../../core/services/documento-relacion.service';

/**
 * Cadena documental: muestra de dónde viene y a dónde fue un documento, con la
 * cantidad/valor aplicado por línea (fase D0).
 *
 *   <app-documentos-relacionados tipo="VENTA" [id]="venta.id" />
 *
 * Se puede poner en el detalle de venta, compra, OC, cotización, pedido y
 * devolución. Si el documento no tiene relaciones, el bloque no se muestra.
 */
@Component({
  selector: 'app-documentos-relacionados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TooltipModule],
  templateUrl: './documentos-relacionados.component.html',
  styleUrls: ['./documentos-relacionados.component.scss'],
})
export class DocumentosRelacionadosComponent implements OnChanges {
  @Input({ required: true }) tipo!: TipoDocumento | string;
  @Input({ required: true }) id!: number;
  /** Oculta el título cuando se integra dentro de una sección que ya lo tiene. */
  @Input() mostrarTitulo = true;

  cargando = false;
  datos: Relacionados = { origenes: [], destinos: [] };
  /** Una fila por documento (las relaciones vienen por línea). */
  origenes: DocumentoAgrupado[] = [];
  destinos: DocumentoAgrupado[] = [];

  constructor(
    private readonly service: DocumentoRelacionService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get hayDatos(): boolean {
    return this.origenes.length > 0 || this.destinos.length > 0;
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['tipo'] || ch['id']) this.cargar();
  }

  private cargar(): void {
    if (!this.tipo || this.id == null) {
      this.aplicar({ origenes: [], destinos: [] });
      return;
    }
    this.cargando = true;
    this.cdr.markForCheck();
    this.service.relacionados(this.tipo, this.id).subscribe({
      next: (res) => {
        this.aplicar(res?.data ?? { origenes: [], destinos: [] });
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.aplicar({ origenes: [], destinos: [] });
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  private aplicar(d: Relacionados): void {
    this.datos = d;
    this.origenes = agrupar(d.origenes ?? []);
    this.destinos = agrupar(d.destinos ?? []);
  }

  etiqueta(tipo: string): string {
    return ETIQUETAS[tipo] ?? tipo;
  }

  titulo(r: DocumentoAgrupado): string {
    return `${this.etiqueta(r.tipo)} ${r.numero ?? '#' + r.id}`;
  }

  /** Ruta de detalle del documento, o null si ese tipo aún no tiene pantalla por id. */
  ruta(r: DocumentoAgrupado): (string | number)[] | null {
    const f = RUTAS[r.tipo];
    return f ? f(r.id) : null;
  }
}

/** Un documento relacionado con lo aplicado sumado de todas sus líneas. */
export interface DocumentoAgrupado {
  tipo: string;
  id: number;
  numero: string | null;
  estado: 'VIGENTE' | 'ANULADA';
  cantidad: number | null;
  valor: number | null;
  lineas: number;
}

function agrupar(lista: Relacionado[]): DocumentoAgrupado[] {
  const porDoc = new Map<string, DocumentoAgrupado>();
  for (const r of lista) {
    const clave = `${r.tipo}|${r.id}|${r.estado}`;
    let g = porDoc.get(clave);
    if (!g) {
      g = { tipo: r.tipo, id: r.id, numero: r.numero, estado: r.estado, cantidad: null, valor: null, lineas: 0 };
      porDoc.set(clave, g);
    }
    if (r.cantidad != null) g.cantidad = (g.cantidad ?? 0) + Number(r.cantidad);
    if (r.valor != null) g.valor = (g.valor ?? 0) + Number(r.valor);
    g.lineas++;
  }
  return [...porDoc.values()];
}

const ETIQUETAS: Record<string, string> = {
  COTIZACION: 'Cotización',
  PEDIDO: 'Pedido',
  VENTA: 'Venta',
  DEVOLUCION: 'Devolución',
  NOTA_VENTA: 'Nota de venta',
  ORDEN_COMPRA: 'Orden de compra',
  REMISION_COMPRA: 'Remisión',
  COMPRA: 'Compra',
  NOTA_COMPRA: 'Nota de compra',
  RECIBO: 'Recibo de caja',
  EGRESO: 'Egreso',
};

/**
 * Rutas de detalle conocidas. Las que faltan se irán agregando a medida que
 * cada tipo tenga su pantalla por id.
 */
const RUTAS: Record<string, (id: number) => (string | number)[]> = {
  // La cotización no se enlaza: su única ruta por id es el formulario de
  // edición, que no aplica a una cotización ya vendida.
  COMPRA: (id) => ['/compras', id, 'editar'],
};
