// Tableros de inicio por línea de uso (docs/PLAN_PERFIL_EMPRESA.md del back).
import { ConfiguracionEmpresaModel } from './platform.model';

export type { ConfiguracionEmpresaModel };

export interface ResumenFinancieroModel {
  /** Saldo de las cuentas 11 (caja y bancos) en el mayor. */
  disponible: number;
  cxcSaldo: number;
  cxcVencido: number;
  cxcVencidas: number;
  cxpSaldo: number;
  cxpVencido: number;
  cxpVencidas: number;
}

export interface TableroComercialModel {
  facturasMes: number;
  facturadoMes: number;
  comprasMes: number;
  compradoMes: number;
  cotizacionesAbiertas: number;
  cotizadoAbierto: number;
  pedidosAbiertos: number;
  productosStockBajo: number;
  financiero: ResumenFinancieroModel;
}

export interface ChequeoModel {
  codigo: string;
  titulo: string;
  ok: boolean;
  detalle: string | null;
  /** Pantalla donde se resuelve; null si no aplica. */
  ruta: string | null;
}

export interface GrupoChequeoModel {
  linea: string;
  nombre: string;
  chequeos: ChequeoModel[];
}

export interface PuestaEnMarchaModel {
  grupos: GrupoChequeoModel[];
  pendientes: number;
  completa: boolean;
}
