# Plan Contable — Pendientes y Roadmap
> Generado: 2026-04-06 | Base: ANALISIS_CONTABLE_GAPS.MD + exploración del código
> Última migración: V51 | Módulos frontend contables: 7

---

## ESTADO RESUMIDO

| # | Tarea | Estado |
|---|-------|--------|
| 1 | `terceroId` + `centroCostoId` en AsientoDetalle | ✅ HECHO (V51) |
| 2 | `CentroCostoEntity` + módulo frontend | ✅ HECHO (V49) |
| 3 | `PeriodoContableEntity` + bloqueo + balance comprobación | ✅ HECHO (V50) |
| 4 | Conciliación bancaria | ✅ HECHO |
| 5 | Enriquecer `TerceroEntity` (campos fiscales) | ❌ Pendiente |
| 6 | Desglose IVA por tarifa en Venta/Factura | ❌ Pendiente |
| 7 | Refactorizar `GastoEntity` (impuestos + tercero + cuenta) | ❌ Pendiente |
| 8 | Módulo Activos Fijos | ❌ Pendiente |
| 9 | Nómina Electrónica DIAN (CUNE) | ❌ Pendiente |
| 10 | Documento Soporte Electrónico | ❌ Pendiente |
| 11 | Motor de retenciones automático | ❌ Pendiente |
| 12 | Declaraciones tributarias (F300, F350, ICA) | ❌ Pendiente |

---

## SPRINT 1 — Campos fiscales en Terceros
> Impacto: ⭐⭐⭐⭐⭐ | Esfuerzo: Bajo | Migración: V52

**Por qué primero:** Todos los cálculos de retención y IVA dependen de saber si un tercero es persona natural/jurídica, responsable de IVA, gran contribuyente o autorretenedor. Sin esto, cualquier motor de retenciones construido después será incorrecto.

### Backend

**Migración V52__tercero_campos_fiscales.sql**
```sql
ALTER TABLE tercero
  ADD COLUMN tipo_persona       VARCHAR(10)  DEFAULT 'NATURAL',   -- NATURAL | JURIDICA
  ADD COLUMN regimen            VARCHAR(30)  DEFAULT 'NO_RESPONSABLE_IVA', -- RESPONSABLE_IVA | NO_RESPONSABLE_IVA | GRAN_CONTRIBUYENTE | REGIMEN_SIMPLE
  ADD COLUMN gran_contribuyente BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN auto_retenedor     BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN codigo_ciiu        VARCHAR(10),
  ADD COLUMN actividad_economica VARCHAR(200),
  ADD COLUMN pais               VARCHAR(60)  DEFAULT 'Colombia',
  ADD COLUMN codigo_pais        VARCHAR(5)   DEFAULT 'CO';
```

**TerceroEntity.java** — agregar campos:
- `tipoPersona` String ("NATURAL" / "JURIDICA")
- `regimen` String
- `granContribuyente` boolean
- `autoRetenedor` boolean
- `codigoCIIU` String
- `actividadEconomica` String
- `pais` String
- `codigoPais` String

**TerceroDto.java / CreateTerceroDto.java / UpdateTerceroDto.java** — agregar los 8 campos.

### Frontend

**tercero.model.ts** — agregar campos a `TerceroModel`, `CreateTerceroDto`, `UpdateTerceroDto`:
- `tipoPersona: 'NATURAL' | 'JURIDICA'`
- `regimen: string`
- `granContribuyente: boolean`
- `autoRetenedor: boolean`
- `codigoCIIU: string | null`
- `actividadEconomica: string | null`
- `pais: string`
- `codigoPais: string`

**Constantes a agregar en model:**
```ts
export const TIPO_PERSONA_OPTIONS = [
  { label: 'Persona Natural', value: 'NATURAL' },
  { label: 'Persona Jurídica', value: 'JURIDICA' },
];
export const REGIMEN_OPTIONS = [
  { label: 'No responsable de IVA', value: 'NO_RESPONSABLE_IVA' },
  { label: 'Responsable de IVA', value: 'RESPONSABLE_IVA' },
  { label: 'Gran Contribuyente', value: 'GRAN_CONTRIBUYENTE' },
  { label: 'Régimen Simple', value: 'REGIMEN_SIMPLE' },
];
```

