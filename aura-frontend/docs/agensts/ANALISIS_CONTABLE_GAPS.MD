# Análisis Contable — Gaps y Pendientes del Sistema Aura POS
> Generado por agente contable experto Colombia · Fecha: 2026-04-04
> Base analizada: Backend Spring Boot (`aura-back-old`) + Frontend Angular 18 (`aura-frontend`)

---

## 1. Diagnóstico ejecutivo

El sistema tiene una **base contable funcional** para un POS básico: plan de cuentas PUC, asientos automáticos desde ventas/compras, CxC/CxP, tesorería, nómina con provisiones y facturación electrónica vía Factus. Sin embargo, presenta **vacíos críticos** para cumplir con la contabilidad colombiana completa (NIIF Pymes, DIAN, retenciones, declaraciones, activos fijos, centros de costo y cierres formales).

**Estado actual por área:**

| Área | Estado |
|------|--------|
| Plan de Cuentas PUC | ✅ Implementado |
| Asientos Contables | ✅ Implementado — `terceroId`, `centroCostoId`, `periodoContableId` añadidos |
| Facturación Electrónica | ⚠️ Parcial — falta desglose IVA por tarifa |
| CxC / CxP | ⚠️ Parcial — sin días mora ni gestión formal |
| Tesorería / Bancos | ✅ Implementado — conciliación bancaria implementada |
| Compras con retenciones | ✅ Implementado |
| Nómina | ⚠️ Parcial — sin nómina electrónica DIAN |
| Gastos | ⚠️ Débil — sin impuestos ni soporte electrónico |
| Activos Fijos | ❌ No existe |
| Centros de Costo | ✅ Implementado — CRUD completo + vinculado a asientos |
| Impuestos / Declaraciones | ❌ No existe |
| Cierre Contable Formal | ✅ Implementado — `PeriodoContableEntity` ABIERTO/CERRADO + bloqueo de asientos |
| Balance de Comprobación | ✅ Implementado — reporte por período con cuadre débito/crédito |
| Documento Soporte Electrónico | ❌ No existe |
| Notas Crédito/Débito DIAN | ❌ No existe (solo nota de cartera interna) |
| Libro Diario formal | ❌ No existe como reporte independiente |

---

## 2. Hallazgos críticos

