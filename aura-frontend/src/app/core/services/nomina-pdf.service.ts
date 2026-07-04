import { Injectable } from '@angular/core';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { EmpresaConfig } from './empresa.service';
import { NominaModel, PeriodoResumenModel } from '../models/nomina.model';
import { PrestacionModel } from '../models/prestacion.model';

const AZUL = '#2563eb';
const GRIS = '#64748b';
const OSCURO = '#1e293b';

@Injectable({ providedIn: 'root' })
export class NominaPdfService {
  private cop(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private fecha(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /** Carga el logo como dataURL (base64). Devuelve null si no hay o falla (CORS). */
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

  private encabezado(empresa: EmpresaConfig, logo: string | null): any {
    const nombre = empresa.razonSocial || empresa.nombreComercial || 'Empresa';
    const nit = empresa.nit ? `NIT ${empresa.nit}${empresa.dv ? '-' + empresa.dv : ''}` : '';
    const datos = [
      { text: nombre, fontSize: 13, bold: true, color: OSCURO, alignment: 'right' },
      { text: nit, fontSize: 8, color: GRIS, alignment: 'right', margin: [0, 2, 0, 0] },
      { text: empresa.direccion || '', fontSize: 8, color: GRIS, alignment: 'right' },
      {
        text: [empresa.telefono, empresa.correo].filter(Boolean).join(' · '),
        fontSize: 8,
        color: GRIS,
        alignment: 'right',
      },
    ];
    const izquierda = logo
      ? { image: logo, fit: [120, 60], width: 120 }
      : { text: nombre, fontSize: 18, bold: true, color: AZUL, width: '*' };

    return {
      columns: [izquierda, { stack: datos, width: '*' }],
      margin: [0, 0, 0, 12],
    };
  }

  private linea(): any {
    return {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: AZUL }],
      margin: [0, 0, 0, 14],
    };
  }

