import { ManualModulo } from '../manual.model';

export const CATALOGO: ManualModulo[] = [
  {
    id: 'productos',
    grupo: 'Catálogo',
    titulo: 'Productos',
    icono: 'pi pi-box',
    rutas: ['/catalogo/productos'],
    resumen:
      'La ficha de cada producto o servicio: cómo se compra, cómo se vende, qué impuestos lleva, cómo se controla su inventario (lotes, seriales) y a qué cuentas contables va.',
    secciones: [
      {
        titulo: 'Crear un producto',
        pasos: [
          'Catálogo → Productos → Nuevo producto.',
          'Pestaña Básico: imagen (JPG, PNG, WebP, GIF o AVIF, máximo 10 MB), nombre, SKU, código de barras, categoría y marca.',
          'Unidad de inventario: la más pequeña en que vende (unidad, kg, litro). Todo el stock se cuenta en esta unidad.',
          'Tipo de producto (los servicios no manejan stock) y Uso: VENTA, INSUMO (solo para recetas o consumo interno, nunca aparece en el POS) o AMBOS.',
          '"Visible en POS" permite ocultarlo temporalmente sin desactivarlo.',
          'Pestaña de empaque y precios (ver abajo), impuestos, inventario y contabilidad.',
          'Guarde.',
        ],
      },
      {
        titulo: 'Unidades y conversiones',
        texto: [
          'En la pestaña "Empaque y precios", la tabla "Unidades y conversiones" muestra la unidad en que se cuenta el inventario (la de la pestaña Básico) y a qué equivale cada empaque o medida: "1 Paca = 24 und", "1 Libra = 0,5 kg", "1 Año = 12 mes".',
          '"Agregar conversión" o los botones de conversiones comunes ("+ Libra = 0,5 kg", "+ Docena = 12 und"…), que cambian según la unidad del producto.',
          'Por cada fila: "Se compra" (la que se propone al registrar compras; solo una), "Se vende" (sale en el POS), precio de venta (vacío = precio de la unidad × lo que equivale), costo y código de barras propio.',
          'Si se compra en una conversión (p. ej. la paca), su costo se escribe ahí y el de la unidad base se calcula solo.',
          'Con las conversiones se compra "4 Pacas + 2 und" en una sola línea y se vende suelto o por empaque.',
          'Columna Utilidad: de cada $100 que vende (sin IVA), cuánto le queda después del costo. Verde 15 % o más, naranja menos de 15 %, rojo pérdida. Pasando el mouse ve cuánto gana en pesos por unidad y el % sobre el costo. Si el precio incluye IVA, se calcula sobre la base sin IVA. También aparece junto a Precio 2 y Precio 3, y en la lista de productos.',
          'Precio 2 (mayorista) y Precio 3 (distribuidor) quedan disponibles en el POS desde el menú de la línea.',
        ],
        notas: [
          'Quitar una conversión no borra los documentos que la usaron. Si se vuelve a crear con la misma cantidad, se recupera la anterior.',
          'Una conversión más pequeña que la unidad base (la unidad de una paca) muestra el botón "Pasar a unidad" para contar el inventario en ella.',
        ],
      },
      {
        titulo: 'Impuestos',
        texto: [
          'IVA e Impoconsumo (bebidas azucaradas, licores). Si la categoría tiene impuesto por defecto, el producto lo hereda.',
          '"El precio ya incluye IVA": actívelo si el precio que escribe ya tiene el IVA adentro. El sistema extrae la base sola.',
        ],
      },
      {
        titulo: 'Inventario: lotes, seriales y stock negativo',
        texto: [
          'Maneja inventario: controla el stock. Desactívelo en servicios o productos digitales.',
          'Maneja lotes: cada compra registra código de lote y vencimiento; se vende primero el que vence primero. Para alimentos y medicamentos.',
          'Maneja serial: cada unidad tiene su número de serie, con meses de garantía. Para electrónicos y maquinaria.',
          'Permitir stock negativo: deja vender sin stock; el inventario queda negativo hasta registrar la compra. Útil para carnicerías y negocios que venden antes de registrar la compra.',
        ],
        notas: [
          'Esta configuración no se puede cambiar cuando el producto ya tiene movimientos. Defínala bien antes de la primera compra.',
        ],
      },
      {
        titulo: '¿Qué es este ítem? (clasificación)',
        texto: [
          'Todo lo que la empresa compra vive en el catálogo y se clasifica: Producto (mercancía), Servicio, Gasto, Dotación, Activo fijo, Intangible o Diferido. La clasificación decide qué hace la compra con la línea.',
          'Solo un Producto maneja inventario, lotes y seriales. Un Servicio se vende pero no tiene existencias. Gasto, Dotación, Activo fijo, Intangible y Diferido se compran y no salen en el POS.',
          'Al comprar un Activo fijo o un Intangible se crea una ficha de activo por unidad (3 computadores = 3 fichas) en Contabilidad › Activos Fijos. Al comprar un Diferido (seguro, suscripción) se crea el diferido y se amortiza mes a mes.',
          'La cuenta a la que va la compra la da la categoría contable del mismo tipo; sin categoría, la cuenta por defecto de la empresa (1524 activo, 1635 intangible, 1705 diferido, 5195 gasto, 510551 dotación).',
          'Lo que no se vende (gasto, dotación, activo, intangible, diferido) no pide precio, forma de venta, tipo, uso ni inventario: la pestaña se llama "Costo e impuestos" y el panel "Al comprarlo" resume la cuenta, la vida útil o los meses que vienen de su categoría contable.',
        ],
        notas: [
          'Un producto con existencias no puede dejar de ser Producto: saque primero el stock con un ajuste, una merma o un consumo interno.',
        ],
      },
      {
        titulo: 'Contabilidad del producto',
        texto: [
          'La categoría contable decide a qué cuentas van el ingreso, el costo y el inventario. Si no elige ninguna usa "General".',
          'En "Cuentas específicas de este producto (avanzado)" puede fijar cuenta de ingreso, costo e inventario solo para excepciones puntuales; vacías, usan las de la categoría.',
        ],
      },
      {
        titulo: 'Cambiar la unidad base ("Pasar a unidad")',
        texto: [
          'Si creó un producto por caja y ahora lo vende por unidad, use "Pasar a …" en la presentación: la presentación pasa a ser la unidad pequeña y la actual queda como presentación.',
          'El sistema muestra el antes y el después del stock y convierte también el kardex, lotes, líneas de venta, recetas y precios de lista.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El producto tiene existencias: no puede dejar de ser mercancía',
        causa: 'Se quiso cambiar a Gasto, Activo u otra clasificación un producto con stock.',
        solucion: 'Saque el stock (ajuste manual, merma o consumo interno) y vuelva a cambiar la clasificación.',
      },
      {
        mensaje: 'Clasificación inválida: use PRODUCTO, SERVICIO, GASTO, DOTACION, ACTIVO_FIJO, INTANGIBLE o DIFERIDO',
        causa: 'Llegó una clasificación que no existe.',
        solucion: 'Elija una de las opciones de "¿Qué es este ítem?".',
      },
      {
        mensaje: 'La cuenta de la compra debe empezar por …; la cuenta … no aplica',
        causa: 'La cuenta específica del producto no es de la clase de su clasificación (por ejemplo una 14 para un activo fijo).',
        solucion: 'Elija una cuenta de la clase indicada o deje el campo vacío para usar la de la categoría.',
      },
      {
        mensaje: 'Escribe a cuántas … equivale 1 …',
        causa: 'Una conversión sin cantidad.',
        solucion: 'Escriba la equivalencia (p. ej. 24 und por paca) o quite la fila.',
      },
      {
        mensaje: 'Dos conversiones equivalen a …: deja solo una',
        causa: 'Dos filas con la misma cantidad.',
        solucion: 'Quite una.',
      },
      {
        mensaje: 'Marca al menos una forma de venta: suelto o en alguna conversión.',
        causa: 'No se vende ni suelto ni en ninguna conversión.',
        solucion: 'Marque "Se vende" en la unidad base o en alguna conversión.',
      },
      {
        mensaje: 'El código de barras ya está en uso / ya lo usa una presentación de la empresa',
        causa: 'Otro producto o presentación tiene ese código.',
        solucion: 'Busque el código en Productos o Presentaciones y corrija el que está mal.',
      },
      {
        mensaje: 'Uso de producto inválido: use VENTA, INSUMO o AMBOS',
        causa: 'Valor de uso no permitido (suele venir de una importación).',
        solucion: 'Elija el uso en la ficha del producto.',
      },
      {
        mensaje: 'Unidad de medida no encontrada / Categoría no encontrada / Marca no encontrada',
        causa: 'La unidad, categoría o marca fue eliminada o desactivada.',
        solucion: 'Créela de nuevo o elija otra.',
      },
      {
        mensaje: 'No se puede …: el producto cambió de unidad base el … y este documento es anterior',
        causa: 'Se quiere anular o editar un documento hecho con la unidad vieja.',
        solucion: 'Registre un documento nuevo (nota crédito, merma o ajuste) en lugar de modificar el antiguo.',
      },
      {
        mensaje: 'No puedes eliminar la única presentación activa del producto',
        causa: 'El producto se quedaría sin forma de venta.',
        solucion: 'Cree otra presentación antes de eliminar esta.',
      },
      {
        mensaje: 'Ya existe una presentación con ese factor de conversión para este producto',
        causa: 'Dos presentaciones con la misma cantidad de unidades.',
        solucion: 'Edite la existente en vez de crear otra.',
      },
      {
        mensaje: 'No se pudo subir la imagen / El archivo supera el tamaño máximo permitido de 10 MB',
        causa: 'Imagen muy pesada o formato no permitido.',
        solucion: 'Use JPG, PNG, WebP, GIF o AVIF de menos de 10 MB.',
      },
    ],
  },
  {
    id: 'categorias-marcas-unidades',
    grupo: 'Catálogo',
    titulo: 'Categorías, marcas y unidades',
    icono: 'pi pi-sitemap',
    rutas: ['/catalogo/categorias', '/catalogo/marcas', '/catalogo/unidades'],
    resumen: 'Las tablas que ordenan el catálogo y definen cómo se mide cada producto.',
    secciones: [
      {
        titulo: 'Categorías',
        texto: [
          'Agrupan los productos (Bebidas, Lácteos, Panadería). Pueden tener una categoría padre para formar subcategorías; vacía, es principal.',
          '"Impuesto por defecto (%)": los productos nuevos de la categoría heredan ese IVA.',
          'Las categorías se usan como filtro en el POS y en los reportes de ventas.',
        ],
      },
      {
        titulo: 'Marcas',
        texto: ['Nombre y estado. Sirven para filtrar productos y reportes.'],
      },
      {
        titulo: 'Unidades de medida',
        texto: [
          'Nombre (Kilogramo, Litro, Unidad), abreviatura (KG, L, UN) y si permite decimales. Marque "Permite decimales" en las unidades que se venden fraccionadas (kilos, litros).',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Ya existe una categoría / marca / unidad con este nombre',
        causa: 'Nombre repetido.',
        solucion: 'Use el registro existente o cambie el nombre.',
      },
      {
        mensaje: 'Una categoría no puede ser su propio padre',
        causa: 'Se eligió la misma categoría como padre.',
        solucion: 'Elija otra categoría padre o déjelo vacío.',
      },
    ],
  },
  {
    id: 'presentaciones',
    grupo: 'Catálogo',
    titulo: 'Presentaciones',
    icono: 'pi pi-clone',
    rutas: ['/catalogo/presentaciones'],
    resumen:
      'Empaques y formatos de venta de un producto (Caja x 12, SixPack, Unidad) con su propio código de barras y precio.',
    secciones: [
      {
        titulo: 'Crear una presentación',
        pasos: [
          'Nueva presentación → elija el producto.',
          'Nombre (Caja x 12), código de barras propio (opcional) y "Unidades base que contiene": Caja x 12 = 12, SixPack = 6, Media libra = 0,5.',
          'Precio de venta y estado. Guarde.',
        ],
        notas: [
          'Al vender una Caja x 12 el inventario baja 12 unidades base. El stock siempre se guarda en la unidad pequeña.',
          'Lo más fácil es crearlas desde el producto, en "Unidades y conversiones", donde además se marca en cuál se compra y cuáles se venden.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'La cantidad que contiene la presentación debe ser mayor que cero',
        causa: 'Factor en cero.',
        solucion: 'Escriba cuántas unidades base trae.',
      },
      {
        mensaje: 'El código … ya lo usa otro producto o presentación de la empresa',
        causa: 'Código de barras repetido.',
        solucion: 'Corrija el código en el otro producto o use otro.',
      },
    ],
  },
  {
    id: 'composiciones',
    grupo: 'Catálogo',
    titulo: 'Recetas y kits (composiciones)',
    icono: 'pi pi-share-alt',
    rutas: ['/catalogo/composiciones'],
    resumen:
      'Los insumos de un producto elaborado (una hamburguesa, un combo, una canasta). Al vender el producto se descuentan sus ingredientes del inventario y el costo sale de la receta.',
    secciones: [
      {
        titulo: 'Crear una receta',
        pasos: [
          'Nueva receta → busque el producto a elaborar.',
          'Rendimiento del lote: cuántas unidades salen de una tanda (por ejemplo, 20 arepas).',
          'Agregue cada ingrediente con la cantidad para el lote completo, la medida y el % de merma (lo que se pierde en el proceso). El sistema calcula el consumo por unidad.',
          'Revise el Costeo: costo por unidad, costo del lote, precio de venta y margen.',
          '"Usar como costo del producto" guarda ese costo en la ficha del producto.',
          'Guarde. "Copiar de otra receta" trae los ingredientes de otro producto.',
        ],
        notas: [
          'Si la lista dice que el costo guardado no coincide con el de la receta, ábrala y aplique el costeo.',
          'Un ingrediente que no maneja inventario no se descuenta.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Un producto no puede ser componente de sí mismo / Ciclo en la composición',
        causa: 'La receta se incluye a sí misma directa o indirectamente.',
        solucion: 'Quite el ingrediente que contiene al producto que está editando.',
      },
      {
        mensaje: 'La cantidad de … es demasiado pequeña para el rendimiento indicado',
        causa: 'Al repartir por unidad la cantidad se redondea a cero.',
        solucion: 'Use una medida más pequeña (gramos en vez de kilos).',
      },
      {
        mensaje: 'El componente … está repetido en la receta',
        causa: 'El mismo ingrediente aparece en dos líneas.',
        solucion: 'Súmelo en una sola línea.',
      },
      {
        mensaje: 'No se puede aplicar el costo: hay componentes sin costo cargado',
        causa: 'Algún ingrediente no tiene costo.',
        solucion: 'Cargue el costo en la ficha del ingrediente (o con una compra) y vuelva a costear.',
      },
      {
        mensaje: 'La receta de … no tiene componentes que manejen inventario',
        causa: 'Ningún ingrediente controla stock, no hay nada que descontar.',
        solucion: 'Active "Maneja inventario" en los ingredientes o registre el producto por unidad.',
      },
    ],
  },
  {
    id: 'etiquetas',
    grupo: 'Catálogo',
    titulo: 'Etiquetas de precio',
    icono: 'pi pi-barcode',
    rutas: ['/catalogo/etiquetas'],
    resumen: 'Generar códigos de barras EAN-13 para los productos que no tienen y imprimir etiquetas con nombre y precio.',
    secciones: [
      {
        titulo: 'Imprimir etiquetas',
        pasos: [
          'Busque los productos y marque los que va a imprimir. En "Copias" indique cuántas de cada uno.',
          'Si un producto dice "Sin código", use "Generar" (o "Generar códigos" para todos): crea un EAN-13 y lo guarda en el producto.',
          '"Configurar e Imprimir": número de columnas, espaciado, márgenes, mostrar nombre y precio, tamaño de letra y ancho del código.',
          '"Saltar espacios" deja huecos en blanco para aprovechar hojas ya usadas; "Ahorrar papel" ajusta el largo para impresoras térmicas.',
          'Imprimir etiquetas.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El código … ya está en uso; asígnelo manualmente desde el producto',
        causa: 'El código generado coincide con uno existente.',
        solucion: 'Escriba otro código en la ficha del producto.',
      },
    ],
  },
  {
    id: 'listas-precios',
    grupo: 'Precios',
    titulo: 'Listas de precios y precio por producto',
    icono: 'pi pi-list',
    rutas: ['/precios/listas', '/precios/productos'],
    resumen:
      'Precios distintos según el tipo de cliente o canal (mayorista, domicilios): se crea la lista y se le asigna precio a cada producto o presentación.',
    secciones: [
      {
        titulo: 'Crear la lista',
        pasos: [
          'Precios → Listas de Precio → Nueva lista. Nombre (Lista General, Mayorista, Domicilios) y estado.',
          '"Ver precios" muestra y edita los precios de la lista.',
        ],
      },
      {
        titulo: 'Asignar precios',
        pasos: [
          'Precios → Precio Productos → Asignar precio.',
          'Elija la lista, el producto y la presentación (si no tiene presentaciones, el precio va directo al producto).',
          'Escriba el precio de venta. El formulario muestra el costo y avisa si el margen es bajo o si vende a pérdida.',
          '"Utilidad esperada (%)" es una referencia interna, no cambia el precio.',
        ],
        notas: ['En el POS, "Precio lista / tipo cliente" aplica la lista a todo el carrito.'],
      },
    ],
    errores: [
      {
        mensaje: 'Este producto ya tiene precio en esta lista',
        causa: 'Ya se asignó ese producto o presentación a la lista.',
        solucion: 'Edite el precio existente.',
      },
      {
        mensaje: 'Debe indicar el producto o la presentación',
        causa: 'Falta el producto.',
        solucion: 'Elija el producto antes de guardar.',
      },
      {
        mensaje: 'Ya existe una lista de precios con este nombre',
        causa: 'Nombre repetido.',
        solucion: 'Use otro nombre.',
      },
    ],
  },
  {
    id: 'descuentos',
    grupo: 'Precios',
    titulo: 'Reglas de descuento',
    icono: 'pi pi-percentage',
    rutas: ['/precios/descuentos'],
    resumen:
      'Descuentos automáticos que el POS aplica solos según la fecha, la hora, el día de la semana, la categoría o el producto (Happy Hour, Descuento Viernes).',
    secciones: [
      {
        titulo: 'Crear una regla',
        pasos: [
          'Nueva regla → nombre.',
          'Tipo: Porcentaje (10 %) o Monto fijo ($5.000) y el valor.',
          '¿A qué aplica? Todo el catálogo, una categoría o un producto.',
          'Vigencia (opcional): fecha y hora de inicio y fin.',
          'Horario (opcional): días de la semana y rango de horas. Sin restricción, aplica todo el día.',
          'Estado activo y guardar.',
        ],
        notas: ['La lista marca "Vencida" las reglas cuya fecha fin ya pasó.'],
      },
    ],
    errores: [
      {
        mensaje: 'La regla debe aplicar a categoría O producto, no ambos',
        causa: 'Se eligieron categoría y producto a la vez.',
        solucion: 'Deje solo uno.',
      },
      {
        mensaje: 'La fecha de inicio no puede ser mayor a la fecha fin / La hora de inicio no puede ser mayor a la hora fin',
        causa: 'Rango invertido.',
        solucion: 'Corrija las fechas u horas.',
      },
      {
        mensaje: 'El descuento no aparece en el POS',
        causa: 'Regla inactiva, vencida o fuera del día u hora configurados.',
        solucion: 'Revise estado, vigencia y horario de la regla.',
      },
    ],
  },
];
