import { ManualModulo } from '../manual.model';

export const REPORTES: ManualModulo[] = [
  {
    id: 'reporte-gerencial',
    grupo: 'Reportes',
    titulo: 'Reporte gerencial',
    icono: 'pi pi-shield',
    rutas: ['/reportes/gerencial'],
    resumen:
      'Cómo va el negocio y qué no cuadra: cruza fuentes independientes (caja, contabilidad, cartera, inventario, gastos) y lista los hallazgos con su causa probable y qué hacer. Se descarga en PDF.',
    secciones: [
      {
        titulo: 'Correr el análisis',
        pasos: [
          'Elija Desde y Hasta (máximo un trimestre).',
          '"Diferencia mínima": debajo de ese monto un descuadre de caja o cartera se considera redondeo y no se reporta. No aplica a la contabilidad, que debe cuadrar al centavo.',
          '"Incluir descuadres anteriores" muestra aparte los problemas viejos ya diagnosticados.',
          'Analizar. Descargar PDF para la junta o el dueño.',
        ],
      },
      {
        titulo: 'Cómo leerlo',
        texto: [
          'Arriba: cuántos hallazgos Graves (plata sin explicar o contabilidad que no cierra), Por revisar (cuadra pero no se puede defender) y Menores (higiene de datos), y el monto en riesgo.',
          'Secciones del negocio: ventas y márgenes, caja, cartera y estados de cuenta, recaudo por medio, impuestos del período, ventas perdidas por carritos abandonados, gastos e inventario.',
          'Cada hallazgo dice qué se comparó, por qué suele pasar (causas ordenadas por probabilidad), qué hacer y dónde mirarlo.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El análisis se corre sobre máximo un trimestre. Acorta el rango',
        causa: 'Rango mayor a tres meses.',
        solucion: 'Analice por trimestres.',
      },
    ],
  },
  {
    id: 'reporte-ventas',
    grupo: 'Reportes',
    titulo: 'Reporte de ventas',
    icono: 'pi pi-chart-line',
    rutas: ['/reportes/ventas'],
    resumen: 'Ventas de un rango con gráfico de los últimos 7 días, últimas ventas y exportación.',
    secciones: [
      {
        titulo: 'Usarlo',
        texto: [
          'Filtre por fechas. Excel y PDF en dos formatos: Detallado (una línea por ítem) o Simple (una línea por factura con los valores sumados).',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'reporte-inventario',
    grupo: 'Reportes',
    titulo: 'Reporte de inventario',
    icono: 'pi pi-box',
    rutas: ['/reportes/inventario'],
    resumen: 'Estado actual de productos y existencias con costo, precio, IVA y distribución por categoría.',
    secciones: [
      {
        titulo: 'Usarlo',
        texto: ['Busque por producto o SKU. Descargue en Excel o PDF.'],
      },
    ],
    errores: [],
  },
  {
    id: 'reporte-cartera',
    grupo: 'Reportes',
    titulo: 'Estado de cuenta (reporte de cartera)',
    icono: 'pi pi-users',
    rutas: ['/reportes/cartera'],
    resumen:
      'Quién debe qué y desde cuándo, por cliente o proveedor, con el detalle de cada documento y cada abono.',
    secciones: [
      {
        titulo: 'Filtros y lectura',
        texto: [
          'Elija Cartera (clientes) o cuentas por pagar (proveedores), estado, mora mínima en días y fechas de emisión. Busque por documento, factura, nombre o NIT.',
          'Resumen por edades: corriente (aún no vence), 1–30, 31–60, 61–90 y más de 90 días.',
          'Cada tercero se despliega con sus documentos y los abonos aplicados: fecha, monto, método, dónde entró el dinero y quién lo registró.',
          'Excel exporta todo.',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'reporte-gastos',
    grupo: 'Reportes',
    titulo: 'Reporte de gastos',
    icono: 'pi pi-money-bill',
    rutas: ['/reportes/gastos'],
    resumen: 'En qué se fue la plata, con lo deducible separado de lo que no.',
    secciones: [
      {
        titulo: 'Usarlo',
        texto: [
          'Filtre por fechas, categoría, sucursal, deducible y forma de pago. Agrupe por categoría, sucursal, tercero, centro de costo, deducible, forma de pago o método.',
          'Tarjetas: total, deducible (resta en renta), no deducible, lo que quedó debiendo (gastos a crédito), IVA y retenciones.',
          'Pestañas Resumen y Detalle; Excel.',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'reporte-kardex',
    grupo: 'Reportes',
    titulo: 'Movimiento de inventario',
    icono: 'pi pi-history',
    rutas: ['/reportes/kardex'],
    resumen: 'Entradas, salidas y anulaciones por producto en un rango, con el kardex detallado y saldo corrido.',
    secciones: [
      {
        titulo: 'Usarlo',
        pasos: [
          'Fechas, sucursal, categoría, marca y tipos de movimiento. Agrupe si quiere.',
          'Resumen por producto: saldo inicial, entradas, salidas, variación, saldo final y valores.',
          'Elija un producto para ver su Kardex detallado con saldo corrido.',
          'Excel o PDF.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Los movimientos no cuadran con la diferencia de saldos',
        causa: 'Hay movimientos mal grabados en ese producto.',
        solucion: 'Reporte el producto al soporte técnico con el rango de fechas.',
      },
    ],
  },
  {
    id: 'reporte-fe',
    grupo: 'Reportes',
    titulo: 'Facturación electrónica',
    icono: 'pi pi-file-export',
    rutas: ['/reportes/facturacion-electronica'],
    resumen: 'Exporta a Excel las facturas y notas crédito/débito electrónicas emitidas en un rango.',
    secciones: [
      {
        titulo: 'Usarlo',
        texto: [
          'Facturas de venta: número, fecha, cliente, bases e IVA por tarifa, descuento, total, CUFE, estado DIAN y ambiente.',
          'Notas: tipo, número, factura referenciada, base, IVA, total, CUDE y estado. Se puede filtrar por tipo de nota.',
          'Una factura rechazada por la DIAN aparece con su estado real.',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'carritos-abandonados',
    grupo: 'Reportes',
    titulo: 'Carritos abandonados',
    icono: 'pi pi-shopping-cart',
    rutas: ['/reportes/carritos-abandonados'],
    resumen:
      'Lo que se armó en el POS y se vació sin vender: cuánto duró armado, qué productos tenía y qué cajero lo vació.',
    secciones: [
      {
        titulo: 'Cómo se registra',
        texto: [
          'Cada vez que en el POS se vacía el carrito (papelera) o se cierra una orden con productos, queda registrado. Vender o convertir en cotización no cuenta.',
        ],
      },
      {
        titulo: 'Leer el reporte',
        pasos: [
          'Rango rápido (Hoy, Últimos 7 días, Este mes, Mes anterior) o fechas.',
          '"Contar desde" (5 minutos por defecto): un carrito vaciado antes no cuenta, suele ser una corrección rápida.',
          'Tarjetas: carritos abandonados, valor que no se vendió, tiempo promedio armado y cuántos se descartaron por tiempo.',
          'Productos que más se abandonan, carritos por cajero y la lista de carritos: clic en uno para ver sus productos y a qué hora entró cada uno.',
          'Excel.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'No hay carritos abandonados en este rango',
        causa: 'Ninguno duró el mínimo de minutos.',
        solucion: 'Baje el valor de "Contar desde" para ver los vaciados más rápido.',
      },
    ],
  },
  {
    id: 'reportes-avanzados',
    grupo: 'Reportes',
    titulo: 'Reportes avanzados',
    icono: 'pi pi-chart-pie',
    rutas: ['/reportes/avanzados'],
    resumen: 'Análisis de ventas, productos, vendedores, caja, márgenes y rotación.',
    secciones: [
      {
        titulo: 'Pestañas',
        texto: [
          'Resumen Ejecutivo: total ventas, margen bruto, transacciones, ticket promedio, clientes nuevos y recurrentes, ventas por día y por método de pago.',
          'Por Categoría, Top Productos (10 por ingresos) y Por Vendedor.',
          'Movimientos de Caja: ingresos, egresos y saldo neto.',
          'Márgenes & Rotación: margen por producto y rotación de los últimos 30 días (días sin movimiento).',
        ],
      },
    ],
    errores: [],
  },
];

export const TERCEROS_SUCURSALES: ManualModulo[] = [
  {
    id: 'terceros',
    grupo: 'Terceros y Sucursales',
    titulo: 'Terceros (clientes, proveedores, empleados)',
    icono: 'pi pi-id-card',
    rutas: ['/terceros'],
    resumen: 'Un solo directorio de clientes, proveedores, empleados y bancos, con sus datos fiscales para la factura electrónica.',
    secciones: [
      {
        titulo: 'Crear un tercero',
        pasos: [
          'Nuevo tercero → tipo de tercero y tipo de persona (natural o jurídica).',
          'Tipo y número de documento. Para NIT, el dígito de verificación y la razón social; para personas, nombres y apellidos.',
          'Contacto: teléfono, correo, dirección, país y municipio. "Correo facturación" es a donde llega la factura electrónica.',
          'Roles: Cliente (puede comprar en el POS), Proveedor (aparece en compras) y Empleado.',
          'Información fiscal: régimen, responsabilidad fiscal, CIIU, gran contribuyente, autorretenedor.',
          'Guarde.',
        ],
        notas: [
          'Para facturar electrónicamente y para la exógena el tercero necesita documento, dirección, municipio y correo completos.',
          'El estado de cuenta de un tercero se consulta en Contabilidad → Estado de Cuenta.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Ya existe un tercero con este número de documento',
        causa: 'Documento repetido.',
        solucion: 'Busque el existente y agréguele el rol que necesita.',
      },
      {
        mensaje: 'Debe ingresar razón social o nombres',
        causa: 'Faltan nombres.',
        solucion: 'Complete razón social (NIT) o nombres.',
      },
      {
        mensaje: 'Selecciona al menos un rol para el tercero',
        causa: 'Sin rol.',
        solucion: 'Marque Cliente, Proveedor o Empleado.',
      },
      {
        mensaje: 'El cliente no aparece en el POS / el proveedor no aparece en compras',
        causa: 'Le falta el rol correspondiente o está inactivo.',
        solucion: 'Edite el tercero y marque el rol.',
      },
    ],
  },
  {
    id: 'sucursales',
    grupo: 'Terceros y Sucursales',
    titulo: 'Sucursales',
    icono: 'pi pi-building',
    rutas: ['/admin/sucursales'],
    resumen: 'Las sedes de la empresa.',
    secciones: [
      {
        titulo: 'Crear una sucursal',
        pasos: [
          'Nueva sucursal → nombre, código, dirección, ciudad, teléfono y prefijo de facturación.',
          'Guarde. Luego cree su bodega principal (Inventario → Bodegas) y sus cajas.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'La sucursal no tiene bodega principal',
        causa: 'Sucursal nueva sin bodega.',
        solucion: 'Cree la bodega principal en Inventario → Bodegas.',
      },
    ],
  },
];

export const VENDEDORES: ManualModulo[] = [
  {
    id: 'vendedores',
    grupo: 'Vendedores',
    titulo: 'Vendedores, locales, rutas y visitas',
    icono: 'pi pi-map',
    rutas: ['/vendedores'],
    resumen:
      'Fuerza de ventas en la calle: los locales que atiende cada vendedor, sus rutas por día y las visitas confirmadas con código QR y ubicación.',
    secciones: [
      {
        titulo: 'Configurar',
        pasos: [
          'Locales: nombre, departamento, ciudad, dirección (formato Calle 12 #12-12), barrio, ubicación, teléfono, horario y preferencia de visita. "Asignar vendedor" y "Generar QR" (imprímalo y péguelo en el local).',
          'Rutas: nombre, días de la semana, vendedor y locales.',
          'Visitas: "Programar visita" con local, ruta (opcional), fecha y hora.',
        ],
      },
      {
        titulo: 'En la calle (vendedor)',
        texto: [
          'El vendedor entra a Mi Perfil (Mis Locales, Mis Rutas, Visitas). Al llegar al local escanea el QR para confirmar la llegada: el sistema guarda la hora y la distancia al local.',
          'Si no hay ruta para ese local ese día, pregunta si desea registrar la visita de todos modos.',
          'Los pedidos que toma se despachan y cobran en Ventas → Ventas de Campo.',
          'En la lista de Vendedores se ve quién está en línea y su ubicación.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Debe estar dentro del local para confirmar la llegada',
        causa: 'La ubicación del teléfono está lejos del local.',
        solucion: 'Acérquese y active el GPS del teléfono.',
      },
      {
        mensaje: 'Ya existe una visita para este local en la fecha especificada',
        causa: 'Visita repetida.',
        solucion: 'Use la existente.',
      },
      {
        mensaje: 'No se puede eliminar, el local / la ruta tiene visitas asociadas',
        causa: 'Hay historia.',
        solucion: 'Desactívelo en vez de eliminarlo.',
      },
      {
        mensaje: 'Debe agregar al menos un local a la ruta',
        causa: 'Ruta vacía.',
        solucion: 'Elija los locales.',
      },
      {
        mensaje: 'El local no tiene un vendedor asignado',
        causa: 'Falta asignar vendedor.',
        solucion: 'Use "Asignar vendedor" en Locales.',
      },
    ],
  },
];
