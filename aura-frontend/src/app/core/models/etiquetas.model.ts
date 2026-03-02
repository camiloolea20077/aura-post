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
  guardado: boolean;
}
