# HU — Anulación parcial de ítems de venta con devolución desde caja

**ID:** HU-002
**Módulo:** Ventas / Caja
**Prioridad:** Media-Alta
**Estado:** Pendiente
**Fecha de creación:** 2026-03-26

---

## Historia de usuario

> Como cajero o administrador,
> quiero poder anular un ítem específico de una venta ya realizada
> para corregir errores de facturación sin necesidad de anular toda la venta,
> y que el dinero correspondiente salga registrado correctamente desde la caja.

---

## Criterios de aceptación

### CA-1 — Acceso a la anulación
- [ ] Desde el detalle de una venta en estado `PAGADA` o `PARCIAL`, cada ítem debe tener un botón **"Anular ítem"**
- [ ] El botón solo es visible para roles `ADMIN` y `SUPER_ADMIN` (los cajeros no pueden anular por defecto)
- [ ] No se puede anular un ítem que ya fue anulado previamente

### CA-2 — Confirmación y cantidad
- [ ] Al hacer clic en "Anular ítem" aparece un diálogo de confirmación
- [ ] Si el producto es por **unidades enteras**: confirmar directo (cantidad fija = la vendida)
- [ ] Si el producto es **pesable**: mostrar input numérico con la cantidad máxima = `cantidad vendida - cantidad ya anulada`
- [ ] La cantidad a anular debe ser > 0

### CA-3 — Método de devolución
El diálogo debe ofrecer tres opciones mutuamente excluyentes:

| Opción | Descripción |
|---|---|
| 💵 **Efectivo** | El cajero entrega efectivo al cliente; se registra egreso en caja |
| 💳 **Tarjeta / Nequi** | Devolución externa gestionada por el cajero; solo se registra el movimiento sin afectar caja |
| 📄 **Nota de crédito** | Se genera saldo a favor del cliente para descontar en próxima compra |

### CA-4 — Efectos en inventario
- [ ] En todos los casos se crea un movimiento de inventario tipo `DEVOLUCION_VENTA` con la cantidad devuelta
- [ ] El stock del producto en la sucursal aumenta en la cantidad anulada

### CA-5 — Efectos en caja
- [ ] Si el método es **Efectivo**: crear `movimiento_caja` tipo `DEVOLUCION_VENTA` (egreso) en el turno activo actual, referenciando la venta original
- [ ] Si el método es **Tarjeta / Nequi**: crear registro en `devolucion_item` con `metodo_devolucion = TARJETA/NEQUI`, sin movimiento de caja
- [ ] Si el método es **Nota de crédito**: crear `nota_credito` vinculada al cliente; si la venta no tiene cliente asignado, esta opción queda deshabilitada

### CA-6 — Efectos en la venta
- [ ] El campo `cantidad_anulada` de `venta_detalle` se actualiza
- [ ] Se recalculan `subtotal`, `descuento_total`, `impuesto_total` y `total_pagar` de la venta
- [ ] Si **todos los ítems** de la venta quedan con `cantidad == cantidad_anulada` → la venta pasa a estado `ANULADA`
- [ ] Se registra en `venta_auditoria` quién, cuándo y por qué se hizo la anulación

### CA-7 — Visualización post-anulación
- [ ] Los ítems anulados se muestran tachados en el detalle de la venta con tag `ANULADO`
- [ ] El total de la venta refleja el nuevo valor recalculado
- [ ] En la tirilla (reimpresión) los ítems anulados aparecen con `(ANULADO)` y el nuevo total

---

## Flujo principal

```
[Detalle de venta]
  └─ Clic en "Anular ítem" (ítem X)
        └─ Diálogo:
              1. Cantidad a anular (si pesable)
              2. Motivo (texto libre, opcional)
              3. Método de devolución: [Efectivo] [Tarjeta/Nequi] [Nota de crédito]
              4. [Confirmar] [Cancelar]
                    └─ Confirmar:
                          ├─ POST /ventas/{ventaId}/detalle/{detalleId}/anular
                          ├─ Movimiento inventario DEVOLUCION_VENTA
                          ├─ Movimiento caja (si efectivo)
                          ├─ Nota de crédito (si aplica)
                          └─ Recalcular totales venta → actualizar UI
```

---

## Modelo de datos

### Cambios en tabla existente `venta_detalle`
```sql
ALTER TABLE venta_detalle
  ADD COLUMN cantidad_anulada  NUMERIC(12,4) NOT NULL DEFAULT 0,
  ADD COLUMN motivo_anulacion  VARCHAR(255),
  ADD COLUMN fecha_anulacion   TIMESTAMP,
  ADD COLUMN anulado_por       INTEGER REFERENCES usuario(id);
```

### Nueva tabla `devolucion_item`
```sql
CREATE TABLE devolucion_item (
  id                  BIGSERIAL PRIMARY KEY,
  venta_id            BIGINT NOT NULL REFERENCES venta(id),
  venta_detalle_id    BIGINT NOT NULL REFERENCES venta_detalle(id),
  turno_caja_id       BIGINT REFERENCES turno_caja(id),
  usuario_id          INTEGER NOT NULL REFERENCES usuario(id),
  cantidad_devuelta   NUMERIC(12,4) NOT NULL,
  valor_devuelto      NUMERIC(14,2) NOT NULL,
  metodo_devolucion   VARCHAR(30) NOT NULL, -- EFECTIVO, TARJETA, NEQUI, NOTA_CREDITO
  nota_credito_id     BIGINT REFERENCES nota_credito(id),
  motivo              VARCHAR(255),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Nuevo tipo en `movimiento_caja`
```
tipo_movimiento: DEVOLUCION_VENTA
```
*(campo ya existe, solo se agrega el valor al enum)*

---

## API Backend

### Endpoint principal
```
POST /api/ventas/{ventaId}/detalle/{detalleId}/anular
```

**Body:**
```json
{
  "cantidadAnular": 1.5,
  "metodoDevolucion": "EFECTIVO",
  "motivo": "Producto en mal estado"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Ítem anulado correctamente",
  "data": {
    "ventaActualizada": { ...VentaDto },
    "devolucionId": 42,
    "notaCreditoId": null
  }
}
```

---

## Frontend

### Componentes a crear / modificar

| Archivo | Acción |
|---|---|
| `features/ventas/detalle/detalle-venta.component.html` | Agregar botón "Anular ítem" por fila |
| `features/ventas/detalle/modal-anular-item/` | Nuevo modal de confirmación |
| `core/services/venta.service.ts` | Nuevo método `anularItem(ventaId, detalleId, body)` |
| `core/models/venta.model.ts` | Agregar `cantidadAnulada`, `motivoAnulacion` a `VentaDetalleModel` |

---

## Dependencias

- La tabla `nota_credito` debe existir antes de implementar la opción de nota de crédito
- Requiere turno de caja activo cuando el método es **Efectivo**
- El rol del usuario debe verificarse antes de mostrar el botón

---

## Notas técnicas

- La anulación es **irreversible** una vez confirmada
- Si no hay turno activo y el método seleccionado es Efectivo → mostrar error y bloquear
- Considerar lock optimista en `venta_detalle` para evitar doble anulación concurrente
- La migración de DB debe correr antes del deploy del backend (`V20__anulacion_parcial_items.sql`)
