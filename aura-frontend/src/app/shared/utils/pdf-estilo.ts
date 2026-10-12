/**
 * Estilo común de los PDF de documentos (venta, facturación, comprobantes…),
 * con la estructura de la representación gráfica de la factura electrónica:
 * caja del documento arriba a la derecha, bloques de datos con etiqueta, tabla
 * de ítems con filas alternas, observaciones y totales al pie, detalle de pago.
 *
 * Colores: encabezados en gris azulado claro (#e1e8ef) y filas alternas blanco /
 * #dfe2e7. El texto va oscuro siempre: sobre fondos claros el blanco no se lee.
 */
export const PDF_COLOR = {
  cabecera: '#e1e8ef',
  alterna: '#dfe2e7',
  texto: '#1e293b',
  gris: '#64748b',
  borde: '#c5ced8',
  rojo: '#b91c1c',
} as const;

type Alineacion = 'left' | 'right' | 'center';

/** Celda de encabezado de tabla. */
export const pdfTh = (text: string, alignment: Alineacion = 'left'): any => ({
  text,
  bold: true,
  fontSize: 7.6,
  color: PDF_COLOR.texto,
  alignment,
});

/** Celda normal de tabla. */
export const pdfTd = (text: string | number | null | undefined, alignment: Alineacion = 'left', extra: any = {}): any => ({
  text: text == null || text === '' ? '—' : String(text),
  fontSize: 7.6,
  color: PDF_COLOR.texto,
  alignment,
  ...extra,
});

/**
 * Tabla con encabezado (#e1e8ef) y filas alternas blanco / #dfe2e7.
 * @param filasEncabezado cuántas filas son encabezado (0 = ninguna)
 */
export const pdfLayoutZebra = (filasEncabezado = 1): any => ({
  fillColor: (row: number) => {
    if (row < filasEncabezado) return PDF_COLOR.cabecera;
    return (row - filasEncabezado) % 2 === 0 ? null : PDF_COLOR.alterna;
  },
  hLineColor: () => PDF_COLOR.borde,
  vLineColor: () => PDF_COLOR.borde,
  hLineWidth: () => 0.4,
  vLineWidth: () => 0.4,
  paddingTop: () => 2.5,
  paddingBottom: () => 2.5,
  paddingLeft: () => 4,
  paddingRight: () => 4,
});

/**
 * Bloque "Etiqueta: valor" en filas alternas, como el de los datos del cliente
 * (CC/NIT, Cliente, País, Municipio, Dirección, Email).
 */
export const pdfBloqueDatos = (pares: [string, string | null | undefined][], anchoEtiqueta = 68): any => ({
  table: {
    widths: [anchoEtiqueta, '*'],
    body: pares.map(([e, v]) => [
      { text: `${e}:`, bold: true, fontSize: 7.6, color: PDF_COLOR.texto },
      { text: v || '—', fontSize: 7.6, color: PDF_COLOR.texto },
    ]),
  },
  layout: pdfLayoutZebra(0),
});

/** Caja del documento (arriba a la derecha): tipo, número y datos clave. */
export const pdfCajaDocumento = (titulo: string, numero: string, filas: [string, string][] = []): any => ({
  table: {
    widths: ['*'],
    body: [
      [{ text: titulo, bold: true, fontSize: 9, alignment: 'center', color: PDF_COLOR.texto, fillColor: PDF_COLOR.cabecera }],
      [{ text: numero, bold: true, fontSize: 13, alignment: 'center', color: PDF_COLOR.texto }],
      ...filas.map(([e, v]) => [
        { text: [{ text: `${e}: `, bold: true }, v || '—'], fontSize: 7.4, alignment: 'center', color: PDF_COLOR.texto },
      ]),
    ],
  },
  layout: {
    hLineColor: () => PDF_COLOR.borde,
    vLineColor: () => PDF_COLOR.borde,
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    paddingTop: () => 3,
    paddingBottom: () => 3,
  },
});

/** Título de sección a todo el ancho, sobre fondo #e1e8ef. */
export const pdfTituloSeccion = (texto: string): any => ({
  table: {
    widths: ['*'],
    body: [[{ text: texto, bold: true, fontSize: 7.8, color: PDF_COLOR.texto, margin: [0, 1, 0, 1] }]],
  },
  layout: {
    fillColor: () => PDF_COLOR.cabecera,
    hLineColor: () => PDF_COLOR.borde,
    vLineColor: () => PDF_COLOR.borde,
    hLineWidth: () => 0.4,
    vLineWidth: () => 0.4,
  },
  margin: [0, 6, 0, 0],
});

/** Totales al pie: filas alternas y el total final resaltado. */
export const pdfTablaTotales = (filas: [string, string][], total: [string, string]): any => ({
  table: {
    widths: ['*', 'auto'],
    body: [
      ...filas.map(([e, v]) => [
        { text: e, fontSize: 7.8, color: PDF_COLOR.texto },
        { text: v, fontSize: 7.8, alignment: 'right', color: PDF_COLOR.texto },
      ]),
      [
        { text: total[0], bold: true, fontSize: 10, color: PDF_COLOR.texto, fillColor: PDF_COLOR.cabecera },
        { text: total[1], bold: true, fontSize: 10, alignment: 'right', color: PDF_COLOR.texto, fillColor: PDF_COLOR.cabecera },
      ],
    ],
  },
  layout: pdfLayoutZebra(0),
});

/** Recuadro con título (observaciones, detalles de pago…). */
export const pdfRecuadro = (titulo: string, contenido: any[]): any => ({
  table: {
    widths: ['*'],
    body: [
      [{ text: titulo, bold: true, fontSize: 7.8, color: PDF_COLOR.texto, fillColor: PDF_COLOR.cabecera }],
      [{ stack: contenido.length ? contenido : [{ text: '—', fontSize: 7.6 }], margin: [0, 1, 0, 1] }],
    ],
  },
  layout: {
    hLineColor: () => PDF_COLOR.borde,
    vLineColor: () => PDF_COLOR.borde,
    hLineWidth: () => 0.4,
    vLineWidth: () => 0.4,
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 2.5,
    paddingBottom: () => 2.5,
  },
});

/** Encabezado de empresa: logo y datos a la izquierda. */
export const pdfEmpresa = (
  logo: string | null,
  nombre: string,
  nit: string | null,
  lineas: (string | null | undefined)[],
): any => ({
  stack: [
    logo ? { image: logo, fit: [130, 52], margin: [0, 0, 0, 4] } : {},
    { text: nombre.toUpperCase(), bold: true, fontSize: 10, color: PDF_COLOR.texto },
    nit ? { text: nit, fontSize: 7.8, color: PDF_COLOR.texto } : {},
    ...lineas.filter(Boolean).map((l) => ({ text: l as string, fontSize: 7.3, color: PDF_COLOR.gris })),
  ],
});
