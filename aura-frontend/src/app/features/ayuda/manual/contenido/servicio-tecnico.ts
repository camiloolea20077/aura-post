import { ManualModulo } from '../manual.model';

/** Servicio técnico (módulo opcional: solo lo ven las empresas que lo tienen activo). */
export const SERVICIO_TECNICO: ManualModulo[] = [
  {
    id: 'servicio-tecnico',
    grupo: 'Servicio Técnico',
    titulo: 'Órdenes de servicio técnico',
    icono: 'pi pi-wrench',
    rutas: ['/servicio-tecnico/ordenes', '/servicio-tecnico/configuracion'],
    permiso: 'servicio-tecnico.ordenes',
    resumen:
      'Recibir celulares, tablets y otros equipos para reparar: datos del equipo y fotos, diagnóstico, repuestos y mano de obra, abonos, estado, entrega con factura, PDF, correo y un enlace para que el cliente consulte su equipo.',
    secciones: [
      {
        titulo: 'Antes de empezar (una sola vez)',
        pasos: [
          'Cree el servicio con el que se cobra la mano de obra: Catálogo → Productos → Nuevo, tipo "Servicio", sin inventario, nombre "Mano de obra servicio técnico" y el IVA que cobre (0 % si no es responsable de IVA).',
          'Abra Servicio Técnico → Configuración y elija ese servicio en "Servicio con el que se factura la mano de obra".',
          'En la misma pantalla revise el prefijo de las órdenes (OS), los días de garantía por defecto y las condiciones que salen impresas (equipos abandonados, qué no cubre la garantía, etc.).',
          'Cree sus repuestos (vea "Cómo crear los repuestos").',
        ],
      },
      {
        titulo: 'Cómo crear los repuestos',
        texto: [
          'Un repuesto es un producto normal del inventario: así sabe cuántos tiene, cuánto le costaron y se descuenta solo cuando entrega el equipo y se factura.',
        ],
        pasos: [
          'Opcional: cree una categoría "Repuestos" en Catálogo → Categorías (y subcategorías como Pantallas, Baterías, Pines de carga) para encontrarlos fácil.',
          'Catálogo → Productos → Nuevo. Tipo "Estándar", con inventario. Nombre claro con marca y modelo: "Pantalla Samsung A54", "Batería iPhone 11". Un código (SKU) ayuda a buscarlo: "PAN-A54".',
          'Escriba el costo y el precio de venta, y el IVA. Si el precio que le dice al cliente ya incluye el IVA, marque "IVA incluido".',
          'Para que tenga existencias, registre la compra al proveedor en Compras (lo normal), o cargue el inventario inicial en Inventario si ya los tenía.',
          'En la orden, en "Repuestos y valor", escriba parte del nombre o el código: aparece el repuesto con su precio.',
        ],
        notas: [
          'Si compró un repuesto afuera solo para esa reparación, no hace falta crearlo: en la orden escríbalo a mano en "O escriba el repuesto". Se factura con el servicio de mano de obra y no mueve inventario.',
          'El stock se descuenta al entregar el equipo con factura, no al agregarlo a la orden.',
        ],
      },
      {
        titulo: 'Recibir un equipo',
        pasos: [
          'Servicio Técnico → Órdenes de servicio → "Recibir equipo".',
          'Busque el cliente o créelo con el botón de la persona (+): documento, nombre y teléfono.',
          'Llene la card del equipo: tipo, marca, modelo, IMEI (marque *#06# en el celular), color, accesorios que deja, daños que ya tiene y el problema que reporta.',
          'Tome fotos del equipo (pantalla, tapa y daños visibles). Desde el celular se pueden tomar con la cámara; se comprimen solas.',
          'En "Diagnóstico y servicio" asigne el técnico, la prioridad y, si quiere, la fecha estimada de entrega.',
          'Presione "Recibir equipo": la orden queda con su número (OS-0001) en estado Recibido.',
        ],
        notas: ['Imprima la etiqueta (botón "Etiqueta") y péguela al equipo o a la bolsa: lleva el número, el cliente y un código QR.'],
      },
      {
        titulo: 'Diagnóstico, presupuesto y estados',
        texto: [
          'Los estados son: Recibido, En diagnóstico, Esperando aprobación, Esperando repuesto, En reparación, Listo para entregar, No reparado, Entregado y Cancelado.',
          'El botón de arriba propone el siguiente paso; "Cambiar estado" deja elegir cualquiera (también volver atrás). Cada cambio queda en el Historial con fecha y usuario.',
        ],
        pasos: [
          'Agregue en "Repuestos y valor" los repuestos y la mano de obra: el total es el precio final para el cliente.',
          'Pase la orden a "Esperando aprobación" y envíele al cliente el enlace (botón de WhatsApp o "Enlace"). Desde ahí ve el presupuesto y puede aprobarlo o rechazarlo.',
          'Si lo aprueba, la orden pasa sola a "En reparación"; si no, a "No reparado".',
        ],
      },
      {
        titulo: 'Abonos',
        pasos: [
          'En "Repuestos y valor" → "Registrar abono": valor, medio de pago y dónde quedó el dinero.',
          'Cada abono genera un recibo de caja del cliente y queda como anticipo. Al entregar, se descuenta de la factura.',
          'Si se equivocó, anule el abono con el botón de la fila (antes de entregar).',
        ],
        notas: [
          'Un abono en efectivo no entra al cuadre de la caja abierta del POS: regístrelo en una cuenta de caja (caja general o caja menor). El pago del saldo al entregar sí puede entrar a la caja abierta.',
        ],
      },
      {
        titulo: 'Entregar el equipo',
        pasos: [
          'Con la orden en "Listo para entregar" (o "No reparado"), presione "Entregar".',
          'Elija cómo: facturar y cobrar el saldo ahora, facturar y dejar el saldo en cartera, o entregar sin factura (garantía o sin cobro, con el motivo).',
          'Al facturar, el sistema arma la factura con los repuestos y la mano de obra, descuenta los abonos, registra el pago y baja el stock de los repuestos.',
          'La orden queda Entregada, con el enlace a la factura y la garantía hasta la fecha calculada.',
        ],
      },
      {
        titulo: 'PDF, correo y enlace del cliente',
        texto: [
          '"PDF" descarga la orden con los datos del cliente y del equipo, el diagnóstico, el valor, los abonos, las condiciones, las fotos y un QR de consulta.',
          '"Correo" se la envía al cliente con el PDF y las fotos adjuntas (puede quitar las fotos antes de enviar).',
          'El enlace de consulta no pide usuario ni clave y no muestra el documento ni el IMEI completo del cliente.',
        ],
      },
      {
        titulo: 'Si el equipo ya vino antes',
        texto: [
          'Al recibir un equipo con un IMEI que ya tuvo órdenes, la pestaña "Cliente y equipo" muestra un aviso con las órdenes anteriores: sirve para revisar garantías y reparaciones repetidas.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El IMEI debe tener 15 dígitos',
        causa: 'Se escribió un número incompleto o el serial en vez del IMEI.',
        solucion: 'Marque *#06# en el celular y copie el IMEI (15 dígitos). Si el equipo no tiene IMEI (tablet WiFi), deje el campo vacío y use Serial.',
      },
      {
        mensaje: 'El IMEI no es válido: revise los dígitos',
        causa: 'Un dígito está mal: el último número del IMEI es de control.',
        solucion: 'Vuelva a copiarlo de *#06# o de la caja del equipo.',
      },
      {
        mensaje: 'Un abono en efectivo no entra al cuadre de la caja abierta',
        causa: 'Los anticipos no se cuentan en el arqueo del turno.',
        solucion: 'Elija la cuenta de caja donde queda el dinero (caja general o caja menor), o "Ya se movió otro día".',
      },
      {
        mensaje: 'Falta el servicio con el que se factura la mano de obra',
        causa: 'No se ha elegido el servicio en la configuración.',
        solucion: 'Cree el servicio en Catálogo → Productos y elíjalo en Servicio Técnico → Configuración.',
      },
      {
        mensaje: 'La orden tiene abonos: entréguela con factura',
        causa: 'Se intentó entregar sin factura (o cancelar) una orden con abonos activos.',
        solucion: 'Entregue facturando (los abonos se descuentan) o anule los abonos y devuelva el dinero.',
      },
      {
        mensaje: 'El cobro supera el saldo de la factura',
        causa: 'Se escribió el dinero que entregó el cliente en vez del saldo.',
        solucion: 'Registre el valor exacto del saldo y entregue el cambio.',
      },
    ],
  },
];
