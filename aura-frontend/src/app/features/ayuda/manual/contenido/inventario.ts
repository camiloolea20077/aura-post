import { ManualError, ManualModulo } from '../manual.model';

const SALIDA_ERRORES: ManualError[] = [
  {
    mensaje: 'Stock insuficiente para: … Disponible: N',
    causa: 'La cantidad supera el stock de la bodega.',
    solucion: 'Revise la cantidad o el stock en Inventario → Stock; registre primero la compra si falta.',
  },
  {
    mensaje: '… se descuenta por su receta: regístralo por unidad / no admite lote',
    causa: 'El producto tiene receta: lo que sale son sus ingredientes, no el producto.',
    solucion: 'Regístrelo por unidad y sin lote; el sistema descuenta los componentes.',
  },
  {
    mensaje: 'Los lotes de … no alcanzan: faltan N (hay M en lotes vencidos)',
    causa: 'El stock disponible en lotes no vencidos es menor que la cantidad.',
    solucion: 'Reduzca la cantidad o, si se puede usar lo vencido, saque ese lote con una merma.',
  },
  {
    mensaje: 'El lote … está vencido',
    causa: 'La empresa bloquea la salida de lotes vencidos en este documento.',
    solucion: 'Elija otro lote o dé de baja el vencido con una merma (Inventario → Lotes → Vencimientos).',
  },
  {
    mensaje: '… maneja serial: elige N seriales',
    causa: 'El producto se controla por serial y faltan seriales.',
    solucion: 'Elija un serial por cada unidad. La cantidad debe ser entera.',
  },
];

