# AGENTS.MD - AURA POS Backend Architecture & Roadmap

# ============================================================
# 1. ARQUITECTURA DEL SISTEMA
# ============================================================

Este proyecto utiliza **Spring Boot 3** con arquitectura modular y patrón **CQRS Ligero**.

## Estructura de Capas

1. Controller  
   - Recibe HTTP request  
   - Valida DTOs (@Valid)  
   - Retorna ApiResponse  
   - NO contiene lógica de negocio  
   - empresaId siempre se extrae del token via SecurityUtils

2. Service (Interface + Impl)  
   - Contiene lógica de negocio  
   - Maneja transacciones (@Transactional)  
   - Orquesta repositorios  
   - Usa MapStruct, NO hace set/get manual masivo

3. Mapper (MapStruct)  
   - Convierte DTO <-> Entity  
   - Relaciones (empresa, sucursal, etc.) se ignoran en el mapper  
   - Se asignan manualmente en el Service

4. Repository (Separación estricta)

   a) ...JPARepository  
      - Extiende JpaRepository  
      - Métodos simples: findByIdAndEmpresaId, existsBy...  
      - SIN métodos con nombres largos tipo findByIdAndEmpresaIdAndDeletedAtIsNull  
      - Validaciones complejas van al QueryRepository  

   b) ...QueryRepository  
      - @Repository  
      - Usa NamedParameterJdbcTemplate  
      - Listados paginados, reportes, validaciones complejas  
      - Métodos de existencia: existeNombre(), existeNombreExcluyendo()  
      - Retorna DTOs directos con BeanPropertyRowMapper

--------------------------------------------------------------

# ============================================================
# 2. SEGURIDAD (SPRING SECURITY 6)
# ============================================================

- Autenticación Stateless con JWT
- Password con BCrypt
- Custom Claims en el token:

{
  "empresaId": 1,
  "sucursalId": 3,
  "usuarioId": 1,
  "rol": "ADMIN"
}

Componentes:
- SecurityConfig
- JwtTokenProvider
- JwtAuthenticationFilter
- CustomUserDetailsService
- SecurityUtils → extrae claims del token en cada request

--------------------------------------------------------------

# ============================================================
# 3. MODELO DE DATOS COMPLETO (ERP MULTI-SEDE + POS)
# ============================================================

El sistema soporta:

✔ Multi-empresa  
✔ Multi-sucursal  
✔ Multi-usuario  
✔ POS  
✔ Inventario avanzado  
✔ Lotes  
✔ Seriales  
✔ Kardex inmutable  
✔ Motor de descuentos  
✔ Facturación electrónica  
✔ Auditoría de sesiones  

--------------------------------------------------------------

# 3.1 ESTRUCTURA EMPRESARIAL

TABLAS:
- empresa
- sucursal
- tercero
- usuario
- usuario_sucursal
- historial_sesion

Características clave:
- UNIQUE(empresa_id, numero_documento) en tercero  
- Usuario puede pertenecer a múltiples sucursales  
- Una sucursal default por usuario  
- Auditoría completa de sesiones  

--------------------------------------------------------------

# 3.2 CATÁLOGO DE PRODUCTOS

TABLAS:
- categoria (jerárquica con padre_id)
- marca
- unidad_medida (sin empresa_id, es global)
- producto
- producto_presentacion
- producto_composicion

Características avanzadas del producto:
- tipo_producto: ESTANDAR | SERVICIO | KIT | PESABLE
- maneja_inventario
- maneja_lotes → si true, compras crean/actualizan lotes
- maneja_serial
- atributos JSONB dinámicos

--------------------------------------------------------------

# 3.3 PRECIOS Y MOTOR DE DESCUENTOS

TABLAS:
- lista_precios
- producto_precio
- regla_descuento (JSONB para dias_semana)

Motor de descuentos:
- Por fecha, día de semana, hora
- Por producto o categoría (no ambos)
- Tipo: PORCENTAJE | MONTO
- buscarReglasAplicables() en QueryRepository para motor de ventas

--------------------------------------------------------------

# 3.4 INVENTARIO (KARDEX PROFESIONAL)

TABLAS:
- inventario (stock actual por sucursal/producto)
- lote (FEFO - First Expired First Out)
- serial_producto (estado: DISPONIBLE | VENDIDO | GARANTIA)
- motivo_merma
- merma + merma_detalle
- movimiento_inventario (INMUTABLE)