| Área | Hallazgo | Nivel | Riesgo | Impacto | Recomendación |
|------|----------|-------|--------|---------|---------------|
| ~~Asiento Detalle~~ | ~~`AsientoDetalleEntity` no tiene `terceroId` ni `centroCostoId`~~ | ~~**CRÍTICO**~~ | ~~Movimientos contables sin identificación de tercero ni centro de costo → información fiscal incompleta~~ | ~~No se pueden generar auxiliares por tercero ni reportes de retención~~ | ✅ **HECHO** — `terceroId`, `centroCostoId` añadidos al detalle de asiento |
| Gastos | `GastoEntity` no tiene tercero, cuenta contable, IVA, retención ni soporte | **CRÍTICO** | Gastos sin trazabilidad fiscal — no deducibles ante DIAN | Riesgo en declaración de renta y desconocimiento de costos reales | Refactorizar `GastoEntity` con campos tributarios completos |
| Factura | `FacturaEntity` no desglosa IVA por tarifa (0%, 5%, 19%) | **CRÍTICO** | Reporte de IVA incorrecto — formulario 300 DIAN errado | Sanción por información inexacta en declaración IVA bimestral | Agregar `ivaBase0`, `ivaBase5`, `ivaValor5`, `ivaBase19`, `ivaValor19` |
| Activos Fijos | No existe ninguna entidad ni módulo | **CRÍTICO** | Depreciación no registrada → activos sobrevaluados y gastos subestimados | Estados financieros incorrectos, sanciones DIAN por no llevar libro de activos | Crear módulo completo de activos fijos con depreciación automática |
| ~~Centros de Costo~~ | ~~No existe ninguna entidad ni módulo~~ | ~~**CRÍTICO**~~ | ~~Sin análisis por unidad de negocio/sucursal contablemente~~ | ~~No se pueden presentar estados por segmento (NIIF 8)~~ | ✅ **HECHO** — `CentroCostoEntity` creada y vinculada a asientos |
| ~~Cierre Contable~~ | ~~No hay entidad que persista el cierre mensual ni bloqueo de períodos~~ | ~~**CRÍTICO**~~ | ~~Asientos pueden modificarse retroactivamente en períodos ya cerrados~~ | ~~Manipulación de información financiera, inconsistencias en balances~~ | ✅ **HECHO** — `PeriodoContableEntity` con ABIERTO/CERRADO y validación en asientos |
| Nómina Electrónica | `NominaEntity` no tiene campos DIAN (CUNE, numero, estado transmisión) | **CRÍTICO** | Multa por no transmitir nómina electrónica según Resolución 013 de 2021 DIAN | Hasta 15.000 UVT de sanción por período | Agregar `cune`, `numeroCE`, `estadoTransmision`, `fechaTransmision` |
| Documento Soporte Electrónico | No existe módulo para compras a no obligados a facturar | Alto | Incumplimiento Resolución 0167/2021 DIAN | Rechazo de costos y deducciones en renta | Crear módulo de documento soporte con transmisión a Factus/DIAN |
| Terceros | Faltan campos fiscales: `tipoPersona`, `regimen`, `granContribuyente`, `autoRetenedor`, `codigoCIIU` | Alto | Cálculo incorrecto de retenciones en ventas/compras | Sanción por retenciones mal practicadas o no practicadas | Enriquecer `TerceroEntity` con campos del RUT colombiano |
| TesoreriaMovimiento | ~~Sin `saldoLibro` acumulado ni entidad formal de conciliación bancaria~~ | ~~Alto~~ | ~~No se puede conciliar con extracto del banco → diferencias no detectadas~~ | ~~Saldos bancarios incorrectamente reportados en balance~~ | ✅ **HECHO** — Conciliación bancaria implementada con matching automático |

---

## 3. Campos faltantes o débiles

