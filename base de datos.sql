-- ==================================================================
-- 1. ESTRUCTURA EMPRESARIAL Y SEGURIDAD (LOGIN MULTI-SEDE)
-- ==================================================================

CREATE TABLE empresa (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    nit VARCHAR(20) UNIQUE NOT NULL,
    dv CHAR(1),
    logo_url TEXT,
    configuracion JSONB DEFAULT '{}', -- Ej: {"login_teclado": true, "color_tema": "azul"}
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sucursal (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    codigo VARCHAR(20), -- SUC-01
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    telefono VARCHAR(50),
    prefijo_facturacion VARCHAR(10), -- PREF-01
    consecutivo_actual BIGINT DEFAULT 1,
    activa BOOLEAN DEFAULT TRUE
);

-- TERCEROS (Clientes, Proveedores, Empleados)
CREATE TABLE tercero (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    tipo_documento VARCHAR(20) DEFAULT 'CC', 
    numero_documento VARCHAR(50) NOT NULL,
    dv CHAR(1),
    razon_social VARCHAR(255), 
    nombres VARCHAR(150), 
    apellidos VARCHAR(150),
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(150),
    email_fe VARCHAR(150), -- Email para Facturación Electrónica
    responsabilidad_fiscal VARCHAR(50), -- Gran contribuyente, etc.
    es_cliente BOOLEAN DEFAULT TRUE,
    es_proveedor BOOLEAN DEFAULT FALSE,
    es_empleado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	deleted_at TIMESTAMP;
    UNIQUE(empresa_id, numero_documento)
);
select * from categoria
-- USUARIOS DEL SISTEMA
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    tercero_id INT REFERENCES tercero(id), -- Datos personales
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pin_acceso_rapido VARCHAR(255), -- Para desbloqueo en pantalla táctil
    rol VARCHAR(50), -- ADMIN, CAJERO, SUPERVISOR
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- *** NUEVA TABLA CLAVE PARA TU PREGUNTA ***
-- Define a qué sucursales tiene permiso de entrar un usuario
CREATE TABLE usuario_sucursal (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuario(id),
    sucursal_id INT REFERENCES sucursal(id),
    es_default BOOLEAN DEFAULT FALSE, -- Cual se selecciona por defecto
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE(usuario_id, sucursal_id)
);

-- AUDITORÍA DE SESIONES
CREATE TABLE historial_sesion (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuario(id),
    sucursal_id INT REFERENCES sucursal(id), -- En cuál entró finalmente
    token_jti VARCHAR(255), -- ID del Token
    ip_address VARCHAR(50),
    dispositivo VARCHAR(100),
    fecha_inicio TIMESTAMP DEFAULT NOW(),
    fecha_fin TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- ==================================================================
-- 2. CATÁLOGO DE PRODUCTOS ROBUSTO
-- ==================================================================

CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    nombre VARCHAR(150) NOT NULL,
    padre_id INT REFERENCES categoria(id), -- Para subcategorías
    impuesto_defecto DECIMAL(5,2) DEFAULT 0,
    
    -- Auditoría
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE marca (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    nombre VARCHAR(150) NOT NULL,
    
    -- Auditoría
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE unidad_medida (
    id SERIAL PRIMARY KEY,
    -- empresa_id INT REFERENCES empresa(id), 
    nombre VARCHAR(50) NOT NULL, 
    abreviatura VARCHAR(10) NOT NULL, 
    permite_decimales BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	deleted_at TIMESTAMP;
select * from producto
);

-- 4. PRODUCTO (El maestro)
CREATE TABLE producto (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    categoria_id INT REFERENCES categoria(id),
    marca_id INT REFERENCES marca(id),
    unidad_medida_base_id INT REFERENCES unidad_medida(id),
    
    sku VARCHAR(100), -- Código interno
    codigo_barras VARCHAR(150), -- EAN/UPC
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    
    -- Configuración
    tipo_producto VARCHAR(20) DEFAULT 'ESTANDAR', -- ESTANDAR, SERVICIO, KIT, PESABLE
    maneja_inventario BOOLEAN DEFAULT TRUE,
    maneja_lotes BOOLEAN DEFAULT FALSE,
    maneja_serial BOOLEAN DEFAULT FALSE,
    
    -- Precios Base e Impuestos
    costo DECIMAL(19, 2) DEFAULT 0,  -- Costo promedio o última compra
    precio DECIMAL(19, 2) DEFAULT 0, -- Precio base de venta
    iva_porcentaje DECIMAL(5,2) DEFAULT 0,
    impoconsumo DECIMAL(14,2) DEFAULT 0,

    -- Flexibilidad (Talla, Color, CPU) -> JSONB es muy potente
    atributos JSONB DEFAULT '{}', 

    -- Auditoría
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Restricción: No repetir código de barras en la misma empresa
    CONSTRAINT uq_producto_codigo UNIQUE (empresa_id, codigo_barras)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_producto_nombre ON producto(empresa_id, nombre);
CREATE INDEX idx_producto_sku ON producto(empresa_id, sku);
-- Presentaciones (Caja x 12, SixPack)
CREATE TABLE producto_presentacion (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES producto(id),
    nombre VARCHAR(100), 
    codigo_barras VARCHAR(150) UNIQUE,
    factor_conversion DECIMAL(14,4) NOT NULL DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE
);

-- Kits y Recetas
CREATE TABLE producto_composicion (
    id SERIAL PRIMARY KEY,
    producto_padre_id INT REFERENCES producto(id),
    producto_hijo_id INT REFERENCES producto(id),
    cantidad DECIMAL(14,4),
    tipo VARCHAR(20) -- KIT, RECETA
);

-- ==================================================================
-- 3. PRECIOS Y MOTOR DE DESCUENTOS
-- ==================================================================

CREATE TABLE lista_precios (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    nombre VARCHAR(100), -- General, Mayorista
    activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE producto_precio (
    id SERIAL PRIMARY KEY,
    lista_precio_id INT REFERENCES lista_precios(id),
    producto_presentacion_id INT REFERENCES producto_presentacion(id),
    precio DECIMAL(14,2) NOT NULL,
    utilidad_esperada DECIMAL(5,2)
);

-- Reglas automáticas (2x1, Descuento por día)
CREATE TABLE regla_descuento (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    nombre VARCHAR(150), 
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    dias_semana JSONB, -- [1,2,3]
    hora_inicio TIME,
    hora_fin TIME,
    
    categoria_id INT REFERENCES categoria(id),
    producto_id INT REFERENCES producto(id),
    
    tipo_descuento VARCHAR(20), -- PORCENTAJE, MONTO
    valor DECIMAL(14,2),
    
    activo BOOLEAN DEFAULT TRUE
);

-- ==================================================================
-- 4. INVENTARIO (KARDEX, LOTES, SERIALES)
-- ==================================================================

CREATE TABLE lote (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES producto(id),
    sucursal_id INT REFERENCES sucursal(id),
    codigo_lote VARCHAR(100),
    fecha_vencimiento DATE,
    stock_actual DECIMAL(14,4),
    costo_unitario DECIMAL(14,2),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE serial_producto (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES producto(id),
    sucursal_id INT REFERENCES sucursal(id),
    serial VARCHAR(200) NOT NULL UNIQUE,
    estado VARCHAR(20) DEFAULT 'DISPONIBLE' -- DISPONIBLE, VENDIDO, GARANTIA
);

-- Existencias rápidas
CREATE TABLE inventario (
    id SERIAL PRIMARY KEY,
    sucursal_id INT REFERENCES sucursal(id),
    producto_id INT REFERENCES producto(id),
    stock_actual DECIMAL(14,4) DEFAULT 0,
    stock_minimo DECIMAL(14,4) DEFAULT 0,
    ubicacion VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(sucursal_id, producto_id)
);

-- Motivos de Merma
CREATE TABLE motivo_merma (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    nombre VARCHAR(100), -- Vencimiento, Robo
    afecta_contabilidad BOOLEAN DEFAULT TRUE
);

-- Cabecera de Merma
CREATE TABLE merma (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    sucursal_id INT REFERENCES sucursal(id),
    usuario_id INT REFERENCES usuario(id),
    motivo_id INT REFERENCES motivo_merma(id),
    fecha TIMESTAMP DEFAULT NOW(),
    observacion TEXT,
    costo_total DECIMAL(14,2),
    estado VARCHAR(20) DEFAULT 'APROBADA'
);

-- Detalle de Merma
CREATE TABLE merma_detalle (
    id SERIAL PRIMARY KEY,
    merma_id INT REFERENCES merma(id),
    producto_id INT REFERENCES producto(id),
    lote_id INT REFERENCES lote(id),
    cantidad DECIMAL(14,4),
    costo_unitario DECIMAL(14,2)
);

-- Kardex (Historial inmutable)
CREATE TABLE movimiento_inventario (
    id SERIAL PRIMARY KEY,
    sucursal_id INT REFERENCES sucursal(id),
    producto_id INT REFERENCES producto(id),
    lote_id INT REFERENCES lote(id),
    tipo_movimiento VARCHAR(20), -- VENTA, COMPRA, MERMA, TRASLADO
    cantidad DECIMAL(14,4), 
    saldo_anterior DECIMAL(14,4),
    saldo_nuevo DECIMAL(14,4),
    costo_historico DECIMAL(14,2),
    referencia_origen VARCHAR(100), -- "Venta #123"
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================================
-- 5. VENTAS (POS Y FACTURACIÓN ELECTRÓNICA)
-- ==================================================================

CREATE TABLE caja (
    id SERIAL PRIMARY KEY,
    sucursal_id INT REFERENCES sucursal(id),
    nombre VARCHAR(100),
    activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE turno_caja (
    id SERIAL PRIMARY KEY,
    caja_id INT REFERENCES caja(id),
    usuario_id INT REFERENCES usuario(id),
    fecha_apertura TIMESTAMP DEFAULT NOW(),
    fecha_cierre TIMESTAMP,
    base_inicial DECIMAL(14,2),
    total_efectivo_sistema DECIMAL(14,2),
    total_efectivo_real DECIMAL(14,2),
    diferencia DECIMAL(14,2),
    estado VARCHAR(20) DEFAULT 'ABIERTA'
);

CREATE TABLE venta (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresa(id),
    sucursal_id INT REFERENCES sucursal(id),
    cliente_id INT REFERENCES tercero(id),
    usuario_id INT REFERENCES usuario(id),
    turno_caja_id INT REFERENCES turno_caja(id),
    
    -- Documento
    tipo_documento VARCHAR(20) DEFAULT 'POS', 
    prefijo VARCHAR(10),
    consecutivo BIGINT,
    fecha_emision TIMESTAMP DEFAULT NOW(),
    fecha_vencimiento DATE,
    
    -- Valores
    subtotal DECIMAL(14,2),
    descuento_total DECIMAL(14,2),
    impuestos_total DECIMAL(14,2),
    total_pagar DECIMAL(14,2),
    
    -- Facturación Electrónica
    cufe VARCHAR(255),
    qr_data TEXT,
    estado_dian VARCHAR(50), 
    
    estado_venta VARCHAR(20) DEFAULT 'COMPLETADA',
    observaciones TEXT
);

CREATE TABLE venta_detalle (
    id SERIAL PRIMARY KEY,
    venta_id INT REFERENCES venta(id),
    producto_id INT REFERENCES producto(id),
    producto_presentacion_id INT REFERENCES producto_presentacion(id),
    lote_id INT REFERENCES lote(id),
    
    cantidad DECIMAL(14,4) NOT NULL,
    precio_unitario DECIMAL(14,2) NOT NULL,
    
    -- Descuentos aplicados
    regla_descuento_id INT REFERENCES regla_descuento(id),
    monto_descuento DECIMAL(14,2) DEFAULT 0,
    
    -- Impuestos grabados
    impuesto_valor DECIMAL(14,2),
    
    subtotal_linea DECIMAL(14,2)
);

CREATE TABLE venta_detalle_serial (
    venta_detalle_id INT REFERENCES venta_detalle(id),
    serial_producto_id INT REFERENCES serial_producto(id)
);

CREATE TABLE venta_pago (
    id SERIAL PRIMARY KEY,
    venta_id INT REFERENCES venta(id),
    metodo_pago VARCHAR(50), -- EFECTIVO, TARJETA, NEQUI
    monto DECIMAL(14,2),
    referencia VARCHAR(100)
);