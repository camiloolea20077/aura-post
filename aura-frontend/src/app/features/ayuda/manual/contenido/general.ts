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
          'Un administrador puede editar ahí el teléfono, correo, dirección y municipio de la empresa: son los datos que salen en la factura. La razón social y el NIT no se cambian desde esta pantalla.',
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
        mensaje: 'Solo un administrador puede cambiar los datos de la empresa',
        causa: 'Un usuario sin rol de administrador intentó editar los datos de la empresa en Mi perfil.',
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
          'Mientras falte algo por configurar, arriba aparece la tarjeta "Puesta en marcha" con los pasos pendientes de cada línea: plan de cuentas, parametrización contable, cuentas bancarias, saldos iniciales, configuración de nómina, afiliaciones, productos, etc.',
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