  // ─────────────────────────────────────────────────────────────
  //  Dispersión: tabla de empleados del período (vertical)
  // ─────────────────────────────────────────────────────────────
  async dispersion(data: PeriodoResumenModel, empresa: EmpresaConfig): Promise<void> {
    const logo = await this.logoDataUrl(empresa.logoUrl);

    const body: any[] = [
      [
        { text: '#', style: 'th' },
        { text: 'Empleado', style: 'th' },
        { text: 'Documento', style: 'th' },
        { text: 'Cargo', style: 'th' },
        { text: 'Banco / Cuenta', style: 'th' },
        { text: 'Neto a pagar', style: 'th', alignment: 'right' },
      ],
    ];
    data.empleados.forEach((e, i) => {
      body.push([
        { text: `${i + 1}`, fontSize: 8 },
        { text: e.empleadoNombre, fontSize: 8 },
        { text: e.empleadoDocumento, fontSize: 8 },
        { text: e.cargo || '—', fontSize: 8 },
        {
          text: [e.banco || 'Sin banco', e.numeroCuenta || 'Sin cuenta'].join(' · '),
          fontSize: 8,
        },
        { text: this.cop(e.netoPagar), fontSize: 8, alignment: 'right' },
      ]);
    });
    body.push([
      { text: 'TOTAL', colSpan: 5, style: 'thTotal', alignment: 'right' },
      {}, {}, {}, {},
      { text: this.cop(data.totalNeto), style: 'thTotal', alignment: 'right' },
    ]);

    const doc: any = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 50],
      content: [
        this.encabezado(empresa, logo),
        this.linea(),
        { text: 'Comprobante de nómina', fontSize: 15, bold: true, color: OSCURO },
        {
          text: `${data.documento}  ·  Período ${this.fecha(data.fechaInicio)} → ${this.fecha(data.fechaFin)}  ·  ${data.estado}`,
          fontSize: 9,
          color: GRIS,
          margin: [0, 2, 0, 12],
        },
        {
          columns: [
            { text: `Total devengado: ${this.cop(data.totalDevengado)}`, fontSize: 9, color: GRIS },
            { text: `Total deducciones: ${this.cop(data.totalDeducciones)}`, fontSize: 9, color: GRIS, alignment: 'center' },
            { text: `Empleados: ${data.cantidadEmpleados}`, fontSize: 9, color: GRIS, alignment: 'right' },
          ],
          margin: [0, 0, 0, 12],
        },
        {
          table: { headerRows: 1, widths: [16, '*', 60, 70, 130, 70], body },
          layout: {
            fillColor: (row: number) => (row === 0 ? '#eff6ff' : row % 2 === 0 ? '#f8fafc' : null),
            hLineColor: () => '#e2e8f0',
            vLineColor: () => '#e2e8f0',
          },
        },
      ],
      styles: {
        th: { bold: true, fontSize: 8, color: AZUL },
        thTotal: { bold: true, fontSize: 9, color: OSCURO },
      },
      footer: (page: number, count: number) => ({
        text: `Página ${page} de ${count}`,
        alignment: 'center',
        fontSize: 7,
        color: GRIS,
        margin: [0, 10, 0, 0],
      }),
    };

    pdfMake.createPdf(doc).download(`${data.documento}-nomina.pdf`);
  }

  // ─────────────────────────────────────────────────────────────
  //  Desprendible de pago por empleado (horizontal)
  // ─────────────────────────────────────────────────────────────
  async desprendible(n: NominaModel, empresa: EmpresaConfig): Promise<void> {
    const logo = await this.logoDataUrl(empresa.logoUrl);

    const fila = (label: string, valor: number, negativo = false): any => [
      { text: label, fontSize: 9, color: OSCURO },
      {
        text: negativo ? `(${this.cop(valor)})` : this.cop(valor),
        fontSize: 9,
        alignment: 'right',
        color: negativo ? '#dc2626' : OSCURO,
      },
    ];

    const devengados: any[] = [
      [{ text: 'DEVENGADOS', style: 'th', colSpan: 2 }, {}],
      fila('Salario', n.salarioProporcional),
      fila('Auxilio de transporte', n.auxilioTransporte),
      fila('Novedades (extras/bonos)', n.totalNovedadesDev),
      [
        { text: 'Total devengado', bold: true, fontSize: 9 },
        { text: this.cop(n.totalDevengado), bold: true, fontSize: 9, alignment: 'right' },
      ],
    ];

    const deducciones: any[] = [
      [{ text: 'DEDUCCIONES', style: 'th', colSpan: 2 }, {}],
      fila('Salud', n.deduccionSalud, true),
      fila('Pensión', n.deduccionPension, true),
      fila('Otras (préstamos/embargos)', n.deduccionOtros, true),
      [
        { text: 'Total deducciones', bold: true, fontSize: 9 },
        { text: `(${this.cop(n.totalDeducciones)})`, bold: true, fontSize: 9, alignment: 'right', color: '#dc2626' },
      ],
    ];

    const doc: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 40, 40, 40],
      content: [
        this.encabezado(empresa, logo),
        this.linea(),
        { text: 'Desprendible de pago', fontSize: 15, bold: true, color: OSCURO },
        {
          text: `Período ${this.fecha(n.periodoFechaInicio)} → ${this.fecha(n.periodoFechaFin)}  ·  ${n.diasTrabajados} días  ·  ${n.estado}`,
          fontSize: 9, color: GRIS, margin: [0, 2, 0, 12],
        },
        // Datos del empleado
        {
          columns: [
            { text: [{ text: 'Empleado: ', bold: true }, n.empleadoNombre], fontSize: 9 },
            { text: [{ text: 'Documento: ', bold: true }, n.empleadoDocumento], fontSize: 9 },
            { text: [{ text: 'Cargo: ', bold: true }, n.cargo || '—'], fontSize: 9 },
          ],
          margin: [0, 0, 0, 4],
        },
        {
          columns: [
            { text: [{ text: 'Banco: ', bold: true }, n.banco || '—'], fontSize: 9 },
            { text: [{ text: 'Cuenta: ', bold: true }, n.numeroCuenta || '—'], fontSize: 9 },
            { text: [{ text: 'Salario base: ', bold: true }, this.cop(n.salarioBase)], fontSize: 9 },
          ],
          margin: [0, 0, 0, 14],
        },
        // Devengados / Deducciones lado a lado
        {
          columns: [
            {
              width: '*',
              table: { widths: ['*', 'auto'], body: devengados },
              layout: 'lightHorizontalLines',
            },
            { width: 20, text: '' },
            {
              width: '*',
              table: { widths: ['*', 'auto'], body: deducciones },
              layout: 'lightHorizontalLines',
            },
          ],
        },
        // Neto
        {
          margin: [0, 16, 0, 0],
          table: {
            widths: ['*', 160],
            body: [
              [
                { text: 'NETO A PAGAR', bold: true, fontSize: 13, color: '#fff', fillColor: AZUL, margin: [8, 6, 8, 6] },
                { text: this.cop(n.netoPagar), bold: true, fontSize: 13, color: '#fff', fillColor: AZUL, alignment: 'right', margin: [8, 6, 8, 6] },
              ],
            ],
          },
          layout: 'noBorders',
        },
        {
          text: 'Aportes patronales y provisiones (no afectan el neto del empleado): '
            + `Salud ${this.cop(n.aporteSalud)} · Pensión ${this.cop(n.aportePension)} · ARL ${this.cop(n.aporteArl)} · `
            + `Caja ${this.cop(n.aporteCaja)} · ICBF ${this.cop(n.aporteIcbf)} · SENA ${this.cop(n.aporteSena)} · `
            + `Cesantías ${this.cop(n.provisionCesantias)} · Prima ${this.cop(n.provisionPrima)} · Vacaciones ${this.cop(n.provisionVacaciones)}`,
          fontSize: 7,
          color: GRIS,
          margin: [0, 14, 0, 0],
        },
      ],
      styles: { th: { bold: true, fontSize: 9, color: AZUL } },
    };

    pdfMake.createPdf(doc).download(`Desprendible-${n.empleadoNombre}-${n.periodoFechaFin}.pdf`);
  }

  // ─────────────────────────────────────────────────────────────
  //  Comprobante de prestación social
  // ─────────────────────────────────────────────────────────────
  private tipoPrestacion(t: string): string {
    const m: Record<string, string> = {
      PRIMA: 'Prima de servicios',
      VACACIONES: 'Vacaciones',
      CESANTIAS: 'Cesantías',
      INTERESES_CESANTIAS: 'Intereses de cesantías',
      INDEMNIZACION: 'Indemnización',
    };
    return m[t] ?? t;
  }

  async prestacion(p: PrestacionModel, empresa: EmpresaConfig): Promise<void> {
    const logo = await this.logoDataUrl(empresa.logoUrl);
    const fila = (label: string, valor: string): any => [
      { text: label, fontSize: 9, color: GRIS },
      { text: valor, fontSize: 9, color: OSCURO, alignment: 'right' },
    ];

    const doc: any = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        this.encabezado(empresa, logo),
        this.linea(),
        { text: 'Comprobante de prestación social', fontSize: 15, bold: true, color: OSCURO },
        {
          text: `${this.tipoPrestacion(p.tipo)}  ·  ${p.estado}`,
          fontSize: 9, color: GRIS, margin: [0, 2, 0, 14],
        },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              fila('Empleado', p.empleadoNombre),
              fila('Documento', p.empleadoDocumento),
              fila('Tipo', this.tipoPrestacion(p.tipo)),
              fila('Período', `${this.fecha(p.fechaDesde)} → ${this.fecha(p.fechaHasta)}`),
              fila('Días', String(p.dias)),
              fila('Base salarial', this.cop(p.baseSalarial)),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          margin: [0, 16, 0, 0],
          table: {
            widths: ['*', 180],
            body: [
              [
                { text: 'VALOR A PAGAR', bold: true, fontSize: 13, color: '#fff', fillColor: AZUL, margin: [8, 6, 8, 6] },
                { text: this.cop(p.valor), bold: true, fontSize: 13, color: '#fff', fillColor: AZUL, alignment: 'right', margin: [8, 6, 8, 6] },
              ],
            ],
          },
          layout: 'noBorders',
        },
        p.observacion
          ? { text: p.observacion, fontSize: 8, color: GRIS, margin: [0, 12, 0, 0] }
          : {},
      ],
    };

    pdfMake.createPdf(doc).download(`Prestacion-${this.tipoPrestacion(p.tipo)}-${p.empleadoNombre}.pdf`);
  }
}
