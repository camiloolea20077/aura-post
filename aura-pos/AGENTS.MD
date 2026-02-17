# AGENTS.MD - ERP Backend Architecture & Roadmap

# ============================================================
# 1. ARQUITECTURA DEL SISTEMA
# ============================================================

Este proyecto utiliza **Spring Boot 3** con arquitectura modular y patrón **CQRS Ligero** (Command Query Responsibility Segregation).

## Estructura de Capas

1. Controller  
   - Recibe HTTP request  
   - Valida DTOs (@Valid)  
   - Retorna ApiResponse  
   - NO contiene lógica de negocio  

2. Service (Interface + Impl)  
   - Contiene lógica de negocio  
   - Maneja transacciones (@Transactional)  
   - Orquesta repositorios  

3. Mapper (MapStruct)  
   - Convierte DTO <-> Entity  
   - El Service NO debe hacer set/get manual masivo  

4. Repository (Separación estricta)

   a) ...JPARepository  
      - Extiende JpaRepository  
      - Usado para:
        - Create
        - Update
        - Delete
        - Validaciones simples (existsBy...)
      - SOLO para comandos

   b) ...QueryRepository  
      - @Repository
      - Usa NamedParameterJdbcTemplate
      - Solo consultas complejas
      - Retorna DTOs directos
      - Usado para:
        - Listados
        - Reportes
        - Tablas paginadas
        - Dashboard

--------------------------------------------------------------

# ============================================================
# 2. SEGURIDAD (SPRING SECURITY 6)
# ============================================================

- Autenticación Stateless con JWT
- Password con BCrypt
- Custom Claims incluidos en el token:

{
  "empresaId": 1,
  "sucursalId": 3,
  "rol": "ADMIN"
}

Componentes:

- SecurityConfig
- JwtTokenProvider
- JwtAuthenticationFilter
- CustomUserDetailsService

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

• UNIQUE(empresa_id, numero_documento) en tercero  
• Usuario puede pertenecer a múltiples sucursales  
• Una sucursal default por usuario  
• Auditoría completa de sesiones  

--------------------------------------------------------------

# 3.2 CATÁLOGO DE PRODUCTOS

TABLAS:

- categoria (jerárquica)
- marca
- unidad_medida
- producto
- producto_presentacion
- producto_composicion

Características avanzadas del producto:

- tipo_producto: ESTANDAR | SERVICIO | KIT | PESABLE
- maneja_inventario
- maneja_lotes
- maneja_serial
- atributos JSONB dinámicos

Esto permite soportar:

- Ferreterías
- Carnicerías
- Restaurantes
- Tecnología
- Verdulerías
- Minimercados

--------------------------------------------------------------

# 3.3 PRECIOS Y MOTOR DE DESCUENTOS

TABLAS:

- lista_precios
- producto_precio
- regla_descuento

Permite:

- Precios por lista
- Precios por presentación
- Descuentos por:
  - Fecha
  - Día de semana
  - Hora
  - Producto
  - Categoría
- Tipo:
  - PORCENTAJE
  - MONTO

--------------------------------------------------------------

# 3.4 INVENTARIO (KARDEX PROFESIONAL)

TABLAS:

- inventario
- lote
- serial_producto
- motivo_merma
- merma
- merma_detalle
- movimiento_inventario

Reglas importantes:

1. movimiento_inventario es INMUTABLE  
2. Nunca se actualiza stock manualmente  
3. Cada venta genera movimiento  
4. Cada merma genera movimiento  
5. Cada compra genera movimiento  

--------------------------------------------------------------

# 3.5 VENTAS (POS + FACTURACIÓN ELECTRÓNICA)

TABLAS:

- caja
- turno_caja
- venta
- venta_detalle
- venta_detalle_serial
- venta_pago

Incluye:

- Prefijo
- Consecutivo por sucursal
- CUFE
- Estado DIAN
- Múltiples métodos de pago
- Descuentos aplicados
- Impuestos grabados

--------------------------------------------------------------

# ============================================================
# 4. ROADMAP DEL PROYECTO
# ============================================================

## FASE 1 - CORE Y SEGURIDAD (COMPLETADO)

- Configuración Spring Boot
- PostgreSQL
- JWT
- Login
- Register transaccional
- Separación JPA / QueryRepository
- Multi-sede operativa

--------------------------------------------------------------

## FASE 2 - GESTIÓN DE TERCEROS

- CRUD Terceros
- Validación documento duplicado
- Listado paginado con JDBC
- Soft delete

--------------------------------------------------------------

## FASE 3 - INVENTARIO Y PRODUCTOS

- CRUD Producto
- Kardex automático
- Manejo de lotes
- Manejo de seriales
- Mermas
- Traslados

--------------------------------------------------------------

## FASE 4 - VENTAS

- POS completo
- Descuentos automáticos
- Integración DIAN
- Cierre de caja
- Reportes

--------------------------------------------------------------

# ============================================================
# 5. GUÍA PARA CREAR UN NUEVO MÓDULO
# ============================================================

Ejemplo: Productos

1. Entity -> domain/models
2. DTOs -> dto/products
3. JPARepository -> comandos
4. QueryRepository -> listados
5. Mapper -> MapStruct
6. Service (Interface + Impl)
7. Controller

--------------------------------------------------------------

# REGLA DE ORO

Consultas de lectura masiva SIEMPRE van al QueryRepository con JDBC.

NO usar Hibernate para listar 1000 registros.

--------------------------------------------------------------

# PRINCIPIOS DEL SISTEMA

✔ Escalable  
✔ Multi-negocio  
✔ Adaptable  
✔ Trazable  
✔ Auditable  
✔ Preparado para crecimiento  
