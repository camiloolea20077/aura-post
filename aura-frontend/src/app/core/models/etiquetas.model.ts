export interface ProductoSinCodigo {
  id: number;
  nombre: string;
  sku: string | null;
  precio: number;
  categoriaId: number | null;
  categoriaNombre: string | null;
  codigoBarras: string | null;
  // UI
  seleccionado: boolean;
  copias: number;
  codigoGenerado: string | null;
  generando: boolean;
  /** El producto tiene código de barras guardado en BD. */
  guardado: boolean;
  /** Recién generado en esta sesión: sólo sirve para resaltar la fila. */
  recienGenerado: boolean;
}
