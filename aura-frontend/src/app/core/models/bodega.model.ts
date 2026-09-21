/**
 * Bodegas (V172). El saldo vive en la bodega, no en la sucursal: la sucursal
 * factura y tiene caja, la bodega guarda. El stock de una sucursal es la suma
 * de sus bodegas.
 */

/** Para combos. */
export interface BodegaDto {
  id: number;
  codigo: string | null;
  nombre: string;
  sucursalId: number;
  sucursalNombre: string;
  esPrincipal: boolean;
  permiteVenta: boolean;
}

export interface BodegaTableModel {
  id: number;
  codigo: string | null;
  nombre: string;
  sucursalId: number;
  sucursalNombre: string;
  responsableUsuarioId: number | null;
  responsableNombre: string | null;
  esPrincipal: boolean;
  permiteVenta: boolean;
  ubicacion: string | null;
  observacion: string | null;
  activa: boolean;
  /** Referencias con saldo distinto de cero. */
  referencias: number;
  /** Inventario al costo: es de lo que responde el responsable. */
  valorInventario: number;
  totalRows: number;
}

export interface CreateBodegaDto {
  sucursalId: number;
  codigo?: string | null;
  nombre: string;
  responsableUsuarioId?: number | null;
  esPrincipal?: boolean;
  permiteVenta?: boolean;
  ubicacion?: string | null;
  observacion?: string | null;
}

export interface UpdateBodegaDto extends Omit<CreateBodegaDto, 'sucursalId'> {
  activa?: boolean;
}
