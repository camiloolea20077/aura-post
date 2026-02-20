# AURA POS — Producto (Guía Única: Backend + Frontend)

Este documento unifica las reglas y convenciones para construir y mantener el **módulo de Producto** (parte visual + API) en **AURA POS**, alineando:

- **Backend** (Spring Boot 3, CQRS ligero, JWT, Kardex/Inventario)
- **Frontend** (Angular 18 standalone, PrimeNG 18, OnPush, dialogs)

> Úsalo como “source of truth” para el desarrollo del **Catálogo de Productos** (producto, presentaciones, composición/kit, precios y soporte inventario: lotes/seriales).

---

## Tabla de contenido

1. [Stack y principios](#stack-y-principios)
2. [Arquitectura Backend](#arquitectura-backend)
3. [Arquitectura Frontend](#arquitectura-frontend)
4. [Modelo de datos de Producto](#modelo-de-datos-de-producto)
5. [Endpoints del módulo Producto](#endpoints-del-módulo-producto)
6. [Patrón de DTOs](#patrón-de-dtos)
7. [Repositorios (JPA vs QueryRepository)](#repositorios-jpa-vs-queryrepository)
8. [Servicios y transacciones](#servicios-y-transacciones)
9. [MapStruct (mappers)](#mapstruct-mappers)
10. [UI Producto (pantallas y dialogs)](#ui-producto-pantallas-y-dialogs)
11. [Formularios y validaciones](#formularios-y-validaciones)
12. [Autocomplete / selectores (producto, categoría, marca, unidad)](#autocomplete--selectores)
13. [SCSS y design system](#scss-y-design-system)
14. [Reglas de oro](#reglas-de-oro)
15. [Checklist antes de commit](#checklist-antes-de-commit)

---

## Stack y principios

### Backend
- Spring Boot 3
- Security 6 + JWT stateless
- MapStruct
- PostgreSQL
- Separación estricta: Controller → Service → Mapper → Repository (JPA / Query)
- CQRS ligero: lecturas masivas con JDBC (QueryRepository)

### Frontend
- Angular 18 (standalone)
- PrimeNG 18 + PrimeFlex + PrimeIcons
- ChangeDetectionStrategy.OnPush + ChangeDetectorRef
- ReactiveFormsModule (DTO principal)
- FormsModule **solo** para filtros/búsquedas y líneas dinámicas
- IndexedDB (localforage) para sesión
- uuid v4 para líneas dinámicas / trackBy

---

## Arquitectura Backend

### Capas
1. **Controller**
   - Recibe request
   - Valida DTOs (`@Valid`)
   - Retorna `ApiResponse`
   - Cero lógica de negocio
   - `empresaId` siempre se toma del token vía `SecurityUtils`

2. **Service (Interface + Impl)**
   - Lógica de negocio
   - `@Transactional` cuando aplica
   - Orquesta repositorios
   - Usa MapStruct (evitar set/get manual masivo)
   - Asigna relaciones ignoradas por mapper

3. **Mapper (MapStruct)**
   - DTO ↔ Entity
   - Relaciones `empresa/sucursal/etc.` se ignoran y se setean en Service

4. **Repository**
   - `...JPARepository`: operaciones simples (findByIdAndEmpresaId, existsBy…)
   - `...QueryRepository`: listados paginados, reportes, validaciones complejas, búsquedas

### Seguridad (JWT)
Claims esperados:
```json
{
  "empresaId": 1,
  "sucursalId": 3,
  "usuarioId": 1,
  "rol": "ADMIN"
}
```
Reglas:
- **NUNCA** recibir `empresaId` en body/header
- `empresaId/sucursalId/usuarioId` se extraen por `SecurityUtils`

---

## Arquitectura Frontend

### Estructura recomendada (módulo Producto)
```
features/catalogo/productos/
├── index/
│   ├── index-productos.component.ts/html/scss
├── form/
│   ├── form-producto.component.ts/html/scss
├── detalle/
│   ├── detalle-producto.component.ts/html/scss
├── models/
│   └── producto.model.ts
├── services/
│   └── producto.service.ts
└── producto.routes.ts
```

Reglas críticas:
- **Cada componente tiene su SCSS propio** (no compartir SCSS entre componentes).
- Crear/editar se hace en **dialog** (`p-dialog`), no en rutas `/nuevo`.

### Change detection
- Todos los componentes: `OnPush`
- En cualquier cambio async: `cdr.markForCheck()` (idealmente en `finally`)

---

## Modelo de datos de Producto

Entidades relacionadas (backend):
- `categoria` (jerárquica)
- `marca`
- `unidad_medida` (global)
- `producto`
- `producto_presentacion`
- `producto_composicion` (kits/recetas)
- `lista_precios` + `producto_precio`
- (inventario) `inventario`, `lote`, `serial_producto`

Atributos clave de producto:
- `tipo_producto`: `ESTANDAR | SERVICIO | KIT | PESABLE`
- `maneja_inventario`
- `maneja_lotes` (FEFO)
- `maneja_serial`
- `atributos` JSONB

---

## Endpoints del módulo Producto

Convención general:
- `POST /page` → paginado
- `GET /` → lista simple (dropdowns)
- `GET /{id}` → detalle completo
- `POST /` → crear
- `PUT /{id}` → actualizar
- `DELETE /{id}` → eliminar
- `PATCH /{id}/anular` → cambio estado (si aplica)

### Sugerencia concreta (producto)
- `POST /api/productos/page`
- `GET  /api/productos` (lista simple para selectores)
- `GET  /api/productos/{id}`
- `POST /api/productos`
- `PUT  /api/productos/{id}`
- `DELETE /api/productos/{id}` (si aplica soft delete)
- `GET  /api/productos/autocomplete?search=...` (si usas selector tipo POS)
- `GET  /api/productos/pos` (si aplica POS con descuento automático)

---

## Patrón de DTOs

- `ProductoDto` → detalle completo (form/obtenerPorId)
- `ProductoTableDto` → tabla paginada (`totalRows`)
- `CreateProductoDto` → creación
- `UpdateProductoDto` → actualización

Frontend (models):
- `ProductoModel`, `ProductoTableModel`, `CreateProductoDto`, `UpdateProductoDto`
- UI: `ProductoLineaUI` (si hay líneas dinámicas en presentaciones/composición)

---

## Repositorios (JPA vs QueryRepository)

### JPARepository
- `findByIdAndEmpresaId(...)`
- `existsBy...` (validaciones simples)
- Evitar nombres largos tipo `...AndDeletedAtIsNull` (si la regla es estricta)

### QueryRepository (JDBC)
- listados paginados
- filtros `ILIKE`
- validaciones complejas (duplicados con exclusión)
- autocomplete y reportes

Paginación estándar:
- `COUNT(*) OVER() AS total_rows`
- `PageImpl` en Service

---

## Servicios y transacciones

Reglas:
- Operaciones que impactan inventario (si aplica) deben ser `@Transactional`.
- Inventario: el stock **no se toca directo**, se mueve por movimientos (kardex).
- Validaciones de negocio viven en Service (no en Controller).

---

## MapStruct (mappers)

- El mapper **ignora** relaciones y campos de auditoría (según convención).
- Service asigna:
  - `empresaId`/`empresa`
  - `sucursal` si aplica
  - valores derivados

---

## UI Producto (pantallas y dialogs)

### IndexProductos (tabla)
- Paginación server-side (`[lazy]="true"`)
- Filtro `search`
- Acciones:
  - ver detalle (clic fila)
  - editar (abre dialog)
  - eliminar/anular (confirm)

Regla:
- En celda de acciones: `(click)="$event.stopPropagation()"`

### FormProducto (dialog)
- `ReactiveForms` para DTO principal
- `ngOnChanges()` para reset y patch
- `try/catch/finally` en HTTP
- `finally`: `loading=false` + `cdr.markForCheck()`

Tamaños sugeridos:
- estándar: `560px`
- si incluye presentaciones/composición (líneas): `860px`

### DetalleProducto (dialog)
- Solo lectura
- Botón editar (abre form desde index) o anular/eliminar (según reglas)

---

## Formularios y validaciones

### Frontend (UI)
Validaciones típicas:
- nombre obligatorio
- categoría obligatoria
- unidad obligatoria (si aplica)
- si `maneja_lotes`: validar que compras gestionen lote (en su módulo), pero en producto mostrar flag claro
- si `tipo_producto = PESABLE`: cantidades decimales habilitadas en POS

### Backend (negocio)
- duplicados: QueryRepository (ej: nombre/sku por empresa)
- existencia: JPARepository por empresa
- coherencias:
  - si `maneja_serial` y `tipo_producto=SERVICIO` → decidir regla (permitir o no)
  - si `KIT`: composición obligatoria (si regla lo requiere)

---

## Autocomplete / selectores

Permitido en frontend usar `ngModel` solo en:
- búsqueda en tabla
- autocomplete de producto (selector)
- líneas dinámicas (presentaciones/composición)

Regla:
- `ngModelOptions="{ standalone: true }"` para no mezclar con `formGroup`.

---

## SCSS y design system

- Variables Aura (`:root --aura-*`) en `styles/_variables.scss`
- SCSS por componente (no compartir)
- Clases helper se copian al componente que las usa
- Botón primario Aura: gradiente (PrimeNG button override)

---

## Reglas de oro

### Backend
1. `empresaId` siempre del JWT.
2. Lecturas masivas → QueryRepository con JDBC.
3. No tocar stock directamente (solo por movimientos/kardex).
4. Transacciones en operaciones que afectan consistencia.

### Frontend
1. `OnPush` siempre.
2. `cdr.markForCheck()` en cambios async (sobre todo en `finally`).
3. Forms principales: ReactiveForms.
4. `ngModel` solo en filtros / autocompletes / líneas dinámicas.
5. Formularios crear/editar: **dialogs**, no rutas.

---

## Checklist antes de commit

- [ ] ¿OnPush en todos los componentes del módulo Producto?
- [ ] ¿`cdr.markForCheck()` en `finally` de llamadas HTTP?
- [ ] ¿Form principal usa `formControlName` (no `ngModel`)?
- [ ] ¿Autocompletes/líneas dinámicas usan `ngModel` standalone?
- [ ] ¿Tabla usa lazy paging y `totalRows` correcto?
- [ ] ¿Acciones en tabla usan `stopPropagation()`?
- [ ] ¿SCSS propio por componente (sin SCSS compartido)?
- [ ] ¿Backend: Controller sin lógica de negocio?
- [ ] ¿Backend: validaciones complejas en QueryRepository?
- [ ] ¿Backend: multi-empresa respetada (empresaId del token)?

---

### Archivos relacionados
- `AGENTS.MD` (Backend Architecture & Roadmap)
- `FRONTEND_AGENTS.MD` (Directivas Angular + PrimeNG)

> Si cambias reglas, actualiza ambos AGENTS y este README único para mantener coherencia.
