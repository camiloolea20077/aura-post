/**
 * Qué entró a las cajas sin ser del turno.
 *
 * No es una bandeja de pendientes: nada de esto está a medio clasificar — el
 * origen es obligatorio al registrar y el freno bloquea lo que no debe pasar.
 * Es supervisión: qué se autorizó, quién lo autorizó y por qué.
 */

export type TipoHallazgo =
  /** Factura vieja que entró a la caja porque alguien con rol la autorizó. */
  | 'DOCUMENTO_AUTORIZADO'
  /** El pago salió de la caja pero el documento es de otro día. */
  | 'PAGO_DE_OTRA_FECHA'
  /** Nadie eligió la caja: el sistema la dedujo por ser la única abierta. */
  | 'CAJA_INFERIDA'
  /** Corrección hecha sobre un arqueo ya cerrado. */
  | 'AJUSTE_CIERRE'
  /** Se declaró que la plata ya había salido del cajón otro día. */
  | 'SALIDA_CAJA_OTRO_DIA'
  /** Lo mismo al revés: un recaudo de cartera que entró al cajón otro día. */
  | 'INGRESO_CAJA_OTRO_DIA';

export interface MovimientoRetroactivoModel {
  tipoHallazgo: TipoHallazgo;
  referenciaId: number;
  fecha: string;
  fechaDocumento: string | null;
  diasAtras: number | null;
  concepto: string | null;
  monto: number;
  tipo: 'INGRESO' | 'EGRESO' | null;
  turnoCajaId: number | null;
  cajaNombre: string | null;
  usuarioNombre: string | null;
  autorizadoPorNombre: string | null;
  motivo: string | null;
}

export interface SupervisionRetroactivaModel {
  movimientos: MovimientoRetroactivoModel[];

  cantidadAutorizados: number;
  montoAutorizados: number;
  cantidadOtrasFechas: number;
  montoOtrasFechas: number;
  cantidadCajaInferida: number;
  montoCajaInferida: number;
  cantidadAjustes: number;
  montoAjustes: number;
  cantidadSalidaOtroDia: number;
  montoSalidaOtroDia: number;
  cantidadIngresoOtroDia: number;
  montoIngresoOtroDia: number;
}

/**
 * Cada hallazgo con lo que significa y qué tan en serio tomarlo.
 *
 * La severidad no es decorativa: un documento autorizado a mano merece que
 * alguien lo lea, mientras que un pago dentro de la ventana de gracia es
 * operación normal que solo se lista para poder rastrearla.
 */
export const HALLAZGOS: Record<
  TipoHallazgo,
  { label: string; hint: string; severity: 'warn' | 'info' | 'secondary' }
> = {
  DOCUMENTO_AUTORIZADO: {
    label: 'Autorizado a mano',
    hint: 'Factura vieja que entró a la caja con autorización expresa. Vale la pena leer el motivo.',
    severity: 'warn',
  },
  AJUSTE_CIERRE: {
    label: 'Corrección de cierre',
    hint: 'Se corrigió un arqueo ya cerrado. El cierre original se conserva.',
    severity: 'warn',
  },
  CAJA_INFERIDA: {
    label: 'Caja deducida',
    hint: 'Nadie eligió la caja: era la única abierta y el sistema la dedujo.',
    severity: 'info',
  },
  SALIDA_CAJA_OTRO_DIA: {
    label: 'Salió otro día',
    hint: 'Se declaró que la plata ya había salido del cajón antes. No pasa por el freno porque no descuadra ningún arqueo — este es el único sitio donde queda visible.',
    severity: 'info',
  },
  INGRESO_CAJA_OTRO_DIA: {
    label: 'Entró otro día',
    hint: 'Recaudo de cartera que el cliente trajo antes: la plata ya estaba en el cajón cuando esa caja se contó y cerró. Tampoco descuadra ningún arqueo.',
    severity: 'info',
  },
  PAGO_DE_OTRA_FECHA: {
    label: 'Documento de otro día',
    hint: 'Dentro de la ventana de gracia. Operación normal, listada para poder rastrearla.',
    severity: 'secondary',
  },
};
