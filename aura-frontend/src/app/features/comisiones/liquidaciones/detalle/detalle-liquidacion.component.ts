import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { ComisionService } from '../../../../core/services/comision.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ComisionLiquidacionModel,
  ComisionVentaModel,
  EstadoLiquidacion,
} from '../../../../core/models/comision.model';

@Component({
  selector: 'app-detalle-liquidacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    TableModule,
    SkeletonModule,
    DialogModule,
    DividerModule,
    TooltipModule,
  ],
  templateUrl: './detalle-liquidacion.component.html',
  styleUrls: ['./detalle-liquidacion.component.scss'],
})
export class DetalleLiquidacionComponent implements OnChanges {
  @Input() visible = false;
  @Input() liquidacionId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  data: ComisionLiquidacionModel | null = null;
  loading = false;
  generandoPdf = false;

  constructor(
    private readonly comisionService: ComisionService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnChanges(): Promise<void> {
    if (!this.visible || !this.liquidacionId) return;
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.data = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.comisionService.getLiquidacionById(this.liquidacionId!),
      );
      this.data = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el detalle');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  getEstadoSeverity(estado: EstadoLiquidacion): 'success' | 'warn' {
    return estado === 'PAGADA' ? 'success' : 'warn';
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  async generarPdf(): Promise<void> {
    if (!this.data) return;
    this.generandoPdf = true;
    this.cdr.markForCheck();

    try {
      const pdfMake = (await import('pdfmake/build/pdfmake')).default;
      const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
      (pdfMake as any).vfs = (pdfFonts as any)['vfs'] ?? (pdfFonts as any).pdfMake?.vfs;

      const d = this.data;
      const tipo = d.tipo === 'VENDEDOR' ? 'Vendedor' : 'Técnico';
      const detalles: ComisionVentaModel[] = d.detalles ?? [];

      const tableBody: any[][] = [
        [
          { text: '#', style: 'thCell' },
          { text: 'Fecha venta', style: 'thCell' },
          { text: 'Producto / Servicio', style: 'thCell' },
          { text: 'Valor venta', style: 'thCell', alignment: 'right' },
          { text: '%', style: 'thCell', alignment: 'center' },
          { text: `Valor ${tipo}`, style: 'thCell', alignment: 'right' },
        ],
        ...detalles.map((v, i) => [
          { text: String(i + 1), style: 'tdCell', alignment: 'center' },
          { text: v.ventaFecha ? v.ventaFecha.substring(0, 10) : '—', style: 'tdCell' },
          { text: v.productoNombre, style: 'tdCell' },
          { text: this.formatCOP(v.valorTotal), style: 'tdCell', alignment: 'right' },
          { text: `${v.porcentajeTecnico}%`, style: 'tdCell', alignment: 'center' },
          { text: this.formatCOP(v.valorTecnico), style: 'tdCell', alignment: 'right', bold: true, color: '#4f46e5' },
        ]),
      ];

      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 50, 40, 60],
        defaultStyle: { font: 'Roboto', fontSize: 9, color: '#1e293b' },
        styles: {
          titulo: { fontSize: 16, bold: true, color: '#1e293b' },
          subtitulo: { fontSize: 10, color: '#64748b' },
          label: { fontSize: 8, color: '#94a3b8', bold: true, characterSpacing: 0.5 },
          value: { fontSize: 9.5, color: '#1e293b', bold: true },
          thCell: { fontSize: 8, bold: true, color: '#94a3b8', characterSpacing: 0.3, fillColor: '#f8fafc' },
          tdCell: { fontSize: 8.5, color: '#374151' },
          firmaLabel: { fontSize: 8, color: '#94a3b8', bold: true, characterSpacing: 0.5 },
        },
        content: [
          // ── Encabezado ───────────────────────────────────────
          {
            columns: [
              {
                stack: [
                  { text: 'Liquidación de Comisiones', style: 'titulo' },
                  { text: `${tipo}: ${d.tecnicoNombre}`, style: 'subtitulo', margin: [0, 4, 0, 0] },
                ],
              },
              {
                stack: [
                  { text: `N° ${d.id}`, style: 'titulo', alignment: 'right', color: '#6366f1' },
                  {
                    text: d.estado === 'PAGADA' ? 'PAGADA' : 'PENDIENTE',
                    alignment: 'right',
                    fontSize: 9,
                    bold: true,
                    color: d.estado === 'PAGADA' ? '#10b981' : '#f59e0b',
                    margin: [0, 4, 0, 0],
                  },
                ],
              },
            ],
            margin: [0, 0, 0, 16],
          },

          // ── Separador ────────────────────────────────────────
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#e2e8f0' }], margin: [0, 0, 0, 16] },

          // ── Info resumen ─────────────────────────────────────
          {
            columns: [
              {
                stack: [
                  { text: 'PERÍODO', style: 'label', margin: [0, 0, 0, 2] },
                  { text: `${d.fechaDesde}  →  ${d.fechaHasta}`, style: 'value' },
                ],
              },
              {
                stack: [
                  { text: 'TIPO', style: 'label', margin: [0, 0, 0, 2] },
                  { text: d.tipo ?? 'TÉCNICO', style: 'value' },
                ],
              },
              {
                stack: [
                  { text: 'TOTAL ITEMS', style: 'label', margin: [0, 0, 0, 2] },
                  { text: String(d.totalServicios), style: 'value' },
                ],
              },
              {
                stack: [
                  { text: 'TOTAL A PAGAR', style: 'label', margin: [0, 0, 0, 2] },
                  { text: this.formatCOP(d.valorTotal), style: 'value', color: '#10b981', fontSize: 11 },
                ],
              },
            ],
            columnGap: 20,
            margin: [0, 0, 0, 20],
          },

          // ── Tabla detalles ───────────────────────────────────
          { text: 'DETALLE DE ITEMS', style: 'label', margin: [0, 0, 0, 6] },
          {
            table: {
              headerRows: 1,
              widths: [20, 70, '*', 70, 35, 75],
              body: tableBody,
            },
            layout: {
              hLineWidth: (i: number) => (i === 0 || i === 1) ? 1.5 : 0.5,
              vLineWidth: () => 0,
              hLineColor: (i: number) => i === 1 ? '#e2e8f0' : '#e2e8f0',
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 5,
              paddingBottom: () => 5,
            },
            margin: [0, 0, 0, 20],
          },

          // ── Total final ──────────────────────────────────────
          {
            columns: [
              { text: '', width: '*' },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: `TOTAL A PAGAR AL ${tipo.toUpperCase()}`, style: 'label', border: [false, false, false, false], margin: [0, 4, 16, 4] },
                      { text: this.formatCOP(d.valorTotal), fontSize: 13, bold: true, color: '#10b981', alignment: 'right', border: [false, false, false, false], margin: [0, 4, 0, 4] },
                    ],
                  ],
                },
                layout: 'noBorders',
                width: 250,
              },
            ],
            margin: [0, 0, 0, 4],
          },

          // ── Observaciones ────────────────────────────────────
          ...(d.observaciones ? [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e2e8f0' }], margin: [0, 8, 0, 8] },
            { text: 'OBSERVACIONES', style: 'label', margin: [0, 0, 0, 4] },
            { text: d.observaciones, fontSize: 9, color: '#475569', italics: true },
          ] : []),

          // ── Firmas ───────────────────────────────────────────
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e2e8f0' }], margin: [0, 24, 0, 32] },
          {
            columns: [
              {
                stack: [
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#334155' }] },
                  { text: 'FIRMA ADMINISTRADOR', style: 'firmaLabel', margin: [0, 6, 0, 2] },
                  { text: 'Nombre: ____________________________', fontSize: 8, color: '#64748b', margin: [0, 4, 0, 0] },
                  { text: 'Cargo: _____________________________', fontSize: 8, color: '#64748b', margin: [0, 4, 0, 0] },
                ],
              },
              { text: '', width: '*' },
              {
                stack: [
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#334155' }] },
                  { text: `FIRMA ${tipo.toUpperCase()}`, style: 'firmaLabel', margin: [0, 6, 0, 2] },
                  { text: `Nombre: ${d.tecnicoNombre}`, fontSize: 8, color: '#64748b', margin: [0, 4, 0, 0] },
                  { text: 'Cédula: _____________________________', fontSize: 8, color: '#64748b', margin: [0, 4, 0, 0] },
                ],
              },
            ],
          },

          // ── Pie de página ────────────────────────────────────
          {
            text: `Generado el ${new Date().toLocaleDateString('es-CO')} — Aura POS`,
            fontSize: 7.5,
            color: '#94a3b8',
            alignment: 'center',
            margin: [0, 32, 0, 0],
          },
        ],
      };

      pdfMake.createPdf(docDefinition).download(`liquidacion-${d.id}-${d.tecnicoNombre?.replace(/\s+/g, '-') ?? ''}.pdf`);
    } catch (err) {
      console.error(err);
      this.alertService.showError('Error', 'No se pudo generar el PDF');
    } finally {
      this.generandoPdf = false;
      this.cdr.markForCheck();
    }
  }
}
