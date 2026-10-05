import { Injectable } from '@angular/core';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { EmpresaConfig } from './empresa.service';
import { FacturaVentaDetalle } from '../models/factura-venta.model';

const AZUL = '#2563eb';
const GRIS = '#64748b';
const OSCURO = '#1e293b';
const BORDE = '#e2e8f0';
const FONDO = '#f8fafc';

/** Datos del cliente para la factura (los del tercero, ya resueltos). */
export interface ClienteFacturaPdf {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  dv: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  email: string | null;
  responsabilidad: string | null;
}

/**
 * Representación gráfica de la factura de venta de Facturación (pdfmake),
 * pensada para caber en una hoja carta con varias líneas.
 *
 * - Con CUFE: "Factura electrónica de venta", QR arriba junto al título.
 * - Emitida sin enviar a la DIAN: "Factura de venta", sin QR ni CUFE.
 * - Borrador: "Borrador de factura" con marca de agua, sin número.
 */
@Injectable({ providedIn: 'root' })
export class FacturaVentaPdfService {
  private num(v: number | null | undefined, dec = 2): string {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(
      Number(v ?? 0),
    );
  }

  private cop(v: number | null | undefined): string {
    return '$ ' + this.num(v);
  }

  /**
   * Fecha en dd/mm/aaaa desde lo que venga: "2026-01-31", "2026-01-31T10:00",
   * "31/01/2026", [2026, 1, 31]… Si no se entiende, el texto tal cual (nunca
   * "Invalid Date").
   */
  private aFecha(v: unknown): Date | null {
    if (v == null || v === '') return null;
    if (Array.isArray(v)) {
      const [y, m, d, h = 0, mi = 0, s = 0] = v.map(Number);
      return new Date(y, (m || 1) - 1, d || 1, h, mi, s);
    }
    const t = String(v).trim();
    let m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(t);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
    m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  }

