import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { ActaCierreModel, ChequeoModel } from '../models/cierre-mes.model';
import { CierreMesService } from './cierre-mes.service';
import { EmpresaConfig, EmpresaService } from './empresa.service';
import {
  PDF_COLOR,
  pdfBloqueDatos,
  pdfCajaDocumento,
  pdfEmpresa,
  pdfLayoutZebra,
  pdfTablaTotales,
  pdfTd,
  pdfTh,
  pdfTituloSeccion,
} from '../../shared/utils/pdf-estilo';

/**
 * Acta de cierre de mes: lo que el contador archiva. Período, quién cerró y
 * cuándo, el resultado de cada chequeo (la foto tomada al cerrar), el resultado
 * del mes, el balance de comprobación y el asiento de cierre.
 */
@Injectable({ providedIn: 'root' })
export class ActaCierrePdfService {
  private readonly cierreService = inject(CierreMesService);
  private readonly empresaService = inject(EmpresaService);

  async ver(periodoId: number): Promise<void> {
    const { doc } = await this.preparar(periodoId);
    await pdfMake.createPdf(doc).open();
  }

  async descargar(periodoId: number): Promise<void> {
    const { doc, nombre } = await this.preparar(periodoId);
    await pdfMake.createPdf(doc).download(`${nombre}.pdf`);
  }

  private async preparar(periodoId: number): Promise<{ doc: any; nombre: string }> {
    const [actaRes, empRes] = await Promise.all([
      lastValueFrom(this.cierreService.acta(periodoId)),
      lastValueFrom(this.empresaService.getConfig()).catch(() => null),
    ]);
    const acta = actaRes?.data;
    if (!acta) throw new Error('No se pudo armar el acta');
    const emp: EmpresaConfig = empRes?.data ?? {};
    const logo = emp.logoUrl ? await this.aBase64(emp.logoUrl) : null;
    return {
      doc: this.documento(acta, logo),
      nombre: ('Acta-cierre-' + acta.periodo).replace(/[^A-Za-z0-9_-]/g, '_'),
    };
  }