| Módulo / Entidad | Campo faltante o deficiente | Para qué sirve | Riesgo de no tenerlo | Prioridad |
|------------------|-----------------------------|----------------|----------------------|-----------|
| ~~`AsientoDetalleEntity`~~ | ~~`terceroId`~~ | ~~Auxiliar por tercero, libro de retenciones~~ | ~~No se puede identificar a quién se pagó/cobró~~ | ✅ **HECHO** |
| ~~`AsientoDetalleEntity`~~ | ~~`centroCostoId`~~ | ~~Análisis por unidad de negocio~~ | ~~Sin control presupuestal ni por sucursal~~ | ✅ **HECHO** |
| `AsientoDetalleEntity` | `baseGravable` | Base para retenciones e impuestos | Reportes de retención incorrectos | ALTA |
| `AsientoDetalleEntity` | `tipoImpuesto` / `codigoImpuesto` | Identificar IVA, rete, ICA por línea | Declaraciones tributarias erróneas | ALTA |
| `AsientoContableEntity` | `fechaContabilizacion` separada de `fecha` | Fecha económica vs fecha de registro | Mala clasificación en períodos contables | MEDIA |
| ~~`AsientoContableEntity`~~ | ~~`periodoContableId`~~ | ~~FK al período contable~~ | ~~No se puede bloquear modificaciones a períodos cerrados~~ | ✅ **HECHO** |
| `PlanCuentaEntity` | `descripcion` | Política de uso de la cuenta | Sin documentación contable | BAJA |
| `PlanCuentaEntity` | `updatedAt`, `updatedBy` | Trazabilidad de cambios al PUC | Sin auditoría del plan de cuentas | MEDIA |
| `TerceroEntity` | `tipoPersona` (NATURAL/JURIDICA) | Tarifa de retención diferenciada | Retenciones mal calculadas | ALTA |
| `TerceroEntity` | `regimen` (RESPONSABLE_IVA / NO_RESPONSABLE) | Determinar si cobra/no cobra IVA | IVA mal facturado | ALTA |
| `TerceroEntity` | `granContribuyente` (boolean) | Cambio en autorretenedor | Autorretención no aplicada | ALTA |
| `TerceroEntity` | `autoRetenedor` (boolean) | No practicar retención al comprar | Retención doble o no aplicada | ALTA |
| `TerceroEntity` | `codigoCIIU`, `actividadEconomica` | Tarifa ICA, renta por actividad | ICA mal liquidado | MEDIA |
| `TerceroEntity` | `pais`, `codigoPais` | Operaciones con extranjeros | Sin soporte para retención por pagos al exterior | MEDIA |
| `GastoEntity` | `terceroId` | Proveedor del gasto | Sin NIT en soporte fiscal del gasto | ALTA |
| `GastoEntity` | `cuentaContableId` | Codificación automática del gasto | Asiento de gasto sin cuenta destino | ALTA |
| `GastoEntity` | `iva`, `baseIva`, `retefuente`, `reteica` | Impuestos del gasto | Declaraciones incorrectas | ALTA |
| `GastoEntity` | `documentoSoporte`, `tipoDocSoporte` | Soporte fiscal del gasto deducible | DIAN puede rechazar deducción | ALTA |
| `GastoEntity` | `centroCostoId` | Asignación de gasto por área | Sin control presupuestal | MEDIA |
| `FacturaEntity` | `ivaBase0`, `ivaBase5`, `ivaValor5`, `ivaBase19`, `ivaValor19` | Desglose IVA por tarifa | Formulario 300 DIAN incorrecto | ALTA |
| `FacturaEntity` | `subtotal`, `totalImpuestos` separados del `valor` total | Claridad en la composición del total | Conciliación IVA imposible | ALTA |
| ~~`CuentaBancariaEntity`~~ | ~~`cuentaContableId`~~ | ~~Enlace con plan de cuentas~~ | ~~Bancos no cuadran con contabilidad~~ | ✅ **HECHO** (conciliación bancaria) |
| ~~`CuentaBancariaEntity`~~ | ~~`saldoExtracto`, `ultimaConciliacion`~~ | ~~Comparativo para conciliación~~ | ~~No se detectan diferencias banco-libros~~ | ✅ **HECHO** |
| `TesoreriaMovimientoEntity` | `terceroId` | Identificar pagador/beneficiario | Sin trazabilidad de pagos por tercero | MEDIA |
| `TesoreriaMovimientoEntity` | `saldoLibro` acumulado | Saldo en libros después del movimiento | No se puede conciliar por movimiento | MEDIA |
| `NominaEntity` | `cune` | Código Único Nómina Electrónica DIAN | Sin validez legal de la nómina electrónica | CRÍTICA |
| `NominaEntity` | `numeroCE`, `estadoTransmision`, `fechaTransmision` | Estado ante DIAN | Multa por no transmitir | CRÍTICA |
| `VentaEntity` | `ivaBase0`, `ivaBase5`, `ivaValor5`, `ivaBase19`, `ivaValor19` | Desglose IVA en venta | Declaración IVA incorrecta | ALTA |

---

## 4. Validaciones que deben existir

### Sistema general
- [x] ✅ Validar que un asiento tenga `totalDebito == totalCredito` antes de contabilizar (partida doble)
- [x] ✅ Bloquear modificación de asientos en períodos contables cerrados
- [ ] Validar que solo cuentas `auxiliar = true` acepten movimientos directos
- [ ] Validar NIT con dígito verificador al crear tercero
- [ ] No permitir eliminar plan de cuentas con movimientos asociados

### Asientos automáticos
- [ ] Verificar que existan cuentas contables configuradas antes de generar asiento automático desde venta/compra/nómina/gasto
- [ ] Si no hay cuenta configurada, lanzar excepción clara con nombre del campo faltante (no silenciar)
- [ ] Asiento desde nómina debe incluir aportes empleador como gasto en cuentas de cargas sociales

### Terceros
- [ ] Validar `responsabilidadFiscal` con los códigos DIAN (R-99-PN, O-13, O-47, etc.)
- [ ] Si es proveedor y `tipoPersona` y `regimen` no están completos, advertir al guardar
- [ ] Validar que NIT extranjero tenga `pais` diligenciado

