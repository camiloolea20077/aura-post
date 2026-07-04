import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { VentaModel } from '../../../../core/models/venta.model';

// pdfmake — instalar con: npm install pdfmake @types/pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

@Component({
  selector: 'app-modal-factura',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, DialogModule, DividerModule],
  templateUrl: './modal-factura.component.html',
  styleUrls: ['./modal-factura.component.scss'],
})
export class ModalFacturaComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() venta: VentaModel | null = null;
  @Output() modalClosed = new EventEmitter<void>();

  generando = false;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['venta'] && this.venta) {
      // reset al abrir
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  get numeroFactura(): string {
    if (!this.venta) return '';
    const num = String(this.venta.consecutivo ?? 0).padStart(6, '0');
    return this.venta.prefijo ? `${this.venta.prefijo}-${num}` : num;
  }

  private formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private metodoPagoLabel(m: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      NEQUI: 'Nequi',
      TARJETA: 'Tarjeta',
      TRANSFERENCIA: 'Transferencia',
    };
    return map[m] ?? m;
  }

  // ── Construir documento pdfmake ───────────────────────────

  private buildDocDefinition(): any {
    const v = this.venta!;

    // Filas de productos
    const bodyRows = v.detalles.map((d) => {
      const base = d.subtotalLinea ?? 0;
      const desc = (d as any).montoDescuento ?? 0;
      const imp = d.impuestoValor ?? 0;
      const total = base - desc + imp;

      return [
        { text: d.productoNombre, style: 'tableBody' },
        {
          text: String(
            d.cantidad % 1 === 0
              ? d.cantidad.toFixed(0)
              : d.cantidad.toFixed(3),
          ),
          style: 'tableBodyRight',
          alignment: 'right',
        },
        {
          text: this.formatCOP(d.precioUnitario ?? base / d.cantidad),
          style: 'tableBodyRight',
          alignment: 'right',
        },
        {
          text: imp > 0 ? `${Math.round((imp / base) * 100)}%` : '—',
          style: 'tableBodyRight',
          alignment: 'right',
        },
        {
          text: desc > 0 ? `-${this.formatCOP(desc)}` : '—',
          style: 'tableBodyRight',
          alignment: 'right',
        },
        {
          text: this.formatCOP(total),
          style: 'tableBodyRight',
          alignment: 'right',
          bold: true,
        },
      ];
    });

    // Filas de pagos
    const pagoRows = v.pagos.map((p) => [
      { text: this.metodoPagoLabel(p.metodoPago), fontSize: 9 },
      { text: this.formatCOP(p.monto), fontSize: 9, alignment: 'right' },
    ]);

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 60],

      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: 'AURA NUBE — Software de gestión empresarial',
            fontSize: 8,
            color: '#7f8c8d',
            margin: [40, 0, 0, 0],
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            fontSize: 8,
            color: '#7f8c8d',
            alignment: 'right',
            margin: [0, 0, 40, 0],
          },
        ],
        margin: [0, 10, 0, 0],
      }),

      content: [
        // ── Encabezado: logo + datos empresa ─────────────
        {
          columns: [
            // Logo (texto como placeholder — reemplazar por imagen si hay)
            {
              stack: [
                {
                  text: 'AURA NUBE',
                  fontSize: 22,
                  bold: true,
                  color: '#3498db',
                  characterSpacing: 2,
                },
                {
                  text: 'Software de gestión empresarial',
                  fontSize: 9,
                  color: '#9b59b6',
                  margin: [0, 2, 0, 0],
                },
              ],
              width: '*',
            },
            // Datos empresa (derecha)
            {
              stack: [
                {
                  text: v.sucursalNombre,
                  fontSize: 13,
                  bold: true,
                  color: '#2c3e50',
                  alignment: 'right',
                },
                {
                  text: `Sucursal: ${v.sucursalNombre}`,
                  fontSize: 8,
                  color: '#7f8c8d',
                  alignment: 'right',
                  margin: [0, 2, 0, 0],
                },
              ],
              width: 'auto',
            },
          ],
          margin: [0, 0, 0, 16],
        },

        // Línea divisora degradado simulado
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 3,
              lineColor: '#3498db',
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // ── Datos cliente + factura ───────────────────────
        {
          columns: [
            // Cliente
            {
              stack: [
                {
                  text: 'FACTURAR A',
                  fontSize: 8,
                  bold: true,
                  color: '#9b59b6',
                  margin: [0, 0, 0, 6],
                },
                {
                  text: v.clienteNombre ?? 'Consumidor Final',
                  fontSize: 11,
                  bold: true,
                  color: '#2c3e50',
                },
              ],
              width: '*',
            },
            // Número y fecha
            {
              stack: [
                {
                  text: 'FACTURA DE VENTA',
                  fontSize: 8,
                  bold: true,
                  color: '#9b59b6',
                  alignment: 'right',
                  margin: [0, 0, 0, 6],
                },
                {
                  columns: [
                    { text: 'N°:', bold: true, fontSize: 9, width: 'auto' },
                    {
                      text: this.numeroFactura,
                      fontSize: 9,
                      alignment: 'right',
                    },
                  ],
                  columnGap: 8,
                },
                {
                  columns: [
                    { text: 'Fecha:', bold: true, fontSize: 9, width: 'auto' },
                    {
                      text: this.formatFecha(v.fechaEmision),
                      fontSize: 9,
                      alignment: 'right',
                    },
                  ],
                  columnGap: 8,
                },
                {
                  columns: [
                    { text: 'Estado:', bold: true, fontSize: 9, width: 'auto' },
                    {
                      text:
                        v.estadoVenta === 'COMPLETADA' ? 'Pagada' : 'Anulada',
                      fontSize: 9,
                      color:
                        v.estadoVenta === 'COMPLETADA' ? '#27ae60' : '#e74c3c',
                      bold: true,
                      alignment: 'right',
                    },
                  ],
                  columnGap: 8,
                },
              ],
              width: 'auto',
            },
          ],
          fillColor: '#f8f9fa',
          margin: [-8, 0, -8, 0],
          // Caja gris de fondo via table
        },

        // Caja datos con fondo gris
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                {
                  stack: [
                    {
                      text: 'FACTURAR A',
                      fontSize: 8,
                      bold: true,
                      color: '#9b59b6',
                      margin: [0, 0, 0, 4],
                    },
                    {
                      text: v.clienteNombre ?? 'Consumidor Final',
                      fontSize: 11,
                      bold: true,
                      color: '#2c3e50',
                    },
                    {
                      text: v.tipoDocumento ?? 'Consumidor Final',
                      fontSize: 9,
                      color: '#7f8c8d',
                      margin: [0, 2, 0, 0],
                    },
                  ],
                  border: [false, false, false, false],
                },
                {
                  stack: [
                    {
                      text: 'DETALLE',
                      fontSize: 8,
                      bold: true,
                      color: '#9b59b6',
                      alignment: 'right',
                      margin: [0, 0, 0, 4],
                    },
                    {
                      text: `N° ${this.numeroFactura}`,
                      fontSize: 10,
                      bold: true,
                      alignment: 'right',
                      color: '#2c3e50',
                    },
                    {
                      text: `Fecha: ${this.formatFecha(v.fechaEmision)}`,
                      fontSize: 9,
                      alignment: 'right',
                      color: '#7f8c8d',
                    },
                    {
                      text:
                        v.estadoVenta === 'COMPLETADA'
                          ? '● Pagada'
                          : '● Anulada',
                      fontSize: 9,
                      bold: true,
                      alignment: 'right',
                      color:
                        v.estadoVenta === 'COMPLETADA' ? '#27ae60' : '#e74c3c',
                    },
                  ],
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          fillColor: '#f8f9fa',
          margin: [0, 0, 0, 24],
        },

        // ── Tabla productos ───────────────────────────────
        {
          table: {
            headerRows: 1,
            widths: ['*', 45, 70, 35, 60, 70],
            body: [
              // Header
              [
                { text: 'DESCRIPCIÓN', style: 'tableHeader' },
                { text: 'CANT.', style: 'tableHeader', alignment: 'right' },
                {
                  text: 'PRECIO UNIT.',
                  style: 'tableHeader',
                  alignment: 'right',
                },
                { text: 'IVA', style: 'tableHeader', alignment: 'right' },
                { text: 'DESCUENTO', style: 'tableHeader', alignment: 'right' },
                { text: 'TOTAL', style: 'tableHeader', alignment: 'right' },
              ],
              // Filas productos
              ...bodyRows,
            ],
          },
          layout: {
            hLineWidth: (i: number, node: any) =>
              i === 0 || i === 1 || i === node.table.body.length ? 0 : 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e0e0e0',
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return null; // header tiene su propio estilo
              return rowIndex % 2 === 0 ? '#f8f9fa' : null;
            },
          },
          margin: [0, 0, 0, 24],
        },

        // ── Totales ───────────────────────────────────────
        {
          columns: [
            // Pagos (izquierda)
            {
              stack: [
                {
                  text: 'MÉTODOS DE PAGO',
                  fontSize: 8,
                  bold: true,
                  color: '#9b59b6',
                  margin: [0, 0, 0, 6],
                },
                {
                  table: {
                    widths: [80, 70],
                    body:
                      pagoRows.length > 0
                        ? pagoRows
                        : [
                            [
                              { text: '—', fontSize: 9 },
                              { text: '', fontSize: 9 },
                            ],
                          ],
                  },
                  layout: 'noBorders',
                },
              ],
              width: '*',
            },
            // Subtotales (derecha)
            {
              table: {
                widths: [100, 80],
                body: [
                  [
                    { text: 'Subtotal:', fontSize: 9, color: '#555' },
                    {
                      text: this.formatCOP(v.subtotal),
                      fontSize: 9,
                      alignment: 'right',
                    },
                  ],
                  ...(v.descuentoTotal > 0
                    ? [
                        [
                          { text: 'Descuento:', fontSize: 9, color: '#e74c3c' },
                          {
                            text: `-${this.formatCOP(v.descuentoTotal)}`,
                            fontSize: 9,
                            alignment: 'right',
                            color: '#e74c3c',
                          },
                        ],
                      ]
                    : []),
                  ...(v.impuestosTotal > 0
                    ? [
                        [
                          { text: 'Impuestos:', fontSize: 9, color: '#555' },
                          {
                            text: this.formatCOP(v.impuestosTotal),
                            fontSize: 9,
                            alignment: 'right',
                          },
                        ],
                      ]
                    : []),
                  [
                    {
                      text: 'TOTAL:',
                      fontSize: 12,
                      bold: true,
                      color: '#3498db',
                      margin: [0, 4, 0, 0],
                    },
                    {
                      text: this.formatCOP(v.totalPagar),
                      fontSize: 12,
                      bold: true,
                      alignment: 'right',
                      color: '#3498db',
                      margin: [0, 4, 0, 0],
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: (i: number, node: any) =>
                  i === node.table.body.length - 1 ? 2 : 0,
                vLineWidth: () => 0,
                hLineColor: () => '#3498db',
              },
              width: 'auto',
            },
          ],
        },

        // ── Observaciones ─────────────────────────────────
        ...(v.observaciones
          ? [
              {
                stack: [
                  {
                    canvas: [
                      {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: 515,
                        y2: 0,
                        lineWidth: 0.5,
                        lineColor: '#e0e0e0',
                      },
                    ],
                    margin: [0, 20, 0, 8],
                  },
                  {
                    text: 'OBSERVACIONES',
                    fontSize: 8,
                    bold: true,
                    color: '#9b59b6',
                    margin: [0, 0, 0, 4],
                  },
                  {
                    text: v.observaciones,
                    fontSize: 9,
                    color: '#555',
                    italics: true,
                  },
                ],
              },
            ]
          : []),
      ],

      styles: {
        tableHeader: {
          fontSize: 8,
          bold: true,
          color: 'white',
          fillColor: '#3498db',
          margin: [0, 4, 0, 4],
        },
        tableBody: {
          fontSize: 9,
          color: '#2c3e50',
          margin: [0, 3, 0, 3],
        },
        tableBodyRight: {
          fontSize: 9,
          color: '#2c3e50',
          margin: [0, 3, 0, 3],
        },
      },

      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#2c3e50',
      },
    };
  }

  // ── Acciones ─────────────────────────────────────────────

  async descargar(): Promise<void> {
    if (!this.venta) return;
    this.generando = true;
    this.cdr.markForCheck();
    try {
      const doc = this.buildDocDefinition();
      pdfMake.createPdf(doc).download(`Factura-${this.numeroFactura}.pdf`);
    } finally {
      this.generando = false;
      this.cdr.markForCheck();
    }
  }

  async imprimir(): Promise<void> {
    if (!this.venta) return;
    this.generando = true;
    this.cdr.markForCheck();
    try {
      const doc = this.buildDocDefinition();
      pdfMake.createPdf(doc).print();
    } finally {
      this.generando = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.modalClosed.emit();
  }

  formatCOPPublic = (v: number) => this.formatCOP(v);
}