  private documento(a: ActaCierreModel, logo: string | null): any {
    const cerrado = a.estado === 'CERRADO';
    const encabezado = {
      columns: [
        { width: '*', ...pdfEmpresa(logo, a.empresaNombre ?? '', a.empresaNit ? `NIT ${a.empresaNit}` : null, []) },
        {
          width: 190,
          ...pdfCajaDocumento('ACTA DE CIERRE CONTABLE', a.periodo, [
            ['Estado', cerrado ? 'Cerrado' : 'Abierto (borrador)'],
            ['Fecha de cierre', a.fechaCierre ?? '—'],
          ]),
        },
      ],
      columnGap: 10,
    };

    const datos = {
      margin: [0, 10, 0, 0],
      ...pdfBloqueDatos(
        [
          ['Período', `${a.periodo} (${a.chequeo.desde} a ${a.chequeo.hasta})`],
          ['Cerró', a.cerradoPor ?? (cerrado ? '—' : 'Sin cerrar')],
          ['Reaperturas', String(a.reaperturas ?? 0)],
          [
            'Chequeo',
            a.chequeoGuardado
              ? `Foto tomada al cerrar (${this.fechaHora(a.chequeo.generadoEn)})`
              : `Calculado al imprimir (${this.fechaHora(a.chequeo.generadoEn)})`,
          ],
          ['Observaciones', a.observaciones],
        ],
        80,
      ),
    };

    const chequeos = [
      pdfTituloSeccion(
        `LISTA DE CHEQUEO · ${a.chequeo.bloqueos} bloqueo(s) · ${a.chequeo.advertencias} advertencia(s)`,
      ),
      {
        table: {
          headerRows: 1,
          widths: [64, 150, '*'],
          body: [
            [pdfTh('Resultado'), pdfTh('Chequeo'), pdfTh('Detalle')],
            ...a.chequeo.chequeos.map((c) => [
              pdfTd(this.estadoTexto(c.estado), 'left', { bold: true, color: this.estadoColor(c.estado) }),
              pdfTd(c.titulo),
              pdfTd(this.detalleChequeo(c)),
            ]),
          ],
        },
        layout: pdfLayoutZebra(1),
      },
    ];

    const resultado = {
      columns: [
        { width: '*', text: '' },
        {
          width: 230,
          ...pdfTablaTotales(
            [
              ['Ingresos', this.cop(a.ingresos)],
              ['Costos', this.cop(a.costos)],
              ['Gastos', this.cop(a.gastos)],
            ],
            [a.utilidad >= 0 ? 'Utilidad del mes' : 'Pérdida del mes', this.cop(a.utilidad)],
          ),
        },
      ],
      margin: [0, 8, 0, 0],
    };

    const balance = [
      pdfTituloSeccion('BALANCE DE COMPROBACIÓN DEL MES'),
      {
        table: {
          headerRows: 1,
          widths: [50, '*', 70, 66, 66, 70],
          body: [
            [
              pdfTh('Cuenta'),
              pdfTh('Nombre'),
              pdfTh('Saldo anterior', 'right'),
              pdfTh('Débitos', 'right'),
              pdfTh('Créditos', 'right'),
              pdfTh('Saldo final', 'right'),
            ],
            ...a.balance.map((l) => [
              pdfTd(l.codigo),
              pdfTd(l.nombre),
              pdfTd(this.cop(l.saldoAnterior), 'right'),
              pdfTd(this.cop(l.debitos), 'right'),
              pdfTd(this.cop(l.creditos), 'right'),
              pdfTd(this.cop(l.saldoFinal), 'right'),
            ]),
            [
              pdfTd(''),
              pdfTd('Totales', 'left', { bold: true }),
              pdfTd(''),
              pdfTd(this.cop(this.suma(a.balance.map((l) => l.debitos))), 'right', { bold: true }),
              pdfTd(this.cop(this.suma(a.balance.map((l) => l.creditos))), 'right', { bold: true }),
              pdfTd(''),
            ],
          ],
        },
        layout: pdfLayoutZebra(1),
      },
    ];

    const asiento = a.asientoCierre.length
      ? [
          pdfTituloSeccion(`ASIENTO DE CIERRE ${a.asientoCierreNumero ?? ''}`),
          {
            table: {
              headerRows: 1,
              widths: [60, '*', 80, 80],
              body: [
                [pdfTh('Cuenta'), pdfTh('Nombre'), pdfTh('Débito', 'right'), pdfTh('Crédito', 'right')],
                ...a.asientoCierre.map((l) => [
                  pdfTd(l.codigo),
                  pdfTd(l.nombre),
                  pdfTd(l.debito ? this.cop(l.debito) : '', 'right'),
                  pdfTd(l.credito ? this.cop(l.credito) : '', 'right'),
                ]),
              ],
            },
            layout: pdfLayoutZebra(1),
          },
        ]
      : [];

    const firma = (t: string) => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.7, lineColor: PDF_COLOR.texto }], margin: [0, 34, 0, 3] },
        { text: t, fontSize: 8, bold: true },
      ],
    });

    return {
      info: { title: `Acta de cierre ${a.periodo}` },
      pageSize: 'LETTER',
      pageMargins: [28, 26, 28, 40],
      defaultStyle: { fontSize: 8, color: PDF_COLOR.texto },
      watermark: cerrado ? undefined : { text: 'BORRADOR', color: '#64748b', opacity: 0.08, bold: true },
      content: [
        encabezado,
        datos,
        ...chequeos,
        resultado,
        ...balance,
        ...asiento,
        {
          columns: [firma('Contador'), firma('Representante legal')],
          columnGap: 40,
          margin: [0, 24, 0, 0],
          unbreakable: true,
        },
      ],
      footer: (page: number, pages: number) => ({
        columns: [
          { text: 'AURA NUBE — Software de gestión empresarial', fontSize: 7, color: PDF_COLOR.gris },
          { text: `Acta de cierre ${a.periodo} · página ${page} de ${pages}`, alignment: 'right', fontSize: 7, color: PDF_COLOR.gris },
        ],
        margin: [28, 10, 28, 0],
      }),
    };
  }

  private detalleChequeo(c: ChequeoModel): string {
    let t = c.detalle ?? '';
    if (c.diferencia != null && c.valorAuxiliar != null) {
      t += ` Módulo ${this.cop(c.valorAuxiliar)} · mayor ${this.cop(c.valorMayor)} · diferencia ${this.cop(c.diferencia)}.`;
    }
    if (c.ejemplos?.length) t += ' ' + c.ejemplos.slice(0, 5).join('; ');
    return t;
  }

  private estadoTexto(e: string): string {
    return e === 'OK' ? 'OK' : e === 'BLOQUEA' ? 'Bloquea' : e === 'ADVERTENCIA' ? 'Advertencia' : 'No aplica';
  }

  private estadoColor(e: string): string {
    return e === 'OK' ? '#047857' : e === 'BLOQUEA' ? PDF_COLOR.rojo : e === 'ADVERTENCIA' ? '#b45309' : PDF_COLOR.gris;
  }

  private suma(v: number[]): number {
    return v.reduce((a, b) => a + (b ?? 0), 0);
  }

  private fechaHora(v: string | null | undefined): string {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleString('es-CO');
  }

  private cop(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }

  private async aBase64(url: string): Promise<string | null> {
    try {
      const blob = await (await fetch(url)).blob();
      return await new Promise((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.onerror = () => resolve(null);
        r.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}
