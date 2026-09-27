import { PasoImportacion } from '../../../core/services/importacion.service';

export type TipoColumna = 'texto' | 'numero' | 'fecha' | 'bool';

export interface ColumnaPlantilla {
  /** Campo del backend. */
  key: string;
  /** Encabezado de la plantilla. */
  header: string;
  /** Otros encabezados que se aceptan (archivos exportados de otros programas). */
  alias: string[];
  tipo: TipoColumna;
  obligatoria: boolean;
  ayuda: string;
}

export interface PasoPlantilla {
  paso: PasoImportacion;
  titulo: string;
  descripcion: string;
  columnas: ColumnaPlantilla[];
  ejemplo: (string | number | boolean | Date | null)[][];
}

const c = (
  key: string,
  header: string,
  tipo: TipoColumna,
  obligatoria: boolean,
  ayuda: string,
  alias: string[] = [],
): ColumnaPlantilla => ({ key, header, tipo, obligatoria, ayuda, alias });

/**
 * Las cuatro plantillas del importador, en el orden en que se deben cargar:
 * sin plan de cuentas no hay saldos, y sin terceros no hay cartera.
 */
export const PASOS: PasoPlantilla[] = [
  {
    paso: 'plan-cuentas',
    titulo: '1. Plan de cuentas',
    descripcion:
      'Las cuentas que el PUC básico no trae. Las existentes se saltan. El nivel, la cuenta padre, el tipo y la naturaleza se deducen del código.',
    columnas: [
      c('codigo', 'Código', 'texto', true, 'Código PUC, solo números', ['cuenta', 'codigo cuenta']),
      c('nombre', 'Nombre', 'texto', true, 'Nombre de la cuenta', ['descripcion', 'nombre cuenta']),
      c('naturaleza', 'Naturaleza', 'texto', false, 'DEBITO o CREDITO (opcional: sale de la clase)'),
    ],
    ejemplo: [
      ['11050501', 'Caja sede norte', null],
      ['159205', 'Depreciación acumulada equipo de oficina', 'CREDITO'],
    ],
  },
  {
    paso: 'terceros',
    titulo: '2. Terceros',
    descripcion:
      'Clientes y proveedores. Se identifican por número de documento: los que ya existen no se modifican.',
    columnas: [
      c('tipoDocumento', 'Tipo documento', 'texto', true, 'CC, NIT, CE, TI, PASAPORTE, PEP, PPT', ['tipo']),
      c('numeroDocumento', 'Número documento', 'texto', true, 'Sin puntos (si trae -DV se separa)', ['documento', 'identificacion', 'nit', 'cedula']),
      c('dv', 'DV', 'texto', false, 'Dígito de verificación (NIT)'),
      c('razonSocial', 'Razón social', 'texto', false, 'Para empresas', ['empresa']),
      c('nombres', 'Nombres', 'texto', false, 'Para personas', ['nombre']),
      c('apellidos', 'Apellidos', 'texto', false, 'Para personas'),
      c('direccion', 'Dirección', 'texto', false, ''),
      c('municipio', 'Municipio', 'texto', false, 'Código DANE (05001) o nombre', ['ciudad']),
      c('telefono', 'Teléfono', 'texto', false, '', ['celular']),
      c('email', 'Correo', 'texto', false, '', ['email', 'correo electronico']),
      c('tipoPersona', 'Tipo persona', 'texto', false, 'NATURAL o JURIDICA'),
      c('regimen', 'Régimen', 'texto', false, 'RESPONSABLE_IVA o NO_RESPONSABLE_IVA'),
      c('esCliente', 'Cliente', 'bool', false, 'SI / NO'),
      c('esProveedor', 'Proveedor', 'bool', false, 'SI / NO'),
    ],
    ejemplo: [
      ['NIT', '900123456', '7', 'Distribuidora El Sol SAS', null, null, 'Calle 10 # 5-20', '68001', '6071234', 'ventas@elsol.com', 'JURIDICA', 'RESPONSABLE_IVA', 'NO', 'SI'],
      ['CC', '1098765432', null, null, 'Ana María', 'Gómez Ruiz', 'Cra 7 # 3-15', 'San Gil', '3001234567', 'ana@correo.com', 'NATURAL', 'NO_RESPONSABLE_IVA', 'SI', 'NO'],
    ],
  },
  {
    paso: 'saldos',
    titulo: '3. Saldos iniciales',
    descripcion:
      'El balance a la fecha de apertura, cuenta por cuenta. Cartera, proveedores y retenciones van con el documento del tercero. Si no cuadra, la diferencia va a resultados de ejercicios anteriores.',
    columnas: [
      c('codigoCuenta', 'Cuenta', 'texto', true, 'Código de una cuenta auxiliar', ['codigo', 'codigo cuenta']),
      c('documentoTercero', 'Documento tercero', 'texto', false, 'Obligatorio en 13xx, 22xx, 23xx', ['tercero', 'nit', 'documento']),
      c('debito', 'Débito', 'numero', false, 'Saldo débito', ['debe']),
      c('credito', 'Crédito', 'numero', false, 'Saldo crédito', ['haber']),
    ],
    ejemplo: [
      ['110505', null, 1500000, null],
      ['130505', '1098765432', 2380000, null],
      ['220505', '900123456', null, 4200000],
      ['310505', null, null, 10000000],
    ],
  },
  {
    paso: 'documentos',
    titulo: '4. Cartera y proveedores abiertos',
    descripcion:
      'Las facturas pendientes a la fecha de apertura, para poder cobrarlas o pagarlas. Un archivo para clientes y otro para proveedores. No generan asiento: su saldo contable ya está en los saldos iniciales, y se cruzan contra ellos.',
    columnas: [
      c('documentoTercero', 'Documento tercero', 'texto', true, 'Cliente o proveedor', ['tercero', 'nit', 'documento', 'cliente', 'proveedor']),
      c('numeroFactura', 'Número factura', 'texto', true, 'Número en el sistema anterior', ['factura', 'numero']),
      c('fechaEmision', 'Fecha emisión', 'fecha', false, 'dd/mm/aaaa', ['fecha']),
      c('fechaVencimiento', 'Fecha vencimiento', 'fecha', false, 'dd/mm/aaaa', ['vencimiento']),
      c('saldo', 'Saldo pendiente', 'numero', true, 'Lo que falta por cobrar o pagar', ['saldo', 'valor', 'pendiente']),
    ],
    ejemplo: [
      ['1098765432', 'FV-1520', '15/08/2026', '14/09/2026', 1380000],
      ['1098765432', 'FV-1604', '02/09/2026', '02/10/2026', 1000000],
    ],
  },
];
