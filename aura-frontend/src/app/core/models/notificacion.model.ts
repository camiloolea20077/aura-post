export type TipoNotificacion =
  | 'LOTES_VENCIDOS'
  | 'LOTES_POR_VENCER'
  | 'STOCK_BAJO'
  | 'PROMESAS_INCUMPLIDAS'
  | 'PROMESAS_HOY'
  | 'SOLICITUDES_CREDITO'
  | 'FACTURAS_VENCIDAS'
  | 'FACTURAS_POR_VENCER'
  | 'ACUERDOS_INCUMPLIDOS'
  | 'CUOTAS_POR_VENCER';

export interface NotificacionModel {
  tipo: TipoNotificacion;
  severidad: 'danger' | 'warn' | 'info';
  titulo: string;
  mensaje: string;
  cantidad: number;
  /** Plata en juego (costo de mercancía o saldo por cobrar), si aplica. */
  valor: number | null;
  ruta: string;
  accion: string;
}
