/**
 * Plantillas del botón "Importar" de catálogo e inventario
 * (docs/PLAN_EXCEL_IMPORTADORES_MODULOS.md §2). Cada columna dice cómo se llama en el
 * Excel, qué campo del back llena, su tipo y si es obligatoria.
 */
export type TipoColumnaImportar = 'texto' | 'numero' | 'bool' | 'fecha';

export interface ColumnaImportar {
  key: string;
  header: string;
  /** Otros encabezados aceptados (archivos de otros programas). */
  alias: string[];
  tipo: TipoColumnaImportar;
  obligatoria: boolean;
  ayuda: string;
}

export interface PlantillaImportar {
  /** Ruta del back: /api/importacion-catalogo/{recurso}/validar|confirmar */
  recurso: 'categorias' | 'marcas' | 'productos' | 'precios' | 'presentaciones' | 'recetas' | 'bodegas' | 'saldos' | 'conteo' | 'balance';
  /** Ruta base del back; por defecto importacion-catalogo (puede llevar un id: conciliacion-fiscal/5). */
  base?: string;
  titulo: string;
  descripcion: string;
  columnas: ColumnaImportar[];
  ejemplo: (string | number | boolean | null)[][];
}

const c = (
  key: string,
  header: string,
  tipo: TipoColumnaImportar,
  obligatoria: boolean,
  ayuda: string,
  alias: string[] = [],
): ColumnaImportar => ({ key, header, tipo, obligatoria, ayuda, alias });

export const PLANTILLA_CATEGORIAS: PlantillaImportar = {
  recurso: 'categorias',
  titulo: 'Categorías',
  descripcion: 'Si la categoría ya existe (mismo nombre) se actualizan su padre y su IVA.',
  columnas: [
    c('nombre', 'Nombre', 'texto', true, 'Nombre de la categoría', ['categoria', 'categoría']),
    c('padre', 'Categoría padre', 'texto', false, 'Opcional: la categoría que la contiene (debe existir o venir en el archivo)', ['padre']),
    c('ivaDefecto', 'IVA sugerido', 'numero', false, 'Opcional: 0, 5 o 19 — se sugiere a sus productos', ['iva']),
  ],
  ejemplo: [
    ['Bebidas', null, 19],
    ['Gaseosas', 'Bebidas', 19],
  ],
};

export const PLANTILLA_MARCAS: PlantillaImportar = {
  recurso: 'marcas',
  titulo: 'Marcas',
  descripcion: 'Las marcas que ya existen (mismo nombre) se dejan como están.',
  columnas: [c('nombre', 'Nombre', 'texto', true, 'Nombre de la marca', ['marca'])],
  ejemplo: [['Postobón'], ['Alpina']],
};

