/** Servicio técnico (docs/PLAN_SERVICIO_TECNICO.md del backend). */

export type EstadoOrdenServicio =
  | 'RECIBIDO'
  | 'EN_DIAGNOSTICO'
  | 'ESPERANDO_APROBACION'
  | 'ESPERANDO_REPUESTO'
  | 'EN_REPARACION'
  | 'LISTO'
  | 'NO_REPARADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type TipoEquipo = 'CELULAR' | 'TABLET' | 'PORTATIL' | 'RELOJ' | 'CONSOLA' | 'OTRO';
export type TipoItemServicio = 'REPUESTO' | 'MANO_OBRA' | 'OTRO';
export type PrioridadOrden = 'NORMAL' | 'URGENTE';
export type MomentoFoto = 'RECIBIDO' | 'REPARACION' | 'ENTREGA';

export interface EquipoServicio {
  tipo: TipoEquipo;
  marca: string;
  modelo: string;
  imei: string | null;
  imei2: string | null;
  serial: string | null;
  color: string | null;
  accesorios: string[];
  estadoFisico: string[];
  enciende: boolean | null;
  problemasReportados: string;
}

export interface GuardarOrdenServicio {
  clienteId: number | null;
  contactoTelefono: string | null;
  contactoEmail: string | null;
  tecnicoId: number | null;
  prioridad: PrioridadOrden;
  fechaEstimada: string | null;
  diagnostico: string | null;
  trabajoRealizado: string | null;
  observaciones: string | null;
  garantiaDias: number | null;
  equipo: EquipoServicio;
}

export interface GuardarItemServicio {
  tipo: TipoItemServicio;
  productoId: number | null;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
}

export interface OrdenServicioFila {
  id: number;
  codigo: string;
  clienteId: number;
  clienteNombre: string;
  clienteTelefono: string | null;
  equipoTipo: TipoEquipo | null;
  equipoMarca: string | null;
  equipoModelo: string | null;
  equipoImei: string | null;
  equipoColor: string | null;
  tecnicoId: number | null;
  tecnicoNombre: string | null;
  estado: EstadoOrdenServicio;
  prioridad: PrioridadOrden;
  fechaRecibido: string;
  fechaEstimada: string | null;
  total: number;
  totalAbonado: number;
  saldo: number;
  vencida: boolean;
  fotos: number;
}

export interface ItemServicio {
  id: number;
  tipo: TipoItemServicio;
  productoId: number | null;
  productoSku: string | null;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  total: number;
}

export interface FotoServicio {
  id: number;
  nombre: string;
  mime: string;
  tamanoBytes: number;
  momento: MomentoFoto;
  createdAt: string;
}

export interface HistorialServicio {
  id: number;
  tipo: 'ESTADO' | 'NOTA';
  estadoAnterior: EstadoOrdenServicio | null;
  estadoNuevo: EstadoOrdenServicio | null;
  nota: string | null;
  usuarioNombre: string | null;
  createdAt: string;
}

export interface OrdenServicioDetalle {
  id: number;
  codigo: string;
  numero: number;
  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string | null;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  contactoTelefono: string | null;
  contactoEmail: string | null;
  tecnicoId: number | null;
  tecnicoNombre: string | null;
  estado: EstadoOrdenServicio;
  prioridad: PrioridadOrden;
  fechaRecibido: string;
  fechaEstimada: string | null;
  fechaEntregado: string | null;
  diagnostico: string | null;
  trabajoRealizado: string | null;
  observaciones: string | null;
  garantiaDias: number;
  garantiaHasta: string | null;
  totalRepuestos: number;
  totalManoObra: number;
  total: number;
  totalAbonado: number;
  saldo: number;
  motivoCancelacion: string | null;
  vencida: boolean;
  editable: boolean;
  createdAt: string;
  equipo: EquipoServicio | null;
  items: ItemServicio[];
  fotos: FotoServicio[];
  historial: HistorialServicio[];
  estadosPermitidos: EstadoOrdenServicio[];
  abonos: AbonoServicio[];
  facturaVentaId: number | null;
  facturaNumero: string | null;
  facturaEstado: string | null;
  ventaId: number | null;
  /** Lo que queda por cobrar de la factura en cartera. */
  saldoCartera: number | null;
  tokenPublico: string | null;
  aprobadoClienteAt: string | null;
  anteriores: OrdenAnterior[];
}

export interface AbonoServicio {
  id: number;
  reciboCajaId: number;
  reciboNumero: string | null;
  monto: number;
  metodoPago: string;
  estado: 'ACTIVO' | 'ANULADO';
  usuarioNombre: string | null;
  createdAt: string;
}

export interface OrdenAnterior {
  id: number;
  codigo: string;
  estado: EstadoOrdenServicio;
  fechaRecibido: string;
  problemasReportados: string | null;
  trabajoRealizado: string | null;
}

/** Cómo entra el dinero (igual que un recibo de caja). */
export interface PagoServicio {
  monto: number | null;
  metodoPago: string;
  cuentaContableId: number | null;
  turnoCajaId: number | null;
  cajaOtroDia: boolean;
  referencia: string | null;
}

export interface EntregarServicio {
  facturar: boolean;
  tipoDocumento: 'FACTURA' | 'CUENTA_COBRO' | null;
  cobro: PagoServicio | null;
  nota: string | null;
}

export interface ConsultaServicioPublica {
  empresaNombre: string;
  empresaTelefono: string | null;
  empresaLogoUrl: string | null;
  codigo: string;
  clienteNombre: string | null;
  estado: EstadoOrdenServicio;
  equipoTipo: TipoEquipo | null;
  equipoMarca: string | null;
  equipoModelo: string | null;
  equipoColor: string | null;
  imeiFinal: string | null;
  problemasReportados: string | null;
  diagnostico: string | null;
  trabajoRealizado: string | null;
  fechaRecibido: string;
  fechaEstimada: string | null;
  fechaEntregado: string | null;
  total: number;
  totalAbonado: number;
  saldo: number;
  garantiaDias: number;
  aprobadoClienteAt: string | null;
  puedeAprobar: boolean;
  condiciones: string | null;
  items: { tipo: TipoItemServicio; descripcion: string; cantidad: number; total: number }[];
  pasos: { estado: EstadoOrdenServicio; fecha: string }[];
}

export interface IndicadoresServicio {
  abiertas: number;
  recibidas: number;
  enProceso: number;
  esperandoCliente: number;
  listas: number;
  vencidas: number;
  entregadasMes: number;
}

export interface FiltroOrdenesServicio {
  estado: EstadoOrdenServicio | 'ABIERTAS' | null;
  tecnicoId: number | null;
  soloMias: boolean;
  soloVencidas: boolean;
  desde: string | null;
  hasta: string | null;
}

export interface ClienteRapidoServicio {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string | null;
  telefono: string;
  email: string | null;
}

export interface ClienteServicio {
  id: number;
  numeroDocumento: string;
  nombreCompleto: string;
  telefono: string | null;
  email: string | null;
}

export interface ConfigServicioTecnico {
  prefijo: string;
  siguienteNumero: number;
  garantiaDias: number;
  condiciones: string | null;
  productoServicioId: number | null;
  productoServicioNombre: string | null;
}

export interface PaginaServicio<T> {
  content: T[];
  totalElements: number;
}
