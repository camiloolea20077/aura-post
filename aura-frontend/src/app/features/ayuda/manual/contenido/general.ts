import { ManualModulo } from '../manual.model';

export const GENERAL: ManualModulo[] = [
  {
    id: 'primeros-pasos',
    grupo: 'Empezar',
    titulo: 'Primeros pasos',
    icono: 'pi pi-flag',
    rutas: ['/perfil'],
    resumen:
      'Cómo entrar, moverse por el menú, cambiar de sucursal y en qué orden configurar una empresa nueva para que todo funcione desde el primer día.',
    secciones: [
      {
        titulo: 'Entrar al sistema',
        pasos: [
          'Escriba su usuario y contraseña en la pantalla de inicio y presione Ingresar.',
          'Si olvidó la contraseña, use "¿Olvidaste tu contraseña?" y siga el enlace que llega al correo registrado.',
          'Al entrar, el sistema abre el Inicio con el tablero de lo que usa su empresa (punto de venta, comercial, contabilidad o nómina). Si su perfil no tiene el Inicio, abre la primera pantalla que sí puede ver.',
        ],
        notas: [
          'La sesión se cierra sola después de un tiempo sin uso. Si le aparece "Sesión expirada", vuelva a ingresar: lo que ya guardó no se pierde.',
        ],
      },
      {
        titulo: 'El menú y los permisos',
        texto: [
          'El menú de la izquierda se arma según el rol del usuario (Administrador, Cajero, Vendedor) y los módulos que la empresa tiene contratados y habilitados. Si una opción no aparece, no es un error: ese usuario no la tiene habilitada.',
          'Arriba a la derecha están: el indicador de turno abierto, la campana de notificaciones (lotes por vencer, stock bajo, promesas de pago, autorizaciones de crédito, facturas vencidas) y el botón de ayuda (?) que abre este manual en el tema de la pantalla donde está.',
        ],
      },
      {
        titulo: 'Sucursal de trabajo y perfil',
        texto: [
          'Cada usuario puede tener varias sucursales asignadas y una principal. Todo lo que registre (ventas, compras, mermas, gastos) queda en la sucursal en la que está trabajando.',
        ],
        pasos: [
          'Abra Mi perfil desde el menú del usuario (arriba a la derecha).',
          'En "Sucursal en la que estás trabajando" elija la sede.',
          'Con "Editar empresa" el administrador cambia el nombre comercial, el logo, el contacto (teléfono, correo, dirección y municipio), la resolución de facturación de la DIAN (número, prefijo, consecutivos y vigencia) y el ID del rango en Factus para facturas y para nómina. La razón social y el NIT no se cambian desde esta pantalla.',
        ],
        notas: [
          'Cuando la DIAN le dé una resolución nueva, actualícela aquí el mismo día: copie los datos tal como aparecen en la resolución y en el rango que creó en Factus. Si el ID del rango no coincide, Factus rechaza las facturas.',
          'La etiqueta junto a "Resolución de facturación" avisa cuando faltan 30 días o menos para que venza.',
          'Además del SUPER_ADMIN, puede editar quien tenga en su perfil la acción especial "Editar datos de la empresa" (Caja → Perfiles, en Usuarios). El perfil Administrador la trae por defecto.',
        ],
      },
      {
        titulo: 'Orden recomendado para configurar una empresa nueva',
        pasos: [
          'Sucursales (Terceros y Sucursales → Sucursales) y sus bodegas (Inventario → Bodegas).',
          'Usuarios con su rol y sucursales (Caja → Usuarios).',
          'Cajas de cada sucursal (Caja → Cajas).',
          'Plan de cuentas: "Cargar PUC completo" si la empresa lleva contabilidad (Contabilidad → Plan de Cuentas).',
          'Cuentas bancarias y billeteras (Tesorería → Cuentas Bancarias).',
          'Catálogo: unidades, categorías, marcas y productos.',
          'Terceros: clientes y proveedores.',
          'Saldos iniciales: inventario con una compra de apertura, cartera y cuentas por pagar con Importar Datos, y saldos contables con Saldos Iniciales.',
          'Abrir el primer turno de caja y hacer una venta de prueba.',
        ],
      },
      {
        titulo: 'Convenciones que se repiten en todo el sistema',
        texto: [
          'Nada se borra de verdad cuando ya afectó inventario, caja o contabilidad: se ANULA. La anulación deja el documento con su número, reversa sus efectos y guarda quién y por qué.',
          'Las fechas se escriben con el calendario (dd/mm/aaaa). El sistema trabaja con la hora de Colombia.',
          'Los valores se muestran en pesos colombianos sin decimales.',
          'Las pantallas de listas tienen buscador arriba y paginación abajo; los formularios se abren en ventana o en página propia y se guardan con el botón azul.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Credenciales inválidas',
        causa: 'El usuario o la contraseña no coinciden, o el usuario está desactivado.',
        solucion:
          'Revise mayúsculas y que no haya espacios. Si sigue fallando, pida al administrador que verifique que el usuario esté activo en Caja → Usuarios o que le asigne una contraseña nueva.',
      },
      {
        mensaje: 'Sesión expirada / Token inválido o expirado',
        causa: 'Pasó el tiempo máximo de la sesión o se ingresó con el mismo usuario en otro equipo.',
        solucion: 'Vuelva a iniciar sesión. Los documentos ya guardados no se pierden; lo que estaba escribiendo sin guardar sí.',
      },
      {
        mensaje: 'No veo una opción del menú',
        causa: 'El rol del usuario o la empresa no tienen habilitado ese submódulo.',
        solucion:
          'Pida al administrador de la plataforma que habilite el submódulo para la empresa o para su rol. No es un error de la pantalla.',
      },
      {
        mensaje: 'Su perfil no le permite editar los datos de la empresa',
        causa: 'El perfil del usuario no tiene la acción especial "Editar datos de la empresa".',
        solucion: 'Pida al administrador que la active en su perfil (Caja → Perfiles, en Usuarios) o que haga el cambio.',
      },
      {
        mensaje: 'El consecutivo inicial de la resolución no puede ser mayor que el final',
        causa: 'En la resolución de facturación el "Consecutivo desde" quedó mayor que el "Consecutivo hasta" (o la fecha inicial después de la final).',
        solucion: 'Revise los números y fechas contra la resolución de la DIAN y vuelva a guardar.',
      },
    ],
  },
  {
    id: 'firma-contable',
    grupo: 'Empezar',
    titulo: 'Firma contable: un contador, varias empresas',
    icono: 'pi pi-briefcase',
    rutas: [],
    resumen:
      'Cómo trabaja una firma contable en Aura: un solo usuario para entrar a todas las empresas cliente que atiende, elegir dónde trabajar y quién puede quitar el acceso.',
    secciones: [
      {
        titulo: 'Qué es',
        texto: [
          'Una firma contable es una empresa en Aura que lleva la contabilidad de otras empresas (sus clientes). La firma no paga licencia; cada cliente paga la suya.',
          'Sus usuarios entran a cada cliente con un solo usuario y contraseña. Dentro del cliente trabajan con el perfil "Contador externo": contabilidad, compras (facturas de compra, gastos, documento soporte), cuentas por cobrar y por pagar, cartera, tesorería, terceros y reportes. No ven punto de venta, caja ni facturas de venta.',
          'Aura crea la firma y le asigna los clientes al dar de alta cada empresa.',
        ],
      },
      {
        titulo: 'Entrar y elegir la empresa',
        pasos: [
          'Ingrese con su usuario y contraseña como siempre.',
          'Si atiende clientes, aparece "¿Dónde vas a trabajar?": su firma arriba y debajo los clientes. Con más de 8 hay un buscador por nombre o NIT.',
          'Elija la empresa. Tiene 2 minutos para hacerlo; si pasan, vuelva a escribir la contraseña.',
          'Arriba a la derecha queda el nombre de la empresa en la que trabaja. Para pasar a otra, haga clic ahí o en su nombre → "Cambiar empresa".',
        ],
        notas: [
          'Al cambiar de empresa la aplicación se recarga: todo lo que ve es de la empresa elegida.',
          'En el cliente puede cambiar de sede con el selector de siempre: tiene todas sus sedes.',
        ],
      },
      {
        titulo: 'Para el administrador de la firma',
        pasos: [
          'Caja → Usuarios → abra el usuario (o créelo).',
          'En la pestaña "Clientes que atiende" marque los clientes en los que trabaja esa persona y Guarde.',
          'Si le quita un cliente, su sesión en ese cliente se cierra en menos de un minuto; en los demás sigue trabajando.',
        ],
        notas: [
          'Los administradores de la firma atienden todos los clientes de la firma sin marcarlos: la asignación es para los auxiliares.',
          'La pestaña solo aparece en una firma contable y solo la ve un administrador.',
        ],
      },
      {
        titulo: 'Clientes gestionados (el cliente no usa Aura)',
        texto: [
          'Si un cliente no quiere usar Aura, la firma puede crearlo y llevarle la contabilidad ella misma. La firma le paga ese cliente a Aura por un contrato aparte. Cada firma tiene un cupo (10 al empezar); Aura lo amplía.',
          'En un cliente gestionado los administradores de la firma entran como administradores: eligen sus módulos, crean usuarios y ajustan perfiles. Los auxiliares entran con "Contador externo".',
        ],
        pasos: [
          'Menú Terceros y Sucursales (o el menú de usuario, arriba a la derecha) → "Clientes de la firma" → "Nuevo cliente gestionado".',
          'Elija si es persona jurídica o persona natural. Jurídica: razón social y NIT. Natural: nombres, apellidos y su NIT (cédula con RUT) o su cédula. Si deja el DV vacío, se calcula solo.',
          'Llene el contacto y marque los módulos: Contabilidad (siempre), Facturación de venta, Compras y gastos, Nómina. Punto de venta, caja e inventario no están disponibles.',
          'Si quiere que el cliente mire el estado de su empresa, elija "Sí, crear un usuario de consulta" y escriba sus datos: ve todo y no puede cambiar nada.',
          'Crear cliente. Se carga su plan de cuentas y ya aparece en "Cambiar empresa".',
          'Para cambiar sus módulos después: "Clientes de la firma" → botón "Módulos" del cliente.',
          'Para pasarlo de jurídica a natural (o corregir el nombre o el DV): botón "Datos" del cliente. El NIT no se cambia.',
        ],
        notas: [
          'El logo, el contacto, la resolución DIAN y los rangos de numeración (factura y nómina) los cambia el administrador de la firma desde Mi perfil, dentro del cliente.',
        ],
      },
      {
        titulo: 'Factura electrónica, nómina electrónica y documento soporte de un gestionado',
        texto: [
          'Factus le entrega las credenciales a Aura, así que la firma no las digita: las pide y Aura las configura.',
        ],
        pasos: [
          '"Clientes de la firma" → botón "Electrónica" del cliente.',
          'Marque lo que necesita (factura electrónica de venta, nómina electrónica, documento soporte), escriba una observación si quiere y "Solicitar a Aura".',
          'Cuando Aura active la cuenta le llega el aviso en la campana. Si la rechaza, el aviso trae el motivo.',
          'Entre al cliente → Mi perfil y digite la resolución DIAN y los rangos de numeración. En "Electrónica" se ve qué falta.',
        ],
        notas: [
          'Solo hay una solicitud pendiente por cliente; se puede cancelar mientras Aura no responda.',
          'Si el cliente ya factura electrónicamente y ahora necesita la nómina electrónica, haga otra solicitud con ese documento.',
        ],
      },
      {
        titulo: 'Solicitudes: una empresa pide una firma',
        pasos: [
          'El administrador de la empresa va a Caja → Usuarios → "Solicitar firma", escribe el NIT de la firma, Buscar y "Enviar solicitud".',
          'La firma ve el aviso en la campana y en "Clientes de la firma" → Solicitudes de empresas: Aceptar o Rechazar (con motivo opcional).',
          'Al aceptar, la empresa queda como cliente de la firma (la empresa paga su licencia) y los contadores entran con "Contador externo".',
          'La empresa ve la respuesta en su campana durante 7 días.',
        ],
        notas: [
          'Si la empresa ya tiene una firma, primero debe quitarle el acceso y después solicitar otra.',
          'Solo hay una solicitud pendiente a la vez; se puede cancelar mientras la firma no responda.',
        ],
      },
      {
        titulo: 'Para el administrador del cliente',
        pasos: [
          'Caja → Usuarios: arriba de la lista aparece "Firma contable con acceso", con la firma y las personas de la firma que entran.',
          'Para que la firma facture ventas: Caja → Perfiles → "Contador externo" → active Ventas → Facturas.',
          'Para quitarle el acceso: botón "Quitar acceso". Sus sesiones abiertas en su empresa se cierran. Para volver a darlo, comuníquese con Aura.',
        ],
        notas: [
          'Lo que hace la firma queda en la Bitácora con el nombre de la persona y de la firma ("Ingresó Juan Pérez (Firma XYZ)").',
          'La firma no puede ver ni cambiar los usuarios ni las claves de su empresa.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Elija la empresa en la que va a trabajar',
        causa: 'Se intentó abrir una pantalla antes de elegir la empresa tras el ingreso.',
        solucion: 'Vuelva a ingresar y elija la empresa en "¿Dónde vas a trabajar?".',
      },
      {
        mensaje: 'Se acabó el tiempo',
        causa: 'Pasaron más de 2 minutos entre escribir la contraseña y elegir la empresa.',
        solucion: 'Vuelva a escribir la contraseña y elija la empresa.',
      },
      {
        mensaje: 'La empresa quitó el acceso de su firma contable',
        causa: 'El administrador del cliente (o Aura) quitó el acceso de la firma, o el administrador de la firma le quitó ese cliente.',
        solucion: 'Ingrese de nuevo y elija otra empresa. Si debía tener acceso, hable con el administrador de su firma.',
      },
      {
        mensaje: 'No tiene acceso a esa empresa',
        causa: 'El cliente ya no está asignado a su usuario o la firma ya no lo atiende.',
        solucion: 'Pida al administrador de su firma que revise sus clientes en Caja → Usuarios.',
      },
      {
        mensaje: 'Llegó al cupo de',
        causa: 'La firma ya tiene tantos clientes gestionados como su cupo permite.',
        solucion: 'Comuníquese con Aura para ampliar el cupo.',
      },
      {
        mensaje: 'Su empresa ya tiene una firma contable',
        causa: 'Se intentó solicitar una firma teniendo otra con acceso.',
        solucion: 'Caja → Usuarios → "Quitar acceso" a la firma actual y luego solicite la nueva.',
      },
      {
        mensaje: 'No hay una firma contable en Aura con ese NIT',
        causa: 'El NIT no corresponde a una firma contable activa en Aura.',
        solucion: 'Revise el NIT sin dígito de verificación, o pida a la firma que confirme que está en Aura.',
      },
      {
        mensaje: 'Ya existe una empresa en Aura con ese NIT',
        causa: 'Al crear un cliente gestionado, ese NIT ya es una empresa en Aura.',
        solucion: 'Si es la misma empresa, pídale que le envíe una solicitud desde Caja → Usuarios.',
      },
      {
        mensaje: 'Ya hay una solicitud pendiente para este cliente',
        causa: 'Ya se le pidió a Aura la activación electrónica de ese cliente y todavía no responde.',
        solucion: 'Espere el aviso en la campana, o cancele la solicitud en "Electrónica" y envíe una nueva.',
      },
      {
        mensaje: 'Esta empresa no tiene habilitada la facturación electrónica',
        causa: 'Aura todavía no ha configurado la cuenta de Factus de la empresa.',
        solucion: 'Si es un cliente gestionado, pídala en "Clientes de la firma" → "Electrónica". Si no, comuníquese con Aura.',
      },
      {
        mensaje: 'Para una persona natural escriba los nombres y los apellidos',
        causa: 'Se eligió persona natural sin nombres o sin apellidos.',
        solucion: 'Escriba los nombres y los apellidos como aparecen en el RUT o en la cédula.',
      },
      {
        mensaje: 'Una persona jurídica se identifica con NIT',
        causa: 'Se eligió persona jurídica con cédula u otro documento.',
        solucion: 'Cambie el tipo de documento a NIT, o elija persona natural.',
      },
      {
        mensaje: 'Solo un administrador de la empresa puede hacer esto',
        causa: 'Asignar clientes (en la firma) o quitar el acceso de la firma (en el cliente) lo hace un administrador.',
        solucion: 'Pida a un administrador que haga el cambio.',
      },
    ],
  },
  {
    id: 'errores-generales',
    grupo: 'Empezar',
    titulo: 'Errores que aparecen en cualquier módulo',
    icono: 'pi pi-exclamation-triangle',
    rutas: [],
    resumen:
      'Mensajes que no son de una pantalla en particular: períodos cerrados, fechas atrasadas, cajas sin abrir, cuentas contables mal elegidas y problemas de conexión.',
    secciones: [
      {
        titulo: 'Por qué el sistema bloquea algunas operaciones',
        texto: [
          'Aura cuida tres cosas que no se pueden descuadrar: el inventario (nunca queda negativo si el producto no lo permite), el efectivo de las cajas (lo que cuenta el cajero al cerrar) y la contabilidad (un mes cerrado ya se reportó). Casi todos los bloqueos protegen una de esas tres.',
          'El mensaje siempre dice qué hacer. Léalo completo antes de intentar de nuevo: suele indicar la pantalla donde se corrige.',
        ],
      },
      {
        titulo: 'Documentos con fecha atrasada',
        texto: [
          'Si registra un gasto, compra o pago con fecha de días anteriores y dice que salió de la caja, el sistema pide un motivo. Pasados los días permitidos, solo el rol autorizador (normalmente el administrador) puede cargarlo a la caja de hoy.',
          'La alternativa correcta suele ser registrarlo contra la caja menor, un banco o dejarlo como cuenta por pagar, o marcar "ya salió de la caja otro día" si ese dinero ya se descontó en un arqueo cerrado.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El período contable … está cerrado: no admite movimientos nuevos',
        causa: 'La fecha del documento cae en un mes que el contador ya cerró.',
        solucion:
          'Cambie la fecha del documento a un mes abierto o pida al contador que reabra el período en Contabilidad → Períodos Contables (queda registrado quién y por qué).',
      },
      {
        mensaje: 'La fecha … está muy adelante',
        causa: 'Se digitó una fecha futura lejana (por ejemplo, un año equivocado).',
        solucion: 'Revise el año y el mes de la fecha del documento.',
      },
      {
        mensaje: 'El … tiene N días de antigüedad y solo ADMIN puede cargarlo a la caja',
        causa: 'Documento viejo que se quiere pagar con el efectivo de la caja de hoy.',
        solucion:
          'Pida autorización al administrador, o regístrelo contra la caja menor, un banco o como cuenta por pagar. Si el dinero ya salió en un turno cerrado, marque "ya salió de la caja otro día".',
      },
      {
        mensaje: 'Explica por qué este … de hace N días se carga a la caja de hoy',
        causa: 'Falta el motivo de un documento con fecha anterior pagado desde caja.',
        solucion: 'Escriba el motivo en el campo "Motivo". Queda guardado en el documento para explicar el arqueo.',
      },
      {
        mensaje: 'No hay una caja abierta en la sucursal para registrar el … en efectivo',
        causa: 'Se eligió pagar en efectivo pero ninguna caja de la sucursal tiene turno abierto.',
        solucion:
          'Abra un turno en Caja → Turnos, o elija como origen una cuenta bancaria o una cuenta contable (por ejemplo la caja menor).',
      },
      {
        mensaje: 'Hay N cajas abiertas en la sucursal. Indique de cuál sale …',
        causa: 'Varias cajas tienen turno abierto y el sistema no sabe de cuál salió el dinero.',
        solucion: 'Elija la caja en el campo "¿De dónde sale la plata?" o use una cuenta bancaria o contable.',
      },
      {
        mensaje: 'La cuenta … tiene $X y el … necesita $Y. Reponga el fondo con un traslado',
        causa: 'La caja menor o cuenta de fondos elegida no tiene saldo suficiente.',
        solucion:
          'Registre un traslado de fondos (Tesorería → Traslados de Fondos) para reponer la caja menor y vuelva a intentar, o pague desde otra cuenta.',
      },
      {
        mensaje: 'La cuenta … no está habilitada como medio de pago',
        causa: 'La cuenta contable elegida como origen no tiene marcada la opción de medio de pago.',
        solucion:
          'En Contabilidad → Plan de Cuentas edite la cuenta y marque "Es medio de pago", o elija otra cuenta de origen.',
      },
      {
        mensaje: 'La cuenta … es una cuenta de agrupación y no admite movimientos',
        causa: 'Se eligió una cuenta padre (por ejemplo 1105) en lugar de una auxiliar (110505).',
        solucion: 'Elija la subcuenta auxiliar, la de último nivel.',
      },
      {
        mensaje: 'Stock insuficiente para: … Disponible: N',
        causa: 'Se intenta sacar más unidades de las que hay en la bodega (venta, merma, traslado, consumo).',
        solucion:
          'Revise el stock en Inventario → Stock. Si la mercancía sí está, falta registrar la compra o un reconteo. Si el producto se vende antes de comprarse (carnicerías), active "Permitir stock negativo" en el producto.',
      },
      {
        mensaje: 'El producto … no tiene inventario en la bodega …',
        causa: 'El producto nunca ha tenido movimientos en esa bodega.',
        solucion: 'Regístrele entrada con una compra o un traslado a esa bodega, o elija otra bodega.',
      },
      {
        mensaje: 'Error de conexión / el sistema no responde',
        causa: 'Internet caído o servidor en mantenimiento.',
        solucion:
          'Verifique la conexión y recargue la página (F5). No repita una venta o pago sin revisar primero el historial: puede haberse guardado antes del corte.',
      },
      {
        mensaje: '… no encontrado / no encontrada',
        causa: 'El registro fue eliminado, anulado o pertenece a otra empresa o sucursal.',
        solucion: 'Recargue la lista. Si persiste, verifique que está trabajando en la sucursal correcta.',
      },
    ],
  },
  {
    id: 'dashboard',
    grupo: 'Principal',
    titulo: 'Inicio (Dashboard)',
    icono: 'pi pi-home',
    rutas: ['/dashboard'],
    resumen:
      'La primera pantalla: el tablero de lo que usa su empresa, cómo va el negocio y qué falta configurar para operar.',
    secciones: [
      {
        titulo: 'Un tablero por línea de uso',
        texto: [
          'Cada empresa declara para qué usa Aura: Punto de venta, Comercial (factura y compra sin mostrador), Contabilidad o Nómina. Puede ser más de una.',
          'El Inicio muestra el tablero de esas líneas. Con varias, aparecen pestañas arriba; la última que abrió queda recordada.',
          'Contabilidad: disponible en caja y bancos, cuentas por cobrar y por pagar (con lo vencido) y el centro contable con el resultado del mes.',
          'La línea Contabilidad también factura: trae facturas de venta, notas crédito/débito, cotizaciones, compras y el catálogo para crear los servicios (un servicio es un producto con clasificación Servicio, que no maneja stock). No trae punto de venta, inventario, bodegas ni listas de precios: eso es de Punto de venta o Comercial.',
          'Si la empresa factura en otro sistema, no necesita esas pantallas: las ventas se traen con Importar datos o con notas contables.',
          'Comercial: lo facturado y comprado en el mes, cotizaciones abiertas, stock bajo y la misma cartera.',
          'Nómina: el centro de Recursos Humanos con el costo y el estado de la nómina.',
        ],
        notas: [
          'Las líneas las define el administrador de la plataforma al crear o editar la empresa.',
          'Una pestaña solo aparece si su perfil puede ver ese módulo.',
        ],
      },
      {
        titulo: 'Puesta en marcha',
        texto: [
          'Mientras falte algo por configurar, arriba aparece la tarjeta "Puesta en marcha" con los pasos pendientes de cada línea: plan de cuentas, parametrización contable, cuentas bancarias, saldos iniciales, configuración de nómina, afiliaciones, productos o servicios, rango de facturación electrónica, etc.',
          'Cada paso pendiente tiene un enlace "Resolver" que lleva a la pantalla donde se arregla. Cuando todo está listo, la tarjeta desaparece sola.',
        ],
      },
      {
        titulo: 'Tablero de punto de venta',
        texto: [
          'Ventas de hoy, ventas del mes, compras del mes e inventario a costo de la sucursal actual.',
          'Ventas de la semana (lunes a domingo), medios de pago del mes y el más usado.',
          'Vencimientos: lotes vencidos y por vencer en los próximos días, con botón "Dar de baja ahora" que abre la merma.',
          'Stock bajo: productos por debajo del mínimo configurado en Inventario → Stock.',
          'Más vendidos del mes, últimas ventas y últimos movimientos del kardex.',
        ],
        notas: [
          'Los accesos rápidos "Nueva venta", "Compra" y "Merma" llevan directo a esos formularios.',
          'Las cifras son de la sucursal en la que está trabajando. Para ver otra, cámbiela en Mi perfil.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Puesta en marcha: "Plan de cuentas cargado" sigue pendiente',
        causa: 'La empresa no tiene plan de cuentas.',
        solucion: 'Cárguelo en Contabilidad → Plan de cuentas o impórtelo desde Contabilidad → Importar datos. Si la empresa es nueva, el administrador de la plataforma puede usar "Cargar ahora" en la ficha de la empresa.',
      },
      {
        mensaje: 'El dashboard sale en ceros',
        causa: 'No hay ventas en la sucursal actual o está trabajando en otra sucursal.',
        solucion: 'Revise la sucursal en Mi perfil.',
      },
      {
        mensaje: 'Un producto aparece en stock bajo aunque hay mercancía',
        causa: 'El stock mínimo configurado es mayor que el stock real, o la mercancía está en otra bodega.',
        solucion: 'Ajuste el stock mínimo en Inventario → Stock (lápiz del producto).',
      },
    ],
  },
];