export const PLANTILLA_PRODUCTOS: PlantillaImportar = {
  recurso: 'productos',
  titulo: 'Productos',
  descripcion:
    'Si el código interno (o, sin él, el código de barras) ya existe, el producto se actualiza con lo que traiga la fila; ' +
    'las celdas vacías no borran nada. A un producto con existencias no se le cambia el costo.',
  columnas: [
    c('sku', 'Código interno', 'texto', false, 'SKU o referencia. Con él se reconoce un producto que ya existe', ['sku', 'referencia', 'codigo']),
    c('codigoBarras', 'Código de barras', 'texto', false, 'EAN/UPC', ['codigo de barras', 'ean', 'barras']),
    c('nombre', 'Nombre', 'texto', true, 'Nombre del producto o servicio (obligatorio si es nuevo)', ['producto', 'descripcion corta']),
    c('descripcion', 'Descripción', 'texto', false, 'Texto largo'),
    c('categoria', 'Categoría', 'texto', false, 'Nombre; si no existe se crea'),
    c('marca', 'Marca', 'texto', false, 'Nombre; si no existe se crea'),
    c('unidad', 'Unidad', 'texto', false, 'Unidad, UND, KG, LT… (por defecto Unidad)', ['unidad de medida']),
    c('clasificacion', 'Tipo', 'texto', false, 'PRODUCTO o SERVICIO (por defecto PRODUCTO)', ['clasificacion', 'clasificación']),
    c('manejaInventario', 'Maneja inventario', 'bool', false, 'Sí / No (por defecto Sí en productos, No en servicios)', ['inventario']),
    c('costo', 'Costo', 'numero', false, 'Costo unitario sin IVA'),
    c('precio', 'Precio', 'numero', true, 'Precio de venta (obligatorio si es nuevo)', ['precio venta', 'precio 1']),
    c('precio2', 'Precio 2', 'numero', false, 'Segundo precio (mayorista…)'),
    c('precio3', 'Precio 3', 'numero', false, 'Tercer precio'),
    c('ivaPorcentaje', 'IVA %', 'numero', false, '0, 5 o 19', ['iva']),
    c('ivaIncluido', 'IVA incluido', 'bool', false, 'Sí si el precio ya trae el IVA'),
    c('impoconsumo', 'Impoconsumo', 'numero', false, 'Valor del impuesto al consumo por unidad'),
    c('activo', 'Activo', 'bool', false, 'Sí / No (por defecto Sí)'),
  ],
  ejemplo: [
    ['P-001', '7702004001234', 'Gaseosa 400 ml', null, 'Bebidas', 'Postobón', 'UND', 'PRODUCTO', 'Sí', 1500, 2500, 2300, null, 19, 'Sí', 0, 'Sí'],
    ['S-001', null, 'Instalación', 'Servicio técnico', null, null, 'UND', 'SERVICIO', 'No', 0, 50000, null, null, 19, 'No', 0, 'Sí'],
  ],
};

export const PLANTILLA_PRECIOS: PlantillaImportar = {
  recurso: 'precios',
  titulo: 'Precios por lista',
  descripcion:
    'Un precio por fila. Si el producto (o su presentación) ya tiene precio en esa lista, se cambia. ' +
    'Si la lista no existe, se crea.',
  columnas: [
    c('lista', 'Lista', 'texto', true, 'Nombre de la lista de precios (Mayoristas, Distribuidores…)', ['lista de precios']),
    c('producto', 'Código', 'texto', true, 'Código interno (SKU) o código de barras del producto o de la presentación', ['sku', 'codigo', 'producto']),
    c('presentacion', 'Presentación', 'texto', false, 'Opcional: nombre de la presentación (Caja x 12). Sin ella, el precio es del producto'),
    c('precio', 'Precio', 'numero', true, 'Precio de venta en esa lista'),
    c('utilidadEsperada', 'Utilidad %', 'numero', false, 'Opcional: margen esperado en %', ['utilidad', 'margen']),
  ],
  ejemplo: [
    ['Mayoristas', 'P-001', null, 2200],
    ['Mayoristas', 'P-001', 'Caja x 12', 24000],
  ],
};

export const PLANTILLA_PRESENTACIONES: PlantillaImportar = {
  recurso: 'presentaciones',
  titulo: 'Presentaciones',
  descripcion:
    'Formas en que se compra o se vende un producto (Caja x 12, Bulto 50 kg). Si el producto ya tiene una ' +
    'presentación con ese nombre, se actualiza.',
  columnas: [
    c('producto', 'Código', 'texto', true, 'Código interno (SKU) o código de barras del producto', ['sku', 'codigo', 'producto']),
    c('nombre', 'Presentación', 'texto', true, 'Nombre: Caja x 12, Bulto 50 kg, Six pack…', ['nombre']),
    c('contiene', 'Contiene', 'numero', true, 'Cuántas unidades del producto trae (Caja x 12 = 12). Obligatorio si es nueva', ['factor', 'unidades']),
    c('codigoBarras', 'Código de barras', 'texto', false, 'El de la presentación, si tiene', ['ean', 'barras']),
    c('precio', 'Precio', 'numero', false, 'Precio de venta de la presentación'),
    c('costo', 'Costo', 'numero', false, 'Costo de compra de la presentación'),
    c('seVende', 'Se vende', 'bool', false, 'Sí / No (por defecto Sí)'),
    c('defaultVenta', 'Por defecto en venta', 'bool', false, 'Sí si es la que sale primero al vender'),
    c('defaultCompra', 'Por defecto en compra', 'bool', false, 'Sí si es la que sale primero al comprar'),
    c('activo', 'Activa', 'bool', false, 'Sí / No (por defecto Sí)'),
  ],
  ejemplo: [
    ['P-001', 'Caja x 12', 12, '7702004009999', 24000, 15000, 'Sí', 'No', 'Sí', 'Sí'],
  ],
};

