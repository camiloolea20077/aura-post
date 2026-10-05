import { ManualError, ManualModulo } from '../manual.model';

const CUENTA_ERRORES: ManualError[] = [
  {
    mensaje: 'Línea N: la cuenta … no es de movimiento. Elija una cuenta auxiliar (último nivel)',
    causa: 'Se eligió una cuenta de agrupación.',
    solucion: 'Elija la subcuenta auxiliar.',
  },
  {
    mensaje: 'Línea N: la cuenta … está inactiva',
    causa: 'La cuenta fue desactivada en el plan de cuentas.',
    solucion: 'Actívela o use otra.',
  },
  {
    mensaje: 'Línea N: tiene débito y crédito a la vez',
    causa: 'Una misma línea con los dos valores.',
    solucion: 'Use una línea para cada lado.',
  },
];

export const CONTABILIDAD: ManualModulo[] = [
  {
    id: 'centro-contabilidad',
    grupo: 'Contabilidad',
    titulo: 'Centro de Contabilidad',
    icono: 'pi pi-th-large',
    rutas: ['/contabilidad'],
    resumen:
      'La entrada al módulo: el resumen del mes desde el mayor y el acceso a todas las pantallas contables.',
    secciones: [
      {
        titulo: 'Cómo se llega',
        texto: [
          'En el menú lateral, "Contabilidad" ya no despliega sus pantallas: abre este centro. Desde cualquier pantalla contable, el botón "Volver a Contabilidad" (arriba a la izquierda) regresa aquí.',
        ],
      },
      {
        titulo: 'Qué muestra',
        texto: [
          'Arriba, los indicadores del mes elegido: ingresos, costos y gastos, utilidad (o pérdida) y comprobantes, con la variación frente al mes anterior. Salen del mayor: solo cuentan los asientos contabilizados, sin los de cierre.',
          'Debajo, los módulos agrupados (Operación contable, Cierre y resultados, Tributario, Tesorería y activos) con un buscador. Solo aparecen las pantallas que el usuario tiene habilitadas.',
          'Al final, el resultado mes a mes del año, el estado contable (período, comprobantes en borrador, conciliaciones abiertas, cierre anual) y la distribución de los gastos del mes.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'No hay información contable disponible para el período seleccionado',
        causa: 'El mes no tiene asientos contabilizados (o están en borrador).',
        solucion: 'Elija otro mes o apruebe los borradores en Revisión de Comprobantes.',
      },
      {
        mensaje: 'No fue posible cargar el resumen contable',
        causa: 'Fallo de conexión con el servidor.',
        solucion: 'Use "Reintentar". Los módulos siguen disponibles abajo.',
      },
    ],
  },
  {
    id: 'contabilidad-como-funciona',
    grupo: 'Contabilidad',
    titulo: 'Cómo funciona la contabilidad en Aura',
    icono: 'pi pi-book',
    rutas: [],
    resumen:
      'La contabilidad se genera sola desde la operación. El contador revisa, ajusta con notas y cierra los meses.',
    secciones: [
      {
        titulo: 'Asientos automáticos',
        texto: [
          'Cada venta, compra, gasto, abono, recibo, merma, obsequio, consumo interno, traslado de fondos, nómina y depreciación genera su asiento contable al guardarse, con las cuentas de la categoría contable del producto, de la forma de pago y de la configuración de la empresa.',
          'Al anular un documento se registra el asiento inverso (reversión). El original no se borra: los dos suman cero en los informes.',
          'Si la empresa trabaja en modo revisión, los asientos automáticos quedan en BORRADOR hasta que el contador los aprueba en Revisión de Comprobantes. Los borradores no salen en los informes oficiales.',
        ],
      },
      {
        titulo: 'Configuración mínima',
        pasos: [
          'Cargar el PUC (Plan de Cuentas → Cargar PUC completo).',
          'Asociar cada cuenta bancaria a su cuenta 11xx (Tesorería → Cuentas Bancarias).',
          'Marcar la caja menor y fondos como medio de pago en el plan de cuentas.',
          'Crear conceptos de caja para los ingresos y egresos del cajero.',
          'Cargar los saldos iniciales.',
          'Configurar las tarifas de retención.',
        ],
      },
      {
        titulo: 'Períodos',
        texto: [
          'Cada mes es un período. Se abre solo cuando entra su primer documento. Cuando el contador lo cierra, ya no admite documentos con fechas de ese mes.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Un documento no aparece en los informes contables',
        causa: 'Su asiento está en BORRADOR (modo revisión) o se anuló.',
        solucion: 'Apruébelo en Contabilidad → Revisión de Comprobantes.',
      },
      {
        mensaje: 'El período contable … está cerrado: no admite documentos nuevos',
        causa: 'La fecha del documento (compra, gasto, devolución, abono, recibo, egreso, recaudo o traslado de fondos) cae en un mes que el contador ya cerró.',
        solucion: 'Corrija la fecha del documento o reabra el período en Contabilidad → Períodos contables.',
      },
      {
        mensaje: 'El comprobante … está en un período cerrado. Anularlo cambiaría saldos ya reportados',
        causa: 'Se intenta anular un documento de un mes cerrado.',
        solucion: 'Reabra el período o registre una nota de ajuste en un mes abierto.',
      },
      {
        mensaje: '… cuyo turno ya está cerrado. Corríjalo con un ajuste retroactivo de caja',
        causa: 'El documento movió efectivo de un turno que ya se contó.',
        solucion: 'Use "Corregir arqueo" en Caja → Turnos.',
      },
    ],
  },
  {
    id: 'plan-cuentas',
    grupo: 'Contabilidad',
    titulo: 'Plan de cuentas (PUC)',
    icono: 'pi pi-sitemap',
    rutas: ['/contabilidad/plan-cuentas'],
    resumen: 'El catálogo de cuentas contables de la empresa.',
    secciones: [
      {
        titulo: 'Ver el plan en árbol',
        pasos: [
          'Las cuentas se ven en árbol: clase (1 Activo) → grupo (11 Disponible) → cuenta (1105 Caja) → subcuenta (110505 Caja general) → auxiliar (11050501).',
          'Clic en la flecha de una cuenta para desplegar sus cuentas asociadas ahí mismo. "Abrir hasta" despliega de una vez hasta clases, grupos, cuentas, subcuentas o todo.',
          'El buscador encuentra por código (empieza por) o por nombre y abre el camino hasta cada coincidencia.',
          'La columna Movimiento dice si la cuenta recibe asientos (✓) o solo agrupa (—).',
        ],
      },
      {
        titulo: 'Buscar una cuenta en cualquier pantalla',
        pasos: [
          'Todo campo de cuenta contable (configuración, formas de pago, productos, gastos, notas, asientos, libros, balance…) funciona igual: escriba el código o parte del nombre y elija de la lista.',
          'La lupa dentro del campo abre el buscador avanzado: código, nombre, clase, tipo, naturaleza y si recibe movimiento, con el camino de cada cuenta (clase › grupo › cuenta).',
          'Si el campo necesita una cuenta que reciba movimiento, las que solo agrupan salen en gris: al hacer clic se muestran sus subcuentas.',
          'En los filtros "cuenta desde / hasta" de los reportes se puede elegir una cuenta o escribir un prefijo (p. ej. 13).',
        ],
      },
      {
        titulo: 'Cargar y crear cuentas',
        pasos: [
          '"Cargar PUC completo" agrega el plan de cuentas completo: clases 1 a 9 con sus grupos, cuentas, subcuentas y auxiliares de 8 dígitos (unas 1.100 cuentas). Solo agrega las que falten: las que ya tiene no cambian.',
          'En una empresa nueva, la configuración por defecto queda en las auxiliares: la caja en 11050501, clientes en 13050501, ventas en 41350101, IVA generado en 24080501, inventario en 14350501, costo en 61010501, etc.',
          'En cada fila, el "+" agrega una subcuenta debajo de esa cuenta (hereda tipo y naturaleza; el código empieza como el del padre). Así se crean los auxiliares de 8 dígitos, p. ej. 11100501 Banco de Bogotá.',
          '"Nueva Cuenta": código (1105), nombre, tipo (Activo, Pasivo, Patrimonio, Ingreso, Gasto, Costo, Orden), naturaleza (Débito o Crédito), nivel y cuenta padre.',
          'Homologación DIAN (opcional) para la exógena.',
          '"Cuenta auxiliar (acepta movimientos)": solo las auxiliares reciben asientos; las demás agrupan.',
          '"Es medio de pago" (solo auxiliares): la cuenta aparece como origen o destino en gastos, compras, pagos y traslados de fondos. Márquelo en cajas menores, bancos y fondos por legalizar.',
        ],
        notas: [
          'Desactivar una cuenta la oculta de los formularios pero conserva su historia.',
          'Al cargar el PUC completo, las cuentas nuevas reciben movimiento solo si son la última del árbol (subcuenta sin hijas).',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'La cuenta no aparece al registrar un gasto o traslado',
        causa: 'No es auxiliar o no está marcada como medio de pago.',
        solucion: 'Edítela y marque "Cuenta auxiliar" y "Es medio de pago".',
      },
      {
        mensaje: 'Ya existe una cuenta con el código …',
        causa: 'Código repetido.',
        solucion: 'Use otro código o edite la existente.',
      },
    ],
  },
  {
    id: 'asientos',
    grupo: 'Contabilidad',
    titulo: 'Asientos contables',
    icono: 'pi pi-list',
    rutas: ['/contabilidad/asientos'],
    resumen:
      'Todos los comprobantes contables con su detalle, más Estado de Resultados, Libro Mayor, Flujo de Caja y Balance en pestañas.',
    secciones: [
      {
        titulo: 'Qué hay en cada pestaña',
        texto: [
          'Libro Diario: los asientos del rango con origen, comprobante, fecha, débito, crédito y estado. "Ver detalle" muestra las líneas con tercero y centro de costo. "Anular" registra la reversión del asiento (los asientos de documentos se anulan desde su documento).',
          'Estado de Resultados: ingresos, costo de ventas, utilidad bruta, gastos y utilidad neta del período.',
          'Libro Mayor: movimientos y saldo de una cuenta.',
          'Flujo de Caja: saldo inicial, ingresos, egresos, saldo final y cuentas por cobrar y pagar del período.',
          'Balance General: activos, pasivos, patrimonio y resultado, con la ecuación contable.',
        ],
      },
      {
        titulo: 'Asiento manual',
        texto: [
          'Para ajustes del contador use Notas Contables: tienen borrador, soportes, plantillas y reversión.',
        ],
      },
    ],
    errores: [...CUENTA_ERRORES],
  },
  {
    id: 'notas-contables',
    grupo: 'Contabilidad',
    titulo: 'Notas contables (comprobante de diario)',
    icono: 'pi pi-pencil',
    rutas: ['/contabilidad/notas'],
    resumen:
      'Ajustes, provisiones y reclasificaciones del contador, con borrador, soportes adjuntos, plantillas recurrentes, reversión y PDF con firmas.',
    secciones: [
      {
        titulo: 'Crear una nota',
        pasos: [
          'Nueva nota → fecha, clasificación y concepto (Provisión de servicios públicos de septiembre).',
          'Agregue líneas: cuenta auxiliar, tercero, centro de costo, descripción, débito o crédito. La línea nueva trae la diferencia para cuadrar.',
          '"Pegar desde Excel": copie filas con Cuenta, Tercero (NIT), Centro de costo, Descripción, Débito, Crédito.',
          '"Usar plantilla" carga una nota guardada.',
          'Guardar borrador (se guarda aunque esté descuadrada) o "Guardar y contabilizar" (debe cuadrar). El consecutivo CD se asigna al contabilizar.',
          'Adjunte soportes (PDF, imágenes, Excel o Word hasta 10 MB) una vez guardada.',
        ],
        notas: [
          '"¿Se reversa sola el día 1 del mes siguiente?": útil para provisiones que se reemplazan cuando llega la factura.',
        ],
      },
      {
        titulo: 'Corregir una nota',
        texto: [
          'Borrador: se edita o se elimina.',
          'Contabilizada: no se elimina. "Anular" (con motivo, solo si su período está abierto) o "Reversar" (registra la nota inversa en un mes abierto; sirve aunque el mes original esté cerrado).',
        ],
      },
      {
        titulo: 'Plantillas',
        texto: [
          'Desde una nota, guarde sus líneas como plantilla. Una plantilla puede repetirse cada mes en un día: ese día el sistema deja la nota en borrador para que el contador la revise y contabilice. Nunca se contabiliza sola.',
        ],
      },
    ],
    errores: [
      ...CUENTA_ERRORES,
      {
        mensaje: 'La nota necesita al menos dos líneas: una al débito y otra al crédito',
        causa: 'Nota con una sola línea.',
        solucion: 'Agregue la contrapartida.',
      },
      {
        mensaje: 'Línea N: no tiene valor',
        causa: 'Línea vacía.',
        solucion: 'Digite el débito o el crédito, o quítela.',
      },
      {
        mensaje: 'La nota … ya está contabilizada: no se elimina, se anula con motivo',
        causa: 'Intento de eliminar una nota contabilizada.',
        solucion: 'Anúlela o revérsela.',
      },
      {
        mensaje: 'Un borrador no se anula: todavía no afecta la contabilidad. Elimínelo',
        causa: 'Intento de anular un borrador.',
        solucion: 'Use Eliminar borrador.',
      },
      {
        mensaje: 'La nota … fue reversada por … Anule primero la reversión',
        causa: 'La nota tiene una reversión vigente.',
        solucion: 'Anule la reversión antes.',
      },
      {
        mensaje: 'La reversión no puede tener fecha anterior a la nota que reversa',
        causa: 'Fecha de reversión inválida.',
        solucion: 'Use una fecha igual o posterior.',
      },
      {
        mensaje: 'La nota ya tiene N soportes, que es el máximo',
        causa: 'Límite de adjuntos.',
        solucion: 'Una varios documentos en un PDF.',
      },
    ],
  },
  {
    id: 'revision-comprobantes',
    grupo: 'Contabilidad',
    titulo: 'Revisión de comprobantes',
    icono: 'pi pi-inbox',
    rutas: ['/contabilidad/revision'],
    resumen:
      'La bandeja del contador: aprobar los asientos automáticos en borrador para que entren a los informes, y detectar comprobantes descuadrados.',
    secciones: [
      {
        titulo: 'Aprobar borradores',
        pasos: [
          'Pestaña "Pendientes de aprobar": filtre por fechas y tipo de origen.',
          '"Ver detalle" para revisar las líneas; "Contabilizar" aprueba uno; "Aprobar en bloque" aprueba todos los filtrados.',
        ],
      },
      {
        titulo: 'Descuadrados',
        texto: [
          'Red de seguridad: lista comprobantes con débito distinto de crédito. Debería estar vacía; si aparece alguno, revíselo antes de cerrar el mes.',
        ],
      },
      {
        titulo: 'Sin asiento',
        texto: [
          'Lista las ventas, compras, gastos, devoluciones, mermas, obsequios y consumos internos del rango que no quedaron en el mayor (su asiento falló después de guardarlos, por ejemplo por una cuenta sin configurar) o que quedaron contados dos veces.',
        ],
        pasos: [
          'Elija el rango y pulse "Revisar".',
          '"Sin asiento": corrija la causa (cuenta, categoría contable, período) y pulse "Reprocesar". Si vuelve a fallar, el mensaje dice por qué.',
          '"N asientos (duplicado)": abra el documento en Asientos Contables y reverse el asiento que sobra.',
        ],
        notas: ['Revise esta pestaña antes de cerrar cada mes.'],
      },
    ],
    errores: [
      {
        mensaje: 'No hay reproceso automático para documentos de tipo …',
        causa: 'Ese tipo de documento no se puede recontabilizar desde aquí.',
        solucion: 'Registre el asiento con una nota contable o anule y registre de nuevo el documento.',
      },
      {
        mensaje: 'El documento ya tenía asiento',
        causa: 'Otro proceso lo contabilizó mientras tanto.',
        solucion: 'No hay nada que hacer: vuelva a pulsar "Revisar".',
      },
      {
        mensaje: 'El período del comprobante … está cerrado: no se puede contabilizar el borrador',
        causa: 'El borrador es de un mes cerrado.',
        solucion: 'Reabra el período, contabilice y vuelva a cerrar.',
      },
    ],
  },
  {
    id: 'conceptos-caja',
    grupo: 'Contabilidad',
    titulo: 'Conceptos de caja',
    icono: 'pi pi-tags',
    rutas: ['/contabilidad/conceptos-caja'],
    resumen:
      'Nombres amigables para los ingresos y egresos que registra el cajero (Matada de cerdo, Compra de jugos), cada uno con su cuenta contable.',
    secciones: [
      {
        titulo: 'Crear un concepto',
        pasos: [
          'Nuevo concepto → nombre, tipo (ingreso o egreso) y cuenta contable.',
          'La cuenta elegida es la contrapartida del asiento; la otra línea es la caja.',
          'Guarde. El cajero lo verá en "Ing / Egr" del POS.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El cajero no ve el concepto',
        causa: 'El concepto es del otro tipo (ingreso vs egreso) o fue eliminado.',
        solucion: 'Revise el tipo del concepto.',
      },
    ],
  },
  {
    id: 'saldos-iniciales',
    grupo: 'Contabilidad',
    titulo: 'Saldos iniciales (apertura)',
    icono: 'pi pi-flag-fill',
    rutas: ['/contabilidad/saldos-iniciales'],
    resumen: 'Los saldos contables con los que la empresa migra al sistema.',
    secciones: [
      {
        titulo: 'Cargar la apertura',
        pasos: [
          'Fecha de apertura y cuenta para la diferencia (por defecto resultados de ejercicios anteriores).',
          '"Traer saldos desde": Bancos, Inventario (valorizado al costo promedio), Activos fijos (costo y depreciación acumulada de las fichas), Diferidos, Cartera (por cliente) y Proveedores (por proveedor). Cada botón agrega sus líneas; al tocarlo de nuevo se quitan.',
          '"Agregar cuenta" para lo demás: cuenta y saldo en su naturaleza (un valor negativo va al lado contrario).',
          '"Guardar apertura". Si no cuadra, pregunta si la diferencia es patrimonio antes de llevarla a la cuenta de ajuste. Para corregir use "Rehacer".',
        ],
        notas: [
          'Traer los saldos de los auxiliares asegura que la contabilidad abra con lo mismo que dicen el inventario, las fichas de activos y la cartera.',
          'Para cargar muchas cuentas use Importar Datos.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Los saldos no cuadran: débitos …, créditos …, diferencia … Revise los saldos o confirme que la diferencia es patrimonio.',
        causa: 'Se guardó sin confirmar que la diferencia es patrimonio.',
        solucion: 'Revise los saldos o confirme la pregunta al guardar.',
      },
      {
        mensaje: 'Ya existe un asiento de apertura. Elimínalo para volver a cargar los saldos iniciales.',
        causa: 'La empresa ya tiene apertura.',
        solucion: 'Use "Rehacer" (solo si no hay otros asientos).',
      },
      {
        mensaje: 'El período contable … está cerrado',
        causa: 'La fecha de apertura cae en un mes cerrado.',
        solucion: 'Use otra fecha o reabra el período.',
      },
    ],
  },
  {
    id: 'centros-costo',
    grupo: 'Contabilidad',
    titulo: 'Centros de costo',
    icono: 'pi pi-th-large',
    rutas: ['/contabilidad/centros-costo'],
    resumen: 'Unidades de análisis (sedes, áreas, proyectos) para repartir gastos e ingresos.',
    secciones: [
      {
        titulo: 'Crear',
        pasos: [
          'Nuevo Centro → código (ADM-001), nombre, tipo, centro padre (vacío = raíz), presupuesto asignado, si permite movimientos y descripción.',
          'Se eligen en las líneas de notas contables y comprobantes.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Ya existe un centro de costo con el código / nombre …',
        causa: 'Repetido.',
        solucion: 'Use otro.',
      },
      {
        mensaje: 'No se puede eliminar este centro de costo porque tiene centros de costo hijos',
        causa: 'Tiene hijos.',
        solucion: 'Mueva o elimine primero los hijos.',
      },
    ],
  },
  {
    id: 'periodos-contables',
    grupo: 'Contabilidad',
    titulo: 'Períodos contables (cierre de mes)',
    icono: 'pi pi-lock',
    rutas: ['/contabilidad/periodos'],
    resumen: 'Cerrar y reabrir meses, y generar el balance de comprobación.',
    secciones: [
      {
        titulo: 'Cerrar un mes',
        pasos: [
          'Revise que no haya comprobantes en borrador (la columna "borr." los cuenta) ni descuadrados.',
          'Concilie y cierre los extractos bancarios del mes.',
          'Cierre el período. Se generan el asiento de cancelación de resultados y la reclasificación de sobregiros, fechados el último día del mes.',
        ],
        notas: [
          'Se cierra en orden: primero los meses anteriores que sigan abiertos.',
          '"Abrir Período" solo hace falta para adelantarse a un mes: el mes en curso se abre solo.',
        ],
      },
      {
        titulo: 'Reabrir',
        texto: [
          '"Reabrir período" con motivo (faltó registrar una factura…). Se anulan los asientos que generó su cierre y queda registrado quién y por qué. Después hay que volver a cerrarlo.',
          'Para reabrir un mes hay que reabrir primero los meses cerrados posteriores.',
        ],
      },
      {
        titulo: 'Balance de comprobación',
        texto: ['Elija el período y Generar: débitos, créditos y saldo por cuenta, con totales.'],
      },
    ],
    errores: [
      {
        mensaje: 'No se puede cerrar el período: hay comprobantes en BORRADOR pendientes de aprobación',
        causa: 'Borradores en el mes.',
        solucion: 'Contabilícelos en Revisión de Comprobantes y las notas en Notas Contables, o anúlelos.',
      },
      {
        mensaje: 'No se puede cerrar el período: hay extractos bancarios … sin conciliar',
        causa: 'Extractos abiertos del mes.',
        solucion: 'Concilie y cierre los extractos, o elimínelos si se crearon por error.',
      },
      {
        mensaje: 'No se puede cerrar el período. Los siguientes comprobantes no cuadran',
        causa: 'Asientos con débito distinto de crédito.',
        solucion: 'Corríjalos (pestaña Descuadrados de Revisión de Comprobantes).',
      },
      {
        mensaje: 'Antes de cerrar … debe cerrar … y los demás meses anteriores',
        causa: 'Hay meses anteriores abiertos.',
        solucion: 'Ciérrelos en orden.',
      },
      {
        mensaje: 'Para reabrir … primero debe reabrir …',
        causa: 'Hay meses posteriores cerrados.',
        solucion: 'Reabra desde el más reciente hacia atrás.',
      },
      {
        mensaje: 'El año … ya tiene cierre fiscal',
        causa: 'Hay provisión de renta o traslado de utilidad registrados.',
        solucion: 'Deshágalos en Cierre Anual antes de reabrir.',
      },
      {
        mensaje: 'No se puede abrir … todavía: como máximo se abre hasta …',
        causa: 'Intento de abrir un mes muy adelantado.',
        solucion: 'Espere o abra el mes siguiente al actual.',
      },
    ],
  },
  {
    id: 'resultados-periodo',
    grupo: 'Contabilidad',
    titulo: 'Resultados del período',
    icono: 'pi pi-chart-bar',
    rutas: ['/contabilidad/cierre'],
    resumen:
      'Qué pasó entre dos fechas: qué se vendió, qué costó y qué quedó, en lenguaje de negocio. No es el cierre formal (ese se hace en Períodos Contables).',
    secciones: [
      {
        titulo: 'Qué muestra',
        texto: [
          'Ventas sin IVA, costo de lo vendido (más mermas), gastos, utilidad neta y margen.',
          'La cascada "En qué se convirtió la venta", los medios de pago, en qué se fue el gasto y el estado de resultados detallado.',
          'Cartera y caja: lo que le deben, lo que debe, ingresos y egresos de caja y el disponible.',
          'Excel exporta el informe.',
        ],
        notas: [
          'Si dice que hay ítems vendidos sin costo configurado, el margen sale inflado: cargue el costo en Productos.',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'balance-general',
    grupo: 'Contabilidad',
    titulo: 'Balance general',
    icono: 'pi pi-align-justify',
    rutas: ['/contabilidad/balance-general'],
    resumen: 'Estado de situación financiera a una fecha de corte, con detalle por cuenta y PDF.',
    secciones: [
      {
        titulo: 'Generar',
        pasos: [
          'Elija la fecha de corte y Generar.',
          'Revise Activo, Pasivo y Patrimonio. Abajo dice si el balance cuadra.',
          'Descargar PDF.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Descuadre de $X entre Activo y Pasivo + Patrimonio',
        causa: 'Comprobantes en borrador o asientos descuadrados.',
        solucion: 'Revise Revisión de Comprobantes (pendientes y descuadrados).',
      },
    ],
  },
  {
    id: 'balance-prueba',
    grupo: 'Contabilidad',
    titulo: 'Balance de prueba',
    icono: 'pi pi-list-check',
    rutas: ['/contabilidad/balance-prueba'],
    resumen: 'Saldo anterior, débitos, créditos y saldo final por cuenta, con comparativo mes o año.',
    secciones: [
      {
        titulo: 'Cómo leerlo',
        texto: [
          'Elija el rango, el nivel (clase, grupo, cuenta, subcuenta o auxiliar), un rango de cuentas y, si quiere, un tercero.',
          'Los saldos van en la naturaleza de cada cuenta: un activo con saldo débito y un pasivo con saldo crédito se ven positivos.',
          'Arriba avisa si los débitos y créditos del período cuadran. Si no, hay asientos descuadrados que revisar.',
          '"Comparar con" agrega el saldo del mes anterior o del mismo período del año anterior, la variación y el porcentaje.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El rango de fechas no es válido',
        causa: 'La fecha inicial es posterior a la final.',
        solucion: 'Corrija las fechas.',
      },
    ],
  },
  {
    id: 'libros-contables',
    grupo: 'Contabilidad',
    titulo: 'Libros contables',
    icono: 'pi pi-book',
    rutas: ['/contabilidad/libros'],
    resumen: 'Auxiliar por tercero y libro diario, listos para revisar o exportar a Excel.',
    secciones: [
      {
        titulo: 'Auxiliar por tercero',
        pasos: [
          'Desde y hasta, cuenta desde y hasta (13 trae todo lo que empieza por 13), tercero (o todos) y vista Resumido o Detallado.',
          'Generar: saldo anterior, débitos, créditos y saldo por cuenta y tercero.',
          'Excel.',
        ],
        notas: [
          'Los saldos van según la naturaleza de la cuenta: en pasivos e ingresos, positivo es lo que se debe o se ganó.',
        ],
      },
      {
        titulo: 'Libro diario',
        texto: ['Todos los comprobantes contabilizados del rango con sus líneas y totales. Máximo un año por consulta.'],
      },
    ],
    errores: [
      {
        mensaje: 'El libro diario se consulta por máximo un año. Divida el rango',
        causa: 'Rango mayor a un año.',
        solucion: 'Consulte por partes.',
      },
      {
        mensaje: 'La fecha inicial es posterior a la final',
        causa: 'Fechas invertidas.',
        solucion: 'Corríjalas.',
      },
    ],
  },
  {
    id: 'declaraciones',
    grupo: 'Contabilidad',
    titulo: 'Borradores de declaraciones',
    icono: 'pi pi-file-export',
    rutas: ['/contabilidad/declaraciones'],
    resumen:
      'IVA (formulario 300) y retención en la fuente (350) leídos de la contabilidad, para trasladarlos al formulario de la DIAN.',
    secciones: [
      {
        titulo: 'Generar',
        pasos: [
          'Elija la pestaña IVA (300) o Retención en la fuente (350).',
          'Periodicidad, año y período (mes, bimestre o cuatrimestre).',
          'Generar: renglones con su valor, bases por tarifa según los documentos y el detalle de cuentas y documentos.',
          'Excel para trabajarlo o archivarlo.',
        ],
        notas: [
          'Es un borrador: el contador lo revisa y lo presenta en la DIAN. Los renglones "Informativo" no entran al resultado.',
          'Las retenciones que le hicieron los clientes (registradas al recibir el pago) salen como anticipos a favor.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Indique el período (desde y hasta)',
        causa: 'Falta el período.',
        solucion: 'Elija año y período.',
      },
      {
        mensaje: 'Sin movimientos',
        causa: 'No hay asientos contabilizados en esas cuentas.',
        solucion: 'Verifique que los borradores del período estén aprobados.',
      },
    ],
  },
  {
    id: 'importar-datos',
    grupo: 'Contabilidad',
    titulo: 'Importar datos desde Excel',
    icono: 'pi pi-upload',
    rutas: ['/contabilidad/importar'],
    resumen:
      'Migrar una empresa desde otro software: plan de cuentas, terceros, saldos iniciales y cartera o cuentas por pagar abiertas.',
    secciones: [
      {
        titulo: 'Cómo importar',
        pasos: [
          'Cargue los pasos en orden: plan de cuentas → terceros → saldos → documentos abiertos.',
          '"Descargar plantilla" de cada paso y llénela sin cambiar las columnas.',
          'Suba el archivo y presione Validar. El sistema revisa cada fila y marca los errores.',
          'Corrija el Excel y valide de nuevo hasta que no haya errores.',
          'Importar. Muestra cuántos fueron nuevos y cuántos ya existían.',
        ],
        notas: [
          'Para saldos: fecha de apertura y cuenta de ajuste (por defecto 3705).',
          'Para documentos: elija "Cartera de clientes" o "Cuentas por pagar a proveedores".',
          'Los registros que ya existen no se duplican.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Al archivo le faltan columnas obligatorias: …',
        causa: 'El Excel no sigue la plantilla.',
        solucion: 'Descargue la plantilla y copie los datos en ella.',
      },
      {
        mensaje: 'El archivo tiene N error(es): corríjalos y valide de nuevo antes de importar',
        causa: 'Hay filas con error.',
        solucion: 'Revise la columna Detalle de cada fila marcada.',
      },
      {
        mensaje: 'No hay filas nuevas para importar',
        causa: 'Todo ya existe en el sistema.',
        solucion: 'Nada que hacer.',
      },
    ],
  },
  {
    id: 'estado-cuenta',
    grupo: 'Contabilidad',
    titulo: 'Estado de cuenta de un cliente o proveedor',
    icono: 'pi pi-id-card',
    rutas: ['/contabilidad/estado-cuenta'],
    resumen: 'El historial de cargos y abonos de un tercero con saldo acumulado, y su PDF.',
    secciones: [
      {
        titulo: 'Consultar',
        pasos: [
          'Busque el cliente o proveedor.',
          'Fechas opcionales y Consultar.',
          'Revise total ventas, deuda en crédito, total abonado y saldo pendiente, y los movimientos con saldo acumulado.',
          'PDF para enviarlo al tercero.',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'reporte-iva',
    grupo: 'Contabilidad',
    titulo: 'Reporte de IVA',
    icono: 'pi pi-percentage',
    rutas: ['/contabilidad/reporte-iva'],
    resumen: 'IVA generado en ventas contra IVA descontable en compras en un rango.',
    secciones: [
      {
        titulo: 'Leerlo',
        texto: [
          'Si el IVA neto es positivo, es lo que se paga al Estado. Si es negativo, es un saldo a favor que se descuenta el período siguiente.',
          'Para el formulario 300 completo use Declaraciones.',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'gastos',
    grupo: 'Contabilidad',
    titulo: 'Gastos',
    icono: 'pi pi-wallet',
    rutas: ['/gastos', '/gastos/nuevo'],
    resumen:
      'Registrar gastos del negocio (arriendo, servicios, papelería) con su soporte, impuestos, retenciones y de dónde salió la plata.',
    secciones: [
      {
        titulo: 'Registrar un gasto',
        pasos: [
          'Registrar gasto → sucursal, categoría, monto y fecha.',
          'Tipo fiscal: Deducible (resta en renta) o No deducible.',
          'Tipo y número de documento, descripción y proveedor o tercero.',
          'Cuenta contable del gasto.',
          '¿De dónde sale la plata? "No se ha pagado" (crea una cuenta por pagar; el tercero es obligatorio), Caja, Banco, Otra cuenta (caja menor) o "Ya salió de la caja".',
          'IVA (base, tarifa, valor), Retefuente y ReteICA (tarifa por mil) si aplican.',
          'Guarde.',
        ],
        notas: [
          'Para proveedores no obligados a facturar, emita el documento soporte desde la lista de gastos.',
        ],
      },
      {
        titulo: 'Editar y anular',
        texto: [
          'Editar sirve para corregir datos contables: cuenta del gasto, centro de costo, IVA, retenciones, categoría o descripción. El asiento se rehace solo.',
          'El valor, la fecha y la forma de pago no se editan, porque ya movieron dinero: anule el gasto y regístrelo de nuevo.',
          'Anular devuelve el dinero a la caja (en el turno abierto de hoy) o al banco, anula la cuenta por pagar si era a crédito y reversa el asiento.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Un gasto a crédito necesita el tercero al que se le queda debiendo',
        causa: 'Gasto sin pagar y sin tercero.',
        solucion: 'Elija el proveedor o tercero.',
      },
      {
        mensaje: 'La cuenta … tiene $X y el gasto necesita $Y',
        causa: 'Caja menor sin saldo.',
        solucion: 'Reponga la caja menor con un traslado de fondos.',
      },
      {
        mensaje: 'No hay cuentas habilitadas como medio de pago',
        causa: 'Ninguna cuenta está marcada como medio de pago.',
        solucion: 'Marque la caja menor en el plan de cuentas.',
      },
      {
        mensaje: 'El valor, la fecha y la forma de pago de un gasto no se editan: anúlelo y regístrelo de nuevo',
        causa: 'Se intentó cambiar un dato que ya movió dinero.',
        solucion: 'Anule el gasto y regístrelo de nuevo con los datos correctos.',
      },
      {
        mensaje: 'La cuenta por pagar de este gasto ya tiene abonos: anule los abonos antes de anular el gasto',
        causa: 'Parte del gasto a crédito ya se pagó.',
        solucion: 'Anule los abonos en Cuentas por Pagar y luego anule el gasto.',
      },
      {
        mensaje: 'El gasto no aparece en el mayor',
        causa: 'Su asiento quedó en borrador (modo revisión).',
        solucion: 'Apruébelo en Revisión de Comprobantes.',
      },
    ],
  },
  {
    id: 'activos-fijos',
    grupo: 'Contabilidad',
    titulo: 'Activos fijos',
    icono: 'pi pi-car',
    rutas: ['/contabilidad/activos-fijos'],
    resumen: 'Fichas de activos (equipos, vehículos, muebles, licencias), su depreciación, adiciones, mantenimientos, baja y venta.',
    secciones: [
      {
        titulo: 'De dónde salen las fichas',
        texto: [
          'Al comprar un ítem clasificado como Activo fijo o Intangible la compra crea una ficha por unidad (AF-000123), con el valor de la línea más su parte de los fletes, las cuentas y la vida útil de su categoría contable. La compra ya debitó la cuenta del activo: la ficha no genera otro asiento.',
          'También se pueden crear a mano con "Nuevo Activo" (su costo entra por saldos iniciales o por un comprobante).',
          'La pestaña Ficha guarda placa, serial, marca, modelo, responsable, póliza y si es componente de otro activo.',
        ],
      },
      {
        titulo: 'Depreciación',
        texto: [
          '"Calcular Depreciación" deprecia el mes elegido para todos los activos vigentes, en un solo asiento fechado el último día del mes. Cada activo empieza el mes de su "Inicio de la depreciación" (por defecto, la fecha de adquisición).',
          'Línea recta: cuota fija; la última absorbe el redondeo. Saldo decreciente: doble sobre el valor en libros, pasando a línea recta al final. Unidades de producción: en la misma ventana se escribe el uso del mes de cada activo.',
          '"Reversar" deshace la depreciación del mes elegido (debe estar abierto y ser el último depreciado), con un contraasiento de la misma fecha.',
        ],
      },
      {
        titulo: 'Ficha del activo',
        texto: [
          'El botón de la ficha abre el resumen (costo, depreciación, valor en libros), la depreciación registrada y la proyección mes a mes, las adiciones y los mantenimientos.',
          'Adición: mejora que sube el costo y, si se indica, la vida útil (DB cuenta del activo · CR caja, banco o proveedor). Las cuotas siguientes se recalculan solas.',
          'Mantenimiento: historial con costo y próxima fecha. No genera asiento: el pago se registra como gasto o compra.',
        ],
      },
      {
        titulo: 'Baja y venta',
        texto: [
          'Dar de baja: fecha y motivo. Cancela la depreciación acumulada y lo que falta por depreciar va a pérdida (5310).',
          'Vender: precio sin IVA, IVA, cuenta que recibe el pago y comprador. La diferencia contra el valor en libros va a utilidad (4245) o pérdida (5310).',
          'Desde la ficha, "Anular retiro" reversa la baja o la venta y el activo vuelve a estar vigente.',
          '"Informe" agrupa costo, depreciación y valor en libros por categoría, centro de costo o responsable, con la depreciación de un mes y exportación a CSV.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El costo de este activo viene de la compra #…: corríjalo editando la compra',
        causa: 'Se quiso cambiar el valor de una ficha creada por una compra.',
        solucion: 'Edite la compra (si el activo no se ha depreciado).',
      },
      {
        mensaje: 'El activo ya tiene depreciaciones: su costo no se cambia. Registre una adición',
        causa: 'El costo ya se usó en asientos.',
        solucion: 'Registre una adición o reverse la depreciación del mes si está abierto.',
      },
      {
        mensaje: 'Hay meses posteriores depreciados: reverse primero el más reciente',
        causa: 'Se quiso reversar un mes intermedio.',
        solucion: 'Reverse desde el último mes depreciado hacia atrás.',
      },
      {
        mensaje: 'El activo tiene componentes vigentes: retírelos o desvincúlelos primero',
        causa: 'Otros activos dicen ser parte de este.',
        solucion: 'Dé de baja los componentes o quite el vínculo en su ficha.',
      },
      {
        mensaje: 'Por unidades de producción hay que decir cuántas unidades (horas, km…) dará el activo en su vida',
        causa: 'Falta la vida en unidades.',
        solucion: 'Escriba "Unidades en su vida".',
      },
      {
        mensaje: 'Este activo lo creó la compra #…: anule la compra o dé de baja el activo',
        causa: 'Se quiso eliminar una ficha que viene de una compra.',
        solucion: 'Anule la compra o dé de baja el activo.',
      },
      {
        mensaje: 'La cuenta … no sirve como … Use una cuenta que empiece por …',
        causa: 'Cuenta de la clase equivocada (por ejemplo una de caja como cuenta del activo).',
        solucion: 'Elija la cuenta de la clase indicada.',
      },
      {
        mensaje: 'Ya existe un activo con el código …',
        causa: 'Código repetido.',
        solucion: 'Use otro código.',
      },
    ],
  },
  {
    id: 'categorias-contables',
    grupo: 'Contabilidad',
    titulo: 'Categorías contables',
    icono: 'pi pi-sitemap',
    rutas: ['/contabilidad/categorias-contables'],
    resumen: 'La plantilla de cuentas de cada clase de ítem: mercancía, servicio, gasto, dotación, activo, intangible y diferido.',
    secciones: [
      {
        titulo: 'Cómo se usa',
        texto: [
          'Cada categoría tiene un tipo. La "cuenta de la compra" es a dónde va el débito al comprar: inventario (14) en mercancía, la 15 en un activo fijo, la 16 en un intangible, la 17 en un diferido, la 5 en un gasto.',
          'Activos e intangibles guardan además la depreciación acumulada, el gasto por depreciación y la vida útil que heredan las fichas. Los diferidos, el gasto de cada mes y en cuántos meses se amortizan.',
          'El producto elige su categoría en su pestaña Contabilidad; solo se ofrecen las del mismo tipo que su clasificación.',
          '"Copiar" crea una categoría nueva con las mismas cuentas, para ajustar solo lo que cambia.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'La cuenta de la compra debe empezar por …; la cuenta … no aplica.',
        causa: 'La cuenta no es de la clase del tipo de la categoría.',
        solucion: 'Elija una cuenta auxiliar de la clase indicada.',
      },
      {
        mensaje: 'Ya existe una categoría contable llamada …',
        causa: 'Nombre repetido.',
        solucion: 'Use otro nombre.',
      },
    ],
  },
  {
    id: 'parametrizacion-contable',
    grupo: 'Contabilidad',
    titulo: 'Parametrización contable',
    icono: 'pi pi-sliders-h',
    rutas: ['/contabilidad/parametrizacion'],
    resumen: 'A qué cuenta va cada concepto automático, cada forma de pago y cada impuesto, sin tocar la base de datos.',
    secciones: [
      {
        titulo: 'Pestañas',
        texto: [
          'Conceptos: cada operación automática (clientes, inventario, IVA, depreciación, nómina…) con su cuenta. Solo se ofrecen cuentas auxiliares de la clase que el concepto admite. "Por defecto" = usa la del PUC.',
          'Formas de pago: la cuenta de cada una. "Nueva forma de pago" crea otra (p. ej. ADDI): nombre, código y cuenta. Aparece de inmediato en el POS al cobrar. Si la plata entra ya, cuenta de caja o banco (11); si la paga después un financiador como ADDI o Sistecrédito, una cuenta de cartera (13), p. ej. 130510 Por cobrar ADDI creada antes en el Plan de Cuentas. "Copiar a…" aplica la cuenta de una forma a otras.',
          'Recargo: si el cliente paga un recargo al usar la forma (p. ej. Sistecrédito 5 %), escríbalo al crearla o en la columna Recargo y guarde con ✓. En el POS, al pagar $100.000 con esa forma el cliente paga $105.000: el recargo se ve en el cobro y queda en la venta y en la factura como la línea "Recargo por forma de pago" (servicio sin IVA que el sistema crea solo, SKU RECARGO-FP; su IVA o su cuenta de ingreso se cambian en Productos).',
          'Impuestos: cuenta del generado (ventas) y del descontable (compras) por tarifa.',
          'Modo: automático (se contabiliza al guardar) o revisión (queda en borrador hasta que el contador lo aprueba).',
          'Historial: quién cambió qué cuenta y cuándo.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El concepto … solo admite cuentas …; la cuenta … no pertenece a esa clase.',
        causa: 'La cuenta no es de la clase que el concepto admite.',
        solucion: 'Elija una cuenta de las que ofrece la lista.',
      },
      {
        mensaje: 'La cuenta de una forma de pago debe ser del disponible (11xx) o de cartera (13xx)…',
        causa: 'Se eligió una cuenta de otra clase.',
        solucion: 'Use caja/banco (11) o una cuenta por cobrar al financiador (13).',
      },
      {
        mensaje: 'Escriba un código para la forma de pago (CREDITO está reservado para las ventas a crédito)',
        causa: 'Código vacío o CREDITO.',
        solucion: 'Use otro código, p. ej. ADDI.',
      },
      {
        mensaje: 'Ya existe una forma de pago con el código …',
        causa: 'Código repetido.',
        solucion: 'Use otro código o edite la existente.',
      },
      {
        mensaje: 'La forma de pago … no tiene cuenta: no hay nada que copiar',
        causa: 'Se quiso copiar una forma sin cuenta.',
        solucion: 'Asígnele cuenta primero.',
      },
    ],
  },
  {
    id: 'herramientas-contador',
    grupo: 'Contabilidad',
    titulo: 'Herramientas del contador',
    icono: 'pi pi-wrench',
    rutas: ['/contabilidad/herramientas'],
    resumen: 'Trasladar movimientos de una cuenta a otra y fusionar terceros duplicados, con bitácora.',
    secciones: [
      {
        titulo: 'Traslado de cuentas',
        pasos: [
          'Cuenta de origen, cuenta de destino (auxiliar), rango de fechas y, si se quiere, solo un tercero.',
          '"Ver qué se mueve": la lista de movimientos (fecha, comprobante, detalle, tercero, débito y crédito), todos marcados. Desmarca los que no deben moverse. Los de meses cerrados salen con candado y no se pueden elegir.',
          'Si la cuenta de origen está configurada en algún lado (conceptos, formas de pago, categorías, productos, impuestos, conceptos de caja, cuentas bancarias…), aparece la lista y la pregunta "¿Pasar también esa configuración a la cuenta destino?". Con Sí, lo que se registre de ahí en adelante va a la cuenta nueva.',
          '"¿Dejar la cuenta de origen como agrupadora si queda vacía?": con Sí, si la cuenta vieja quedó sin movimientos ni configuración, deja de recibir movimientos.',
          'Motivo y "Trasladar": se mueven solo los marcados. Queda en la bitácora.',
        ],
        notas: [
          'Para pasar de una cuenta a su auxiliar (p. ej. de 110505 Caja general a 11050501): origen 110505, destino 11050501, rango desde el primer movimiento hasta hoy, configuración Sí y agrupadora Sí.',
          'Si desmarca todos los movimientos, solo se pasa la configuración.',
        ],
      },
      {
        titulo: 'Fusión de terceros',
        pasos: [
          'El tercero duplicado (desaparece) y el que se conserva.',
          '"Ver qué se mueve": ventas, compras, cartera, asientos, roles… del duplicado.',
          'Motivo y "Fusionar". Todo pasa al que se conserva y el duplicado queda inactivo. Queda en la bitácora.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El traslado toca meses cerrados (…). Reábralos o acorte el rango',
        causa: 'Hay movimientos de la cuenta en meses cerrados dentro del rango.',
        solucion: 'Reabra esos meses o acorte el rango.',
      },
      {
        mensaje: 'La cuenta no tiene movimientos en ese rango',
        causa: 'Nada que trasladar.',
        solucion: 'Revise la cuenta y las fechas.',
      },
      {
        mensaje: 'La cuenta no tiene movimientos en ese rango ni configuración que la use',
        causa: 'Se pidió pasar la configuración, pero no hay movimientos ni configuración en la cuenta de origen.',
        solucion: 'Revise la cuenta de origen y las fechas.',
      },
      {
        mensaje: 'Los dos terceros tienen ficha de empleado: una persona no puede ser dos empleados. Retire la ficha duplicada antes de fusionar',
        causa: 'Ambos terceros son empleados.',
        solucion: 'Retire la ficha de empleado duplicada y vuelva a fusionar.',
      },
      {
        mensaje: 'Escriba el motivo … queda en la bitácora',
        causa: 'Falta el motivo.',
        solucion: 'Escriba por qué se hace el cambio.',
      },
    ],
  },
  {
    id: 'tarifas-retencion',
    grupo: 'Contabilidad',
    titulo: 'Tarifas de retención',
    icono: 'pi pi-sliders-h',
    rutas: ['/contabilidad/tarifas-retencion'],
    resumen: 'Porcentajes de Retefuente, ReteIVA y ReteICA por concepto.',
    secciones: [
      {
        titulo: 'Crear',
        pasos: [
          'Nueva Tarifa → tipo, código y concepto (Honorarios y comisiones).',
          'Tarifa para persona natural y jurídica (%) y base mínima en pesos.',
          'Activa y guardar.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Ya existe una tarifa de … con el concepto …',
        causa: 'Concepto repetido.',
        solucion: 'Edite la existente.',
      },
    ],
  },
  {
    id: 'conciliacion-bancaria',
    grupo: 'Contabilidad',
    titulo: 'Conciliación bancaria',
    icono: 'pi pi-check-square',
    rutas: ['/contabilidad/conciliacion'],
    resumen:
      'El extracto del banco contra el libro de la cuenta bancaria. Comisiones, GMF e intereses se contabilizan desde la misma pantalla.',
    secciones: [
      {
        titulo: 'Conciliar un mes',
        pasos: [
          'Nuevo extracto → cuenta bancaria, período, saldo inicial y final del extracto.',
          'Abrir → "Importar CSV": pegue el extracto con fecha;descripción;valor (signo del banco: + abono, − cargo). Acepta fechas dd/MM/yyyy y montos $1.234.567,89.',
          'Por cada línea del extracto, "Conciliar" con el movimiento del libro que coincide (el sistema sugiere candidatos de valor exacto y fecha ±3 días).',
          'Si el banco cobró algo que no está en el libro (comisión, GMF, intereses), "Contabilizar como ajuste": genera el asiento solo.',
          'Cuando la diferencia sea cero, "Cerrar extracto".',
        ],
        notas: ['El cierre del mes contable exige que los extractos del mes estén cerrados.'],
      },
    ],
    errores: [
      {
        mensaje: 'Sin candidatos (valor exacto, fecha ±3 días)',
        causa: 'El movimiento no existe en el libro.',
        solucion: 'Si es un cargo del banco, contabilícelo como ajuste; si es un pago no registrado, regístrelo.',
      },
      {
        mensaje: 'No se puede eliminar el extracto',
        causa: 'Ya tiene ajustes contabilizados.',
        solucion: 'Solo se eliminan extractos sin ajustes.',
      },
    ],
  },
  {
    id: 'cierre-anual',
    grupo: 'Contabilidad',
    titulo: 'Cierre anual',
    icono: 'pi pi-calendar-times',
    rutas: ['/contabilidad/cierre-anual'],
    resumen:
      'Provisión de renta, traslado de la utilidad a resultados acumulados y distribución de utilidades (reserva legal y dividendos). El sistema sugiere y el contador decide.',
    secciones: [
      {
        titulo: 'Pasos del cierre de ejercicio',
        pasos: [
          'Antes de cerrar diciembre: "Calcular sugerencia" de la provisión de renta; escriba el valor definitivo y "Contabilizar provisión".',
          'Cierre el período de diciembre en Períodos Contables (cancela ingresos, costos y gastos contra la utilidad).',
          'Al abrir el año nuevo: "Trasladar utilidad / pérdida" (3605 → 3705).',
          'Después de la asamblea: distribución con reserva legal (10 % sugerido, tope 50 % del capital) y dividendos decretados, con el número del acta.',
          'Registre los pagos de dividendos a cada socio con medio de pago y cuenta.',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'eeff',
    grupo: 'Contabilidad',
    titulo: 'Estados financieros NIIF',
    icono: 'pi pi-chart-line',
    rutas: ['/contabilidad/eeff'],
    resumen:
      'Estado de cambios en el patrimonio y estado de flujo de efectivo (método indirecto), que completan los 5 estados de NIIF pymes.',
    secciones: [
      {
        titulo: 'Generar',
        texto: [
          'Elija el rango y Generar. Cambios en el Patrimonio muestra saldo inicial, aumentos, disminuciones y saldo final por cuenta.',
          'Flujo de Efectivo: actividades de operación, inversión y financiación. Abajo verifica que el flujo neto cuadre con la variación del disponible.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El flujo neto difiere del Δ disponible en libros',
        causa: 'Asientos manuales sobre bancos o clasificaciones de cuentas raras.',
        solucion: 'Revise las notas contables que tocan cuentas 11.',
      },
    ],
  },
  {
    id: 'exogena',
    grupo: 'Contabilidad',
    titulo: 'Información exógena DIAN',
    icono: 'pi pi-send',
    rutas: ['/contabilidad/exogena'],
    resumen: 'Generar los formatos de medios magnéticos desde la contabilidad y exportarlos al Excel del prevalidador.',
    secciones: [
      {
        titulo: 'Flujo',
        pasos: [
          'Año gravable y formato.',
          'Validar: lista períodos abiertos, comprobantes en borrador, cuentas sin mapeo y terceros incompletos (documento, DV, dirección, municipio). Corrija hasta que no haya hallazgos.',
          'Generar lote: agrupa los movimientos del año por tercero y concepto. Los terceros bajo el umbral van como cuantías menores (NIT 222222222).',
          'Revisar el lote, "Aprobar y bloquear" y descargar el "Excel prevalidador".',
        ],
      },
      {
        titulo: 'Mapeos de cuentas',
        texto: [
          'Cada cuenta o prefijo del PUC se asigna a un concepto DIAN. El prefijo más específico gana (5105 le gana a 51). "Restaurar defaults" vuelve al mapeo estándar.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El lote no tiene líneas',
        causa: 'No hay movimientos del año en las cuentas mapeadas.',
        solucion: 'Revise los mapeos del formato y que los comprobantes estén contabilizados.',
      },
      {
        mensaje: 'Terceros incompletos',
        causa: 'Faltan documento, DV, dirección o municipio.',
        solucion: 'Complete los terceros en Terceros.',
      },
    ],
  },
];