### Bancos
- [ ] No permitir movimiento de tesorería en cuenta `activa = false`
- [ ] Validar que transferencia entre cuentas genere dos movimientos (salida + entrada)

### Nómina
- [ ] No liquidar nómina sin período contable abierto
- [ ] Validar que suma de devengados - deducciones = neto a pagar
- [ ] Bloquear liquidación si faltan parámetros ARL, SENA, ICBF, Caja en `NominaConfigEntity`

### Facturación
- [ ] No emitir factura sin CUFE de respuesta DIAN
- [ ] Verificar que el total factura = subtotal + IVA - descuentos
- [ ] Nota crédito debe referenciar factura origen válida

---

## 5. Recomendaciones de mejora

### Corto plazo (1-4 semanas)
1. ✅ **HECHO** ~~Agregar `terceroId` y `centroCostoId` a `AsientoDetalleEntity`~~ — implementado con migración V51.
2. **Enriquecer `TerceroEntity`** con: `tipoPersona`, `regimen`, `granContribuyente`, `autoRetenedor` — afecta cálculo de retenciones en todas las transacciones.
3. **Agregar desglose de IVA por tarifa en `FacturaEntity` y `VentaEntity`** — necesario para declaración bimestral.
4. **Enriquecer `GastoEntity`** con tercero, cuenta contable, IVA y documento soporte.
5. ✅ **HECHO** ~~**Crear `CentroCostoEntity`**~~ — implementado con migración V49 y módulo frontend completo.

### Mediano plazo (1-3 meses)
6. ✅ **HECHO** ~~**Crear `PeriodoContableEntity`**~~ — implementado con migración V50, bloqueo en asientos automáticos y manuales, y balance de comprobación.
7. **Crear módulo de Activos Fijos** con: `ActivoFijoEntity` (codigo, descripcion, fechaAdquisicion, valorCompra, vidaUtil, metodDepreciacion, depreciacionAcumulada, ubicacion, responsable, estado, cuentaContableId).
8. ✅ **HECHO** ~~**Crear `ConciliacionBancariaEntity`**~~ — implementada con matching automático por monto ±1 peso y fecha ±3 días.
9. **Agregar campos DIAN a `NominaEntity`** (`cune`, `numeroCE`, `estadoTransmision`) e integrar con proveedor tecnológico de nómina electrónica.
10. **Crear módulo de Documento Soporte Electrónico** para compras a proveedores no obligados a facturar (Resolución 0167/2021 DIAN).

### Largo plazo (3-6 meses)
11. **Módulo de declaraciones tributarias**: IVA bimestral/cuatrimestral (F300), Retención en la Fuente (F350), ICA municipal — con precálculo automático desde los movimientos.
12. **Presupuesto por centro de costo**: definir presupuesto mensual/anual y comparar vs ejecutado real en reportes.
13. **Motor de retenciones automático**: tabla de tarifas por tipo de ingreso, tarifa, base mínima — aplicar automáticamente en compras y pagos según tipo de tercero y actividad.
14. **Integración libro diario formal**: reporte cronológico de todos los movimientos con número de comprobante, tercero, centro de costo y saldo acumulado.
15. **Notas Crédito/Débito electrónicas DIAN**: módulo separado de `NotaContableEntity` actual (que es solo ajuste de cartera) — integrado con Factus para transmisión.

---

## 6. Información adicional requerida para diagnóstico profundo

Para profundizar el análisis se necesita:

1. **`ContabilidadAutoServiceImpl.java`** — revisar si los asientos automáticos de ventas/compras incluyen IVA, retenciones y tercero correctamente.
2. **`PlanCuentasServiceImpl.java`** — verificar si el seed del PUC básico incluye cuentas de retenciones (135515, 236540, 236560, 237005) y de IVA (2408xx, 1355xx).
3. **`CierreContableQueryRepository`** — validar las queries del cierre: si usa datos de asientos o directamente tablas operativas (riesgo de doble contabilidad).
4. **`ReporteAvanzadoServiceImpl.java`** — revisar qué reportes existen y si los datos cruzan con los asientos contables.
5. **Migraciones SQL** (`db/migration/`) — revisar índices, constraints de unicidad y si hay FK entre tablas contables.
6. **`NominaConfigServiceImpl.java`** — verificar si genera asiento contable al aprobar nómina o solo calcula valores.
7. **`TesoreriaServiceImpl.java`** — verificar si los movimientos de tesorería generan asiento contable automático.
8. **Configuración de cuentas contables por módulo** — si existe tabla de parametrización tipo `ConfigCuentaContable(modulo, evento, cuentaId)` para los asientos automáticos.