export const PLANTILLA_RECETAS: PlantillaImportar = {
  recurso: 'recetas',
  titulo: 'Recetas',
  descripcion:
    'Una fila por ingrediente; las filas del mismo producto arman su receta completa y reemplazan la que tenga.',
  columnas: [
    c('producto', 'Producto', 'texto', true, 'Código del producto que se fabrica o se arma', ['codigo producto']),
    c('tipo', 'Tipo', 'texto', false, 'RECETA (se fabrica) o KIT (se arma con productos); por defecto RECETA'),
    c('rendimiento', 'Rendimiento', 'numero', false, 'Unidades que salen (ej. 40 panes). Basta en la primera fila del producto'),
    c('componente', 'Ingrediente', 'texto', true, 'Código del ingrediente o componente', ['componente', 'insumo']),
    c('cantidad', 'Cantidad', 'numero', true, 'Cantidad del ingrediente para el rendimiento indicado'),
    c('presentacion', 'Presentación del ingrediente', 'texto', false, 'Si la cantidad está en una presentación (Bulto 50 kg)', ['presentacion']),
    c('merma', 'Merma %', 'numero', false, 'Pérdida del ingrediente en el proceso (0 a 99,99)'),
    c('nota', 'Nota', 'texto', false, 'Opcional'),
  ],
  ejemplo: [
    ['PAN-01', 'RECETA', 40, 'HARINA-01', 1, 'Bulto 50 kg', 2, null],
    ['PAN-01', null, null, 'AZUCAR-01', 0.5, null, 0, null],
  ],
};

// ── Inventario (§2c) ─────────────────────────────────────────────────

export const PLANTILLA_BODEGAS: PlantillaImportar = {
  recurso: 'bodegas',
  base: 'importacion-inventario',
  titulo: 'Bodegas',
  descripcion: 'Las bodegas que ya existen en esa sede (mismo nombre) se dejan como están.',
  columnas: [
    c('nombre', 'Nombre', 'texto', true, 'Nombre de la bodega', ['bodega']),
    c('sede', 'Sede', 'texto', false, 'Nombre o código de la sede; vacío = la sede en la que está trabajando', ['sucursal']),
    c('codigo', 'Código', 'texto', false, 'Código corto (B02…)'),
    c('permiteVenta', 'Permite venta', 'bool', false, 'Sí si se vende desde ella (por defecto Sí)'),
    c('ubicacion', 'Ubicación', 'texto', false, 'Dónde queda'),
  ],
  ejemplo: [['Bodega trasera', null, 'B02', 'No', 'Patio']],
};