**terceros.component.html** — agregar sección "Información Fiscal" en el formulario de creación/edición con: tipo persona, régimen, checkboxes gran contribuyente + autorretenedor, CIIU.

---

## SPRINT 2 — Desglose IVA en Ventas
> Impacto: ⭐⭐⭐⭐⭐ | Esfuerzo: Medio | Migración: V53

**Por qué segundo:** El formulario 300 de declaración de IVA es obligación bimestral. Sin desglose por tarifa (0%, 5%, 19%) es imposible cuadrar la declaración.

### Backend

**Migración V53__venta_desglose_iva.sql**
```sql
ALTER TABLE venta
  ADD COLUMN iva_base0      NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN iva_base5      NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN iva_valor5     NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN iva_base19     NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN iva_valor19    NUMERIC(18,2) NOT NULL DEFAULT 0;

ALTER TABLE factura
  ADD COLUMN iva_base0      NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN iva_base5      NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN iva_valor5     NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN iva_base19     NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN iva_valor19    NUMERIC(18,2) NOT NULL DEFAULT 0;
```

**VentaEntity.java + FacturaEntity.java** — agregar los 5 campos de IVA.

**VentaServiceImpl.java** — al contabilizar venta, calcular desglose IVA agrupando líneas de `venta_detalle` por tarifa del producto (`producto.porcentajeIva`).

**VentaDto / FacturaDto** — exponer los campos en la respuesta.

### Frontend

**contabilidad.model.ts / venta.model.ts** — agregar campos `ivaBase0`, `ivaBase5`, `ivaValor5`, `ivaBase19`, `ivaValor19`.

**reporte-iva** (módulo ya existe en frontend) — consumir los nuevos campos para mostrar desglose correcto.

---

## SPRINT 3 — Refactorizar GastoEntity
> Impacto: ⭐⭐⭐⭐ | Esfuerzo: Medio | Migración: V54

**Por qué:** Los gastos sin NIT, sin cuenta contable y sin retenciones no son deducibles ante la DIAN y no se pueden contabilizar correctamente.

### Backend

**Migración V54__gasto_campos_tributarios.sql**
```sql
ALTER TABLE gasto
  ADD COLUMN tercero_id          BIGINT REFERENCES tercero(id),
  ADD COLUMN cuenta_contable_id  BIGINT REFERENCES plan_cuenta(id),
  ADD COLUMN centro_costo_id     BIGINT REFERENCES centros_costos(id),
  ADD COLUMN base_iva            NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN tarifa_iva          NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN valor_iva           NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN base_retefuente     NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN tarifa_retefuente   NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN valor_retefuente    NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN base_reteica        NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN tarifa_reteica      NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN valor_reteica       NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN tipo_doc_soporte    VARCHAR(20),   -- FACTURA | DOCUMENTO_SOPORTE | RECIBO | OTRO
  ADD COLUMN numero_doc_soporte  VARCHAR(50),
  ADD COLUMN periodo_contable_id BIGINT REFERENCES periodo_contable(id);
```

**GastoEntity.java** — agregar los nuevos campos.

**GastoServiceImpl.java** — al aprobar/contabilizar gasto, generar asiento automático usando `cuentaContableId` + cuentas de retención hardcodeadas (2365xx, 2367xx).

**GastoController.java** — exponer nuevos campos en DTOs.

### Frontend

**gasto.model.ts** — actualizar con nuevos campos.

**gastos.component.html** — agregar sección de impuestos en el formulario: tercero (autocomplete), cuenta contable (dropdown plan cuentas), IVA, retefuente, reteICA calculados automáticamente al escribir el monto.

---

