import { ManualModulo } from '../manual.model';

export const COMPRAS_VENTAS: ManualModulo[] = [
  {
    id: 'compras',
    grupo: 'Compras',
    titulo: 'Compras',
    icono: 'pi pi-truck',
    rutas: ['/compras', '/compras/nueva'],
    resumen:
      'Registrar lo que llega del proveedor: sube el stock, actualiza el costo, crea lotes y seriales, y según cómo se pague sale de la caja, del banco o queda como cuenta por pagar.',
    secciones: [
      {
        titulo: 'Registrar una compra',
        pasos: [
          'Compras → Nueva compra.',
          'Busque el proveedor por nombre o NIT (debe existir como tercero con rol Proveedor).',
          'Tipo de documento: Factura de Compra, Nota Débito, Nota Crédito o Recibo. Número del documento del proveedor, fecha y sucursal.',
          'Agregue los productos: en la celda Producto escriba el nombre, SKU o código de barras y elija de la lista (con el lector de barras basta escanear y Enter). La lupa abre el buscador avanzado, donde puede filtrar por categoría, marca, clase (mercancía, activo, gasto…) y estado.',
          'En cada línea: cantidad (puede elegir la presentación de compra y sumar unidades sueltas), valor unitario, descuento, IVA %. Use Duplicar para repetir una línea.',
          'Columnas: con el botón "Columnas" junto a "Agregar producto" oculte las que no usa (Descuento, Costo, IVA %, IVA $). El equipo lo recuerda. Aunque estén ocultas, el IVA del producto se sigue calculando.',
          'Productos con lote: escriba cada lote que llegó con su vencimiento; las cantidades deben sumar la de la línea ("Agregar otro lote").',
          'Productos con serial: escriba un serial por unidad.',
          'Retenciones (si aplica): Retefuente, ReteIVA y ReteICA con su concepto y tarifa. Fletes si los hay.',
          'Revise subtotal, IVA y el total o "Neto a pagar". Guarde.',
        ],
      },
      {
        titulo: '¿De dónde sale la plata?',
        texto: [
          'Crédito: no sale dinero; queda una cuenta por pagar al proveedor con su plazo.',
          'Caja: sale del cajón del punto de venta y afecta su arqueo (debe haber turno abierto).',
          'Banco: sale de una cuenta bancaria; elija la cuenta y el método (Transferencia, Nequi, Tarjeta, Cheque).',
          'Otra cuenta: caja menor, anticipos a empleados o fondos por legalizar. La cuenta debe estar marcada como medio de pago en el plan de cuentas y tener saldo.',
          'Ya salió de la caja: la plata salió otro día y ese arqueo ya se cerró. No toca ninguna caja.',
        ],
        notas: [
          'Si la fecha de la compra es de días anteriores y paga desde la caja, el sistema pide un motivo (y pasado el límite, autorización del administrador).',
        ],
      },
      {
        titulo: 'Nota crédito de compra (devolución al proveedor)',
        pasos: [
          'Nueva compra → tipo de documento Nota Crédito.',
          'Elija la factura que corrige (del mismo proveedor y sucursal). El sistema carga los productos con la cantidad que aún se puede acreditar; ajuste o quite las líneas que sí llegaron.',
          '¿Qué se hace con el valor? "Bajar la deuda" (descuenta de la cuenta por pagar de esa factura), "Devuelve la plata" (el proveedor devuelve dinero) o "Saldo a favor" (queda crédito para próximas compras).',
          'Guarde. La mercancía sale del inventario.',
        ],
      },
      {
        titulo: 'Activos, gastos y diferidos en la misma factura',
        texto: [
          'Cada línea hace lo que dice la clasificación de su ítem: la mercancía entra al inventario; un activo fijo crea sus fichas; un diferido crea el diferido; un gasto, un servicio o una dotación van directo a su cuenta. La línea lo avisa con una etiqueta azul.',
          'Los fletes se reparten entre todas las líneas según su valor: la parte de un activo sube el costo de su ficha y la de la mercancía, el costo promedio.',
        ],
        notas: [
          'Una nota crédito no acepta líneas de activo, intangible ni diferido: si el activo no se ha movido, anule la compra; si ya se depreció, dé de baja el activo.',
        ],
      },
      {
        titulo: 'Presentaciones y unidades sueltas',
        texto: [
          'Con una presentación elegida (Paca ×28) aparece "+ N und sueltas": llegaron 4 pacas y 2 cervezas se escribe en una sola línea. Las sueltas se cobran al costo de la presentación dividido por lo que contiene.',
          'En productos con lotes no se ofrecen sueltas: los lotes se escriben en presentaciones completas.',
        ],
      },
      {
        titulo: 'Ver asiento antes de guardar',
        texto: [
          '"Ver asiento" muestra el comprobante contable que va a quedar (cuentas, débitos y créditos) sin guardar nada. Sale del mismo cálculo que el asiento real.',
        ],
      },
      {
        titulo: 'Consultar, editar y anular',
        texto: [
          'La lista tiene: Ver detalle (con PDF), Editar compra, Comprobante de egreso (tirilla para firmar) y Documento soporte (para proveedores no obligados a facturar).',
          'Anular revierte el stock y los lotes. No se puede si esa mercancía ya se vendió o salió.',
          'Si la cuenta por pagar de la compra ya tiene abonos, anule los abonos antes de cambiar el valor o la forma de pago.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'No se puede anular la compra: un activo fijo que creó esta compra ya se depreció, se dio de baja o se vendió',
        causa: 'La ficha del activo ya tiene historia propia.',
        solucion: 'No se anula la compra: dé de baja o venda el activo desde Activos Fijos, o reverse primero su depreciación si el mes está abierto.',
      },
      {
        mensaje: 'No se puede editar la compra: un diferido que creó esta compra ya tiene cuotas amortizadas',
        causa: 'El diferido ya reconoció gasto en meses anteriores.',
        solucion: 'Corrija con una nota contable o una nota crédito del proveedor.',
      },
      {
        mensaje: '… es activo fijo: no se acredita con nota crédito',
        causa: 'La nota crédito incluye un activo, intangible o diferido.',
        solucion: 'Anule la compra (si el activo no se ha movido) o dé de baja el activo.',
      },
      {
        mensaje: 'La línea de … crearía N fichas de activo (máximo 200 por línea). Revise la cantidad.',
        causa: 'Cantidad muy alta en una línea de activo fijo.',
        solucion: 'Revise la cantidad o compre ese ítem como Gasto o Dotación.',
      },
      {
        mensaje: 'La compra tiene notas crédito vigentes: anúlelas primero',
        causa: 'Hay devoluciones al proveedor (notas crédito) sobre esa compra.',
        solucion: 'Anule primero las notas crédito y luego la compra.',
      },
      {
        mensaje: 'La compra tiene un documento soporte aceptado por la DIAN',
        causa: 'El documento soporte electrónico ya fue aceptado.',
        solucion: 'No se anula: corríjalo con una nota de ajuste.',
      },
      {
        mensaje: 'La cuenta por pagar de esta compra ya tiene abonos: anule los abonos antes de anular la compra',
        causa: 'Parte de la compra a crédito ya se pagó.',
        solucion: 'Anule los abonos en Cuentas por Pagar y luego anule la compra. Al anular, lo pagado de contado vuelve a la caja (turno de hoy) o al banco.',
      },
      {
        mensaje: 'No se puede anular, stock insuficiente en: …',
        causa: 'Parte de lo comprado ya se vendió o salió.',
        solucion: 'Registre una nota crédito por lo que queda en lugar de anular.',
      },
      {
        mensaje: 'No se puede …: del lote … ya salió mercancía',
        causa: 'Se intenta anular o editar una compra cuyo lote ya tuvo ventas.',
        solucion: 'Registre una nota crédito por lo que queda.',
      },
      {
        mensaje: 'La cuenta por pagar de esta compra ya tiene abonos',
        causa: 'Se quiere cambiar valor o forma de pago de una compra ya abonada.',
        solucion: 'Elimine o anule los abonos en Cuentas por Pagar y vuelva a editar.',
      },
      {
        mensaje: 'Una nota crédito debe indicar la factura de compra que corrige',
        causa: 'Falta la factura origen.',
        solucion: 'Elija la factura en "Factura que corrige".',
      },
      {
        mensaje: 'No se puede acreditar N de …',
        causa: 'Se intenta devolver más de lo que se compró o de lo que queda por acreditar.',
        solucion: 'Reduzca la cantidad.',
      },
      {
        mensaje: 'La nota crédito (X) supera lo que aún se debe de la compra #N',
        causa: 'Con "Bajar la deuda" el valor es mayor al saldo de la cuenta por pagar.',
        solucion: 'Use "Devuelve la plata" o "Saldo a favor" por la diferencia.',
      },
      {
        mensaje: 'La compra #N no tiene una cuenta por pagar viva',
        causa: 'Esa factura ya se pagó o fue de contado.',
        solucion: 'Emita la nota con destino "Devuelve la plata" o "Saldo a favor".',
      },
      {
        mensaje: 'Los lotes elegidos de … suman X y la línea tiene Y',
        causa: 'La suma de los lotes no coincide con la cantidad de la línea.',
        solucion: 'Corrija las cantidades de los lotes.',
      },
      {
        mensaje: 'El lote … ya existe con vencimiento …',
        causa: 'El código de lote ya existe con otra fecha.',
        solucion: 'Revise la fecha o use otro código.',
      },
      {
        mensaje: '… tiene N unidades y llegaron M seriales: escribe uno por unidad',
        causa: 'Cantidad de seriales distinta a las unidades.',
        solucion: 'Escriba un serial por unidad.',
      },
      {
        mensaje: 'La cuenta destino de una compra debe ser de activo (1xxx), gasto (5xxx) o costo',
        causa: 'Se eligió una cuenta contable destino inválida.',
        solucion: 'Elija una cuenta auxiliar de activo, gasto o costo.',
      },
    ],
  },
  {
    id: 'sugerido-compra',
    grupo: 'Compras',
    titulo: 'Sugerido de compra',
    icono: 'pi pi-shopping-cart',
    rutas: ['/compras/sugerido'],
    resumen: 'Qué pedir y cuánto: los productos en su punto de reorden, agrupados por el último proveedor.',
    secciones: [
      {
        titulo: 'Cómo funciona',
        texto: [
          'Por cada bodega sale lo que tiene un saldo igual o menor a su punto de reorden (o a su stock mínimo si no tiene punto). Sugiere pedir lo que falta para llegar al máximo.',
          'Sin máximo, el sugerido solo lo devuelve al punto de reorden: la pantalla avisa cuántos productos están así.',
          'El punto de reorden y el máximo se definen en Inventario › Stock, en cada registro de producto por bodega.',
          '"Exportar CSV" deja el pedido listo para Excel o para enviar al proveedor.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Nada por pedir',
        causa: 'Ningún producto está en su punto de reorden, o no tienen mínimo ni punto definidos.',
        solucion: 'Defina el stock mínimo o el punto de reorden en Inventario › Stock.',
      },
    ],
  },
  {
    id: 'ordenes-compra',
    grupo: 'Compras',
    titulo: 'Órdenes de compra',
    icono: 'pi pi-file-edit',
    rutas: ['/compras/ordenes'],
    resumen: 'Pedidos al proveedor con aprobación y recepción: al recibir, la orden se convierte en compra.',
    secciones: [
      {
        titulo: 'Flujo de una orden',
        pasos: [
          'Nueva Orden: proveedor, sucursal, fecha de entrega esperada, observaciones y productos con cantidad y costo. Queda en BORRADOR.',
          '"Enviar al proveedor" la pasa a ENVIADA.',
          '"Confirmar orden" cuando el proveedor la acepta.',
          '"Recibir mercancía": escriba el número de factura del proveedor y la cantidad recibida de cada producto. Al confirmar se crea la compra automáticamente.',
          'Si no llegó todo, la orden queda en "Recibida parcialmente" y puede recibir el resto después.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'La orden debe estar en BORRADOR para enviarse',
        causa: 'Ya fue enviada o anulada.',
        solucion: 'Siga con el paso siguiente del flujo.',
      },
      {
        mensaje: 'La orden debe estar ENVIADA para confirmarse',
        causa: 'Se intenta confirmar una orden en borrador.',
        solucion: 'Envíela primero.',
      },
    ],
  },
  {
    id: 'documentos-soporte',
    grupo: 'Compras',
    titulo: 'Documento soporte electrónico',
    icono: 'pi pi-verified',
    rutas: ['/compras/documentos-soporte'],
    resumen:
      'Soporte fiscal para compras y gastos a proveedores no obligados a facturar (personas naturales sin factura). Se emite ante la DIAN a través de Factus.',
    secciones: [
      {
        titulo: 'Emitir un documento soporte',
        pasos: [
          'En Compras o en Gastos, use el botón "Documento soporte (proveedor no obligado a facturar)" de la compra o gasto.',
          'Revise los datos del proveedor: documento, dirección, municipio y correo son obligatorios.',
          'Emita. Si la DIAN lo acepta queda con número y CUDS, y se puede ver el PDF.',
        ],
      },
      {
        titulo: 'Seguimiento',
        texto: [
          'Compras → Documentos Soporte lista los emitidos por fecha, con número, origen (compra o gasto), proveedor, total y estado.',
          'Si un intento fue rechazado: "Revisar y reintentar" corrige y reenvía; "Descartar intento" lo quita.',
          'Un documento soporte aceptado no se elimina: se corrige con una nota de ajuste.',
        ],
        notas: [
          'La empresa debe tener habilitado el documento soporte y su rango de numeración ante la DIAN y en Factus. Si la DIAN rechaza por rango, el problema es de habilitación, no del documento.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Faltan datos para emitir el documento soporte: …',
        causa: 'Al proveedor le faltan documento, dirección, municipio o correo.',
        solucion: 'Complete el tercero en Terceros y vuelva a emitir.',
      },
      {
        mensaje: 'Este documento ya tiene un documento soporte aceptado por la DIAN',
        causa: 'Ya se emitió.',
        solucion: 'Consúltelo en Compras → Documentos Soporte.',
      },
      {
        mensaje: 'La compra está anulada: no lleva documento soporte',
        causa: 'Documento anulado.',
        solucion: 'No aplica.',
      },
      {
        mensaje: 'Una nota crédito de compra no lleva documento soporte',
        causa: 'Las notas crédito se corrigen con nota de ajuste al DS original.',
        solucion: 'Emita el DS de la compra original.',
      },
      {
        mensaje: 'No se pudo conectar con Factus',
        causa: 'Factus no respondió.',
        solucion: 'Intente de nuevo en unos minutos.',
      },
      {
        mensaje: 'Rechazo DIAN por rango de numeración (DSAB…)',
        causa: 'El rango de documento soporte no está habilitado o no coincide.',
        solucion: 'Habilite el documento soporte y su rango en la DIAN y asócielo en Factus.',
      },
    ],
  },
  {
    id: 'ventas',
    grupo: 'Ventas',
    titulo: 'Historial de ventas',
    icono: 'pi pi-receipt',
    rutas: ['/ventas'],
    resumen:
      'Todas las ventas registradas: consultar, reimprimir, ver o emitir la factura electrónica y anular.',
    secciones: [
      {
        titulo: 'Consultar',
        texto: [
          'Busque por número de venta, número de factura electrónica, cliente o caja.',
          'Acciones: Ver detalle (productos, pagos, CUFE), Reimprimir tirilla, Factura PDF y Ver factura electrónica.',
        ],
      },
      {
        titulo: 'Anular una venta',
        texto: [
          'Desde el detalle, "Anular venta" revierte el stock de todos los productos y la contabilidad.',
          'Si la venta fue a crédito y su cuenta por cobrar ya tiene abonos, primero hay que reversar los abonos.',
          'Una venta con factura electrónica aceptada se corrige con una nota crédito electrónica (Ventas → Notas Crédito/Débito), no solo anulándola en Aura.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'La venta tiene devoluciones vigentes: anúlelas primero o registre la devolución total',
        causa: 'Anular la venta reversaría dos veces lo que la devolución ya devolvió.',
        solucion: 'Anule las devoluciones o use una devolución total en lugar de anular.',
      },
      {
        mensaje: 'Las comisiones de esta venta ya se liquidaron',
        causa: 'La comisión ya se le pagó al técnico o vendedor.',
        solucion: 'Ajuste la liquidación de comisiones antes de anular la venta.',
      },
      {
        mensaje: 'La factura de esta venta ya fue emitida o se está enviando en este momento',
        causa: 'Otro usuario (o un doble clic) ya la está enviando a la DIAN.',
        solucion: 'Espere unos segundos y recargue la venta.',
      },
      {
        mensaje: 'Factus no respondió a tiempo y pudo haber recibido la factura',
        causa: 'Se envió la factura y no llegó respuesta. La venta queda en estado DESCONOCIDO.',
        solucion: 'Revise en Factus si la factura existe antes de reenviarla. Si se reenvía y ya existía, Factus la rechaza como duplicada.',
      },
      {
        mensaje: 'Factus rechazó la factura: …',
        causa: 'Factus o la DIAN encontraron un dato inválido (cliente, resolución, valores).',
        solucion: 'Corrija lo que indica el mensaje y vuelva a enviarla.',
      },
      {
        mensaje: 'No se puede anular la venta porque su cuenta por cobrar ya tiene abonos',
        causa: 'La venta a crédito ya recibió pagos.',
        solucion: 'Elimine o anule los abonos (Cuentas por Cobrar o Cartera) y luego anule la venta.',
      },
      {
        mensaje: 'La venta ya está anulada',
        causa: 'Anulación repetida.',
        solucion: 'No hay nada que hacer.',
      },
      {
        mensaje: 'Esta venta ya tiene factura electrónica emitida',
        causa: 'Se intentó facturar dos veces.',
        solucion: 'Descargue el PDF desde "Ver factura electrónica".',
      },
      {
        mensaje: 'Esta venta no tiene factura electrónica emitida',
        causa: 'Se pidió el PDF o una nota de una venta sin factura.',
        solucion: 'Emita la factura primero.',
      },
      {
        mensaje: 'La venta no tiene productos para facturar',
        causa: 'Venta sin líneas.',
        solucion: 'Revise la venta.',
      },
    ],
  },
  {
    id: 'ventas-campo',
    grupo: 'Ventas',
    titulo: 'Ventas de campo',
    icono: 'pi pi-map-marker',
    rutas: ['/ventas-campo'],
    resumen: 'Pedidos que toman los vendedores en la calle: se despachan desde la bodega y se cobran después.',
    secciones: [
      {
        titulo: 'Flujo de un pedido',
        pasos: [
          'El vendedor crea el pedido ("Nueva venta de campo"): cliente (o consumidor final), productos y observaciones.',
          'En la oficina, "Despachar": confirma los productos. El pedido pasa a Despachada, sale el inventario y se genera la cuenta por cobrar.',
          '"Registrar cobro": método de pago, referencia y observaciones cuando el cliente paga.',
          '"Imprimir tirilla" para entregar con la mercancía. "Anular" solo antes de cobrar.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El pedido debe tener un cliente para despacharse',
        causa: 'La entrega genera una cuenta por cobrar y necesita deudor.',
        solucion: 'Asigne el cliente al pedido.',
      },
      {
        mensaje: 'Solo se pueden despachar pedidos en estado CREADA o PENDIENTE_DESPACHO',
        causa: 'El pedido ya se despachó, cobró o anuló.',
        solucion: 'Revise el estado del pedido.',
      },
      {
        mensaje: 'No se puede anular un pedido ya cobrado',
        causa: 'Ya se registró el pago.',
        solucion: 'Registre una devolución.',
      },
    ],
  },
  {
    id: 'notas-electronicas',
    grupo: 'Ventas',
    titulo: 'Notas crédito y débito electrónicas',
    icono: 'pi pi-file-excel',
    rutas: ['/ventas/notas', '/ventas/notas/credito', '/ventas/notas/debito'],
    resumen:
      'Documentos electrónicos que corrigen o anulan una factura ya enviada a la DIAN: la nota crédito resta y la nota débito suma.',
    secciones: [
      {
        titulo: 'Emitir una nota crédito',
        pasos: [
          'Ventas → Notas Crédito/Débito → Nota crédito.',
          'Busque la factura por número, documento o nombre del cliente y selecciónela.',
          'Concepto de corrección: Devolución de parte de los bienes, Anulación de factura electrónica, Rebaja o descuento, Ajuste de precio u Otros.',
          'Agregue los productos o servicios con cantidad, precio, impuesto y descuento.',
          'Método de pago y observación. Registrar.',
        ],
        notas: [
          'Los totales en pantalla son una estimación; Factus calcula los definitivos al validar.',
          'La nota débito funciona igual con conceptos Intereses, Gastos por cobrar, Cambio del valor u Otros.',
        ],
      },
      {
        titulo: 'Después de emitir',
        texto: ['Desde la lista: Ver nota, Ver PDF, Reenviar correo al cliente (solo notas con número) y Eliminar nota. Una nota aceptada por la DIAN sigue existiendo allá aunque se elimine en Aura: úselo solo con notas rechazadas o de prueba.'],
      },
    ],
    errores: [
      {
        mensaje: 'La nota no tiene número (no fue aceptada por la DIAN)',
        causa: 'La DIAN rechazó la nota.',
        solucion: 'Revise el detalle del rechazo, corríjala y vuelva a emitir.',
      },
      {
        mensaje: 'Ya existe una nota con la referencia …',
        causa: 'Código de referencia repetido.',
        solucion: 'Use un código distinto.',
      },
      {
        mensaje: 'No hay correo del cliente; indica uno',
        causa: 'Se intentó reenviar sin correo.',
        solucion: 'Escriba el correo o complételo en el tercero.',
      },
    ],
  },
  {
    id: 'cotizaciones',
    grupo: 'Ventas',
    titulo: 'Cotizaciones',
    icono: 'pi pi-file-edit',
    rutas: ['/cotizaciones'],
    resumen: 'Propuestas de precio para un cliente, con vigencia, PDF y conversión a venta.',
    secciones: [
      {
        titulo: 'Crear y usar',
        pasos: [
          'Se crean desde el POS (ícono de guardar como cotización) o se editan desde Ventas → Cotizaciones.',
          'Cliente, días de vigencia (muestra la fecha de vencimiento), observaciones y productos con precio y descuento.',
          'Generar PDF o imprimir tirilla para entregar al cliente.',
          '"Convertir a venta" carga los productos en el carrito del POS para cobrar.',
          'Se puede vender por partes: si en el POS se cobra menos de lo cotizado, la cotización queda "Parcial" y en su detalle cada producto muestra cuánto se ha vendido y cuánto falta.',
          'Si se cobra más de lo cotizado, la cotización se da por vendida hasta lo que tenía y el resto queda como venta normal.',
          'Una cotización Parcial se vuelve a convertir con "Vender lo pendiente": el POS carga solo lo que falta. Cuando se vende todo, pasa a "Convertida".',
          'Si se anula una venta que salió de una cotización, lo vendido vuelve a quedar pendiente en ella.',
          'En el detalle de la cotización y de la venta, "Documentos relacionados" muestra de qué cotización salió cada venta y a qué ventas fue cada cotización.',
          'Una cotización vencida se puede "Reactivar (mantiene los precios)" una sola vez. Una Parcial también vence: lo que falta se cotizó a un precio que ya no rige.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'Solo se pueden editar cotizaciones en estado PENDIENTE',
        causa: 'Ya se vendió (toda o una parte), venció o se anuló.',
        solucion: 'Si es Parcial, venda lo pendiente; si venció, reactívela; si no, cree una nueva.',
      },
      {
        mensaje: 'La cotización … está CONVERTIDA / ANULADA / VENCIDA: no se puede vender',
        causa: 'Solo se venden cotizaciones Pendientes o Parciales.',
        solucion: 'Reactívela si venció, o cree una nueva.',
      },
      {
        mensaje: 'La cotización … venció el …: reactívela para venderla',
        causa: 'Pasó la fecha de vigencia y todavía no corre el proceso nocturno que la marca como vencida.',
        solucion: 'Use "Reactivar" o cree una nueva cotización.',
      },
      {
        mensaje: 'La venta indica la cotización … pero no vende nada de lo que le queda pendiente',
        causa: 'Otra caja vendió lo que faltaba de la cotización mientras esta venta estaba en el carrito.',
        solucion: 'Revise "Documentos relacionados" de la cotización; si el cliente igual lleva los productos, vacíe el carrito y véndalos sin cargar la cotización.',
      },
      {
        mensaje: 'La cotización … ya no tiene nada pendiente por vender',
        causa: 'Todo lo cotizado ya se vendió.',
        solucion: 'Revise sus ventas en "Documentos relacionados".',
      },
      {
        mensaje: 'Esta cotización ya se reactivó una vez',
        causa: 'Solo se reactiva una vez para no sostener precios viejos.',
        solucion: 'Cree una nueva cotización con precios actuales.',
      },
      {
        mensaje: 'No se puede anular una cotización ya convertida a venta',
        causa: 'Ya es una venta.',
        solucion: 'Anule la venta si es necesario.',
      },
    ],
  },
  {
    id: 'devoluciones',
    grupo: 'Ventas',
    titulo: 'Devoluciones y cambios',
    icono: 'pi pi-replay',
    rutas: ['/devoluciones'],
    resumen: 'Cuando un cliente devuelve o cambia productos de una venta: reintegra el inventario y devuelve el dinero o reduce su deuda.',
    secciones: [
      {
        titulo: 'Registrar una devolución',
        pasos: [
          'Nueva Devolución → escriba el número de la venta y Buscar.',
          'Tipo: Parcial o Total. Fecha de devolución.',
          'Método de dinero: Sin movimiento de dinero, Efectivo, Transferencia o Nota crédito.',
          '"Reintegrar inventario": márquelo si el producto vuelve a la venta (desmárquelo si llegó dañado).',
          'Motivo y observaciones. En "Productos a devolver" escriba la cantidad de cada uno; para seriales, elija cuáles devuelve.',
          'Para un cambio, agregue los productos nuevos en "Cambio — agregar productos": el sistema muestra si hay que cobrar diferencia o devolver.',
          'Guardar devolución.',
        ],
        notas: ['Si la venta era a crédito, la devolución reduce automáticamente la cuenta por cobrar.'],
      },
    ],
    errores: [
      {
        mensaje: 'La cantidad a devolver (X) supera la cantidad original (Y)',
        causa: 'Se devuelve más de lo vendido.',
        solucion: 'Corrija la cantidad.',
      },
      {
        mensaje: 'Esta venta ya fue devuelta en su totalidad',
        causa: 'No queda nada por devolver.',
        solucion: 'Revise las devoluciones anteriores de la venta.',
      },
      {
        mensaje: 'No se puede devolver una venta anulada',
        causa: 'La venta ya se anuló.',
        solucion: 'No aplica devolución.',
      },
      {
        mensaje: '… maneja serial: véndelo desde el POS para elegir el serial',
        causa: 'Producto con serial agregado en un cambio.',
        solucion: 'Haga el cambio con una venta en el POS.',
      },
      {
        mensaje: 'Indica cuáles seriales de … devuelve el cliente',
        causa: 'Faltan los seriales devueltos.',
        solucion: 'Márquelos en la línea.',
      },
    ],
  },
];
