import { Injectable } from '@angular/core';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { EmpresaConfig } from './empresa.service';
import { ConfigServicioTecnico, OrdenServicioDetalle } from '../models/servicio-tecnico.model';
import { PdfAdjunto, pdfABase64 } from '../../shared/utils/pdf-adjunto';
import { imagenDataUrl } from '../../shared/utils/imagen-data-url';
import {
  PDF_COLOR,
  pdfBloqueDatos,
  pdfCajaDocumento,
  pdfEmpresa,
  pdfLayoutZebra,
  pdfRecuadro,
  pdfTablaTotales,
  pdfTd,
  pdfTh,
  pdfTituloSeccion,
} from '../../shared/utils/pdf-estilo';

const ESTADO: Record<string, string> = {
  RECIBIDO: 'Recibido',
  EN_DIAGNOSTICO: 'En diagnóstico',
  ESPERANDO_APROBACION: 'Esperando aprobación',
  ESPERANDO_REPUESTO: 'Esperando repuesto',
  EN_REPARACION: 'En reparación',
  LISTO: 'Listo para entregar',
  NO_REPARADO: 'No reparado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const TIPO_ITEM: Record<string, string> = { REPUESTO: 'Repuesto', MANO_OBRA: 'Mano de obra', OTRO: 'Otro' };

/**
 * PDF de la orden de servicio técnico y etiqueta para el equipo. El QR lleva al
 * enlace público donde el cliente consulta el estado.
 */
@Injectable({ providedIn: 'root' })
export class ServicioTecnicoPdfService {
  /** Enlace que abre el cliente (también va en el QR). */
  enlacePublico(o: OrdenServicioDetalle): string | null {
    return o.tokenPublico ? `${window.location.origin}/consulta-servicio/${o.tokenPublico}` : null;
  }

  async descargar(o: OrdenServicioDetalle, empresa: EmpresaConfig, config: ConfigServicioTecnico | null, fotos: string[]): Promise<void> {
    pdfMake.createPdf(await this.documento(o, empresa, config, fotos)).download(`Orden-${o.codigo}.pdf`);
  }

  async adjunto(o: OrdenServicioDetalle, empresa: EmpresaConfig, config: ConfigServicioTecnico | null, fotos: string[]): Promise<PdfAdjunto> {
    return { nombre: `Orden-${o.codigo}.pdf`, base64: await pdfABase64(await this.documento(o, empresa, config, fotos)) };
  }

  /** Etiqueta de 62 × 40 mm para pegar al equipo o a la bolsa. */
  etiqueta(o: OrdenServicioDetalle, empresa: EmpresaConfig): void {
    const mm = (v: number) => (v * 72) / 25.4;
    const enlace = this.enlacePublico(o);
    const doc: any = {
      pageSize: { width: mm(62), height: mm(40) },
      pageMargins: [mm(3), mm(3), mm(3), mm(2)],
      defaultStyle: { fontSize: 7, color: PDF_COLOR.texto },
      content: [
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: empresa.nombreComercial || empresa.razonSocial || '', fontSize: 6, color: PDF_COLOR.gris },
                { text: o.codigo, bold: true, fontSize: 14 },
                { text: o.clienteNombre, bold: true, margin: [0, 1, 0, 0] },
                { text: o.contactoTelefono || o.clienteTelefono || '' },
                { text: `${o.equipo?.marca ?? ''} ${o.equipo?.modelo ?? ''}`.trim(), margin: [0, 1, 0, 0] },
                { text: o.equipo?.imei ? `IMEI ${o.equipo.imei}` : o.equipo?.color ?? '', fontSize: 6 },
                { text: `Recibido ${this.fecha(o.fechaRecibido)}`, fontSize: 6, color: PDF_COLOR.gris },
              ],
            },
            enlace ? { width: mm(20), qr: enlace, fit: mm(20) } : { width: 0, text: '' },
          ],
          columnGap: mm(2),
        },
      ],
    };
    pdfMake.createPdf(doc).open();
  }

  private async documento(o: OrdenServicioDetalle, empresa: EmpresaConfig, config: ConfigServicioTecnico | null, fotos: string[]): Promise<any> {
    const logo = await imagenDataUrl(empresa.logoUrl);
    const nombre = empresa.razonSocial || empresa.nombreComercial || 'Empresa';
    const nit = empresa.nit ? `NIT ${empresa.nit}${empresa.dv ? '-' + empresa.dv : ''}` : null;
    const e = o.equipo;
    const enlace = this.enlacePublico(o);

    const items = o.items.length
      ? {
          table: {
            headerRows: 1,
            widths: [62, '*', 34, 70, 70],
            body: [
              [pdfTh('Tipo'), pdfTh('Descripción'), pdfTh('Cant.', 'right'), pdfTh('Valor unit.', 'right'), pdfTh('Total', 'right')],
              ...o.items.map((i) => [
                pdfTd(TIPO_ITEM[i.tipo] ?? i.tipo),
                pdfTd(i.descripcion),
                pdfTd(this.num(i.cantidad), 'right'),
                pdfTd(this.cop(i.valorUnitario), 'right'),
                pdfTd(this.cop(i.total), 'right'),
              ]),
            ],
          },
          layout: pdfLayoutZebra(1),
        }
      : { text: 'Sin repuestos ni mano de obra registrados todavía.', fontSize: 7.6, color: PDF_COLOR.gris, margin: [0, 4, 0, 0] };

    const abonos = o.abonos.filter((a) => a.estado === 'ACTIVO');
    const fotosPdf = fotos.slice(0, 4);

    return {
      pageSize: 'LETTER',
      pageMargins: [36, 36, 36, 40],
      defaultStyle: { fontSize: 8, color: PDF_COLOR.texto },
      footer: (pag: number, total: number) => ({
        text: `${o.codigo} · página ${pag} de ${total}`,
        alignment: 'center',
        fontSize: 7,
        color: PDF_COLOR.gris,
      }),
      content: [
        {
          columns: [
            { width: '*', stack: [pdfEmpresa(logo, nombre, nit, [empresa.direccion, empresa.municipio, [empresa.telefono, empresa.correo].filter(Boolean).join(' · ')])] },
            {
              width: 190,
              stack: [
                pdfCajaDocumento('ORDEN DE SERVICIO', o.codigo, [
                  ['Recibido', this.fechaHora(o.fechaRecibido)],
                  ['Estado', ESTADO[o.estado] ?? o.estado],
                  ['Entrega estimada', o.fechaEstimada ? this.fecha(o.fechaEstimada) : 'Por definir'],
                ]),
              ],
            },
          ],
          columnGap: 16,
          margin: [0, 0, 0, 8],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                pdfTituloSeccion('CLIENTE'),
                pdfBloqueDatos([
                  ['Nombre', o.clienteNombre],
                  ['Documento', o.clienteDocumento],
                  ['Teléfono', o.contactoTelefono || o.clienteTelefono],
                  ['Correo', o.contactoEmail || o.clienteEmail],
                ]),
              ],
            },
            {
              width: '*',
              stack: [
                pdfTituloSeccion('EQUIPO'),
                pdfBloqueDatos([
                  ['Equipo', e ? `${e.marca} ${e.modelo}` : null],
                  ['IMEI', [e?.imei, e?.imei2].filter(Boolean).join(' / ') || null],
                  ['Serial', e?.serial],
                  ['Color', e?.color],
                  ['Enciende', e?.enciende == null ? 'No se sabe' : e.enciende ? 'Sí' : 'No'],
                ]),
              ],
            },
          ],
          columnGap: 12,
        },
        {
          columns: [
            { width: '*', stack: [pdfRecuadro('ACCESORIOS RECIBIDOS', [{ text: e?.accesorios.length ? e.accesorios.join(', ') : 'Ninguno', fontSize: 7.6 }])] },
            { width: '*', stack: [pdfRecuadro('ESTADO FÍSICO AL RECIBIR', [{ text: e?.estadoFisico.length ? e.estadoFisico.join(', ') : 'Sin daños anotados', fontSize: 7.6 }])] },
          ],
          columnGap: 12,
          margin: [0, 6, 0, 0],
        },
        { ...pdfRecuadro('PROBLEMAS REPORTADOS POR EL CLIENTE', [{ text: e?.problemasReportados ?? '—', fontSize: 7.6 }]), margin: [0, 6, 0, 0] },
        o.diagnostico ? { ...pdfRecuadro('DIAGNÓSTICO TÉCNICO', [{ text: o.diagnostico, fontSize: 7.6 }]), margin: [0, 6, 0, 0] } : {},
        o.trabajoRealizado ? { ...pdfRecuadro('TRABAJO REALIZADO', [{ text: o.trabajoRealizado, fontSize: 7.6 }]), margin: [0, 6, 0, 0] } : {},
        pdfTituloSeccion('REPUESTOS Y MANO DE OBRA'),
        items,
        {
          columns: [
            {
              width: '*',
              stack: [
                abonos.length
                  ? pdfRecuadro(
                      'ABONOS',
                      abonos.map((a) => ({
                        text: `${this.fecha(a.createdAt)} · ${a.metodoPago} · ${this.cop(a.monto)}${a.reciboNumero ? ' · ' + a.reciboNumero : ''}`,
                        fontSize: 7.4,
                      })),
                    )
                  : {},
                o.garantiaDias > 0
                  ? { text: `Garantía: ${o.garantiaDias} días${o.garantiaHasta ? ' (hasta ' + this.fecha(o.garantiaHasta) + ')' : ' desde la entrega'}.`, fontSize: 7.4, margin: [0, 6, 0, 0] }
                  : {},
                enlace
                  ? {
                      columns: [
                        { qr: enlace, fit: 62, width: 66 },
                        { text: 'Consulte el estado de su equipo escaneando este código o en:\n' + enlace, fontSize: 6.8, color: PDF_COLOR.gris, margin: [4, 8, 0, 0] },
                      ],
                      margin: [0, 8, 0, 0],
                    }
                  : {},
              ],
            },
            {
              width: 200,
              stack: [
                pdfTablaTotales(
                  [
                    ['Repuestos', this.cop(o.totalRepuestos)],
                    ['Mano de obra', this.cop(o.totalManoObra)],
                    ['Total del servicio', this.cop(o.total)],
                    ['Abonado', this.cop(o.totalAbonado)],
                  ],
                  ['SALDO', this.cop(o.saldoCartera ?? o.saldo)],
                ),
              ],
            },
          ],
          columnGap: 14,
          margin: [0, 8, 0, 0],
        },
        config?.condiciones
          ? { ...pdfRecuadro('CONDICIONES DEL SERVICIO', [{ text: config.condiciones, fontSize: 6.8 }]), margin: [0, 10, 0, 0] }
          : {},
        {
          columns: [
            { text: '_______________________________\nFirma del cliente', alignment: 'center', fontSize: 7.4, margin: [0, 34, 0, 0] },
            { text: '_______________________________\nRecibió (taller)', alignment: 'center', fontSize: 7.4, margin: [0, 34, 0, 0] },
          ],
        },
        fotosPdf.length
          ? {
              stack: [
                pdfTituloSeccion('FOTOS DEL EQUIPO'),
                { columns: fotosPdf.map((f) => ({ image: f, fit: [122, 122], width: '*' })), columnGap: 8, margin: [0, 6, 0, 0] },
              ],
              unbreakable: true,
              margin: [0, 10, 0, 0],
            }
          : {},
      ],
    };
  }

  private cop(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }

  private num(v: number): string {
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(v ?? 0);
  }

  private fecha(f: string): string {
    return new Date(f.length === 10 ? f + 'T00:00:00' : f).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private fechaHora(f: string): string {
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