Reglas críticas:
1. movimiento_inventario NUNCA se edita ni elimina
2. Stock SOLO se mueve via: COMPRA | VENTA | MERMA | TRASLADO | ANULACION_COMPRA
3. Cada operación registra saldo_anterior y saldo_nuevo
4. Si producto.maneja_lotes = true → compra crea/actualiza lote automáticamente
5. Stock nunca queda negativo → validación en anulaciones

--------------------------------------------------------------

# 3.5 COMPRAS

TABLAS:
- compra (cabecera)
- compra_detalle

Flujo de una compra:
1. Crear cabecera
2. Por cada detalle:
   a. Crear compra_detalle
   b. resolverLote() → crea o actualiza lote si maneja_lotes = true
   c. resolverInventario() → crea o actualiza stock en inventario
   d. registrarMovimiento() → Kardex tipo COMPRA
3. Actualizar totales en cabecera

Estados: RECIBIDA | ANULADA
Anulación revierte stock, lotes y genera movimiento ANULACION_COMPRA

--------------------------------------------------------------

# 3.6 TERCEROS

TABLAS:
- tercero

Características:
- Un tercero puede ser cliente, proveedor y empleado simultáneamente
- nombre_completo = COALESCE(razon_social, nombres + apellidos)
- listarClientes() y listarProveedores() para selectores en POS y compras
- Soft delete con deleted_at

--------------------------------------------------------------

# 3.7 VENTAS (POS + FACTURACIÓN ELECTRÓNICA)

TABLAS:
- caja
- turno_caja
- venta
- venta_detalle
- venta_detalle_serial
- venta_pago

Incluye:
- Prefijo + Consecutivo por sucursal
- CUFE + Estado DIAN
- Múltiples métodos de pago
- Descuentos automáticos via motor de reglas
- Impuestos grabados

--------------------------------------------------------------

# ============================================================
# 4. PATRONES Y CONVENCIONES
# ============================================================

## DTOs
- XxxDto → detalle completo (formulario/obtenerPorId)
- XxxTableDto → tabla paginada (incluye totalRows)
- CreateXxxDto → creación
- UpdateXxxDto → actualización

## Paginación
- Siempre via POST /page con PageableDto
- COUNT(*) OVER() AS total_rows en queries
- BeanPropertyRowMapper para mapeo automático
- PageImpl como respuesta

## Soft Delete
- Entidades con deleted_at: categoria, marca, producto, tercero, compra
- Entidades sin deleted_at (solo activo): unidad_medida, lista_precios, lote, regla_descuento
- Serial: hard delete

## Seguridad
- empresaId siempre del token: securityUtils.getEmpresaId()
- sucursalId del token: securityUtils.getSucursalId()
- usuarioId del token: securityUtils.getUsuarioId()
- NUNCA recibir empresaId por header o body

## Validaciones
- Duplicados → QueryRepository (existeNombre, existeDocumento, etc.)
- Existencia por id → JPARepository (findByIdAndEmpresaId)
- Lógica de negocio → Service

--------------------------------------------------------------

# ============================================================
# 5. ROADMAP DEL PROYECTO
# ============================================================

## ✅ COMPLETADO

- Configuración Spring Boot + PostgreSQL + JWT
- Login + Register transaccional multi-sede
- SecurityUtils con claims del token
- Categorías (jerárquico)
- Marcas
- Unidades de Medida (global)
- Productos
- Producto Presentaciones
- Producto Composición (Kits y Recetas)
- Listas de Precios
- Precios por Producto
- Reglas de Descuento
- Inventario
- Lotes
- Seriales
- Terceros (clientes y proveedores)
- Compras + Kardex automático

## 🔨 POR CONSTRUIR

1. Caja
2. Turno de Caja
3. Ventas / POS (core)
4. Mermas
5. Traslados entre sucursales
6. Reportes y Dashboard

--------------------------------------------------------------

# ============================================================
# 6. GUÍA PARA CREAR UN NUEVO MÓDULO
# ============================================================

Orden estricto:
1. SQL migration (si es tabla nueva)
2. Entity → domain/models
3. DTOs → dto/modulo (Dto, TableDto, CreateDto, UpdateDto)
4. JPARepository → comandos simples
5. QueryRepository → listados + validaciones complejas
6. Mapper → MapStruct
7. Service Interface + ServiceImpl
8. Controller

--------------------------------------------------------------

# REGLA DE ORO

Consultas de lectura masiva SIEMPRE van al QueryRepository con JDBC.
NO usar Hibernate para listar registros.
El stock NUNCA se modifica directamente, siempre via movimiento_inventario.