---

## 7. Tabla de prioridad de desarrollo

| # | Tarea | Impacto Fiscal | Esfuerzo | Sprint | Estado |
|---|-------|---------------|----------|--------|--------|
| 1 | `terceroId` + `centroCostoId` en `AsientoDetalleEntity` | ⭐⭐⭐⭐⭐ | Bajo | 1 | ✅ HECHO |
| 2 | Enriquecer `TerceroEntity` (tipoPersona, regimen, autoRetenedor) | ⭐⭐⭐⭐⭐ | Bajo | 1 | ❌ Pendiente |
| 3 | Desglose IVA por tarifa en Factura/Venta | ⭐⭐⭐⭐⭐ | Medio | 1 | ❌ Pendiente |
| 4 | `GastoEntity` con impuestos y soporte | ⭐⭐⭐⭐ | Medio | 1 | ❌ Pendiente |
| 5 | `CentroCostoEntity` + vinculación | ⭐⭐⭐⭐ | Medio | 2 | ✅ HECHO |
| 6 | `PeriodoContableEntity` + bloqueo de asientos | ⭐⭐⭐⭐⭐ | Medio | 2 | ✅ HECHO |
| 7 | Activos Fijos + depreciación automática | ⭐⭐⭐⭐ | Alto | 3 | ❌ Pendiente |
| 8 | Nómina Electrónica DIAN (CUNE) | ⭐⭐⭐⭐⭐ | Alto | 3 | ❌ Pendiente |
| 9 | Conciliación Bancaria formal | ⭐⭐⭐ | Alto | 4 | ✅ HECHO |
| 10 | Documento Soporte Electrónico | ⭐⭐⭐⭐⭐ | Alto | 4 | ❌ Pendiente |
| 11 | Motor de retenciones automático | ⭐⭐⭐⭐⭐ | Muy alto | 5 | ❌ Pendiente |
| 12 | Declaraciones tributarias (F300, F350, ICA) | ⭐⭐⭐⭐⭐ | Muy alto | 6 | ❌ Pendiente |

---

## 8. Señales de alerta detectadas en la arquitectura actual

- **ALERTA** `NotaContableEntity` mezcla concepto de nota de cartera interna con nota crédito/débito electrónica — nombres confusos, deben separarse
- **ALERTA** `GastoEntity` usa `categoria` como String libre sin FK a tabla de categorías — inconsistencia en reportes
- **ALERTA** `FacturaEntity` tiene `valor` como campo único sin subtotal/IVA separados — imposible cuadrar declaración IVA solo con facturas
- ~~**ALERTA** `AsientoDetalleEntity` no tiene `terceroId` — los asientos automáticos desde venta no identifican al cliente en el detalle contable~~ ✅ **RESUELTO**
- **ALERTA** `TesoreriaMovimientoEntity` tiene campo `conciliado` pero no existe entidad de conciliación bancaria — no se puede llevar el proceso formal ✅ **RESUELTO** (conciliación bancaria implementada)
- **ALERTA** Nómina tiene estado `BORRADOR/APROBADO/PAGADO/ANULADO` pero no existe estado de transmisión DIAN — incumplimiento normativo
- **ALERTA** No hay tabla de configuración de cuentas contables por módulo — los asientos automáticos dependen de lógica hardcodeada en servicios, difícil de mantener

---

*Análisis generado con base en: entidades JPA, controladores REST, y módulos frontend Angular del proyecto aura-pos.*
*Para usar este análisis como agente activo, cargar junto a `AGENTSCONTABLE.MD`.*
*Última actualización: 2026-04-06 — marcados ítems completados en sesión de cierre contable.*
