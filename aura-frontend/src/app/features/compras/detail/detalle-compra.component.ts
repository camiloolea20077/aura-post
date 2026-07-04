import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CompraModel,
  CompraPagoModel,
} from '../../../core/models/compra.model';
import { CompraService } from '../../../core/services/compra.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  EmpresaConfig,
  EmpresaService,
} from '../../../core/services/empresa.service';
import { TerceroModel } from '../../../core/models/tercero.model';
import { TerceroService } from '../../../core/services/tercero.service';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

@Component({
  selector: 'app-detalle-compra',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './detalle-compra.component.html',
  styleUrls: ['./detalle-compra.component.scss'],
})
export class DetalleCompraComponent implements OnChanges {
  @Input() visible = false;
  @Input() compraId: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() anulada = new EventEmitter<void>();

  public compra: CompraModel | null = null;
  public isLoading = false;
  public isAnulando = false;
  public generandoPDF = false;

  constructor(
    private readonly compraService: CompraService,
    private readonly empresaService: EmpresaService,
    private readonly terceroService: TerceroService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.compraId) {
      this.loadCompra(this.compraId);
    }
    if (changes['visible'] && !this.visible) {
      this.compra = null;
    }
  }

  private async loadCompra(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.compraService.getById(id));
      this.compra = res?.data ?? null;
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo cargar el detalle de la compra.',
      );
      this.close();
    } finally {
      this.isLoading = false;
    }
  }

  close(): void {
    this.compra = null;
    this.closed.emit();
  }

  confirmarAnular(): void {
    if (!this.compra) return;
    this.confirmationService.confirm({
      message: `¿Anular la compra <strong>${this.compra.numeroCompra ?? '#' + this.compra.id}</strong>?<br>
                <small>Se revertirá el stock y lotes de todos los productos.</small>`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.anular();
      },
    });
  }

  private async anular(): Promise<void> {
    if (!this.compra) return;
    this.isAnulando = true;
    try {
      await lastValueFrom(this.compraService.anular(this.compra.id));
      this.alertService.showSuccess(
        'Compra anulada',
        'El stock fue revertido correctamente.',
      );
      this.anulada.emit();
      this.close();
    } catch (err: any) {
      this.alertService.showError(
        'Error al anular',
        err?.message ?? 'No se pudo anular la compra.',
      );
    } finally {
      this.isAnulando = false;
    }
  }

  // ── PDF ───────────────────────────────────────────────────────────

  async generarPDF(): Promise<void> {
    if (!this.compra) return;
    this.generandoPDF = true;
    this.cdr.markForCheck();
    try {
      const [empRes, provRes] = await Promise.all([
        lastValueFrom(this.empresaService.getConfig()),
        lastValueFrom(this.terceroService.getById(this.compra.proveedorId)),
      ]);
      const emp: EmpresaConfig = empRes?.data ?? {};
      const prov: TerceroModel | null = provRes?.data ?? null;

      let logoBase64: string | null = null;
      if (emp.logoUrl) {
        logoBase64 = await this.urlToBase64(emp.logoUrl);
      }

      const doc = this.buildCompraDoc(this.compra, emp, prov, logoBase64);
      pdfMake.createPdf(doc).open();
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el PDF.');
    } finally {
      this.generandoPDF = false;
      this.cdr.markForCheck();
    }
  }

  private async urlToBase64(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  private metodoPagoLabel(m: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TARJETA: 'Tarjeta',
      TRANSFERENCIA: 'Transferencia',
      CREDITO: 'Crédito',
      CHEQUE: 'Cheque',
    };
    return map[m] ?? m;
  }

  private fmtCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private buildCompraDoc(
    c: CompraModel,
    emp: EmpresaConfig,
    prov: TerceroModel | null,
    logoBase64: string | null,
  ): any {
    const num = c.numeroCompra ?? `C-${String(c.id).padStart(6, '0')}`;
    const fecha = c.fecha
      ? new Date(c.fecha).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '—';

    // Datos del proveedor
    const provNombre = prov
      ? (prov.razonSocial ??
        `${prov.nombres ?? ''} ${prov.apellidos ?? ''}`.trim())
      : c.proveedorNombre;
    const provDoc = prov
      ? `${prov.tipoDocumento}: ${prov.numeroDocumento}${prov.dv ? '-' + prov.dv : ''}`
      : null;
    const provDir = prov?.direccion ?? null;
    const provTel = prov?.telefono ?? null;
    const provEmail = prov?.email ?? null;

    // Logo o nombre empresa como fallback
    const logoElement = logoBase64
      ? { image: logoBase64, fit: [90, 55] }
      : {
          text: emp.nombreComercial ?? emp.razonSocial ?? 'Empresa',
          fontSize: 15,
          bold: true,
          color: '#374151',
        };

    // Filas de productos
    const bodyRows = c.detalles.map((d, i) => [
      {
        text: String(i + 1),
        fontSize: 9,
        alignment: 'center',
        margin: [0, 4, 0, 4],
      },
      {
        text: d.productoSku ?? '—',
        fontSize: 9,
        margin: [0, 4, 0, 4],
        color: '#64748b',
      },
      { text: d.productoNombre, fontSize: 9, margin: [0, 4, 0, 4] },
      {
        text:
          d.cantidad % 1 === 0 ? d.cantidad.toFixed(0) : d.cantidad.toFixed(3),
        fontSize: 9,
        alignment: 'right',
        margin: [0, 4, 0, 4],
      },
      {
        text: this.fmtCOP(d.subtotalLinea),
        fontSize: 9,
        alignment: 'right',
        margin: [0, 4, 0, 4],
        bold: true,
      },
    ]);

    // Filas de retenciones
    const retenRows: any[] = [];
    if ((c.retefuenteValor ?? 0) > 0)
      retenRows.push([
        {
          text: `Retefuente (${c.retefuentePct}%)`,
          fontSize: 9,
          color: '#64748b',
          border: [false, false, false, false],
        },
        {
          text: `-${this.fmtCOP(c.retefuenteValor)}`,
          fontSize: 9,
          alignment: 'right',
          color: '#dc2626',
          border: [false, false, false, false],
        },
      ]);
    if ((c.reteivaValor ?? 0) > 0)
      retenRows.push([
        {
          text: `ReteIVA (${c.reteivaPct}%)`,
          fontSize: 9,
          color: '#64748b',
          border: [false, false, false, false],
        },
        {
          text: `-${this.fmtCOP(c.reteivaValor)}`,
          fontSize: 9,
          alignment: 'right',
          color: '#dc2626',
          border: [false, false, false, false],
        },
      ]);
    if ((c.reteicaValor ?? 0) > 0)
      retenRows.push([
        {
          text: `ReteICA (${c.reteicaPct}%)`,
          fontSize: 9,
          color: '#64748b',
          border: [false, false, false, false],
        },
        {
          text: `-${this.fmtCOP(c.reteicaValor)}`,
          fontSize: 9,
          alignment: 'right',
          color: '#dc2626',
          border: [false, false, false, false],
        },
      ]);

    // Stack de datos del proveedor (dinámico)
    const provStack: any[] = [
      {
        text: 'PROVEEDOR',
        fontSize: 7,
        bold: true,
        color: '#94a3b8',
        margin: [0, 0, 0, 3],
      },
      {
        text: provNombre,
        fontSize: 11,
        bold: true,
        color: '#1e293b',
        margin: [0, 0, 0, 5],
      },
    ];
    if (provDoc)
      provStack.push({
        text: provDoc,
        fontSize: 8,
        color: '#475569',
        margin: [0, 0, 0, 2],
      });
    if (provDir)
      provStack.push({
        text: provDir,
        fontSize: 8,
        color: '#475569',
        margin: [0, 0, 0, 2],
      });
    if (provTel)
      provStack.push({
        text: `Tel: ${provTel}`,
        fontSize: 8,
        color: '#475569',
        margin: [0, 0, 0, 2],
      });
    if (provEmail)
      provStack.push({
        text: provEmail,
        fontSize: 8,
        color: '#64748b',
        italics: true,
      });

    return {
      pageSize: 'A4',
      pageMargins: [30, 30, 30, 50],

      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: 'AURA NUBE — Software de gestión empresarial',
            fontSize: 7,
            color: '#94a3b8',
            margin: [30, 0, 0, 0],
          },
          {
            text: `Pág. ${currentPage} / ${pageCount}`,
            fontSize: 7,
            color: '#94a3b8',
            alignment: 'right',
            margin: [0, 0, 30, 0],
          },
        ],
        margin: [0, 10, 0, 0],
      }),

      content: [
        // ── Encabezado: logo | empresa | caja compra ───────────
        {
          columns: [
            { stack: [logoElement], width: 100 },
            {
              stack: [
                {
                  text: emp.razonSocial ?? '',
                  fontSize: 13,
                  bold: true,
                  color: '#1e293b',
                  alignment: 'center',
                },
                {
                  text: `NIT: ${emp.nit ?? ''}${emp.dv ? '-' + emp.dv : ''}`,
                  fontSize: 8,
                  color: '#64748b',
                  alignment: 'center',
                  margin: [0, 3, 0, 0],
                },
                {
                  text: emp.direccion ?? '',
                  fontSize: 8,
                  color: '#64748b',
                  alignment: 'center',
                  margin: [0, 2, 0, 0],
                },
                {
                  text: emp.telefono ?? '',
                  fontSize: 8,
                  color: '#64748b',
                  alignment: 'center',
                  margin: [0, 2, 0, 0],
                },
                {
                  text: emp.municipio ?? '',
                  fontSize: 8,
                  color: '#64748b',
                  alignment: 'center',
                  margin: [0, 2, 0, 0],
                },
              ],
              width: '*',
            },
            {
              table: {
                widths: ['*'],
                body: [
                  [
                    {
                      stack: [
                        {
                          text: 'Compra',
                          fontSize: 9,
                          bold: true,
                          color: '#475569',
                          alignment: 'center',
                          margin: [0, 0, 0, 4],
                        },
                        {
                          text: `No. ${num}`,
                          fontSize: 14,
                          bold: true,
                          color: '#1e293b',
                          alignment: 'center',
                        },
                      ],
                      margin: [10, 10, 10, 10],
                      border: [true, true, true, true],
                    },
                  ],
                ],
              },
              layout: {
                hLineColor: () => '#cbd5e1',
                vLineColor: () => '#cbd5e1',
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                fillColor: () => '#f8fafc',
              },
              width: 120,
            },
          ],
          margin: [0, 0, 0, 14],
        },

        // ── Línea divisora gris ─────────────────────────────────
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 535,
              y2: 0,
              lineWidth: 2,
              lineColor: '#374151',
            },
          ],
          margin: [0, 0, 0, 14],
        },

        // ── Proveedor (izquierda) + Fechas/Estado (derecha) ─────
        {
          table: {
            widths: ['*', 195],
            body: [
              [
                {
                  stack: provStack,
                  border: [false, false, false, false],
                  margin: [0, 6, 0, 6],
                },
                {
                  table: {
                    widths: ['*', 'auto'],
                    body: [
                      [
                        {
                          text: 'Fecha de compra',
                          fontSize: 8,
                          bold: true,
                          color: '#64748b',
                          border: [false, false, false, false],
                        },
                        {
                          text: fecha,
                          fontSize: 8,
                          color: '#1e293b',
                          alignment: 'right',
                          border: [false, false, false, false],
                        },
                      ],
                      [
                        {
                          text: 'Forma de pago',
                          fontSize: 8,
                          bold: true,
                          color: '#64748b',
                          border: [false, false, false, false],
                        },
                        {
                          text:
                            c.formaPago === 'CONTADO'
                              ? 'Contado'
                              : c.formaPago === 'CREDITO'
                                ? 'Crédito'
                                : '—',
                          fontSize: 8,
                          bold: true,
                          alignment: 'right',
                          color:
                            c.formaPago === 'CONTADO' ? '#059669' : '#d97706',
                          border: [false, false, false, false],
                        },
                      ],
                      [
                        {
                          text: 'Estado',
                          fontSize: 8,
                          bold: true,
                          color: '#64748b',
                          border: [false, false, false, false],
                        },
                        {
                          text:
                            c.estado === 'RECIBIDA'
                              ? '● Recibida'
                              : '● Anulada',
                          fontSize: 8,
                          bold: true,
                          alignment: 'right',
                          color:
                            c.estado === 'RECIBIDA' ? '#059669' : '#dc2626',
                          border: [false, false, false, false],
                        },
                      ],
                      [
                        {
                          text: 'Sucursal destino',
                          fontSize: 8,
                          bold: true,
                          color: '#64748b',
                          border: [false, false, false, false],
                        },
                        {
                          text: c.sucursalNombre,
                          fontSize: 8,
                          alignment: 'right',
                          color: '#1e293b',
                          border: [false, false, false, false],
                        },
                      ],
                    ],
                  },
                  layout: 'noBorders',
                  border: [false, false, false, false],
                  fillColor: '#f8fafc',
                  margin: [8, 6, 8, 6],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 0,
            hLineColor: () => '#e2e8f0',
          },
          margin: [0, 0, 0, 16],
        },

        // ── Tabla de productos ──────────────────────────────────
        {
          table: {
            headerRows: 1,
            widths: [22, 65, '*', 45, 85],
            body: [
              [
                { text: 'Ítem', style: 'th', alignment: 'center' },
                { text: 'Referencia', style: 'th' },
                { text: 'Nombre producto', style: 'th' },
                { text: 'Cantidad', style: 'th', alignment: 'right' },
                { text: 'Vr. Bruto', style: 'th', alignment: 'right' },
              ],
              ...bodyRows,
            ],
          },
          layout: {
            hLineWidth: (i: number, node: any) =>
              i === 0 || i === 1 || i === node.table.body.length ? 0 : 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e2e8f0',
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return null;
              return rowIndex % 2 === 0 ? '#f8fafc' : null;
            },
          },
          margin: [0, 0, 0, 20],
        },

        // ── Condiciones + Totales ───────────────────────────────
        {
          columns: [
            {
              stack: [
                {
                  text: 'Condiciones de Pago',
                  fontSize: 8,
                  bold: true,
                  color: '#94a3b8',
                  margin: [0, 0, 0, 4],
                },
                {
                  text:
                    c.formaPago === 'CONTADO'
                      ? 'Contado'
                      : c.formaPago === 'CREDITO'
                        ? 'Crédito'
                        : '—',
                  fontSize: 11,
                  bold: true,
                  color: '#1e293b',
                },
                // Métodos de pago usados
                ...(c.pagos?.length > 0
                  ? [
                      {
                        text: 'Métodos de pago',
                        fontSize: 8,
                        bold: true,
                        color: '#94a3b8',
                        margin: [0, 10, 0, 4],
                      },
                      ...c.pagos.map((p: CompraPagoModel) => ({
                        columns: [
                          {
                            text: this.metodoPagoLabel(p.metodoPago),
                            fontSize: 9,
                            color: '#475569',
                            width: '*',
                          },
                          ...(p.banco
                            ? [
                                {
                                  text: p.banco,
                                  fontSize: 8,
                                  color: '#94a3b8',
                                  width: 'auto',
                                  margin: [4, 1, 8, 0],
                                },
                              ]
                            : []),
                          {
                            text: this.fmtCOP(p.monto),
                            fontSize: 9,
                            bold: true,
                            color: '#1e293b',
                            alignment: 'right',
                            width: 80,
                          },
                        ],
                        margin: [0, 2, 0, 2],
                      })),
                    ]
                  : []),
                ...(c.observaciones
                  ? [
                      {
                        text: 'Observaciones',
                        fontSize: 8,
                        bold: true,
                        color: '#94a3b8',
                        margin: [0, 10, 0, 4],
                      },
                      {
                        text: c.observaciones,
                        fontSize: 9,
                        color: '#475569',
                        italics: true,
                      },
                    ]
                  : []),
              ],
              width: '*',
            },
            {
              table: {
                widths: [115, 90],
                body: [
                  [
                    {
                      text: 'Subtotal',
                      fontSize: 9,
                      color: '#64748b',
                      border: [false, false, false, false],
                      margin: [0, 3, 0, 3],
                    },
                    {
                      text: this.fmtCOP(c.subtotal),
                      fontSize: 9,
                      alignment: 'right',
                      border: [false, false, false, false],
                      margin: [0, 3, 0, 3],
                    },
                  ],
                  ...(c.impuestosTotal > 0
                    ? [
                        [
                          {
                            text: 'IVA',
                            fontSize: 9,
                            color: '#64748b',
                            border: [false, false, false, false],
                            margin: [0, 3, 0, 3],
                          },
                          {
                            text: this.fmtCOP(c.impuestosTotal),
                            fontSize: 9,
                            alignment: 'right',
                            border: [false, false, false, false],
                            margin: [0, 3, 0, 3],
                          },
                        ],
                      ]
                    : []),
                  ...(c.descuentoTotal > 0
                    ? [
                        [
                          {
                            text: 'Descuento',
                            fontSize: 9,
                            color: '#dc2626',
                            border: [false, false, false, false],
                            margin: [0, 3, 0, 3],
                          },
                          {
                            text: `-${this.fmtCOP(c.descuentoTotal)}`,
                            fontSize: 9,
                            alignment: 'right',
                            color: '#dc2626',
                            border: [false, false, false, false],
                            margin: [0, 3, 0, 3],
                          },
                        ],
                      ]
                    : []),
                  ...(c.fletes > 0
                    ? [
                        [
                          {
                            text: 'Fletes',
                            fontSize: 9,
                            color: '#64748b',
                            border: [false, false, false, false],
                            margin: [0, 3, 0, 3],
                          },
                          {
                            text: this.fmtCOP(c.fletes),
                            fontSize: 9,
                            alignment: 'right',
                            border: [false, false, false, false],
                            margin: [0, 3, 0, 3],
                          },
                        ],
                      ]
                    : []),
                  ...retenRows,
                  [
                    {
                      text: 'Total Bruto',
                      fontSize: 10,
                      bold: true,
                      color: '#1e293b',
                      border: [false, true, false, false],
                      fillColor: '#f1f5f9',
                      margin: [6, 6, 0, 6],
                    },
                    {
                      text: this.fmtCOP(c.total),
                      fontSize: 10,
                      bold: true,
                      alignment: 'right',
                      color: '#1e293b',
                      border: [false, true, false, false],
                      fillColor: '#f1f5f9',
                      margin: [0, 6, 6, 6],
                    },
                  ],
                  [
                    {
                      text: 'Total a Pagar',
                      fontSize: 12,
                      bold: true,
                      color: '#fff',
                      border: [false, false, false, false],
                      fillColor: '#1e293b',
                      margin: [6, 8, 0, 8],
                    },
                    {
                      text: this.fmtCOP(c.netaAPagar ?? c.total),
                      fontSize: 12,
                      bold: true,
                      alignment: 'right',
                      color: '#fff',
                      border: [false, false, false, false],
                      fillColor: '#1e293b',
                      margin: [0, 8, 6, 8],
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: (i: number, node: any) =>
                  i === node.table.body.length - 2 ? 1.5 : 0,
                vLineWidth: () => 0,
                hLineColor: () => '#cbd5e1',
              },
              width: 'auto',
            },
          ],
        },
      ],

      styles: {
        th: {
          fontSize: 8,
          bold: true,
          color: '#fff',
          fillColor: '#374151',
          margin: [4, 5, 4, 5],
        },
      },

      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#1e293b',
      },
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────

  formatFecha(f: string | null): string {
    if (!f) return '—';
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
