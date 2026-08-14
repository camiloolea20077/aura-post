# Plan de frontend — módulo de nómina

Contraparte de `PLAN_MIGRACION_NOMINA.md`, `ESTADO.md` y `FRONTEND.md` del backend
(`D:\DOCUMENTOS CLOUD TECNOLOGY\REPOSITORIOS\aura-back-old\docs\`).

Fecha: 2026-07-17

---

## 0. Lo primero: hoy no se rompe nada

**Ninguna pantalla actual deja de funcionar con los cambios de backend hechos hasta ahora.**

Lo verifiqué:

| Riesgo evaluado | Resultado |
|---|---|
| `CreateEmpleadoDto` cambió | Solo se **agregaron** campos. `cargo`, `tipoContrato`, `fechaFinContrato` intactos |
| Validación nueva de contrato (FIJO exige fecha fin) | `form-empleado.component.ts:168` **ya validaba lo mismo**. Coincide |
| `liquidarTodos()` sigue síncrono | El controller no cambió. Sigue funcionando igual |
| `empleados.cargo` | **Se retiró la deprecación en el backend.** Ver sección 4 |

**Nada de esto se puede probar todavía:** el backend no tiene endpoints nuevos, no tiene tests, y le falta el `V13__baseline.sql`. El plan de abajo es para cuando eso exista.

---

## 1. Estado actual del frontend

### Lo que ya existe

```
features/nomina/
  config/                  → nomina-config
  empleados/               → form, index, crear-usuario
  liquidacion/             → index, detail, documento
  periodos/                → index
  prestaciones/            → prestaciones
features/asistencia/       → marcaje, turnos, revision, novedades, autorizaciones, cierre
features/asistencia-frente/→ digitacion, revision, preliquidacion
features/laboral/          → calendario, config
features/terceros/         → index, form, form-plano, estado-cuenta
configuracion/tipos-empleado/
```

Está más completo de lo que el backend soporta hoy. La asistencia por frente es el activo más valioso: es dato de campo, caro de capturar, y el backend recién ahora lo aprovecha para costear.

### Lo que NO existe y va a hacer falta

- Contratos laborales (hoy los datos de contrato viven en el form de empleado)
- Catálogo de conceptos de nómina
- Afiliaciones (EPS/AFP/CCF/ARL)
- PILA
- Retefuente (deducciones del empleado)
- Embargos
- Desprendible de pago
- Certificados
- Seguimiento de procesos asíncronos

---

## 2. Fases del backend y su contraparte de frontend

| Fase backend | ¿Toca frontend? | Qué implica |
|---|---|---|
| **−1** baseline | No | Interno |
| **0** motor (IBC, topes) | **No** | Los montos cambian, las pantallas no |
| **1** tercero | **Sí — medio** | 4 campos de nombre, fecha nac., sexo, rep. legal |
| **2** contrato | **Sí — alto** | Pantalla nueva; el form de empleado se parte |
| **3** conceptos | **Sí — medio** | Pantalla nueva; desprendible con traza |
| **4.5** retefuente | **Sí — bajo** | Deducciones por empleado |
| **5** nómina electrónica | 🚧 en pausa | Los clientes actuales no la usan |
| **5.5** afiliaciones | **Sí — medio** | Pantalla nueva |
| **6** PILA | **Sí — medio** | Pantalla nueva |
| **8** prestaciones | **Sí — bajo** | Ampliar la pantalla existente |
| **9** embargos | **Sí — bajo** | Pantalla nueva |
| **10** certificados | **Sí — medio** | Desprendible + certificados |
| **4** proyectos | **No** | La distribución es automática desde asistencia |
| **7** async | **Sí — alto** | Cambia el flujo de liquidación |

**Las dos que más trabajo dan: contratos (2) y procesos async (7).**

---

## 3. Lo que hay que corregir de lo existente

### 3.a `form-tercero` — cuatro campos de nombre

**Prioridad: alta.** Bloquea PILA.

Hoy el modelo tiene `nombres` y `apellidos`. La UGPP exige los cuatro componentes **por separado**:

```typescript
// tercero.model.ts — agregar
nombre1: string | null;
nombre2: string | null;
apellido1: string | null;
apellido2: string | null;
```

**No los partas en el front con `split(' ')`.** Falla con "DE LA ROSA", "VAN DER BERG", nombres de una palabra. El backend tampoco lo hace, a propósito.

El formulario debe pedir los cuatro cuando `tipoPersona === 'NATURAL'`. Los viejos siguen existiendo; se pueden dejar ocultos o de solo lectura.

### 3.b `form-tercero` — persona natural / jurídica

Campos nuevos, condicionados por `tipoPersona`:

```typescript
// NATURAL — requeridos por PILA
fechaNacimiento: string | null;
sexo: 'M' | 'F' | 'OTRO' | null;
fechaExpedicionDocumento: string | null;
municipioExpedicionId: number | null;

// JURIDICA — requeridos por PILA (encabezado del aportante)
nombreComercial: string | null;
representanteLegalNombre: string | null;
representanteLegalDocumento: string | null;
```

### 3.c `form-tercero` — autorretenedor se dividió

```typescript
// Antes: autoRetenedor: boolean
// Ahora, dos checks distintos:
esAutoretenedorIca: boolean;
esAutoretenedorFuente: boolean;
declarante: boolean;
```

Son autorretenciones distintas: se puede ser de renta y no de ICA. El campo viejo sigue funcionando, pero el formulario debería mostrar los dos.

### 3.d `form-empleado` — selector de tercero

**Opcional, pero vale la pena.**

`CreateEmpleadoDto` acepta `terceroId`. Si no viene, el backend busca por documento o crea el tercero. **El form sigue funcionando sin cambios.**

Lo que gana con el selector: el usuario ve si la persona **ya existe** (por ejemplo, si ya es proveedor) en vez de duplicarla.

**⚠️ Caso a manejar:** si hay dos terceros con el mismo documento, el backend responde **409** pidiendo resolver el duplicado o mandar `terceroId`. Hoy el form mostraría un error genérico.

### 3.e `index-liquidacion` — el cambio más grande

**Prioridad: alta si hay clientes con volumen.**

Hoy (`index-liquidacion.component.ts:96`):
```typescript
await lastValueFrom(this.nominaService.liquidarTodos(periodo.id));
this.alertService.showSuccess('Liquidado', '...');
```

Es síncrono. Con 30 empleados va bien; **con 500 y provisiones da timeout** y el usuario no sabe si quedó a medias.

Flujo nuevo:
```typescript
// 1. Lanzar → 202 Accepted
const { procesoId } = await lastValueFrom(this.nominaService.liquidarTodos(periodo.id));

// 2. Polling cada 2-3 s
const proceso = await this.pollProceso(procesoId);

// 3. Según el estado
```

Estados:
```typescript
type EstadoProceso =
  | 'PENDIENTE' | 'EN_PROCESO'
  | 'COMPLETADO'
  | 'COMPLETADO_CON_ERRORES'   // ← NO es un fallo
  | 'FALLIDO' | 'REVERSADO';
```

**`COMPLETADO_CON_ERRORES` no es un error.** En 500 empleados, que 3 fallen no bota los 497 buenos. El front debe mostrar la lista de `errores` (JSON con `referencia` y `error` por item) y dejar que el usuario resuelva esos 3 — no un toast rojo genérico.

También hay que mostrar `progreso` (0-100) y `mensaje`.

Un **409** al lanzar significa que ya hay un proceso corriendo para ese período.

### 3.f `liquidar` por empleado → por contrato

`POST /nomina/liquidar/{periodoId}/empleado/{empleadoId}` sigue funcionando pero quedó `@Deprecated`: resuelve el contrato principal.

**Con multi-vínculo eso es ambiguo**: si una persona tiene dos contratos, ¿cuál se liquida? Cuando exista `POST /liquidar/{periodoId}/contrato/{contratoId}`, migrar.

Depende de si algún cliente necesita multi-vínculo (pendiente #1 del backend).

---

## 4. `empleados.cargo` — NO tocar

**Este es el punto que más importa de este documento.**

`empleados.cargo` parece un campo descriptivo y **no lo es**. Sostiene tres cosas:

1. **El listado de vendedores** — el backend hace
   `findByEmpresaIdAndActivoTrueAndCargoIgnoreCase(empresaId, "VENDEDOR")`.
   Sin eso, el módulo de ventas se queda sin vendedores.

2. **La resolución de `tipo_empleado`** — `EmpleadoServiceImpl:~348` y
   `UsuarioServiceImpl:~207` comparan `empleado.cargo` contra
   `TipoEmpleadoEntity.nombre` **por nombre, IgnoreCase — no por FK**.
   De ahí salen `tipoEmpleadoId` y `tipoEmpleadoNombre` que el front muestra.

3. **Las comisiones** — `comision_venta.vendedor_id` → `empleados(id)`.
   Van por FK, así que sobreviven, pero dependen de que el listado de
   vendedores devuelva a la gente correcta.

La Fase 2 crea `contrato_laboral.cargo`, pero **NO reemplaza** a `empleados.cargo`.
El backend ya lo tiene documentado en `V102__contrato_laboral.sql`.

### 🐛 Desajuste preexistente que conviene saber

**El front manda `tipoEmpleadoId` al crear el empleado y el backend lo ignora en silencio.**
No existe en `CreateEmpleadoDto`, ni en `EmpleadoEntity`, ni en `EmpleadoDto`.

El tipo se resuelve **por nombre contra `cargo`**, no por el id que el front envía.

Eso explica por qué `cargo` es tan frágil: es la llave real de un vínculo que
*parece* tener FK y no la tiene. Si alguien escribe "Vendedor " con espacio, o
"VENDEDORES", el empleado deja de aparecer como vendedor y pierde sus comisiones.

**Vale la pena arreglarlo** (que `tipoEmpleadoId` sea FK real), pero es trabajo de
backend y no está en el plan de nómina. Mientras tanto: **el campo `cargo` debe
seguir siendo un selector alimentado de `tipos-empleado`, nunca texto libre.**

---

## 5. Pantallas nuevas

### 5.a Contratos — la más importante

**Bloquea el alta de empleados bien hecha.**

Hoy los datos de contrato (`salarioBase`, `tipoContrato`, `fechaIngreso`,
`fechaFinContrato`, `cargo`) están en el form de empleado. Con la Fase 2 son una
entidad aparte: una persona puede tener varios contratos, y el salario tiene historial.

```
features/nomina/contratos/
  index/       → lista por empleado
  form/        → alta
  historial/   → historial salarial + renovaciones
```

Endpoints (backend los tiene que exponer):
```
GET  /contrato/empleado/{empleadoId}
POST /contrato
PUT  /contrato/{id}/salario          → { nuevoSalario, fechaDesde, motivo }
PUT  /contrato/{id}/terminar         → { fechaFin, causaRetiro }
GET  /contrato/{id}/historial-salarios
POST /contrato/{id}/renovacion
GET  /contrato/por-vencer?dias=30
```

**Dos cosas de UX que salen del diseño del backend:**

**Cambiar el salario NO es un update.** Preserva el histórico: cierra la vigencia
anterior y abre una nueva. El formulario debe pedir **desde cuándo rige** y
**motivo** — no solo el valor nuevo. Sin esa fecha no se pueden liquidar
retroactivos ni calcular la bandera `vsp` de PILA.

**`causaRetiro` decide la indemnización.** Selector, no texto libre:
```
JUSTA_CAUSA | SIN_JUSTA_CAUSA | RENUNCIA | MUTUO_ACUERDO
VENCIMIENTO_TERMINO | OBRA_TERMINADA | MUERTE
```

**Migración del form de empleado:** los campos de contrato pueden quedarse ahí
para el alta inicial (el backend crea el contrato solo), pero **editarlos después
debe llevar a la pantalla de contrato**. Si no, un cambio de salario perdería el
histórico.

### 5.b Afiliaciones — bloquea PILA

```
features/nomina/afiliaciones/
```

```
GET  /afiliacion/catalogo/{tipo}        → EPS | AFP | CCF | ARL
POST /afiliacion/contrato/{contratoId}  → { entidadId, desde }
GET  /afiliacion/contrato/{contratoId}
GET  /afiliacion/validar/{contratoId}   → lista de problemas
```

**El usuario elige de una lista, nunca digita el código.** El catálogo es nacional
y lo mantiene el proveedor: si cada cliente digitara el código de la EPS,
divergirían y PILA se rechazaría.

**Cambiar de EPS es un traslado, no un update.** El formulario pide **desde
cuándo**: de esa fecha PILA deriva las banderas de traslado.

**`GET /validar` conviene mostrarlo antes de liquidar**, no al generar PILA con
200 empleados y un rechazo sin diagnóstico.

### 5.c PILA

```
features/nomina/pila/
```

```
POST /pila/generar/{periodo}    → 'YYYY-MM'
GET  /pila/{empresaId}/{periodo}
GET  /pila/{id}/cotizantes
```

`POST /generar` responde **409 con la lista de problemas por empleado**. Es texto
accionable — hay que mostrarlo completo, no un toast.

**Falta el archivo plano** en el backend: depende de qué operador usen los clientes.

### 5.d Desprendible y certificados

```
GET /certificado/desprendible/{nominaId}
GET /certificado/ingresos/{terceroId}/{agno}
GET /certificado/laboral/{contratoId}?conSalario=true
```

**El desprendible trae `traza` por línea:**
```json
[{"paso":"Base","valor":"1300000"},{"paso":"Tarifa","valor":"4 %"},{"paso":"Resultado","valor":"52000"}]
```

Vale la pena mostrarlo (tooltip o expandible): es la diferencia entre
"salud: 52.000" y poder explicarle al empleado de dónde salió ese número.

**El certificado de ingresos se archiva.** Si se pide dos veces devuelve el mismo
documento — es requisito legal, no caché.

El **PDF falta en backend**; los servicios devuelven DTOs.

### 5.e Conceptos

```
GET  /concepto?fecha=2026-03-31
POST /concepto
```

El formulario tiene que entender `base`, que es un **enum acotado**, no una fórmula:
```
SALARIO | SALARIO_MAS_AUXILIO | IBC | DEVENGADO_TOTAL | FIJO | MANUAL
```
`FIJO` exige `valorFijo`; los porcentuales exigen `porcentaje`.

**Cambiar una tarifa no edita el concepto** — crea una versión nueva con
`vigenteDesde`. El backend rechaza solapes. La UI debe reflejar eso: "nueva
vigencia", no "editar".

### 5.f Retefuente y embargos

```
GET  /retefuente/deducciones/{contratoId}
POST /retefuente/deducciones
PUT  /contrato/{id}/procedimiento-retefuente   → '1' | '2'

GET  /embargo/contrato/{contratoId}
POST /embargo
```

**`DEPENDIENTES` no lleva valor**: es siempre 10% del ingreso topado a 32 UVT, lo
calcula el backend. Mejor un check que un campo de monto.

**El embargo es "o valor total o porcentaje", nunca ambos** (hay CHECK en BD).

---

## 6. Orden recomendado

```
1. form-tercero: 4 nombres + fecha nac. + sexo     ← bloquea PILA
2. Contratos (pantalla nueva)                      ← bloquea alta correcta
3. index-liquidacion: async + polling              ← bloquea volumen
4. Desprendible con traza                          ← lo que el empleado pide
5. Afiliaciones → PILA
6. Conceptos, retefuente, embargos
7. Nómina electrónica (cuando se retome)
```

**Nada arranca hasta que el backend exponga los endpoints.** Hoy tiene la lógica
en servicios sin controller.

---

## 7. Riesgos

| Riesgo | Nota |
|---|---|
| **`empleados.cargo`** | No convertirlo en texto libre. Sostiene vendedores, tipos y comisiones |
| **`tipoEmpleadoId` se ignora** | Desajuste preexistente. El tipo se resuelve por nombre contra `cargo` |
| **409 en crear empleado** | Documentos duplicados en `tercero`. Hay que manejarlo |
| **`COMPLETADO_CON_ERRORES`** | No es un fallo. Mostrar los items que fallaron, no un toast rojo |
| **Partir nombres en el front** | No hacerlo. Falla con apellidos compuestos |
| **Backend sin endpoints ni tests** | Nada de esto es probable hoy |
