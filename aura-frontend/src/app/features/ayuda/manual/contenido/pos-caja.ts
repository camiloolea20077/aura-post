import { ManualModulo } from '../manual.model';

export const POS_CAJA: ManualModulo[] = [
  {
    id: 'pos',
    grupo: 'Principal',
    titulo: 'Punto de Venta (POS)',
    icono: 'pi pi-shopping-cart',
    rutas: ['/pos'],
    resumen:
      'Donde se vende: buscar productos, armar el carrito, elegir cliente y precio, cobrar con uno o varios medios de pago, facturar electrónicamente e imprimir la tirilla.',
    secciones: [
      {
        titulo: 'Antes de vender',
        texto: [
          'El POS solo funciona con un turno de caja abierto. Si no hay turno, la pantalla muestra "Sin turno abierto" con el botón "Ir a turnos". Abra el turno (Caja → Turnos → Abrir turno) indicando la caja y la base en efectivo.',
          'El nombre de la caja del turno aparece arriba. Los vendedores ven "Vendedor" en su lugar.',
        ],
      },
      {
        titulo: 'Agregar productos',
        pasos: [
          'Escriba el nombre o SKU en "Buscar producto o SKU..." o use los botones de categoría para filtrar.',
          'Haga clic en la tarjeta del producto. Si tiene presentaciones (por ejemplo Unidad y Paca x 24), toque el botón de la presentación que vende.',
          'Con lector de código de barras: escanee y el producto entra solo. Los códigos de balanza (etiqueta con peso) agregan el producto con los kilos de la etiqueta.',
          'Para productos con serial, escanee el serial o use el botón de seriales de la línea para elegir cuáles unidades se venden.',
          'Cambie la cantidad con − y + o escribiéndola; quite la línea con el ícono de eliminar.',
        ],
        notas: [
          'La tarjeta muestra el stock disponible. "¡Últimas!" indica menos de 5 unidades. El stock en lotes vencidos aparece aparte y no se vende si la empresa lo bloquea.',
          'Al agregar un producto cuyo lote está por vencer, el POS avisa "Producto por vencer".',
        ],
      },
      {
        titulo: 'Cliente, lista de precios y precios por línea',
        texto: [
          'Sin cliente la venta queda a "Consumidor final". Busque el cliente por nombre o documento, o créelo con el botón de persona con +.',
          '"Precio lista / tipo cliente" aplica una lista de precios (mayorista, domicilios…) a todo el carrito.',
          'En cada línea, el menú de opciones (los tres puntos) permite: Descuento (en porcentaje), Editar precio (cambio de precio para esa venta) y Precio de venta (elegir el precio de otra lista, Precio 2 o Precio 3 del producto).',
          '"Venta exenta de IVA" se activa solo para ONG o entidades sin ánimo de lucro que lo acrediten.',
        ],
        notas: [
          'Editar el precio no es un descuento: la factura sale con el nuevo precio. Use "Descuento" cuando quiera que se vea el descuento.',
          'Las reglas de descuento automáticas (Precios → Descuentos) se aplican solas y la línea muestra "Desc. aplicado".',
        ],
      },
      {
        titulo: 'Varias órdenes a la vez',
        texto: [
          'Con el botón + de las pestañas abre otra orden sin perder la actual (por ejemplo, mientras un cliente busca la plata). Cada pestaña tiene su carrito y su cliente.',
          'Vaciar el carrito (papelera) o cerrar una pestaña con productos queda registrado en el reporte de Carritos Abandonados, con el tiempo que duró armado.',
          'El ícono de guardar como cotización convierte el carrito en una cotización para el cliente.',
        ],
      },
      {
        titulo: 'Cobrar',
        pasos: [
          'Presione Cobrar. Se abre "Cobrar venta" con el total.',
          'Elija el método: Efectivo, Tarjeta, Transferencia, Nequi, Daviplata o Crédito. En transferencias y billeteras elija "¿A qué cuenta llega el pago?".',
          'Escriba el monto recibido. "Exacto" completa el faltante. En efectivo el sistema calcula el vuelto.',
          'Para pagar con dos medios (parte efectivo, parte tarjeta) use "Agregar otro método".',
          'Si aplica, escriba un "Descuento adicional" sobre el total.',
          'Presione "Confirmar venta" cuando diga "Listo" o "Pago exacto".',
        ],
      },
      {
        titulo: 'Venta a crédito y autorización de cupo',
        texto: [
          'La venta a crédito exige cliente. El recuadro muestra el cupo total, la deuda actual y lo disponible.',
          'Si la venta pasa el cupo y el cliente está configurado para pedir autorización, aparece "Pedir autorización". La solicitud llega al administrador (Cartera → Autorizaciones y la campana). Mientras espera, puede cobrar de otra forma. Cuando la aprueban, el POS muestra "Crédito autorizado" y ya se puede elegir Crédito.',
          'La venta a crédito crea automáticamente la cuenta por cobrar del cliente.',
        ],
      },
      {
        titulo: 'Después de la venta',
        texto: [
          'Si la empresa factura electrónicamente, el sistema pregunta "¿El cliente desea factura electrónica para esta venta?". Con "Sí, generar factura" la envía a la DIAN a través de Factus y llega al correo del cliente; muestra el CUFE y permite descargar el PDF.',
          'Luego abre la tirilla para imprimir. Elija el ancho del papel (58 u 80 mm).',
          'Si la factura electrónica falla, la venta queda guardada igual: puede reintentar desde Ventas → Ventas.',
        ],
      },
      {
        titulo: 'Ingresos y egresos de caja (Ing / Egr)',
        pasos: [
          'Toque "Ing / Egr" junto al nombre de la caja.',
          'Elija Ingreso (entra dinero) o Egreso (sale dinero) y el método de pago.',
          'Elija un Concepto de caja (lo configura el contador; define la cuenta contable) o escriba el concepto.',
          'Si es un abono a una cuenta por cobrar o un pago a una cuenta por pagar, búsquela en el campo de cuenta: el movimiento abona esa deuda.',
          'Escriba el monto y quién entregó o recibió, y confirme.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Sin turno abierto / Debe abrir un turno de caja para registrar ventas en efectivo',
        causa: 'El usuario no tiene turno abierto.',
        solucion: 'Vaya a Caja → Turnos → Abrir turno.',
      },
      {
        mensaje: 'Ya tienes un turno abierto en otra caja',
        causa: 'Un cajero solo puede tener un turno abierto a la vez.',
        solucion: 'Cierre el turno de la otra caja o siga vendiendo en ella.',
      },
      {
        mensaje: 'Stock insuficiente / Sin stock: Solo hay N de …',
        causa: 'No hay unidades suficientes en la bodega que despacha ventas (o parte está en lotes vencidos).',
        solucion:
          'Registre la compra pendiente o haga un reconteo. Si el negocio vende antes de registrar la compra, active "Permitir stock negativo" en el producto.',
      },
      {
        mensaje: 'Stock insuficiente del componente …',
        causa: 'El producto se descuenta por receta y uno de sus ingredientes no alcanza.',
        solucion: 'Registre la compra del ingrediente o revise las cantidades de la receta en Catálogo → Composiciones.',
      },
      {
        mensaje: 'Precio inválido: … no tiene un precio válido',
        causa: 'El producto o la presentación tiene precio en cero.',
        solucion: 'Asigne el precio de venta en Catálogo → Productos.',
      },
      {
        mensaje: 'Sin forma de venta: … no tiene unidad ni presentación a la venta',
        causa: 'El producto no se vende por unidad y ninguna presentación está marcada para venta.',
        solucion: 'En el producto, marque una presentación como de venta o habilite la venta por unidad.',
      },
      {
        mensaje: 'Faltan seriales: elige N seriales antes de cobrar',
        causa: 'Producto con serial sin elegir cuáles unidades se venden.',
        solucion: 'Toque el botón de seriales de la línea y elija uno por unidad.',
      },
      {
        mensaje: 'Las ventas a crédito requieren un cliente asociado',
        causa: 'Se eligió Crédito con Consumidor final.',
        solucion: 'Seleccione o cree el cliente antes de cobrar.',
      },
      {
        mensaje: 'El pago recibido (X) es menor al total (Y)',
        causa: 'Los montos no cubren el total.',
        solucion: 'Complete el faltante o agregue otro método de pago.',
      },
      {
        mensaje: 'El cliente tiene N días de mora: primero debe ponerse al día',
        causa: 'Se pidió autorización de crédito para un cliente en mora.',
        solucion: 'El cliente debe abonar primero (Cartera → ficha del cliente → Registrar pago).',
      },
      {
        mensaje: 'Esta empresa no tiene habilitada la facturación electrónica',
        causa: 'La empresa no tiene configurada la conexión con Factus.',
        solucion: 'Contacte al administrador de la plataforma para habilitarla.',
      },
      {
        mensaje: 'Credenciales o resolución de facturación vencidas',
        causa: 'La resolución de numeración DIAN o el acceso a Factus expiró.',
        solucion:
          'Renueve la resolución de facturación en la DIAN y actualícela en Factus. La venta quedó guardada: facture después desde Ventas.',
      },
      {
        mensaje: 'El servicio de facturación electrónica no está disponible',
        causa: 'Factus o la DIAN no respondieron.',
        solucion: 'Espere unos minutos y reintente desde Ventas → Ver factura electrónica.',
      },
    ],
  },
  {
    id: 'turnos',
    grupo: 'Caja',
    titulo: 'Cajas y turnos',
    icono: 'pi pi-clock',
    rutas: ['/caja/turnos', '/caja/cajas'],
    resumen:
      'Crear las cajas de cada sucursal, abrir el turno con la base, seguir las ventas del turno, cerrar con el conteo real y corregir un arqueo ya cerrado sin reescribirlo.',
    secciones: [
      {
        titulo: 'Crear una caja',
        pasos: [
          'Caja → Cajas → Nueva caja.',
          'Elija la sucursal (no se puede cambiar después) y un nombre: Caja Principal, Caja 2, Caja Express…',
          'Guarde. La caja queda activa y disponible para abrir turnos.',
        ],
      },
      {
        titulo: 'Abrir turno',
        pasos: [
          'Caja → Turnos → Abrir turno.',
          'Seleccione la caja que va a operar.',
          'Escriba la base inicial: el efectivo físico con el que arranca (puede ser $0).',
          'Presione Abrir turno. Desde ese momento puede vender en el POS.',
        ],
      },
      {
        titulo: 'Seguir el turno activo',
        texto: [
          'La tarjeta "Turno activo" muestra las ventas del turno, el efectivo esperado (base + ventas en efectivo + ingresos − egresos), descuentos, ventas por categoría y métodos de pago. Se actualiza cada 30 segundos.',
        ],
      },
      {
        titulo: 'Cerrar turno',
        pasos: [
          'Caja → Turnos → Cerrar turno.',
          'Revise el resumen: ventas por categoría, por método de pago, ventas a crédito, ingresos y egresos manuales, pagos de documentos de otras fechas y comisiones de técnicos.',
          'Cuente el efectivo del cajón y escríbalo en "Efectivo contado".',
          'El sistema muestra la diferencia contra el esperado. Si pasa de $50.000 le pide verificar el conteo.',
          'Presione Cerrar turno. Puede descargar el cierre en PDF desde la lista.',
        ],
        notas: [
          'Si hay comisiones de servicios pendientes, genere la liquidación antes de entregar el efectivo.',
        ],
      },
      {
        titulo: 'Corregir un arqueo cerrado',
        texto: [
          'Si después del cierre aparece un pago que no se registró, o sobró plata, no se reabre el turno: se registra un ajuste encima. El cierre que firmó el cajero se conserva y la corrección se muestra aparte.',
        ],
        pasos: [
          'En la lista de turnos, use "Corregir arqueo" en el turno cerrado.',
          'Elija qué pasó: Ingreso (sobró plata) o Egreso (salió y no se registró).',
          'Escriba el monto, la fecha del hecho (define el período contable), el concepto y el motivo.',
          'Registrar ajuste. Solo el rol autorizador de la empresa puede hacerlo.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'La caja ya tiene un turno abierto',
        causa: 'Otro usuario tiene esa caja abierta.',
        solucion: 'Pida que cierre su turno o use otra caja.',
      },
      {
        mensaje: 'La caja está inactiva',
        causa: 'La caja fue desactivada.',
        solucion: 'Actívela en Caja → Cajas (Editar → Estado).',
      },
      {
        mensaje: 'El turno ya está cerrado / No se pueden registrar movimientos en un turno cerrado',
        causa: 'Se intenta operar un turno que ya se cerró.',
        solucion: 'Abra un turno nuevo. Para corregir el cerrado use "Corregir arqueo".',
      },
      {
        mensaje: 'No tienes permiso para cerrar el turno de caja',
        causa: 'El turno es de otro usuario y usted no es administrador.',
        solucion: 'Que lo cierre el mismo cajero o un administrador.',
      },
      {
        mensaje: 'El turno todavía está abierto. Registre el movimiento normalmente',
        causa: 'Se usó "Corregir arqueo" en un turno abierto.',
        solucion: 'Use "Ing / Egr" en el POS mientras el turno esté abierto.',
      },
      {
        mensaje: 'El período contable de … está cerrado, así que el ajuste no puede registrarse en esa fecha',
        causa: 'La fecha del hecho cae en un mes cerrado.',
        solucion: 'Use una fecha de un período abierto o pida reabrir el mes.',
      },
      {
        mensaje: 'Solo ADMIN puede corregir un arqueo cerrado',
        causa: 'El usuario no tiene el rol autorizador.',
        solucion: 'Pida al administrador que registre la corrección.',
      },
    ],
  },
  {
    id: 'supervision-caja',
    grupo: 'Caja',
    titulo: 'Supervisión de caja',
    icono: 'pi pi-eye',
    rutas: ['/caja/supervision'],
    resumen:
      'Lo que entró o salió de las cajas sin ser del propio turno: documentos viejos autorizados a mano, pagos de otro día, cajas que dedujo el sistema y correcciones de arqueos cerrados.',
    secciones: [
      {
        titulo: 'Cómo usarla',
        pasos: [
          'Elija el rango Desde y Hasta y presione Buscar.',
          'Filtre por tipo de hallazgo: Autorizados a mano, Correcciones de cierre, Caja deducida, Salió otro día, Entró otro día o Documentos de otro día.',
          'Cada fila muestra el documento, la fecha del documento y la de registro, la caja, el monto, el motivo, quién registró y quién autorizó.',
        ],
        notas: [
          '"Nada que revisar en este período" significa que todo lo que salió de las cajas corresponde a su propio turno.',
          'Úsela antes de pagar comisiones o al revisar un faltante: explica por qué el esperado de un cierre no coincide con las ventas del día.',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'comprobantes',
    grupo: 'Caja',
    titulo: 'Comprobantes de egreso y recibos de caja',
    icono: 'pi pi-file',
    rutas: ['/comprobantes', '/comprobantes/contable/nuevo'],
    resumen:
      'Comprobantes de Egreso (CE, sale dinero) y Recibos de Caja (RC, entra dinero) con sus líneas contables, beneficiario e impresión en tirilla.',
    secciones: [
      {
        titulo: 'Consultar',
        texto: [
          'La lista muestra número, concepto, monto, método de pago, a quién se entregó, origen y fecha. Filtre por tipo y por fechas; "Ver comprobante" abre la tirilla para imprimir.',
        ],
      },
      {
        titulo: 'Crear un comprobante contable',
        pasos: [
          'Nuevo comprobante → elija el tipo (Comprobante de Egreso o Recibo de Caja).',
          'Busque el beneficiario por nombre o documento; se completan dirección, teléfono y ciudad.',
          'Escriba el concepto general, elija la sucursal de la caja y el método: caja, cuenta bancaria o cuenta contable (caja menor, fondos por legalizar…).',
          'Agregue las líneas contables: cuenta, tercero, centro de costo, descripción, débito o crédito.',
          'Para pagar o cobrar facturas, use la sección "Estados de cuenta": marca las cuentas por pagar (CE) o por cobrar (RC) del tercero y escribe el valor a aplicar; el sistema arma las líneas.',
          'Guardar y contabilizar. Débitos y créditos deben ser iguales.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El comprobante no cuadra (débito ≠ crédito)',
        causa: 'La suma de débitos es distinta de la de créditos.',
        solucion: 'Revise las líneas; la diferencia se muestra al pie.',
      },
      {
        mensaje: 'La cuenta … tiene $X y el comprobante necesita $Y',
        causa: 'La caja menor o cuenta de fondos no tiene saldo.',
        solucion: 'Reponga el fondo con un traslado de fondos o pague desde otra cuenta.',
      },
      {
        mensaje: 'Línea N: la cuenta … no es de movimiento',
        causa: 'Se eligió una cuenta de agrupación.',
        solucion: 'Elija la cuenta auxiliar (último nivel).',
      },
    ],
  },
  {
    id: 'usuarios',
    grupo: 'Caja',
    titulo: 'Usuarios',
    icono: 'pi pi-users',
    rutas: ['/admin/usuarios'],
    resumen: 'Crear las personas que entran al sistema, su rol, su PIN y las sucursales donde pueden trabajar.',
    secciones: [
      {
        titulo: 'Crear un usuario',
        pasos: [
          'Caja → Usuarios → Nuevo usuario.',
          'Datos de acceso: username, contraseña (mínimo 6 caracteres), rol y PIN de acceso rápido (hasta 6 dígitos, opcional).',
          'Datos personales: nombres, apellidos, tipo y número de documento, teléfono y email.',
          'Sucursales asignadas: marque al menos una y señale la sede principal.',
          'Guarde. Al editar, deje la contraseña vacía para no cambiarla.',
        ],
        notas: [
          'Desactivar un usuario le impide entrar pero conserva todo lo que registró.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Debes asignar al menos una sucursal',
        causa: 'El usuario no tiene sucursal.',
        solucion: 'Marque una sucursal y señálela como principal.',
      },
      {
        mensaje: 'El username ya está en uso',
        causa: 'Otro usuario usa ese nombre de acceso.',
        solucion: 'Elija otro username.',
      },
    ],
  },
];