export const PLANTILLA_SALDOS_INVENTARIO: PlantillaImportar = {
  recurso: 'saldos',
  base: 'importacion-inventario',
  titulo: 'Saldos iniciales de inventario',
  descripcion:
    'Existencias con las que arranca cada producto. Solo entra en un producto sin existencias en esa bodega. ' +
    'Mueve stock, kardex, lotes, seriales y costo promedio, pero NO genera asiento: el valor contable va por ' +
    'Contabilidad → Importar → Saldos iniciales (cuenta 1435).',
  columnas: [
    c('producto', 'Código', 'texto', true, 'Código interno (SKU) o código de barras', ['sku', 'codigo', 'producto']),
    c('bodega', 'Bodega', 'texto', false, 'Nombre o código; vacío = la principal de la sede en la que está trabajando'),
    c('cantidad', 'Cantidad', 'numero', true, 'Unidades del producto (en su unidad base)', ['stock', 'existencias']),
    c('costo', 'Costo unitario', 'numero', false, 'Vacío = el costo que tiene el producto', ['costo']),
    c('lote', 'Lote', 'texto', false, 'Solo productos con lotes; una fila por lote'),
    c('vencimiento', 'Vencimiento', 'fecha', false, 'Fecha de vencimiento del lote'),
    c('fabricacion', 'Fabricación', 'fecha', false, 'Fecha de fabricación del lote (opcional)'),
    c('seriales', 'Seriales', 'texto', false, 'Solo productos con serial: uno por unidad, separados por coma'),
  ],
  ejemplo: [
    ['P-001', null, 24, 1500, null, null, null, null],
    ['LECHE-01', 'Bodega trasera', 10, 2800, 'L2026-10', '2026-12-31', null, null],
    ['CEL-01', null, 2, 450000, null, null, null, 'IMEI001, IMEI002'],
  ],
};

export const PLANTILLA_CONTEO: PlantillaImportar = {
  recurso: 'conteo',
  base: 'importacion-inventario',
  titulo: 'Conteo físico',
  descripcion:
    'Lo que se contó en la bodega. Llena las cantidades contadas de este reconteo; el inventario se ajusta solo ' +
    'al aprobarlo.',
  columnas: [
    c('producto', 'Código', 'texto', true, 'Código interno (SKU) o código de barras', ['sku', 'codigo', 'producto']),
    c('lote', 'Lote', 'texto', false, 'Si el producto tiene varios lotes en el conteo'),
    c('cantidad', 'Cantidad contada', 'numero', true, 'Lo que hay físicamente', ['contado', 'cantidad', 'conteo']),
  ],
  ejemplo: [['P-001', null, 23], ['LECHE-01', 'L2026-10', 9]],
};

/**
 * Balance de prueba para la conciliación fiscal 2516/2517 (PLAN_EXCEL §5). La `base`
 * la pone la pantalla con el id de la conciliación.
 */
export const PLANTILLA_BALANCE_FISCAL: PlantillaImportar = {
  recurso: 'balance',
  base: 'conciliacion-fiscal',
  titulo: 'Balance de prueba',
  descripcion:
    'El balance de prueba del año gravable ANTES del cierre, de cualquier programa. Use la columna Saldo (con signo) o Débito y Crédito. ' +
    'Si trae todos los niveles (1, 11, 1105…) se toman solo las cuentas auxiliares. Cargarlo reemplaza el balance anterior; los ajustes se conservan.',
  columnas: [
    c('cuenta', 'Cuenta', 'texto', true, 'Código PUC de la cuenta (solo números)', ['codigo', 'código', 'codigo cuenta', 'código cuenta', 'cuenta contable']),
    c('nombre', 'Nombre', 'texto', false, 'Nombre de la cuenta', ['descripcion', 'descripción', 'nombre cuenta', 'nombre de la cuenta']),
    c('saldo', 'Saldo', 'numero', false, 'Saldo final con signo (por naturaleza, o débito positivo y crédito negativo: se detecta solo)', ['saldo final', 'nuevo saldo', 'saldo a diciembre']),
    c('debito', 'Débito', 'numero', false, 'En lugar de Saldo: saldo débito', ['debito', 'saldo debito', 'saldo débito', 'debe']),
    c('credito', 'Crédito', 'numero', false, 'En lugar de Saldo: saldo crédito', ['credito', 'saldo credito', 'saldo crédito', 'haber']),
  ],
  ejemplo: [
    ['110505', 'Caja general', 1300000, null, null],
    ['220505', 'Proveedores nacionales', 400000, null, null],
    ['413505', 'Comercio al por mayor', 1000000, null, null],
  ],
};
