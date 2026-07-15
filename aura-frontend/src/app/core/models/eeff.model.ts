// E10 · Estados financieros NIIF: cambios en el patrimonio y flujo de
// efectivo por el método indirecto.

export interface CambioPatrimonioLinea {
  codigo: string;
  nombre: string;
  saldoInicial: number;
  aumentos: number;
  disminuciones: number;
  saldoFinal: number;
}

export interface FlujoDetalleLinea {
  grupo: string;
  flujo: number;
}

export interface FlujoEfectivoModel {
  desde: string;
  hasta: string;
  utilidadPeriodo: number;
  depreciacion: number;
  deterioroYProvisiones: number;
  variacionesCapitalTrabajo: FlujoDetalleLinea[];
  flujoOperacion: number;
  detalleInversion: FlujoDetalleLinea[];
  flujoInversion: number;
  detalleFinanciacion: FlujoDetalleLinea[];
  flujoFinanciacion: number;
  flujoNeto: number;
  efectivoInicial: number;
  efectivoFinal: number;
  deltaEfectivoLibros: number;
  cuadra: boolean;
}