export const INVENTARIO: ManualModulo[] = [
  {
    id: 'stock',
    grupo: 'Inventario',
    titulo: 'Stock',
    icono: 'pi pi-database',
    rutas: ['/inventario/stock'],
    resumen:
      'Cuánto hay de cada producto en cada sucursal, el stock mínimo que dispara la alerta y la ubicación física.',
    secciones: [
      {
        titulo: 'Cómo se mueve el stock',
        texto: [
          'El stock entra con compras, traslados y devoluciones, y sale con ventas, mermas, obsequios, consumo interno y traslados. Cada movimiento queda en el kardex con el saldo anterior y el nuevo.',
          'Para corregir diferencias con lo que hay físicamente lo formal es un Reconteo. También se puede cambiar la cantidad desde el lápiz de esta pantalla: pide un motivo y queda en el kardex como "Ajuste manual — sobrante" o "— faltante", al costo promedio.',
          'Dos cajas vendiendo el mismo producto al mismo tiempo ya no se pisan el saldo: la segunda espera un instante y descuenta sobre lo que dejó la primera.',
        ],
      },
      {
        titulo: 'Qué se configura aquí',
        pasos: [
          '"Registrar producto" crea el registro de inventario de un producto en una sucursal (el stock arranca en 0).',
          'El lápiz edita el stock mínimo (al llegar a ese nivel aparece en "Stock bajo" y en la campana) y la ubicación física (Estante A-3, Refrigerador).',
          '"Ver historial de movimientos" muestra el kardex del producto.',
          'El botón "Stock bajo" lista los productos que necesitan reabastecimiento.',
        ],
      },
      {
        titulo: 'Punto de reorden, máximo y stock como se cuenta',
        texto: [
          'Punto de reorden: con este saldo o menos el producto sale en Compras › Sugerido de Compra. Máximo: hasta dónde pedir. Los dos son por bodega y opcionales.',
          'Si el producto tiene una presentación (Caja ×10), debajo del número aparece el stock como se cuenta: "2 Cajas + 8 und". Es solo visual; el saldo sigue en la unidad base.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El punto de reorden no puede ser menor que el stock mínimo: se pide antes de llegar al mínimo',
        causa: 'Se escribió un punto de reorden por debajo del mínimo.',
        solucion: 'Suba el punto de reorden o baje el mínimo.',
      },
      {
        mensaje: 'El máximo debe ser mayor que el punto de reorden (o que el mínimo)',
        causa: 'El máximo quedó igual o por debajo del punto de pedido.',
        solucion: 'Suba el máximo o déjelo vacío.',
      },
      {
        mensaje: 'Este producto ya tiene inventario en la bodega …',
        causa: 'El registro de inventario ya existe.',
        solucion: 'Edítelo en la lista en lugar de crearlo de nuevo.',
      },
      {
        mensaje: 'Escribe el motivo del ajuste de stock: queda registrado en el kardex',
        causa: 'Se cambió la cantidad sin decir por qué.',
        solucion: 'Escriba el motivo (conteo físico, producto dañado, error de digitación) y guarde.',
      },
      {
        mensaje: 'El stock no coincide con lo que hay en la estantería',
        causa: 'Ventas, compras o mermas sin registrar, o errores de conteo.',
        solucion: 'Haga un Reconteo y revise el kardex del producto para encontrar el movimiento que falta.',
      },
    ],
  },
  {
    id: 'bodegas',
    grupo: 'Inventario',
    titulo: 'Bodegas',
    icono: 'pi pi-building',
    rutas: ['/inventario/bodegas'],
    resumen:
      'Dónde vive el stock dentro de cada sucursal (principal, averías, nevera, vitrina) y quién responde por él.',
    secciones: [
      {
        titulo: 'Crear una bodega',
        pasos: [
          'Nueva bodega → sucursal (no se cambia después: moverla movería el stock).',
          'Código, nombre, responsable (quién responde por un faltante), ubicación y observación.',
          '¿Es la bodega principal? Recibe el stock cuando un documento no dice bodega. Solo una por sucursal.',
          '¿Despacha ventas? Averías o cuarentena guardan stock pero el POS no las ofrece.',
          'Guarde.',
        ],
        notas: ['Cada sucursal necesita al menos una bodega principal.'],
      },
    ],
    errores: [
      {
        mensaje: 'La sucursal no tiene bodega principal. Cree una en Inventario, opción Bodegas',
        causa: 'Sucursal sin bodega principal.',
        solucion: 'Cree la bodega y márquela como principal.',
      },
      {
        mensaje: 'No se puede desactivar / eliminar la bodega principal',
        causa: 'La principal es obligatoria.',
        solucion: 'Marque otra bodega como principal primero.',
      },
      {
        mensaje: 'La bodega ya tiene saldo o movimientos. Desactívela en vez de eliminarla',
        causa: 'Borrarla perdería la historia del kardex.',
        solucion: 'Desactívela.',
      },
      {
        mensaje: 'La bodega … no despacha ventas',
        causa: 'Se intentó vender desde una bodega de averías o cuarentena.',
        solucion: 'Traslade la mercancía a una bodega que despache o active "¿Despacha ventas?".',
      },
      {
        mensaje: 'La bodega … no pertenece a la sucursal del documento',
        causa: 'Bodega de otra sede.',
        solucion: 'Elija una bodega de la misma sucursal.',
      },
      {
        mensaje: 'Ya hay una bodega llamada … en esta sucursal',
        causa: 'Nombre repetido.',
        solucion: 'Use otro nombre.',
      },
    ],
  },
  {
    id: 'lotes',
    grupo: 'Inventario',
    titulo: 'Lotes y vencimientos',
    icono: 'pi pi-calendar',
    rutas: ['/inventario/lotes'],
    resumen:
      'Los lotes entran con la compra (código y vencimiento). Aquí se consultan, se corrigen y se dan de baja los vencidos.',
    secciones: [
      {
        titulo: 'Consultar y corregir',
        texto: [
          'La lista muestra código, producto, sucursal, compra de origen, vencimiento, stock y costo unitario.',
          '"Corregir código o vencimiento" arregla un dato mal digitado en la compra, con motivo. El stock no se cambia aquí.',
          '"Desactivar lote" solo funciona si el lote ya no tiene stock.',
        ],
      },
      {
        titulo: 'Vencimientos',
        pasos: [
          'Botón Vencimientos: lista los lotes vencidos y los que vencen en los próximos días, con su valor.',
          'Marque los vencidos ("Elegir los vencidos") y use el botón que abre la merma con esos lotes y todo su stock.',
        ],
      },
      {
        titulo: 'Reglas',
        texto: [
          '¿Bloquear la venta de lotes vencidos? "Sí, bloquear" impide venderlos, regalarlos o usarlos en consumo interno. "No, solo avisar" deja venderlos con aviso. La merma y la nota crédito al proveedor siempre pueden sacar lo vencido.',
          '"Avisar cuando falten (días)": el POS muestra "Vence en N d" y avisa al agregar el producto.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Los lotes se crean al registrar la compra … Aquí solo se corrigen',
        causa: 'Se intentó crear un lote a mano.',
        solucion: 'Registre la compra con su lote.',
      },
      {
        mensaje: 'El lote … todavía tiene stock: sácalo con una merma, un consumo interno o una nota crédito',
        causa: 'Se intentó desactivar un lote con unidades.',
        solucion: 'Saque primero las unidades con el documento que corresponda.',
      },
      {
        mensaje: 'Ya existe el lote … para este producto en la bodega',
        causa: 'Código repetido.',
        solucion: 'Revise el código o use otro.',
      },
      {
        mensaje: 'Los días tienen que estar entre 0 y 3650',
        causa: 'Valor de aviso fuera de rango.',
        solucion: 'Escriba un número de días razonable.',
      },
    ],
  },
  {
    id: 'seriales',
    grupo: 'Inventario',
    titulo: 'Seriales',
    icono: 'pi pi-qrcode',
    rutas: ['/inventario/seriales'],
    resumen:
      'Cada unidad de un producto con serial: de qué compra vino, a quién se vendió, su garantía y toda su historia.',
    secciones: [
      {
        titulo: 'Cómo entran y salen',
        texto: [
          'Los seriales nuevos entran con la compra (uno por unidad) y salen con cada venta, merma, obsequio o traslado.',
          '"Registrar serial" es solo para el stock que ya existía antes de manejar seriales.',
          '"Trazabilidad": escanee o escriba el serial y verá su historia completa, costo y garantía.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Este serial ya está registrado',
        causa: 'El serial existe en la empresa.',
        solucion: 'Búsquelo en Trazabilidad; puede haberse digitado dos veces.',
      },
      {
        mensaje: '… ya tiene N seriales para M unidades … Los seriales nuevos se registran en la compra',
        causa: 'Ya hay tantos seriales como stock.',
        solucion: 'Registre la compra con los seriales nuevos.',
      },
      {
        mensaje: 'El serial … ya tiene movimientos y no se puede eliminar',
        causa: 'El serial ya se vendió o movió.',
        solucion: 'No se elimina; su historia queda como evidencia.',
      },
      {
        mensaje: 'El serial … no está disponible / no está en esta bodega',
        causa: 'Ya se vendió o está en otra bodega.',
        solucion: 'Revise su trazabilidad y elija otro serial.',
      },
    ],
  },
  {
    id: 'kardex',
    grupo: 'Inventario',
    titulo: 'Kardex',
    icono: 'pi pi-history',
    rutas: ['/inventario/kardex'],
    resumen: 'El historial inmutable de todos los movimientos de inventario: qué entró, qué salió, cuándo y con qué saldo.',
    secciones: [
      {
        titulo: 'Consultar',
        pasos: [
          'Filtre por producto, tipo de movimiento, sucursal y fechas; presione Aplicar.',
          'Cada fila tiene tipo, lote, cantidad, variación de stock (Δ), saldo anterior, saldo nuevo y costo histórico.',
          '"Ver detalle" muestra el documento que originó el movimiento.',
        ],
        notas: [
          'Los movimientos no se editan ni se eliminan. Un error se corrige con otro documento (anulación, merma, reconteo).',
          'Para ver el kardex con saldo corrido de un producto use Reportes → Movimiento de inventario.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El kardex detallado es de un producto: indique cuál',
        causa: 'Se pidió el detalle sin elegir producto.',
        solucion: 'Elija el producto en el filtro.',
      },
    ],
  },
  {
    id: 'reconteos',
    grupo: 'Inventario',
    titulo: 'Reconteos (conteo físico)',
    icono: 'pi pi-check-square',
    rutas: ['/inventario/reconteos'],
    resumen: 'Contar lo que hay físicamente y ajustar el sistema a ese conteo, dejando registro de sobrantes y faltantes.',
    secciones: [
      {
        titulo: 'Hacer un reconteo',
        pasos: [
          'Nuevo reconteo → sucursal y tipo: Total (todos los productos) o Parcial (por categoría). Observaciones opcionales.',
          'Crear reconteo. Se abre con el stock del sistema de cada producto.',
          'Abra "Ver / contar" y escriba en "Stock contado" lo que contó; se guarda al salir de cada casilla.',
          'Revise los totales: líneas contadas, sobrantes y faltantes.',
          '"Aprobar y aplicar ajustes" deja el stock igual al contado y genera los movimientos de ajuste en el kardex.',
        ],
        notas: [
          'Cuente con la tienda quieta o anote las ventas del momento: una venta durante el conteo cambia el stock del sistema.',
          'Un reconteo aprobado no se anula; uno en borrador sí.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'No se puede modificar un reconteo en estado: APROBADO',
        causa: 'El reconteo ya se aplicó.',
        solucion: 'Haga un reconteo nuevo si hay otra diferencia.',
      },
      {
        mensaje: 'Solo se puede aprobar un reconteo en estado BORRADOR o EN_CONTEO',
        causa: 'Está anulado o ya aprobado.',
        solucion: 'Cree uno nuevo.',
      },
      {
        mensaje: 'No se puede anular un reconteo ya aprobado',
        causa: 'Sus ajustes ya están en el kardex.',
        solucion: 'Corrija con un reconteo nuevo.',
      },
    ],
  },
  {
    id: 'mermas',
    grupo: 'Inventario',
    titulo: 'Mermas',
    icono: 'pi pi-trash',
    rutas: ['/mermas'],
    resumen: 'Registrar mercancía perdida por vencimiento, daño o robo: baja el inventario y lleva el costo a la contabilidad.',
    secciones: [
      {
        titulo: 'Registrar una merma',
        pasos: [
          'Registrar merma → elija el motivo (o "Crear nuevo motivo").',
          'Agregue los productos: escanee el SKU o código de barras y presione Enter, o búsquelos.',
          'Escriba la cantidad (puede elegir la presentación). Para productos con lote, elija el lote o déjelo en "Automático (vence primero)". Para seriales, elija cuáles.',
          'Revise el costo total y presione "Registrar merma".',
        ],
        notas: [
          'Los productos con receta descuentan sus componentes.',
          'Los motivos (Vencimiento, Robo, Daño) se configuran en la pantalla de motivos; "Afecta contabilidad" decide si genera asiento.',
          'Anular la merma devuelve el stock.',
        ],
      },
    ],
    errores: [
      ...SALIDA_ERRORES,
      {
        mensaje: 'La merma ya está anulada',
        causa: 'Se intentó anularla dos veces.',
        solucion: 'No hay nada que hacer.',
      },
      {
        mensaje: 'Ya existe un motivo con este nombre',
        causa: 'Motivo repetido.',
        solucion: 'Use el existente.',
      },
    ],
  },
  {
    id: 'obsequios',
    grupo: 'Inventario',
    titulo: 'Obsequios',
    icono: 'pi pi-gift',
    rutas: ['/obsequios'],
    resumen:
      'Producto entregado sin cobro (muestras, promociones, cortesías, donaciones): baja el inventario y, si aplica, causa el IVA por retiro.',
    secciones: [
      {
        titulo: 'Registrar un obsequio',
        pasos: [
          'Registrar obsequio → motivo: Muestra comercial, Promoción, Cortesía a cliente, Donación u Otro.',
          'Beneficiario (opcional) y observación.',
          '"Causar IVA por retiro de inventario": para la DIAN, regalar mercancía se trata como venta; el IVA se calcula sobre el valor comercial y lo asume la empresa.',
          'Agregue los productos con cantidad, lote o seriales.',
          'Revise costo e IVA y presione "Registrar obsequio".',
        ],
      },
    ],
    errores: [
      ...SALIDA_ERRORES,
      {
        mensaje: 'El obsequio ya está anulado',
        causa: 'Anulación repetida.',
        solucion: 'No hay nada que hacer.',
      },
    ],
  },
  {
    id: 'consumo-interno',
    grupo: 'Inventario',
    titulo: 'Consumo interno',
    icono: 'pi pi-briefcase',
    rutas: ['/consumo-interno'],
    resumen:
      'Mercancía que usa el propio negocio (aseo, cafetería, mantenimiento): baja el inventario y lleva el costo a la cuenta del concepto.',
    secciones: [
      {
        titulo: 'Conceptos',
        texto: [
          'Botón Conceptos: cada concepto (Aseo y cafetería, Mantenimiento) decide a qué cuenta va el costo y si causa IVA por retiro. Sin cuenta, usa la 5195. Una herramienta que se queda en el negocio puede ir a una cuenta 15.',
        ],
      },
      {
        titulo: 'Registrar un consumo',
        pasos: [
          'Registrar consumo → concepto (¿para qué se usó?) y responsable (¿quién lo retiró?).',
          'Observación: reparación del baño, cafetería de la semana…',
          '¿Genera IVA por retiro? El concepto trae el valor inicial; confírmelo con su contador.',
          'Agregue los productos y presione "Registrar consumo".',
        ],
      },
    ],
    errores: [
      ...SALIDA_ERRORES,
      {
        mensaje: 'El concepto … está inactivo',
        causa: 'El concepto fue desactivado.',
        solucion: 'Actívelo en Conceptos o elija otro.',
      },
      {
        mensaje: 'La cuenta … no es de movimiento / El consumo interno solo admite cuentas …',
        causa: 'La cuenta del concepto no es auxiliar o no es de gasto, costo o activo.',
        solucion: 'Elija una cuenta auxiliar de la clase correcta para el concepto.',
      },
    ],
  },
  {
    id: 'traslados-inventario',
    grupo: 'Inventario',
    titulo: 'Traslados de inventario',
    icono: 'pi pi-arrows-h',
    rutas: ['/traslados'],
    resumen: 'Mover mercancía entre sucursales o entre bodegas de la misma sucursal.',
    secciones: [
      {
        titulo: 'Crear un traslado',
        pasos: [
          'Nuevo traslado → sucursal y bodega de origen.',
          'Sucursal y bodega de destino (no pueden ser la misma bodega).',
          'Agregue los productos con la cantidad; el formulario muestra el stock en origen. Elija lote o seriales si aplica.',
          'Crear traslado. Sale del origen y entra al destino con el mismo costo.',
        ],
        notas: ['Anular devuelve la mercancía, solo si todavía no ha salido de la bodega destino.'],
      },
    ],
    errores: [
      ...SALIDA_ERRORES,
      {
        mensaje: 'El origen y el destino son la misma bodega',
        causa: 'Bodegas iguales.',
        solucion: 'Elija otra bodega destino.',
      },
      {
        mensaje: 'Stock insuficiente en origen para: …',
        causa: 'No hay unidades suficientes en la bodega de origen.',
        solucion: 'Reduzca la cantidad.',
      },
      {
        mensaje: 'No se puede anular, el producto … ya salió de la bodega destino',
        causa: 'La mercancía trasladada ya se vendió o movió en el destino.',
        solucion: 'Haga un traslado de vuelta por lo que queda.',
      },
    ],
  },
];