## SPRINT 4 — Módulo Activos Fijos
> Impacto: ⭐⭐⭐⭐ | Esfuerzo: Alto | Migración: V55

**Por qué:** Sin activos fijos no se registra depreciación → estados financieros incorrectos. Es obligatorio llevar libro de activos ante DIAN.

### Backend

**Migración V55__activos_fijos.sql**
```sql
CREATE TABLE activo_fijo (
  id                      BIGSERIAL PRIMARY KEY,
  empresa_id              INTEGER NOT NULL,
  codigo                  VARCHAR(30) NOT NULL,
  descripcion             VARCHAR(200) NOT NULL,
  categoria               VARCHAR(50) NOT NULL,  -- MAQUINARIA | VEHICULO | INMUEBLE | EQUIPO | MUEBLES | INTANGIBLE
  fecha_adquisicion       DATE NOT NULL,
  valor_compra            NUMERIC(18,2) NOT NULL,
  vida_util_meses         INTEGER NOT NULL,
  metodo_depreciacion     VARCHAR(20) NOT NULL DEFAULT 'LINEA_RECTA',  -- LINEA_RECTA | UNIDADES_PRODUCCION | SALDO_DECRECIENTE
  depreciacion_acumulada  NUMERIC(18,2) NOT NULL DEFAULT 0,
  valor_residual          NUMERIC(18,2) NOT NULL DEFAULT 0,
  ubicacion               VARCHAR(100),
  responsable             VARCHAR(100),
  estado                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',  -- ACTIVO | DEPRECIADO | VENDIDO | DADO_DE_BAJA
  cuenta_activo_id        BIGINT REFERENCES plan_cuenta(id),
  cuenta_depreciacion_id  BIGINT REFERENCES plan_cuenta(id),
  cuenta_gasto_dep_id     BIGINT REFERENCES plan_cuenta(id),
  centro_costo_id         BIGINT REFERENCES centros_costos(id),
  periodo_contable_id     BIGINT REFERENCES periodo_contable(id),
  tercero_id              BIGINT REFERENCES tercero(id),  -- proveedor de compra
  observaciones           TEXT,
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP,
  deleted_at              TIMESTAMP,
  CONSTRAINT uq_activo_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE depreciacion_periodo (
  id              BIGSERIAL PRIMARY KEY,
  activo_id       BIGINT NOT NULL REFERENCES activo_fijo(id),
  empresa_id      INTEGER NOT NULL,
  periodo_id      BIGINT NOT NULL REFERENCES periodo_contable(id),
  valor           NUMERIC(18,2) NOT NULL,
  asiento_id      BIGINT REFERENCES asiento_contable(id),
  calculado_en    TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Entidades:** `ActivoFijoEntity.java`, `DepreciacionPeriodoEntity.java`

**Servicio:** `ActivoFijoService.java` con métodos:
- `crear()`, `actualizar()`, `listar()`, `getById()`
- `calcularDepreciacionPeriodo(periodoId)` — genera asiento automático de depreciación por cada activo activo
- `darDeBaja(id, observaciones)`

**Controller:** `ActivoFijoController.java` en `/api/activos-fijos`

### Frontend

**Rutas:** `/contabilidad/activos-fijos`

**Módulo:** `activos-fijos.component` con:
- Tabla paginada de activos con columnas: código, descripción, categoría, valor compra, depreciación acumulada, valor en libros, estado
- Formulario CRUD con sección de cuentas contables
- Botón "Calcular depreciación del período" (llama al endpoint por períodoId activo)
- Tab de historial de depreciaciones por activo

---

## SPRINT 5 — Nómina Electrónica DIAN
> Impacto: ⭐⭐⭐⭐⭐ | Esfuerzo: Alto | Migración: V56

**Por qué:** Multa de hasta 15.000 UVT por período sin transmitir. Obligación desde Resolución 013/2021.

### Backend

**Migración V56__nomina_electronica_dian.sql**
```sql
ALTER TABLE nomina
  ADD COLUMN cune                VARCHAR(200),
  ADD COLUMN numero_ce           VARCHAR(50),
  ADD COLUMN estado_transmision  VARCHAR(20) DEFAULT 'PENDIENTE',
  -- PENDIENTE | ENVIADO | ACEPTADO | RECHAZADO | ERROR
  ADD COLUMN fecha_transmision   TIMESTAMP,
  ADD COLUMN respuesta_dian      TEXT,
  ADD COLUMN xml_generado        TEXT;