  private fecha(v: unknown): string {
    const d = this.aFecha(v);
    if (!d) return v ? String(v) : '—';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private hora(v: unknown): string {
    const d = this.aFecha(v);
    if (!d || (typeof v === 'string' && v.length <= 10)) return '—';
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  private nit(numero: string | null | undefined, dv: string | null | undefined): string {
    if (!numero) return '—';
    const n = /^\d+$/.test(numero) ? new Intl.NumberFormat('es-CO').format(Number(numero)) : numero;
    return dv ? `${n}-${dv}` : n;
  }

  /** Logo como dataURL; null si no hay o falla (CORS). */
  private async logoDataUrl(url?: string): Promise<string | null> {
    if (!url) return null;
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  /**
   * El QR de la FE. Factus devuelve en `qr` una URL o la imagen en base64;
   * si no hay, se arma la consulta pública de la DIAN con el CUFE.
   */
  private qr(f: FacturaVentaDetalle, tamano: number): any {
    const q = (f.qrData ?? '').trim();
    if (q.startsWith('data:image')) return { image: q, fit: [tamano, tamano] };
    if (/^[A-Za-z0-9+/=\s]{200,}$/.test(q)) return { image: 'data:image/png;base64,' + q.replace(/\s/g, ''), fit: [tamano, tamano] };
    const texto =
      q ||
      f.factusUrl ||
      (f.cufe ? `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${f.cufe}` : '');
    return texto ? { qr: texto, fit: tamano, eccLevel: 'M' } : null;
  }

  private etiqueta(e: string, v: string | null | undefined): any {
    return {
      text: [{ text: `${e}: `, bold: true }, { text: v || '—' }],
      fontSize: 7.8,
      color: OSCURO,
      margin: [0, 0.5, 0, 0.5],
    };
  }

  private banda(texto: string): any {
    return {
      table: { widths: ['*'], body: [[{ text: texto, bold: true, fontSize: 7.8, color: AZUL, alignment: 'center', margin: [0, 1.5, 0, 1.5] }]] },
      layout: { fillColor: () => '#eff6ff', hLineColor: () => BORDE, vLineColor: () => BORDE, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
      margin: [0, 6, 0, 4],
    };
  }

  private caja(titulo: string, contenido: any[]): any {
    return {
      table: {
        widths: ['*'],
        body: [[{ stack: [{ text: titulo, bold: true, fontSize: 7.8, color: AZUL, margin: [0, 0, 0, 2] }, ...contenido], margin: [4, 3, 4, 3] }]],
      },
      layout: { hLineColor: () => BORDE, vLineColor: () => BORDE, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
    };
  }

  private medio(m: string | null): string {
    const n: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TRANSFERENCIA: 'Transferencia',
      CONSIGNACION: 'Consignación',
      TARJETA: 'Tarjeta',
      CHEQUE: 'Cheque',
    };
    return m ? (n[m] ?? m) : '—';
  }

  private tipoCuenta(t: string): string {
    const m: Record<string, string> = { AHORROS: 'Cuenta de ahorros', CORRIENTE: 'Cuenta corriente' };
    return m[t.toUpperCase()] ?? t;
  }

  async generar(f: FacturaVentaDetalle, empresa: EmpresaConfig, cliente: ClienteFacturaPdf): Promise<void> {
    const logo = await this.logoDataUrl(empresa.logoUrl);
    const borrador = f.estado === 'BORRADOR';
    const electronica = !!f.cufe;
    const numero = borrador ? `Borrador ${f.id}` : f.factusNumero || f.numero || `${f.id}`;
    const emision = borrador ? new Date().toISOString() : (f.fechaEmision ?? f.emitidaAt ?? f.createdAt);
    const titulo = borrador ? 'BORRADOR DE FACTURA' : electronica ? 'FACTURA ELECTRÓNICA DE VENTA' : 'FACTURA DE VENTA';
    const empresaNombre = empresa.razonSocial || empresa.nombreComercial || 'Empresa';
    const qr = electronica ? this.qr(f, 105) : null;

    // ── Encabezado: empresa · título y fechas · QR ─────────────────
    const empresaCol = {
      width: '*',
      stack: [
        logo ? { image: logo, fit: [120, 46], margin: [0, 0, 0, 3] } : {},
        { text: empresaNombre.toUpperCase(), bold: true, fontSize: 9.5, color: OSCURO },
        { text: `NIT: ${this.nit(empresa.nit, empresa.dv)}`, fontSize: 7.8, color: OSCURO },
        { text: [empresa.direccion, empresa.municipio].filter(Boolean).join(' · '), fontSize: 7.3, color: GRIS, margin: [0, 2, 0, 0] },
        { text: [empresa.telefono ? `Tel: ${empresa.telefono}` : '', empresa.correo].filter(Boolean).join(' · '), fontSize: 7.3, color: GRIS },
      ],
    };
    const tituloCol = {
      width: 190,
      stack: [
        { text: titulo, bold: true, fontSize: 10.5, color: borrador ? GRIS : AZUL, alignment: 'right' },
        { text: `No. ${numero}`, bold: true, fontSize: 10, color: OSCURO, alignment: 'right', margin: [0, 1, 0, 4] },
        { ...this.etiqueta('Fecha emisión', `${this.fecha(emision)}  ${borrador ? '' : this.hora(emision)}`), alignment: 'right' },
        {
          ...this.etiqueta('Vencimiento', f.formaPago === 'CREDITO' ? this.fecha(f.fechaVencimiento) : this.fecha(emision)),
          alignment: 'right',
        },
        { ...this.etiqueta('Moneda', 'COP'), alignment: 'right' },
        f.estado === 'ANULADA' ? { text: 'ANULADA', bold: true, color: '#dc2626', fontSize: 10, alignment: 'right' } : {},
      ],
    };
    const encabezado: any = {
      columns: qr ? [empresaCol, tituloCol, { width: 110, stack: [qr], margin: [5, 0, 0, 0] }] : [empresaCol, tituloCol],
      columnGap: 8,
    };
    const cufe = electronica
      ? {
          text: [{ text: 'CUFE: ', bold: true, color: OSCURO }, { text: f.cufe!, color: GRIS }],
          fontSize: 6.5,
          margin: [0, 4, 0, 0],
        }
      : {};

    // ── Cliente ────────────────────────────────────────────────────
    const clienteBloque = {
      columns: [
        {
          width: '*',
          stack: [
            this.etiqueta('Razón social', cliente.nombre),
            this.etiqueta(cliente.tipoDocumento || 'Documento', this.nit(cliente.numeroDocumento, cliente.dv)),
            this.etiqueta('Dirección', cliente.direccion),
            this.etiqueta('Correo', cliente.email),
          ],
        },
        {
          width: 190,
          stack: [
            this.etiqueta('Teléfono', cliente.telefono),
            this.etiqueta('Ciudad', cliente.ciudad),
            this.etiqueta('Responsabilidad', cliente.responsabilidad),
            this.etiqueta('Vendedor', f.vendedorNombre),
          ],
        },
      ],
      columnGap: 8,
    };

    // ── Detalle (una fila por línea, compacta) ─────────────────────
    const th = (t: string, a: 'left' | 'right' | 'center' = 'left') => ({ text: t, bold: true, fontSize: 7.3, color: AZUL, alignment: a });
    const body: any[] = [
      [th('#', 'center'), th('Producto / servicio'), th('Cant.', 'right'), th('V. Unitario', 'right'), th('Desc.', 'right'), th('IVA', 'right'), th('Total', 'right')],
    ];
    f.lineas.forEach((l, i) => {
      const extra = [
        l.descripcion && l.descripcion !== l.productoNombre ? l.productoNombre : null,
        l.productoSku ? `Cód. ${l.productoSku}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      body.push([
        { text: `${i + 1}`, fontSize: 7.5, alignment: 'center' },
        {
          text: [
            { text: l.descripcion || l.productoNombre, color: OSCURO },
            extra ? { text: `  ${extra}`, fontSize: 6.5, color: GRIS } : '',
          ],
          fontSize: 7.5,
        },
        {
          text: `${this.num(l.cantidad, Number(l.cantidad) % 1 === 0 ? 0 : 2)}${l.unidadAbreviatura ? ' ' + l.unidadAbreviatura : ''}`,
          fontSize: 7.5,
          alignment: 'right',
        },
        { text: this.num(l.precioUnitario), fontSize: 7.5, alignment: 'right' },
        { text: Number(l.descuentoValor) ? this.num(l.descuentoValor) : '—', fontSize: 7.5, alignment: 'right' },
        { text: `${this.num(l.impuestoPorcentaje, 0)}%`, fontSize: 7.5, alignment: 'right' },
        { text: this.num(l.subtotalLinea), fontSize: 7.5, alignment: 'right', bold: true },
      ]);
    });

    // ── Totales ────────────────────────────────────────────────────
    const ivas = new Map<number, number>();
    for (const l of f.lineas) {
      const t = Number(l.impuestoPorcentaje);
      if (t > 0) ivas.set(t, (ivas.get(t) ?? 0) + Number(l.impuestoValor));
    }
    const bruto = f.lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precioUnitario), 0);
    const fila = (a: string, b: string) => [
      { text: a, fontSize: 7.8, color: GRIS },
      { text: b, fontSize: 7.8, alignment: 'right', color: OSCURO },
    ];
    const totales: any[] = [fila('Subtotal', this.cop(bruto)), fila('Descuento', this.cop(f.descuentoTotal))];
    if (f.aiu) {
      // Costo directo = la obra (sin A, I ni U), que es la base del AIU.
      const costoDirecto = f.lineas
        .filter((l) => !l.aiuTipo)
        .reduce((s, l) => s + Number(l.cantidad) * Number(l.precioUnitario) - Number(l.descuentoValor), 0);
      totales.splice(0, 0, fila('Costo directo', this.cop(costoDirecto)));
    }
    [...ivas.entries()].sort((a, b) => b[0] - a[0]).forEach(([t, v]) => totales.push(fila(`IVA ${this.num(t, 0)}%`, this.cop(v))));
    if (!ivas.size) totales.push(fila('IVA', this.cop(0)));
    totales.push([
      { text: 'TOTAL', bold: true, fontSize: 9.5, color: '#fff', fillColor: AZUL, margin: [3, 2, 3, 2] },
      { text: this.cop(f.total), bold: true, fontSize: 9.5, color: '#fff', fillColor: AZUL, alignment: 'right', margin: [3, 2, 3, 2] },
    ]);

    // ── Pago y observaciones, lado a lado con los totales ──────────
    const pago: any[] = [
      this.etiqueta('Condición', f.formaPago === 'CREDITO' ? `Crédito${f.condicionPagoNombre ? ' · ' + f.condicionPagoNombre : ''}` : 'Contado'),
    ];
    if (f.formaPago === 'CONTADO') {
      pago.push(this.etiqueta('Medio de pago', this.medio(f.metodoPago)));
      if (f.cuentaBancariaId) {
        pago.push(
          this.etiqueta(
            'Banco / Cuenta',
            [f.cuentaBancariaBanco || f.cuentaBancariaNombre, f.cuentaBancariaTipo ? this.tipoCuenta(f.cuentaBancariaTipo) : null]
              .filter(Boolean)
              .join(' - '),
          ),
        );
      }
    } else {
      pago.push(this.etiqueta('Vence', this.fecha(f.fechaVencimiento)));
    }
    if (f.ordenCompra) pago.push(this.etiqueta('Orden de compra', f.ordenCompra));
    if (f.aiu) {
      const p = (v: number) => this.num(v, Number(v) % 1 === 0 ? 0 : 2);
      pago.push(
        this.etiqueta(
          'Contrato AIU',
          `Administración ${p(f.aiuAdministracionPct)}% · Imprevistos ${p(f.aiuImprevistosPct)}% · ` +
            `Utilidad ${p(f.aiuUtilidadPct)}% · IVA ${p(f.aiuIvaPct)}% sobre la utilidad`,
        ),
      );
    }
    const izquierdaPie: any[] = [this.caja('FORMA Y CONDICIÓN DE PAGO', pago)];
    if (f.notas) {
      izquierdaPie.push({ ...this.caja('OBSERVACIONES', [{ text: f.notas, fontSize: 7.5, color: OSCURO }]), margin: [0, 4, 0, 0] });
    }

    // ── Resolución y proveedor, en letra pequeña ───────────────────
    const legal: any[] = [];
    if (empresa.resolucionNumero && !borrador) {
      const pref = empresa.resolucionPrefijo ?? '';
      const partes = [
        `Resolución DIAN No. ${empresa.resolucionNumero}`,
        pref ? `prefijo ${pref}` : null,
        empresa.resolucionDesde != null ? `del ${pref}${empresa.resolucionDesde} al ${pref}${empresa.resolucionHasta ?? ''}` : null,
        empresa.resolucionFechaDesde
          ? `vigencia ${this.fecha(empresa.resolucionFechaDesde)} a ${this.fecha(empresa.resolucionFechaHasta)}`
          : null,
      ].filter(Boolean);
      legal.push({ text: partes.join(', ') + '.', fontSize: 6.8, color: GRIS });
    }
    if (electronica) {
      legal.push({ text: 'Software: Aura · Proveedor tecnológico: Factus.', fontSize: 6.8, color: GRIS });
    }

    const doc: any = {
      pageSize: 'LETTER',
      pageMargins: [28, 26, 28, 34],
      watermark: borrador
        ? { text: 'BORRADOR', color: '#94a3b8', opacity: 0.12, bold: true }
        : f.estado === 'ANULADA'
          ? { text: 'ANULADA', color: '#dc2626', opacity: 0.1, bold: true }
          : undefined,
      content: [
        encabezado,
        cufe,
        this.banda('CLIENTE / ADQUIRENTE'),
        clienteBloque,
        this.banda('DETALLE DE LA FACTURA'),
        {
          table: { headerRows: 1, widths: [14, '*', 46, 62, 46, 30, 66], body },
          layout: {
            fillColor: (row: number) => (row === 0 ? '#eff6ff' : row % 2 === 0 ? FONDO : null),
            hLineColor: () => BORDE,
            vLineColor: () => BORDE,
            hLineWidth: () => 0.4,
            vLineWidth: () => 0.4,
            paddingTop: () => 1.5,
            paddingBottom: () => 1.5,
            paddingLeft: () => 3,
            paddingRight: () => 3,
          },
        },
        {
          columns: [
            { width: '*', stack: izquierdaPie },
            {
              width: 200,
              table: { widths: ['*', 'auto'], body: totales },
              layout: { hLineColor: () => BORDE, vLineColor: () => BORDE, hLineWidth: () => 0.4, vLineWidth: () => 0.4 },
            },
          ],
          columnGap: 10,
          margin: [0, 6, 0, 0],
          unbreakable: true,
        },
        legal.length ? { stack: legal, margin: [0, 8, 0, 0], unbreakable: true } : {},
      ],
      footer: (page: number, count: number) => ({
        columns: [
          {
            text: borrador
              ? 'Borrador: no es una factura y no tiene validez.'
              : electronica
                ? 'Representación gráfica de la factura electrónica de venta. Consulte el documento electrónico con el código QR.'
                : 'Factura de venta. Aún no ha sido enviada a la DIAN como factura electrónica.',
            fontSize: 6.5,
            color: GRIS,
          },
          { text: `Página ${page} de ${count}`, fontSize: 6.5, color: GRIS, alignment: 'right', width: 70 },
        ],
        margin: [28, 10, 28, 0],
      }),
      info: { title: `Factura ${numero}` },
    };

    pdfMake.createPdf(doc).download(`${borrador ? 'Borrador' : 'Factura'}-${numero}.pdf`);
  }
}
