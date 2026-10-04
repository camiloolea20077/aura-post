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
          'Formas con recargo (p. ej. Sistecrédito 5 %): escriba la parte de la venta que se paga con ella; el aviso naranja muestra el recargo y cuánto paga el cliente en total. El recargo sale en el resumen, en el total y en la factura. Se configura en Contabilidad › Parametrización › Formas de pago.',
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
          'A la izquierda está el detalle del turno: ventas por categoría, métodos de pago, crédito, movimientos, documentos de otras fechas y comisiones.',
          'Presione "Calculadora de billetes": se abre en una ventana aparte que se puede arrastrar desde el título. Muévala a un lado para seguir viendo el detalle mientras cuenta.',
          'En la calculadora escriba cuántos billetes y monedas hay de cada valor, o use + y −. En "Otros" van vales o cheques. Lo contado pasa solo a "Efectivo contado".',
          'Si ya contó por su cuenta, escriba la cifra directamente en "Efectivo contado".',
          'A la derecha, "Cuadre de caja" muestra lo que debe haber (base + ventas en efectivo + ingresos − egresos − comisiones), lo contado y si hay faltante, sobrante o cuadre exacto.',
          'Si la diferencia pasa de $50.000 le pide verificar el conteo. El botón dice con cuánto se cierra (por ejemplo "Cerrar con faltante de $3.000").',
          'Presione el botón para cerrar. Puede descargar el cierre en PDF desde la lista.',
        ],
        notas: [
          'El conteo se guarda en este equipo mientras el turno siga abierto: si cierra la ventana a mitad del arqueo, al volver sigue donde iba. "Volver a contar" lo pone en cero.',
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
    resumen: 'Las personas que entran al sistema: quién es (su tercero), cómo entra, en qué sedes trabaja, qué puede hacer y cuánto descuento puede dar.',
    secciones: [
      {
        titulo: 'Crear un usuario',
        pasos: [
          'Caja → Usuarios → Nuevo usuario. Se abre una página con cuatro pestañas y un solo botón Guardar.',
          'Datos y acceso: busque el tercero de la persona (empleado, vendedor…). Es obligatorio. Si no existe, use "Nuevo tercero". Nombre, documento y correo salen del tercero.',
          'Usuario de acceso: si lo deja vacío, se usa el correo del tercero. Contraseña de mínimo 6 caracteres, tipo de usuario y perfil de permisos (por defecto, el de su tipo).',
          'Sedes: marque al menos una y la principal (estrella).',
          'Permisos y Descuentos y acciones especiales: ajustes solo para esta persona (vea abajo).',
          'Guardar. Al editar, deje la contraseña vacía para no cambiarla.',
        ],
        notas: [
          'Un tercero solo puede tener un usuario.',
          'Nombre, documento y contacto se corrigen en Terceros, no en el usuario.',
          'Desactivar un usuario le impide entrar pero conserva todo lo que registró.',
          'El tipo de usuario sigue decidiendo cosas del negocio, como que el cajero necesite turno. Lo que ve y lo que puede hacer lo decide su perfil.',
        ],
      },
      {
        titulo: 'Ajustar los permisos de una sola persona',
        pasos: [
          'Abra el usuario (clic en la fila o en el lápiz) y vaya a la pestaña Permisos.',
          'Lo que tiene por su perfil sale en azul claro. Clic en una casilla para darle algo que su perfil no tiene (azul fuerte) o quitarle algo que sí tiene (rojo). Otro clic la devuelve a lo del perfil.',
          'En la pestaña Descuentos y acciones especiales: límites propios de descuento y de rebaja de precio (vacío = los del perfil) y acciones especiales ("Lo del perfil", Sí o No).',
          'Guardar. La persona lo verá al recargar la aplicación.',
        ],
        notas: [
          'Si varias personas necesitan el mismo ajuste, es mejor crear un perfil en Perfiles y Permisos.',
        ],
      },
      {
        titulo: 'Sesiones, clave y bloqueo',
        pasos: [
          'Desactivar un usuario, cambiarle la clave o cambiarle las sedes cierra sus sesiones abiertas: en su próxima acción tendrá que volver a entrar.',
          'Para sacar a alguien sin cambiarle nada: abra el usuario → Cerrar sesiones (acción especial "Cerrar sesiones").',
          'Cinco claves erradas seguidas bloquean el usuario 15 minutos. Pasado ese tiempo puede volver a intentarlo; cambiarle la clave también lo desbloquea.',
          'La sesión dura 12 horas; después hay que volver a entrar.',
        ],
      },
      {
        titulo: 'Cambiar de sede',
        pasos: [
          'Arriba, en el selector de sede (el marcador del mapa), elija la sede donde va a trabajar.',
          'La aplicación se recarga y todo lo que haga queda en esa sede.',
        ],
        notas: [
          'Solo aparecen las sedes asignadas al usuario. Si su perfil no tiene "todas las sedes", tampoco ve ni opera en las demás.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Usuario bloqueado por intentos fallidos. Intente después de las …',
        causa: 'Se escribió mal la clave cinco veces seguidas.',
        solucion: 'Espere 15 minutos, o pida a un administrador que le cambie la clave.',
      },
      {
        mensaje: 'Su sesión se cerró. Vuelva a iniciar sesión',
        causa: 'Le desactivaron el usuario, le cambiaron la clave o las sedes, o un administrador cerró sus sesiones.',
        solucion: 'Entre de nuevo con su usuario y clave.',
      },
      {
        mensaje: 'Esa sede no está asignada a su usuario',
        causa: 'Se intentó cambiar a una sede que el usuario no tiene.',
        solucion: 'Pida que le asignen la sede en Usuarios.',
      },
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
      {
        mensaje: 'No puede dar … en …: usted no lo tiene',
        causa: 'Nadie puede dar a otro un permiso que él mismo no tiene.',
        solucion: 'Pídale a un usuario con ese permiso (o con acceso total) que haga el cambio.',
      },
      {
        mensaje: 'Solo un SUPER_ADMIN cambia los permisos de otro SUPER_ADMIN',
        causa: 'Se intentó ajustar los permisos de un SUPER_ADMIN sin serlo.',
        solucion: 'Pídale el cambio a un SUPER_ADMIN.',
      },
    ],
  },
  {
    id: 'perfiles-permisos',
    grupo: 'Caja',
    titulo: 'Perfiles y Permisos',
    icono: 'pi pi-lock',
    rutas: ['/admin/perfiles'],
    resumen: 'Qué pantallas ve cada usuario y qué puede hacer en cada una (ver, crear, editar, anular).',
    secciones: [
      {
        titulo: 'Cómo funciona',
        pasos: [
          'La empresa manda: lo que la empresa no tiene activo no lo ve nadie, aunque el perfil lo tenga.',
          'Cada usuario tiene un perfil; el perfil dice qué pantallas ve y si puede crear, editar o anular en cada una.',
          'A una persona se le pueden hacer ajustes propios sobre su perfil (en el usuario, pestaña Permisos).',
          'Lo que el perfil no permite desaparece del menú, y los botones Nuevo, Editar o Anular no aparecen si no tiene esa acción.',
        ],
        notas: [
          'Toda empresa trae perfiles del sistema: Administrador (todo lo que la empresa tiene), Cajero, Vendedor, Supervisor y Básico. No se borran.',
          'El Administrador no se edita: para un administrador con menos acceso (por ejemplo, sin Contabilidad), duplíquelo y quite lo que no quiera.',
        ],
      },
      {
        titulo: 'Límites de descuento y precio',
        pasos: [
          'En el perfil, sección Límites y sedes: descuento máximo y rebaja máxima de precio, en %. Vacío = sin límite.',
          'El descuento cuenta por línea y el general se suma (10% + 10% = 19%). Las reglas de descuento automáticas no cuentan.',
          'La rebaja de precio se mide contra el menor precio que tiene el producto (precios 1 a 3, presentación, listas y precios especiales), sin IVA.',
          'Si una venta pasa el límite, el POS pide la autorización de un supervisor (alguien con la acción "Autorizar descuentos y precios"). Hay dos formas, y en ninguna el supervisor escribe su clave en el equipo del cajero:',
          'Código: el supervisor toca el escudo de la barra superior (Autorizaciones) → Generar código, y le dicta al cajero los 6 dígitos. Vence en 2 minutos y sirve una sola vez.',
          'Aprobación remota: el cajero toca "pedir aprobación remota"; al supervisor le aparece en la campana y en Autorizaciones, la aprueba o la rechaza, y el POS sigue solo.',
          'Queda en la Bitácora quién autorizó, a quién y cuánto.',
        ],
        notas: [
          'Quien autoriza también tiene sus límites: no puede autorizar más de lo que él mismo puede dar.',
          'La autorización sirve para una sola venta y vence a los 10 minutos. Cinco códigos errados seguidos frenan al cajero unos minutos.',
        ],
      },
      {
        titulo: 'Sedes',
        pasos: [
          '"¿Todas las sedes?" Sí = ve y trabaja en todas. "Solo las suyas" = solo en las sedes asignadas al usuario (Usuarios → Sucursales).',
        ],
        notas: [
          'Mientras el control del servidor está "observando", ver otra sede se anota en el Registro del control pero no se bloquea.',
        ],
      },
      {
        titulo: 'Acciones especiales',
        pasos: [
          'Acciones delicadas que van aparte de crear, editar o anular: reabrir un período contable, aprobar un reconteo, aprobar créditos, aprobar la nómina, vender a crédito, autorizar descuentos y cerrar sesiones de otros.',
          'Cada una tiene tres opciones: "Igual que …" (la tiene quien tenga esa acción en la pantalla, como venía funcionando), Sí o No.',
          'Ejemplo: un auxiliar contable que edita períodos pero no los reabre → Reabrir período = No.',
        ],
        notas: [
          'Autorizar descuentos y precios no se hereda: por defecto la tienen el Administrador y el Supervisor.',
        ],
      },
      {
        titulo: 'Crear o editar un perfil',
        pasos: [
          'Caja → Perfiles y Permisos → Nuevo perfil (o clic en uno existente).',
          'Nombre y descripción. "¿Acceso total?" Sí = todo lo que la empresa tenga, sin elegir pantalla por pantalla.',
          'En la tabla, marque Ver, Crear, Editar o Anular por pantalla. Crear, editar o anular incluyen ver.',
          'El círculo de cada módulo o grupo marca o quita esa columna completa de una vez. Use el buscador para encontrar una pantalla.',
          'Guardar. Los usuarios con ese perfil lo verán al recargar.',
        ],
        notas: [
          'Un perfil inactivo deja sin acceso a quienes lo tengan.',
          'Solo se puede eliminar un perfil que no tenga usuarios.',
          'La pestaña Historial de cambios muestra quién cambió qué permiso y cuándo.',
        ],
      },
      {
        titulo: 'Registro del control',
        pasos: [
          'El servidor revisa cada acción contra el perfil del usuario.',
          'Mientras está en modo "observando" no bloquea: anota en esta pestaña lo que habría bloqueado. Revíselo unos días y ajuste los perfiles.',
          'Cuando todo esté bien, se pasa a modo bloquear y el servidor responde "Sin permiso" a lo que el perfil no permite.',
          '"Ruta sin submódulo asignado" es un pendiente técnico: avise a soporte. Mientras tanto esa acción no se bloquea.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Sin permiso · No tiene permiso para … en …',
        causa: 'El perfil del usuario no tiene esa acción en esa pantalla.',
        solucion: 'Agréguela al perfil o como ajuste del usuario (pestaña Permisos del usuario).',
      },
      {
        mensaje: 'Sin permiso · Su perfil no tiene acceso a "…"',
        causa: 'Se intentó abrir una pantalla que el perfil no deja ver.',
        solucion: 'Pida que le agreguen Ver en esa pantalla.',
      },
      {
        mensaje: 'El perfil Administrador da todo lo que la empresa tiene y no se edita',
        causa: 'Se intentó modificar el perfil Administrador.',
        solucion: 'Duplíquelo y ajuste la copia.',
      },
      {
        mensaje: 'Solo un usuario con acceso total puede …',
        causa: 'Marcar, quitar o asignar un perfil de acceso total exige tener acceso total.',
        solucion: 'Pídale el cambio a un administrador con acceso total.',
      },
      {
        mensaje: 'El perfil lo tienen N usuario(s): asígneles otro perfil antes de eliminarlo',
        causa: 'Hay usuarios con ese perfil.',
        solucion: 'Cámbieles el perfil en Usuarios y vuelva a intentarlo.',
      },
      {
        mensaje: 'La venta pasa su límite y necesita autorización de un supervisor',
        causa: 'El descuento o la rebaja de precio superan el límite de su perfil.',
        solucion: 'Pida a un supervisor el código de 6 dígitos (lo genera en Autorizaciones) o use "pedir aprobación remota".',
      },
      {
        mensaje: 'El código no es válido o ya venció: pida otro',
        causa: 'El código se escribió mal, ya se usó o pasaron más de 2 minutos.',
        solucion: 'Pida al supervisor que genere otro código.',
      },
      {
        mensaje: 'Ese tercero ya tiene el usuario …',
        causa: 'Cada persona puede tener un solo usuario.',
        solucion: 'Edite el usuario que ya existe en vez de crear otro.',
      },
      {
        mensaje: 'Elija el tercero del usuario',
        causa: 'El usuario debe estar ligado a una persona (tercero).',
        solucion: 'Búsquela en Datos y acceso, o créela con "Nuevo tercero".',
      },
      {
        mensaje: '… no tiene permiso para autorizar descuentos',
        causa: 'Quien intentó autorizar no tiene la acción "Autorizar descuentos y precios".',
        solucion: 'Que autorice otra persona, o darle esa acción en su perfil.',
      },
      {
        mensaje: '… solo puede autorizar hasta N% de descuento',
        causa: 'El supervisor también tiene límite y la venta lo pasa.',
        solucion: 'Que autorice alguien con un límite mayor (o sin límite).',
      },
      {
        mensaje: 'La autorización venció / ya se usó: pida una nueva',
        causa: 'La autorización dura 10 minutos y sirve para una sola venta.',
        solucion: 'Vuelva a cobrar: el POS pedirá otra autorización.',
      },
      {
        mensaje: 'Su perfil solo le permite trabajar en sus sedes asignadas',
        causa: 'El perfil no tiene "todas las sedes" y se pidió información de otra sede.',
        solucion: 'Cambie a una de sus sedes, o pida que le asignen la sede.',
      },
      {
        mensaje: 'No puede dar un límite de … mayor que el suyo',
        causa: 'Nadie da a otro un límite más amplio que el propio.',
        solucion: 'Que haga el cambio alguien con un límite mayor o sin límite.',
      },
    ],
  },
  {
    id: 'bitacora',
    grupo: 'Caja',
    titulo: 'Bitácora',
    icono: 'pi pi-history',
    rutas: ['/admin/bitacora'],
    resumen: 'Quién anuló, editó, autorizó o cambió qué y cuándo, con el antes y el después.',
    secciones: [
      {
        titulo: 'Qué queda registrado',
        pasos: [
          'Toda edición y anulación de documentos y registros, y toda acción especial (reabrir período, aprobar…).',
          'Con el antes y el después: cambios de precio o costo de productos, autorizaciones de descuento y ventas que las usaron, cambios de clave y de sedes de usuarios, desactivación y cierre de sesiones.',
        ],
        notas: [
          '"Anotado por el servidor" = lo registró el control automático; trae la ruta y el documento, sin el antes y el después.',
        ],
      },
      {
        titulo: 'Buscar',
        pasos: [
          'Caja → Bitácora. Elija fechas, módulo y acción, o escriba un texto (nombre del producto, usuario…).',
          'Clic en la flecha de una fila para ver el antes y el después.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Sin permiso · No tiene permiso para ver en caja›bitacora',
        causa: 'El perfil no tiene la pantalla Bitácora.',
        solucion: 'Pida que le agreguen Ver en Caja › Bitácora.',
      },
    ],
  },
];