```

**NominaEntity.java** — agregar los campos DIAN.

**NominaService.java** — agregar método `transmitirDian(nominaId)`:
1. Generar XML según formato DIAN (esquema nómina electrónica)
2. Llamar Factus (o proveedor habilitado) para transmisión
3. Guardar CUNE y estado en la entidad

**NominaController.java** — endpoint `POST /api/nomina/{id}/transmitir-dian`

### Frontend

**nomina.component.html** — agregar en la tabla columna "Estado DIAN" con badge de color + botón "Transmitir" cuando estado = APROBADO y transmision = PENDIENTE.

---

## SPRINT 6 — Motor de Retenciones Automático
> Impacto: ⭐⭐⭐⭐⭐ | Esfuerzo: Alto | Migración: V57

**Por qué:** Actualmente las retenciones en compras son manuales (el usuario escribe el %). Con los campos de `TerceroEntity` (Sprint 1) ya disponibles, se puede automatizar.

### Backend

**Migración V57__tabla_retenciones.sql**
```sql
CREATE TABLE tarifa_retencion (
  id                  BIGSERIAL PRIMARY KEY,
  empresa_id          INTEGER NOT NULL,
  tipo                VARCHAR(20) NOT NULL,  -- RETEFUENTE | RETEIVA | RETEICA
  concepto            VARCHAR(100) NOT NULL, -- "Servicios generales", "Compras", etc.
  codigo_concepto     VARCHAR(20),           -- código DIAN
  tarifa_natural      NUMERIC(5,2) NOT NULL, -- % para persona natural
  tarifa_juridica     NUMERIC(5,2) NOT NULL, -- % para persona jurídica
  base_minima         NUMERIC(18,2) NOT NULL DEFAULT 0,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tarifa_empresa_tipo_concepto UNIQUE (empresa_id, tipo, concepto)
);
```

**TarifaRetencionEntity.java** + repositorio + servicio + controller (`/api/tarifas-retencion`)

**CompraServiceImpl.java** — al crear/actualizar compra con tercero asignado:
- Buscar tarifas aplicables según tipo de tercero (`tipoPersona` del Sprint 1)
- Calcular automáticamente `retefuenteValor`, `reteIvaValor`, `reteIcaValor`
- Mostrar en el formulario como valores sugeridos (el usuario puede ajustar)

### Frontend

**Nueva pantalla:** `/contabilidad/tarifas-retencion` — tabla CRUD de tarifas con columnas: tipo, concepto, tarifa natural %, tarifa jurídica %, base mínima.

**compras.component.html** — al seleccionar tercero, calcular retenciones automáticamente y mostrar en el formulario.

---

## SPRINT 7 — Documento Soporte Electrónico
> Impacto: ⭐⭐⭐⭐⭐ | Esfuerzo: Alto | Migración: V58

**Por qué:** Resolución 0167/2021 DIAN obliga a emitir Documento Soporte cuando se compra a personas no obligadas a facturar (agricultores, artesanos, etc.).

### Backend

**Migración V58__documento_soporte.sql**
```sql
CREATE TABLE documento_soporte (
  id                  BIGSERIAL PRIMARY KEY,
  empresa_id          INTEGER NOT NULL,
  prefijo             VARCHAR(10),
  consecutivo         INTEGER NOT NULL,
  fecha_emision       DATE NOT NULL,
  tercero_id          BIGINT NOT NULL REFERENCES tercero(id),
  periodo_contable_id BIGINT REFERENCES periodo_contable(id),
  subtotal            NUMERIC(18,2) NOT NULL,
  base_iva            NUMERIC(18,2) NOT NULL DEFAULT 0,
  valor_iva           NUMERIC(18,2) NOT NULL DEFAULT 0,
  base_retefuente     NUMERIC(18,2) NOT NULL DEFAULT 0,
  valor_retefuente    NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_pagar         NUMERIC(18,2) NOT NULL,
  descripcion         TEXT,
  cuds                VARCHAR(200),  -- Código Único Documento Soporte
  estado_dian         VARCHAR(20) DEFAULT 'PENDIENTE',
  xml_generado        TEXT,
  asiento_id          BIGINT REFERENCES asiento_contable(id),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP,
  CONSTRAINT uq_ds_empresa_consecutivo UNIQUE (empresa_id, consecutivo)
);
```

**DocumentoSoporteEntity.java** + servicio + controller (`/api/documento-soporte`)

**Servicio:** métodos `crear()`, `transmitirDian(id)`, `anular(id)`, `listar()` — la transmisión llama a Factus con el XML del documento soporte.

### Frontend

**Nueva pantalla:** `/contabilidad/documento-soporte` — formulario similar al de compras pero simplificado, orientado a compras a no obligados. Lista de documentos con estado DIAN y botón de transmisión.

---

## SPRINT 8 — Declaraciones Tributarias (F300, F350, ICA)
> Impacto: ⭐⭐⭐⭐⭐ | Esfuerzo: Muy alto | Sin migración de datos (solo vistas/queries)

**Por qué:** Es el módulo final que cierra el ciclo contable-fiscal. Consolida todo lo anterior.

### Backend

**ReporteTributarioController.java** — nuevos endpoints:

- `GET /api/reportes-tributarios/formulario-300?periodoId=` → Declaración IVA bimestral
  - Agrupado por tarifa (0%, 5%, 19%), usando campos de Sprint 2
  - Ventas gravadas, compras descontables, IVA a pagar o a favor

- `GET /api/reportes-tributarios/formulario-350?anio=&mes=` → Retención en la Fuente
  - Agrupado por concepto de retención
  - Total retenido a terceros en compras

- `GET /api/reportes-tributarios/ica?anio=&bimestre=` → ICA municipal
  - Ingresos brutos del período × tarifa ICA del municipio

### Frontend

**Nueva pantalla:** `/contabilidad/declaraciones` con tabs:
- **IVA (F300)** — tabla por tarifa con totales, botón exportar PDF/Excel
- **Retención (F350)** — tabla por concepto de retención
- **ICA** — resumen por período con tarifa configurable

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
Sprint 1 (Terceros campos fiscales)   ← base de todo lo demás
    ↓
Sprint 2 (Desglose IVA)               ← necesita productos con tarifa IVA
    ↓
Sprint 3 (GastoEntity refactor)       ← usa terceros del Sprint 1
    ↓
Sprint 4 (Activos Fijos)              ← módulo independiente
    ↓
Sprint 5 (Nómina Electrónica)         ← módulo independiente
    ↓
Sprint 6 (Motor Retenciones)          ← depende de Sprint 1 (tipoPersona)
    ↓
Sprint 7 (Documento Soporte)          ← depende de Sprint 1 (tercero fiscal)
    ↓
Sprint 8 (Declaraciones F300/F350)    ← depende de Sprints 2, 6
```

---

## MIGRACIONES PENDIENTES

| Versión | Nombre | Sprint |
|---------|--------|--------|
| V52 | tercero_campos_fiscales | 1 |
| V53 | venta_desglose_iva | 2 |
| V54 | gasto_campos_tributarios | 3 |
| V55 | activos_fijos | 4 |
| V56 | nomina_electronica_dian | 5 |
| V57 | tabla_retenciones | 6 |
| V58 | documento_soporte | 7 |

---

*Plan generado: 2026-04-06 | Próxima revisión: al completar Sprint 1*
