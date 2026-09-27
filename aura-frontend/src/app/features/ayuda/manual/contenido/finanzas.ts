import { ManualModulo } from '../manual.model';

export const FINANZAS: ManualModulo[] = [
  {
    id: 'cuentas-cobrar',
    grupo: 'Cuentas',
    titulo: 'Cuentas por cobrar',
    icono: 'pi pi-arrow-down-left',
    rutas: ['/cuentas/cuentas-por-cobrar'],
    resumen:
      'Lo que los clientes deben. Las ventas a crédito crean su cuenta sola; aquí se consultan, se crean deudas manuales y se registran abonos.',
    secciones: [
      {
        titulo: 'Consultar',
        texto: [
          'Filtre por número o cliente, fechas de emisión y estado (activa, pagada, vencida). Cada fila muestra total, abonado y saldo.',
          '"Ver detalle" abre la cuenta con su progreso de pago, los abonos y los botones para imprimir factura, tirilla o recibo.',
        ],
      },
      {
        titulo: 'Registrar un abono',
        pasos: [
          'En el detalle, "Registrar Abono".',
          'Monto (máximo el saldo pendiente), método de pago y fecha de pago.',
          'Si tiene caja abierta, el dinero entra a esa caja. Si no, elija la cuenta contable donde entra el dinero.',
          'Marque "Ya entró a la caja otro día" si la plata ya estaba en el cajón cuando esa caja se contó y cerró: queda registrado y contabilizado sin tocar el arqueo.',
          'Guarde e imprima el recibo.',
        ],
        notas: [
          'Para pagos con retenciones o que cubren varias facturas, use mejor Cartera → ficha del cliente → Registrar pago (recibo de caja).',
          'Solo se eliminan abonos del día actual. Los de días anteriores se reversan desde el recibo en Cartera.',
        ],
      },
      {
        titulo: 'Crear una cuenta manual',
        texto: [
          '"Nueva Cuenta": cliente, total de la deuda, fechas de emisión y vencimiento y observaciones. Útil para deudas que no vienen de una venta del sistema (saldos iniciales, préstamos a clientes).',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El monto aplicado (X) supera el saldo pendiente de la cuenta',
        causa: 'Abono mayor que la deuda.',
        solucion: 'Registre el valor exacto; el sobrante puede quedar como anticipo desde un recibo de caja en Cartera.',
      },
      {
        mensaje: 'La cuenta ya está pagada',
        causa: 'Saldo en cero.',
        solucion: 'No se puede abonar más.',
      },
      {
        mensaje: 'Solo se pueden eliminar abonos del día actual',
        causa: 'El abono es de un día anterior.',
        solucion: 'Anule el recibo de caja desde Cartera con motivo.',
      },
      {
        mensaje: 'Este abono hace parte de un recibo de caja: anule el recibo completo desde cartera',
        causa: 'El abono vino de un recibo que pagó varias facturas.',
        solucion: 'Cartera → Recibos de caja → Anular.',
      },
      {
        mensaje: 'Esta es la retención de un pago: elimine el pago y se eliminan sus retenciones',
        causa: 'Se intentó borrar solo la retención.',
        solucion: 'Elimine o anule el pago que la originó.',
      },
      {
        mensaje: 'El tercero no es un cliente',
        causa: 'El tercero no tiene rol Cliente.',
        solucion: 'Edite el tercero y márquelo como Cliente.',
      },
    ],
  },
  {
    id: 'cuentas-pagar',
    grupo: 'Cuentas',
    titulo: 'Cuentas por pagar',
    icono: 'pi pi-arrow-up-right',
    rutas: ['/cuentas/cuentas-por-pagar'],
    resumen:
      'Lo que la empresa debe a proveedores. Las compras y gastos a crédito las crean solas; aquí se registran los pagos.',
    secciones: [
      {
        titulo: 'Registrar un pago',
        pasos: [
          'Abra el detalle de la cuenta y presione "Registrar Pago".',
          'Monto (máximo el saldo), método de pago, banco y referencia si aplica, y fecha.',
          'Cuenta de origen: de qué cuenta sale el dinero. Déjela vacía para que salga de la caja abierta.',
          'Sin caja abierta, elija la cuenta contable (banco, caja menor) de la que sale.',
          '"Ya salió de la caja otro día": la plata salió antes y esa caja ya cerró contándola.',
          'Guarde e imprima el comprobante.',
        ],
      },
      {
        titulo: 'Crear una cuenta manual',
        texto: [
          '"Nueva Cuenta": proveedor, número de factura externo, total, fechas y observaciones. Para deudas anteriores al sistema o que no vienen de una compra.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El monto no puede ser mayor al saldo pendiente',
        causa: 'Pago mayor que la deuda.',
        solucion: 'Pague el saldo exacto.',
      },
      {
        mensaje: 'El abono se declaró como salido de la caja otro día, pero también eligió una cuenta bancaria',
        causa: 'Dos orígenes a la vez.',
        solucion: 'Si salió del banco, desmarque "ya salió de la caja otro día".',
      },
      {
        mensaje: 'La cuenta … tiene $X y el pago necesita $Y',
        causa: 'La cuenta de origen no tiene saldo.',
        solucion: 'Reponga el fondo o pague desde otra cuenta.',
      },
      {
        mensaje: 'El tercero no es un proveedor',
        causa: 'Falta el rol Proveedor.',
        solucion: 'Edite el tercero y márquelo como Proveedor.',
      },
    ],
  },
  {
    id: 'cartera',
    grupo: 'Cartera',
    titulo: 'Cartera: crédito y cobranza',
    icono: 'pi pi-wallet',
    rutas: ['/cartera', '/cartera/cliente'],
    resumen:
      'Gestión completa del crédito a clientes: cupos, tablero, agenda de cobro, ficha del cliente, recibos de caja con retenciones, acuerdos de pago y autorizaciones.',
    secciones: [
      {
        titulo: 'Las pestañas de Cartera',
        texto: [
          'Tablero: cartera total, vencida, días de cobro (DSO), recaudo del mes, efectividad de cobro, evolución por edades, mayores deudores y saldo por vendedor.',
          'Cobrar hoy: promesas incumplidas, promesas para hoy, vencidos sin gestión y facturas que vencen pronto, con botones para llamar, WhatsApp y registrar gestión o pago.',
          'Autorizaciones: ventas a crédito que pasan el cupo y esperan aprobación.',
          'Cuentas Vencidas, Clientes (cupos), Edades de Cartera, Recibos de caja y Acuerdos de pago.',
        ],
      },
      {
        titulo: 'Configurar el crédito de un cliente',
        pasos: [
          'Pestaña Clientes → elija el cliente.',
          'Cupo de crédito, plazo (días) y días de tolerancia de mora.',
          'Estado del crédito y "Requiere autorización al superar cupo": con esto el cajero puede pedir autorización en lugar de quedar bloqueado.',
          'Guarde. El score (0 a 1000) y la suspensión por mora se recalculan cada noche.',
        ],
      },
      {
        titulo: 'Ficha del cliente',
        texto: [
          'Muestra saldo por cobrar, vencido, cupo disponible, saldo a favor, días promedio en pagar y edad del saldo.',
          'Pestañas: Facturas abiertas, Pagos, Recibos, Acuerdos, Gestiones, Anticipos e Historial de crédito.',
          'Botones: Estado de cuenta, Gestión de cobro, Acuerdo de pago, Registrar pago y Recalcular score.',
        ],
      },
      {
        titulo: 'Registrar un pago (recibo de caja)',
        pasos: [
          'En la ficha, "Registrar pago".',
          'Valor recibido, fecha, referencia y ¿Cómo pagó?',
          '¿Dónde quedó el efectivo? En la caja (elija cuál), "Entró otro día" (ese arqueo ya cerró) u "Otra cuenta" (caja menor…). Para transferencias, la cuenta donde entró.',
          'Aplicar a facturas: "Repartir (más vieja primero)" o escriba cuánto va a cada factura. "Pagar completa" llena el saldo de una.',
          'Si el cliente retuvo impuestos, use el botón % de la factura: Renta, IVA e ICA. Lo retenido también abona la factura.',
          'Lo que sobre queda como saldo a favor (anticipo), que luego se aplica con "Aplicar saldo a favor".',
          'Registrar pago e imprimir el recibo.',
        ],
      },
      {
        titulo: 'Gestiones y promesas de pago',
        texto: [
          '"Registrar gestión": qué se hizo (llamada, visita, WhatsApp), el resultado y, si prometió pagar, cuándo y cuánto. Las promesas aparecen en Cobrar hoy y en la campana; si vencen sin pago quedan como incumplidas.',
        ],
      },
      {
        titulo: 'Acuerdos de pago',
        pasos: [
          'En la ficha, "Acuerdo de pago".',
          'Elija las facturas que entran, el número de cuotas, la primera fecha, cada cuánto y los días de gracia. Puede usar "Plan personalizado" y ajustar valores.',
          'Crear acuerdo e "Imprimir para firmar". Las facturas pasan a vencer con cada cuota.',
          'Los pagos se registran normalmente a las facturas y se aplican a las cuotas en orden. Una cuota sin pagar más los días de gracia deja el acuerdo incumplido.',
        ],
      },
      {
        titulo: 'Reglas de crédito y autorizaciones',
        texto: [
          'Reglas de crédito (botón en Cartera): suben o bajan cupos y suspenden clientes solos según cómo pagan. Se arman con condiciones (score, mora, cupo), qué hacen, cuándo se revisan y cada cuánto pueden repetirse. "Probar con los clientes de hoy" muestra a quién afectaría.',
          'Autorizaciones: cada solicitud muestra cuánto pasa el cupo, lo que debe y su score. Aprobar deja al cajero vender a crédito por un tiempo; Rechazar pide motivo que el cajero verá.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'A la cuenta … se le aplica más de su saldo',
        causa: 'Lo aplicado (más retenciones) supera el saldo de la factura.',
        solucion: 'Reduzca el valor; el excedente queda como anticipo.',
      },
      {
        mensaje: 'Lo aplicado a facturas supera el valor recibido',
        causa: 'Se repartió más de lo que entró.',
        solucion: 'Ajuste los valores aplicados.',
      },
      {
        mensaje: 'En efectivo con caja abierta no se puede dejar sobrante como anticipo',
        causa: 'Se recibió de más en efectivo.',
        solucion: 'Entregue el cambio y registre el valor exacto, o registre el anticipo por una cuenta.',
      },
      {
        mensaje: 'A la cuenta … se le registran retenciones sin pago',
        causa: 'Solo se escribieron retenciones.',
        solucion: 'Registre el valor pagado junto con lo retenido.',
      },
      {
        mensaje: 'Un pago de cartera no puede registrarse a crédito',
        causa: 'Método de pago Crédito en un recibo.',
        solucion: 'Elija el medio con el que realmente pagó.',
      },
      {
        mensaje: 'El efectivo de este recibo entró a un turno de caja que ya cerró; no se puede anular',
        causa: 'Ese dinero ya se contó en un arqueo.',
        solucion: 'Corrija con "Corregir arqueo" en Caja → Turnos.',
      },
      {
        mensaje: 'El sobrante de este recibo ya se cruzó contra otra factura',
        causa: 'El anticipo ya se aplicó.',
        solucion: 'Reverse ese cruce antes de anular el recibo.',
      },
      {
        mensaje: 'La cuenta … ya está en el acuerdo …: anúlelo primero',
        causa: 'Factura incluida en otro acuerdo vigente.',
        solucion: 'Anule el acuerdo anterior o deje fuera esa factura.',
      },
      {
        mensaje: 'Las cuotas suman $X y la deuda del acuerdo es $Y: deben ser iguales',
        causa: 'Plan personalizado descuadrado.',
        solucion: 'Use "Ajustar la última cuota" o "Volver a repartir igual".',
      },
      {
        mensaje: 'La cuota N tiene una fecha pasada / debe vencer después de la cuota anterior',
        causa: 'Fechas de cuotas inválidas.',
        solucion: 'Corrija las fechas.',
      },
      {
        mensaje: 'El cliente no tiene cupo de crédito configurado',
        causa: 'Sin cupo en la pestaña Clientes.',
        solucion: 'Configure el cupo del cliente.',
      },
      {
        mensaje: 'No hace falta autorización: la venta cabe en el cupo',
        causa: 'El cupo alcanza.',
        solucion: 'Cobre a crédito directamente.',
      },
      {
        mensaje: 'Agrega al menos una condición: sin condiciones la regla actuaría sobre todos los clientes',
        causa: 'Regla de crédito sin condiciones.',
        solucion: 'Agregue al menos una condición.',
      },
    ],
  },
  {
    id: 'cuentas-bancarias',
    grupo: 'Tesorería',
    titulo: 'Cuentas bancarias, cajas y billeteras',
    icono: 'pi pi-building-columns',
    rutas: ['/tesoreria/cuentas-bancarias'],
    resumen:
      'Las cuentas de dinero de la empresa (bancos, billeteras como Nequi, cajas) con su cuenta contable, saldo inicial y sobregiro.',
    secciones: [
      {
        titulo: 'Crear una cuenta',
        pasos: [
          'Nueva Cuenta → código (vacío se asigna solo) y nombre (Bancolombia principal).',
          'Tipo, banco, número de cuenta o billetera y titular. Opcional: el banco como tercero.',
          'Cuenta contable del disponible (11xx): 1105 caja, 1110 bancos. Es obligatoria.',
          'Saldo inicial: el saldo con el que arranca en el sistema.',
          '¿Permite sobregiro? Si sí, el cupo de sobregiro.',
          'Guardar.',
        ],
        notas: [
          'Esta cuenta aparece en "¿A qué cuenta llega el pago?" del POS y en los pagos por banco de compras, gastos y recibos.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'La cuenta contable es obligatoria',
        causa: 'Falta asociarla al plan de cuentas.',
        solucion: 'Elija una cuenta 11xx auxiliar. Si no existe, créela en el plan de cuentas.',
      },
      {
        mensaje: 'El código solo admite letras, números, guion y guion bajo (máximo 20)',
        causa: 'Caracteres no permitidos.',
        solucion: 'Corrija el código o déjelo vacío.',
      },
    ],
  },
  {
    id: 'egresos-recaudos',
    grupo: 'Tesorería',
    titulo: 'Egresos y recaudos',
    icono: 'pi pi-sort-alt',
    rutas: ['/tesoreria/egresos', '/tesoreria/recaudos'],
    resumen: 'Salidas y entradas de dinero directo en las cuentas bancarias que no vienen de una venta o compra.',
    secciones: [
      {
        titulo: 'Registrar',
        pasos: [
          'Egresos → Nuevo Egreso (o Recaudos → Nuevo Recaudo).',
          'Cuenta, fecha, concepto (Pago factura energía, Cobro factura #001), categoría, beneficiario u origen, referencia y monto.',
          'Registrar. La pantalla muestra el total del período y el número de movimientos.',
        ],
        notas: [
          'Para pagar deudas registradas use Cuentas por Pagar o Cartera, así la deuda baja. Un egreso suelto no descuenta ninguna cuenta por pagar.',
        ],
      },
    ],
    errores: [],
  },
  {
    id: 'conciliacion-tesoreria',
    grupo: 'Tesorería',
    titulo: 'Conciliación (tesorería)',
    icono: 'pi pi-check-circle',
    rutas: ['/tesoreria/conciliacion'],
    resumen: 'Comparar los movimientos de una cuenta en el sistema con el extracto del banco.',
    secciones: [
      {
        titulo: 'Conciliar',
        pasos: [
          'Seleccione la cuenta bancaria y el rango de fechas.',
          '"Importar CSV" con el extracto: columnas fecha,concepto,monto (separador coma o punto y coma, fecha AAAA-MM-DD).',
          'Marque los movimientos que coinciden o use "Conciliar emparejados" / "Conciliar todos".',
          'Escriba el saldo final del extracto: el cuadre muestra saldo inicial, recaudos y egresos conciliados, saldo del sistema y la diferencia.',
        ],
        notas: [
          'La conciliación contable completa (con ajustes de comisiones, GMF e intereses y cierre del extracto) está en Contabilidad → Conciliación Bancaria.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El CSV no carga o las fechas salen mal',
        causa: 'Formato distinto al esperado.',
        solucion: 'Use fecha AAAA-MM-DD, concepto y monto, una línea por movimiento.',
      },
    ],
  },
  {
    id: 'traslados-fondos',
    grupo: 'Tesorería',
    titulo: 'Traslados de fondos y caja menor',
    icono: 'pi pi-arrow-right-arrow-left',
    rutas: ['/tesoreria/traslados-fondos'],
    resumen:
      'Mover plata entre cuentas propias: constituir y reembolsar la caja menor, consignar el efectivo del día o pasar dinero entre bancos.',
    secciones: [
      {
        titulo: 'Constituir la caja menor',
        pasos: [
          'Verifique que la caja menor exista en el plan de cuentas (por ejemplo 110510 Cajas menores) como auxiliar y con "Es medio de pago".',
          'Nuevo traslado → De dónde sale: Caja (la caja abierta de la sucursal), Cuenta bancaria o Cuenta contable.',
          'A dónde entra: Cuenta contable → la caja menor.',
          'Monto, fecha y concepto (Constitución caja menor sede norte). Registrar.',
        ],
      },
      {
        titulo: 'Usar y reembolsar la caja menor',
        texto: [
          'Los gastos, compras y pagos se registran eligiendo "Otra cuenta" → la caja menor como origen. El sistema no deja gastar más de lo que tiene.',
          'Al reembolsar, el formulario muestra el fondo fijo, el saldo de hoy y lo que falta reponer, con los movimientos desde la última reposición. "Usar este monto" llena el valor a reponer.',
        ],
      },
      {
        titulo: 'Anular un traslado',
        texto: [
          '"Anular traslado" pide un motivo (mínimo 10 caracteres). El traslado no se borra: su asiento se reversa con fecha de hoy.',
          'Si el traslado movió un turno de caja ya cerrado, no se anula: se corrige ese cierre con "Corregir arqueo".',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'El origen y el destino del traslado son el mismo',
        causa: 'Misma cuenta en ambos lados.',
        solucion: 'Elija destinos distintos.',
      },
      {
        mensaje: 'Debe indicar la cuenta bancaria / cuenta contable del origen o destino',
        causa: 'Falta elegir la cuenta.',
        solucion: 'Complete el campo.',
      },
      {
        mensaje: 'No hay cajas abiertas. Abre una o elige otro origen',
        causa: 'Origen Caja sin turno abierto.',
        solucion: 'Abra un turno o use banco o cuenta contable.',
      },
      {
        mensaje: 'No hay cuentas habilitadas como medio de pago',
        causa: 'Ninguna cuenta contable tiene la marca de medio de pago.',
        solucion: 'En el plan de cuentas edite la caja menor y marque "Es medio de pago".',
      },
      {
        mensaje: 'El turno de … que movió este traslado ya cerró',
        causa: 'Anular cambiaría un arqueo cerrado.',
        solucion: 'Use "Corregir arqueo" en Caja → Turnos.',
      },
      {
        mensaje: 'Esta cuenta no tiene constitución registrada',
        causa: 'Se pidió reembolso sin haber constituido la caja menor.',
        solucion: 'Registre primero la constitución.',
      },
    ],
  },
  {
    id: 'obligaciones',
    grupo: 'Tesorería',
    titulo: 'Préstamos y obligaciones financieras',
    icono: 'pi pi-percentage',
    rutas: ['/obligaciones'],
    resumen: 'Créditos bancarios con su tabla de amortización y el pago de cada cuota.',
    secciones: [
      {
        titulo: 'Registrar un préstamo',
        pasos: [
          'Nuevo préstamo → banco (acreedor), nombre de la entidad y número de obligación o pagaré.',
          'Cuenta donde entra el dinero.',
          'Monto, tasa de interés mensual (%), plazo en meses y fecha de desembolso.',
          'Crear préstamo. El sistema arma la tabla de amortización (cuota, capital, interés y saldo).',
        ],
      },
      {
        titulo: 'Pagar una cuota',
        texto: [
          'En "Ver tabla de amortización" use "Pagar cuota" en la cuota pendiente, elija el medio de pago y la cuenta de origen. Sin cuenta, sale de la caja en efectivo.',
        ],
      },
    ],
    errores: [
      {
        mensaje: 'La cuota #N ya está pagada',
        causa: 'Se intentó pagar dos veces la misma cuota.',
        solucion: 'Revise la tabla: pague la siguiente cuota pendiente.',
      },
      {
        mensaje: 'No se puede anular: la obligación ya tiene cuotas pagadas',
        causa: 'El préstamo ya tuvo pagos.',
        solucion: 'Un préstamo con pagos no se anula; si se registró mal, consulte con el contador para ajustarlo con una nota contable.',
      },
    ],
  },
];
