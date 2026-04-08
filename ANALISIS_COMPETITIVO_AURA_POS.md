# ANÁLISIS COMPETITIVO: AURA POS vs Siigo vs Alegra
## Documento de Brechas, Mejoras y Roadmap — Marzo 2025

---

## TABLA DE CONTENIDOS

1. [Estado Actual de AURA POS](#1-estado-actual-de-aura-pos)
2. [Benchmarking: AURA vs Siigo vs Alegra](#2-benchmarking-aura-vs-siigo-vs-alegra)
3. [Brechas Críticas Regulatorias DIAN 2025](#3-brechas-críticas-regulatorias-dian-2025)
4. [Brechas Funcionales por Módulo](#4-brechas-funcionales-por-módulo)
5. [Brechas Técnicas y de Arquitectura](#5-brechas-técnicas-y-de-arquitectura)
6. [Oportunidades Diferenciadoras](#6-oportunidades-diferenciadoras)
7. [Roadmap de Implementación Priorizado](#7-roadmap-de-implementación-priorizado)
8. [Modelo de Precios Sugerido](#8-modelo-de-precios-sugerido)
9. [Resumen Ejecutivo](#9-resumen-ejecutivo)

---

## 1. ESTADO ACTUAL DE AURA POS

### Stack Tecnológico
| Capa | Tecnología | Estado |
|------|-----------|--------|
| Frontend | Angular 18.2, Standalone Components, PrimeNG 18 | Sólido |
| Backend | Spring Boot 3.5.10, Java 17, JPA, PostgreSQL | Sólido |
| Autenticación | JWT, Spring Security, Roles (SUPER_ADMIN, ADMIN, CAJERO) | Funcional |
| Almacenamiento | Cloudflare R2 (S3-compatible) | OK |
| Facturación DIAN | API Factus con Circuit Breaker + Retry | Parcial |
| BD Migraciones | Flyway V14 → V42 | Activo |

### Módulos Existentes (Inventario)

| Módulo | Frontend | Backend | Madurez | Notas |
|--------|----------|---------|---------|-------|
| **POS** | ✅ Robusto (48KB, multi-tab) | ✅ Completo | 85% | Falta modo offline |
| **Catálogo Productos** | ✅ 4 tipos, composiciones | ✅ Completo | 90% | OK |
| **Inventario** | ✅ Lotes, seriales, kardex | ✅ Completo | 85% | Falta ajustes automáticos |
| **Precios** | ✅ Múltiples listas, reglas | ✅ 20 métodos dinámicos | 90% | Muy completo |
| **Ventas** | ✅ Listado + detalle | ✅ CRUD completo | 85% | Falta devoluciones |
| **Compras** | ✅ Órdenes + recepción | ✅ Retenciones incluidas | 80% | Falta Documento Soporte |
| **Cotizaciones** | ✅ Básico | ✅ CRUD | 65% | Sin integración full |
| **Cartera** | ✅ Dashboard, scoring | ✅ Motor crédito JSONB | 75% | Muy diferenciador |
| **Cuentas x Cobrar** | ✅ Abonos + PDF | ✅ Abonos, PDF | 80% | Falta interés mora |
| **Cuentas x Pagar** | ✅ Abonos + PDF | ✅ Abonos, PDF | 80% | Falta proyecciones |
| **Tesorería** | ✅ Básico | ✅ Movimientos | 50% | Muy básica |
| **Caja / Turnos** | ✅ Apertura/cierre | ✅ Completo | 85% | OK |
| **Nómina** | ✅ UI completa | ✅ Estructura + liquidación | 55% | Sin descuentos complejos |
| **Comisiones** | ✅ Config + liquidaciones | ✅ Funcional | 75% | OK |
| **Dashboard** | ✅ KPIs + 2 gráficas | ✅ 3 endpoints | 60% | Básico vs competencia |
| **Reportes** | ✅ Ventas + inventario | ✅ Excel + PDF | 55% | Muy básico |
| **Facturación DIAN** | ✅ Modal básico | ✅ Factus + resiliencia | 65% | Incompleto |
| **Contabilidad** | ✅ PUC, Asientos, P&G, Libro Mayor, Flujo Caja | ✅ Completo | 75% | Faltan retenciones, NIIF, exógena |
| **Traslados** | ✅ Completo | ✅ Completo | 80% | OK |
| **Mermas** | ✅ Completo | ✅ Completo | 80% | OK |
| **Terceros** | ✅ Completo | ✅ Completo | 85% | OK |
| **Usuarios/Sucursales** | ✅ Completo | ✅ Multi-empresa | 85% | OK |
| **Pedidos Vendedor** | ✅ Básico | ✅ CRUD | 60% | Sin app móvil |

---

## 2. BENCHMARKING: AURA vs SIIGO vs ALEGRA

### Comparativa General de Features

| Feature | AURA POS | SIIGO | ALEGRA |
|---------|----------|-------|--------|
| **FACTURACIÓN** |  |  |  |
| Factura electrónica de venta | ✅ (via Factus) | ✅ | ✅ |
| Nota crédito electrónica | ⚠️ Parcial | ✅ | ✅ |
| Nota débito electrónica | ⚠️ Parcial | ✅ | ✅ |
| Documento equivalente electrónico (tiquete POS) | ❌ | ✅ | ✅ |
| Documento Soporte (compras sin obligados) | ❌ | ✅ | ✅ |
| Nómina electrónica | ❌ Generación no implementada | ✅ | ✅ |
| Código QR en documentos | ⚠️ | ✅ | ✅ |
| Facturación desde WhatsApp | ❌ | ❌ | ✅ |
| Facturación por voz | ❌ | ❌ | ✅ |
| Contingencia DIAN | ❌ | ✅ | ✅ |
| **CONTABILIDAD** |  |  |  |
| Plan de cuentas (PUC) | ✅ | ✅ | ✅ |
| Balance general | ✅ | ✅ | ✅ |
| Estado de resultados | ✅ | ✅ | ✅ |
| Flujo de caja | ✅ | ✅ | ✅ |
| Asientos contables | ✅ | ✅ | ✅ |
| Conciliación bancaria automática | ❌ | ✅ | ✅ (con IA) |
| Conexión directa bancaria | ❌ | ⚠️ | ✅ (Bancolombia) |
| Cumplimiento NIIF | ❌ | ✅ | ✅ |
| Centros de costo | ❌ | ✅ | ✅ |
| Información exógena DIAN | ❌ | ✅ | ✅ |
| Retenciones automáticas | ⚠️ Solo en compras | ✅ | ✅ |
| **PUNTO DE VENTA** |  |  |  |
| Múltiples órdenes simultáneas | ✅ (5 tabs) | ❌ | ❌ |
| Múltiples métodos de pago en 1 venta | ✅ | ✅ | ✅ |
| Apertura/cierre de turno | ✅ | ✅ | ✅ |
| Descuentos automáticos | ✅ | ✅ | ✅ |
| Crédito con validación en POS | ✅ | ⚠️ | ⚠️ |
| Modo offline | ❌ | ❌ | ❌ |
| App móvil para POS | ❌ | ✅ | ✅ |
| Propinas | ❌ | ✅ (GastroBar) | ✅ |
| POS para restaurantes (mesas, comandas) | ❌ | ✅ (GastroBar) | ❌ |
| Pago QR Nequi integrado | ❌ | ❌ | ✅ |
| Impresión tirilla | ✅ | ✅ | ✅ |
| **INVENTARIO** |  |  |  |
| Multi-bodegas | ✅ (sucursales) | ✅ | ✅ |
| Lotes y vencimientos | ✅ | ⚠️ | ⚠️ |
| Seriales | ✅ | ⚠️ | ❌ |
| Kardex | ✅ | ✅ | ✅ |
| Inventario físico/reconteo | ✅ | ✅ | ⚠️ |
| Mermas | ✅ | ⚠️ | ❌ |
| Traslados entre sucursales | ✅ | ✅ | ✅ |
| Alertas stock bajo | ✅ | ✅ | ✅ |
| Importación masiva desde Excel | ❌ | ✅ | ✅ (con IA) |
| **CARTERA / CRM** |  |  |  |
| Score crediticio | ✅ | ❌ | ❌ |
| Motor de reglas de crédito | ✅ (JSONB) | ⚠️ | ⚠️ |
| Gestión de cobros manual | ✅ | ✅ | ⚠️ |
| Agente de cobros automático (IA) | ❌ | ❌ | ✅ |
| Alertas de vencimiento | ✅ | ✅ | ✅ |
| Edades de cartera | ✅ | ✅ | ✅ |
| Estado de cuenta PDF | ✅ | ✅ | ✅ |
| Cobranza por WhatsApp | ❌ | ✅ | ✅ (IA) |
| **NÓMINA** |  |  |  |
| Liquidación básica | ✅ | ✅ | ✅ |
| Transmisión DIAN | ❌ | ✅ | ✅ |
| Novedades (extras, incapacidades) | ✅ | ✅ | ✅ |
| Prestaciones sociales complejas | ⚠️ | ✅ | ✅ |
| Archivos bancarios PILA | ❌ | ✅ | ⚠️ |
| Colillas electrónicas PDF | ❌ | ✅ | ✅ |
| **REPORTES E IA** |  |  |  |
| Reportes avanzados (ventas, clientes, productos) | ⚠️ Básico | ✅ | ✅ |
| Dashboard ejecutivo | ⚠️ Básico | ✅ | ✅ |
| Análisis por categoría / período | ❌ | ✅ | ✅ |
| Proyecciones / predicciones | ❌ | ❌ | ✅ (IA) |
| Exógena automática | ❌ | ✅ | ✅ |
| Inteligencia Artificial | ❌ | ⚠️ Básico | ✅ 20+ features (GPT-5) |
| Resumen inteligente con IA | ❌ | ❌ | ✅ |
| **INTEGRACIONES** |  |  |  |
| E-commerce (Shopify/WooCommerce) | ❌ | ⚠️ Via terceros | ✅ Nativo |
| MercadoLibre | ❌ | ❌ | ✅ |
| Pasarelas de pago (PayU, Wompi) | ❌ | ✅ Siigo Pay | ✅ |
| Zapier | ❌ | ✅ | ✅ |
| API REST propia | ✅ | ✅ | ✅ |
| Tienda online propia | ❌ | ❌ | ✅ (Alegra Tienda) |
| **SEGURIDAD** |  |  |  |
| Autenticación JWT | ✅ | ✅ | ✅ |
| 2FA / MFA | ❌ | ✅ | ✅ |
| Rate limiting | ❌ | ✅ | ✅ |
| Auditoría de cambios | ❌ | ✅ | ✅ |
| Alertas de seguridad (actividades inusuales) | ❌ | ⚠️ | ✅ |
| Certificaciones ISO | ❌ | ⚠️ | ✅ ISO 27001, 9001 |
| **EXPERIENCIA** |  |  |  |
| App móvil | ❌ | ✅ | ✅ |
| PWA (Progressive Web App) | ❌ | ⚠️ | ⚠️ |
| Acceso contador gratis | ❌ | ✅ (Siigo Contador) | ✅ (todos los planes) |
| Multi-empresa desde 1 cuenta | ✅ (plataforma) | ✅ | ✅ |
| Prueba gratuita | ⚠️ | ⚠️ | ✅ 15 días |

---

## 3. BRECHAS CRÍTICAS REGULATORIAS DIAN 2025

Estas son **obligaciones legales en Colombia**. No implementarlas representa riesgo de sanciones para los clientes.

### 🔴 CRÍTICO — Sin implementar

#### 3.1 Documento Equivalente Electrónico (Tiquete POS)
- **Qué es:** Reemplaza el tiquete POS tradicional en papel. La DIAN exige que los sistemas POS emitan documentos equivalentes electrónicos firmados digitalmente.
- **Estado AURA:** El POS actual emite una tirilla de impresión local, **NO un documento equivalente electrónico validado por DIAN**.
- **Impacto:** Los comerciantes que usen AURA POS podrían incurrir en sanciones.
- **Acción requerida:** Integrar con Factus (ya existe) la generación del documento equivalente electrónico desde el POS, con firma digital, QR y transmisión previa a DIAN.

#### 3.2 Documento de Soporte de Compras (No Obligados)
- **Qué es:** Cuando un negocio compra a personas naturales no obligadas a facturar (ej. agricultores, artesanos), debe emitir un Documento Soporte Electrónico hacia DIAN.
- **Estado AURA:** El módulo de compras NO genera Documento Soporte.
- **Impacto:** Clientes que compren a proveedores no facturadores no pueden respaldar costos ante DIAN.
- **Acción requerida:** Agregar tipo de compra "no obligado", integrar con Factus para generar el XML correspondiente.

#### 3.3 Nómina Electrónica (Transmisión DIAN)
- **Qué es:** Toda empresa con empleados debe transmitir los soportes de pago de nómina a la DIAN dentro de los 10 primeros días del mes siguiente.
- **Estado AURA:** Nómina se puede liquidar internamente, pero **NO hay transmisión a la DIAN**.
- **Impacto:** Clientes con empleados no pueden cumplir obligación legal.
- **Acción requerida:** Generar XML de nómina electrónica en formato DIAN y transmitir via Factus.

#### 3.4 Notas Crédito y Débito Electrónicas
- **Qué es:** Las devoluciones, descuentos y ajustes sobre facturas electrónicas deben hacerse mediante Notas Crédito o Débito electrónicas con validación DIAN.
- **Estado AURA:** Existe la estructura en código (`notas/`) pero **no está integrada en el flujo de ventas** ni genera documentos DIAN válidos.
- **Impacto:** Los clientes no pueden procesar devoluciones legalmente.
- **Acción requerida:** Completar el módulo de devoluciones con generación de notas crédito electrónicas via Factus.

#### 3.5 Resolución 000202 — Marzo 2025
- **Cambio:** Desde abril 2025, solo se requieren 3 datos del comprador (tipo doc, número, nombre). Desde mayo 2025, facturas solo en COP con suplemento especial para moneda extranjera.
- **Estado AURA:** No verificado si la integración con Factus ya maneja esto.
- **Acción requerida:** Verificar y actualizar payloads enviados a Factus según nueva resolución.

---

## 4. BRECHAS FUNCIONALES POR MÓDULO

### 🔴 PRIORIDAD ALTA

#### 4.1 Módulo de Contabilidad ✅ IMPLEMENTADO
Siigo y Alegra basan su propuesta de valor en contabilidad integrada. AURA ahora tiene un módulo contable completo con 4 vistas.

**Funcionalidades implementadas:**
- [x] Plan de cuentas (PUC colombiano preconfigurado — 9 clases + subcuentas comunes)
- [x] Código DIAN nullable en plan_cuenta (preparación homologación fiscal)
- [x] Numero de comprobante en asientos (CD-000001, VT-000001, CO-000001 — auditoría colombiana)
- [x] Asientos contables manuales con partida doble y validación de cuadre
- [x] Balance General (basado en asientos CONTABILIZADOS)
- [x] Asientos automáticos desde ventas (VT) y compras (CO) — idempotentes
- [x] Estado de Resultados (P&G) detallado con márgenes bruto y neto
- [x] Libro Mayor por cuenta con saldo acumulado (ventana deslizante SQL)
- [x] Flujo de Caja: movimientos reales de tesorería + proyección CxC/CxP
- [ ] Manejo de retenciones en la fuente (retefuente, reteIVA, reteICA)
- [ ] Centros de costos
- [ ] Cumplimiento NIIF (diferidos, leasing)
- [ ] Información Exógena DIAN (Formato 1001, 1007, 2276, etc.)

#### 4.2 Módulo de Devoluciones ✅ IMPLEMENTADO
- [x] Devolución parcial o total de una venta
- [ ] Generación automática de Nota Crédito Electrónica (DIAN)
- [x] Reintegro a inventario
- [x] Registro de motivo de devolución
- [ ] Afectación de cartera (si fue a crédito)
- [ ] Devolución de dinero (método de pago original o crédito)

#### 4.3 Reportes Avanzados ✅ IMPLEMENTADO
La oferta actual (solo 2 reportes: ventas e inventario en Excel/PDF) es muy inferior a la competencia.

**Reportes implementados:**
- [x] Ventas por categoría / marca / vendedor / período
- [x] Margen bruto por producto / categoría
- [x] Productos más vendidos (configurable top N)
- [x] Análisis de rentabilidad (márgenes por producto)
- [ ] Proyección de ventas (histórico + tendencia)
- [x] Rotación de inventario
- [ ] Reporte de vencimientos de lotes (próximos 30/60/90 días)
- [ ] Reporte de cartera por antigüedad (aging detallado)
- [ ] Reporte de comisiones por vendedor/técnico
- [ ] Reporte de compras por proveedor
- [x] Dashboard ejecutivo con KPIs (resumen ejecutivo + variación vs período anterior)

#### 4.4 Conciliación Bancaria ✅ IMPLEMENTADO
- [x] Importación de extractos bancarios (CSV)
- [x] Matching automático de movimientos (por monto ±1 peso y fecha ±3 días)
- [x] Diferencias pendientes de conciliar
- [x] Conciliación en lote (individual o por auto-match)

### 🟡 PRIORIDAD MEDIA

#### 4.5 Módulo de Nómina (Completar)
- [ ] Transmisión electrónica a DIAN
- [ ] Colillas de pago en PDF (para enviar a empleados)
- [ ] Cálculo automático de prestaciones sociales (prima, cesantías, vacaciones, intereses cesantías)
- [ ] Libro de vacaciones (causadas, disfrutadas, pendientes)
- [ ] Archivos planos bancarios (PILA y dispersión de nómina)
- [ ] Aportes sociales (ARL, EPS, AFP, Caja de compensación)
- [ ] Contabilización automática de nómina

#### 4.6 Mejoras en Tesorería
- [ ] Proyecciones de flujo de caja (ingresos esperados vs egresos)
- [ ] Presupuesto vs real
- [ ] Caja menor / fondos fijos
- [ ] Gestión de cheques (recibidos / girados)
- [ ] Cruce automático de CxC/CxP con movimientos bancarios

#### 4.7 Pedidos Online / E-commerce
- [ ] Integración con WooCommerce
- [ ] Integración con Shopify
- [ ] Integración con MercadoLibre
- [ ] Sincronización de inventario en tiempo real
- [ ] Descarga automática de pedidos como ventas en AURA

#### 4.8 Módulo de Cotizaciones (Completar)
- [ ] Conversión cotización → venta con 1 clic
- [ ] Conversión cotización → orden de compra
- [ ] Seguimiento de estado (enviada, vista, aceptada, rechazada)
- [ ] Fecha de vencimiento automática
- [ ] Envío por email desde la plataforma
- [ ] Plantilla personalizable con logo de empresa

#### 4.9 Importación Masiva
- [ ] Importar productos desde Excel (con validación y preview)
- [ ] Importar terceros (clientes/proveedores) desde Excel
- [ ] Importar precios desde Excel
- [ ] Importar saldos iniciales de inventario
- [ ] Plantillas de importación descargables

### 🟢 PRIORIDAD BAJA

#### 4.10 POS para Sector Gastronómico (Vertical)
- [ ] Vista de mesas con estado en tiempo real
- [ ] Asignación de mesas a meseros
- [ ] Comandas digitales (envío a cocina/barra)
- [ ] Pre-cuenta por mesa
- [ ] Propinas (cálculo y distribución)
- [ ] Combos y recetas (descuento automático de ingredientes)
- [ ] Zonas de impresión (cocina, barra, caja)

#### 4.11 Módulo de Proyectos / Servicios
- [ ] Órdenes de servicio (para talleres, técnicos, servicios)
- [ ] Estado de orden (recibida, en proceso, lista, entregada)
- [ ] Asignación a técnico
- [ ] Repuestos consumidos de inventario
- [ ] Tiempo trabajado
- [ ] Facturación desde orden de servicio

#### 4.12 CRM Básico
- [ ] Pipeline de ventas (prospectos → clientes)
- [ ] Actividades (llamadas, visitas, emails)
- [ ] Historial de interacciones por cliente
- [ ] Segmentación de clientes (ABC, zona, canal)
- [ ] Campañas de email/WhatsApp desde la plataforma

---

## 5. BRECHAS TÉCNICAS Y DE ARQUITECTURA

### 5.1 Seguridad

| Brecha | Impacto | Acción |
|--------|---------|--------|
| **Sin 2FA/MFA** | Cuentas vulnerables a robo de credenciales | Implementar TOTP (Google Authenticator) o SMS OTP |
| **Sin rate limiting** | Vulnerable a brute force en /auth/login | Agregar rate limiting (Spring @RateLimiter o filtro custom) |
| **Sin auditoría de cambios** | No se sabe quién modificó qué | Implementar `@EntityListeners(AuditingEntityListener.class)` con createdBy/modifiedBy |
| **JWT 3 días** | Token muy longevo si es comprometido | Reducir a 24h + refresh token |
| **Secret hardcodeado en properties** | En repositorio público = compromiso total | Mover a variables de entorno o secrets manager |

### 5.2 Performance

| Brecha | Impacto | Acción |
|--------|---------|--------|
| **POS component 48KB** | Tiempo de carga lento, difícil de mantener | Dividir en: `PosGridComponent`, `PosCartComponent`, `PosPagoComponent` |
| **Dashboard carga todo al inicio** | Pantalla lenta en primera visita | Lazy load por widget con skeleton loading |
| **Sin caché en API** | Consultas repetitivas al DB | Agregar `@Cacheable` en endpoints de catálogo y precios |
| **Sin CDN para assets** | Imágenes de productos lentas | Servir desde Cloudflare R2 con CDN activado |
| **Sin índices específicos** | Queries lentos en tablas grandes | Revisar índices en venta, inventario, kardex |

### 5.3 Disponibilidad y Offline

| Brecha | Impacto | Acción |
|--------|---------|--------|
| **Sin modo offline** | Si cae internet, el POS no funciona | Implementar Service Worker + IndexDB para ventas offline |
| **Sin PWA** | No instalable en tablets/celulares | Agregar manifest.json + service worker |
| **Sin app móvil** | Vendedores de campo sin herramienta | PWA como primer paso, app nativa luego |

### 5.4 Observabilidad

| Brecha | Impacto | Acción |
|--------|---------|--------|
| **Error handling inconsistente** | console.error sin captura global | Interceptor HTTP global + Error Boundary Angular |
| **Sin logs estructurados** | Difícil debuggear en producción | Agregar Logback con JSON logging + ELK/Loki |
| **Sin métricas de negocio** | No se sabe si el sistema está sano | Spring Actuator + Micrometer + Grafana |
| **TODOs pendientes** | Bugs conocidos sin resolver | Resolver TODOs en `VentaServiceImpl` (consecutivos, zona horaria) |

### 5.5 Testing

| Brecha | Impacto | Acción |
|--------|---------|--------|
| **Sin tests unitarios frontend** | Regresiones silenciosas | Jest + Angular Testing Library para componentes críticos |
| **Sin tests de integración backend** | Bugs en flujos complejos | Spring Boot Test + Testcontainers para PostgreSQL |
| **Sin tests E2E** | Flujo de venta sin validar end-to-end | Cypress o Playwright para flujo POS → factura |

### 5.6 DevOps

| Brecha | Impacto | Acción |
|--------|---------|--------|
| **Sin CI/CD documentado** | Deploys manuales riesgosos | GitHub Actions: build + test + deploy automático |
| **Sin staging environment** | Tests directos en producción | Ambiente staging con datos de prueba |
| **Sin backup automático** | Riesgo de pérdida de datos | Backup diario automático PostgreSQL → R2 |

---

## 6. OPORTUNIDADES DIFERENCIADORAS

AURA POS tiene características únicas que **Siigo y Alegra NO tienen** o tienen de forma más básica. Estas son ventajas competitivas a destacar y potenciar.

### 6.1 ✅ Ya Implementados (Diferenciar en Marketing)

| Diferenciador | Descripción | Por qué es valioso |
|--------------|-------------|-------------------|
| **Múltiples órdenes simultáneas en POS** | Hasta 5 tabs/órdenes al mismo tiempo | Ideal para restaurantes, ferreterías, tiendas con múltiples vendedores en 1 caja |
| **Score crediticio de clientes** | Motor de reglas JSONB, historial, scoring automático | Único en el segmento PyME. Siigo y Alegra tienen cartera básica, no scoring |
| **Lotes y seriales integrados** | Gestión completa de lotes con vencimiento y seriales en POS | Sector farmacéutico, electrónica, alimentos |
| **Comisiones para técnicos/vendedores** | Configuración granular por producto + liquidaciones | Talleres, distribuidoras con fuerza de ventas |
| **Multi-empresa SaaS** | Plataforma para gestionar múltiples empresas | Base para franquicias, contadores con varios clientes |
| **Pedidos de vendedor de campo** | Tomar pedidos sin cerrar la venta | Distribuidoras, preventas |
| **Reglas de descuento automáticas** | Motor potente de 20+ métodos de precio dinámico | Mayoristas, distribuidoras con precios por volumen/cliente |

### 6.2 🚀 Por Implementar (Nuevos Diferenciadores)

| Idea | Descripción | Impacto |
|------|-------------|---------|
| **IA para cobros** | Agente IA que envía recordatorios automáticos por WhatsApp a clientes morosos | Alegra lo tiene, pero AURA ya tiene el módulo de cartera. Combinar es natural |
| **WhatsApp Business integration** | Enviar facturas, cotizaciones, estados de cuenta por WhatsApp desde la plataforma | Todos los competidores lo están haciendo, es expectativa del mercado |
| **POS vertical para talleres/servicios** | Órdenes de servicio + repuestos + facturación integrada | Nicho desatendido por Siigo y Alegra |
| **POS para sector salud** | Campos MIPRES, autorización EPS, consultorios médicos | Alegra tiene algunas capacidades, Siigo no. AURA puede especializarse |
| **POS para restaurantes** | Mesas, comandas, cocina | Solo Siigo GastroBar tiene esto. Gran oportunidad |
| **Análisis predictivo de inventario** | IA para sugerir cuándo y cuánto recomprar | Ninguno lo tiene para PyMES |
| **Dashboard financiero con IA** | Resumen automático: "esta semana vendiste X, tu margen bajó Y%, te recomendamos..." | Alegra tiene análisis con IA pero en contabilidad, no en POS |
| **Integración con básculas** | Para productos pesables en tiempo real | Panaderías, plazas de mercado, fruterías |
| **Programa de fidelización** | Puntos, descuentos por recurrencia | Ninguno de los competidores tiene esto nativo |
| **Multi-moneda** | Ventas en USD/EUR con conversión automática | Para exportadores o zonas fronterizas |

---

## 7. ROADMAP DE IMPLEMENTACIÓN PRIORIZADO

### FASE 1 — Cumplimiento Legal y Estabilidad (1-2 meses)
*Sin esto, el sistema tiene riesgo legal para los clientes*

| # | Tarea | Módulo | Esfuerzo |
|---|-------|--------|---------|
| 1 | Documento Equivalente Electrónico (tiquete POS) via Factus | POS + Backend | Alto |
| 2 | Nota Crédito Electrónica (devoluciones) + módulo frontend | Ventas + Backend | Alto |
| 3 | Nota Débito Electrónica | Ventas + Backend | Medio |
| 4 | Documento Soporte Electrónico en compras a no obligados | Compras + Backend | Medio |
| 5 | Implementar `forgot-password` endpoint (incompleto) | Auth Backend | Bajo |
| 6 | Resolver TODOs de consecutivos y zona horaria | Backend | Bajo |
| 7 | Verificar compliance Resolución 000202 (abril-mayo 2025) | Backend | Bajo |

### FASE 2 — Contabilidad Básica (2-4 meses)
*Sin esto, AURA no puede competir con Siigo/Alegra en clientes que necesiten contabilidad*

| # | Tarea | Módulo | Esfuerzo |
|---|-------|--------|---------|
| 8 | Plan de cuentas (PUC) — CRUD + preconfigurado | Contabilidad Backend | Alto |
| 9 | Asientos automáticos desde ventas (factura → asiento) | Contabilidad Backend | Alto |
| 10 | Asientos automáticos desde compras | Contabilidad Backend | Medio |
| 11 | Asientos automáticos desde nómina | Contabilidad Backend | Medio |
| 12 | Balance General + Estado de Resultados (frontend) | Contabilidad Frontend | Alto |
| 13 | Retenciones automáticas en ventas (retefuente, reteIVA, reteICA) | Ventas Backend | Medio |
| 14 | Módulo contabilidad en sidebar + rutas | Frontend | Bajo |

### FASE 3 — Reportes y Dashboard Avanzado (1-2 meses)
*Mejora la retención de clientes y el valor percibido*

| # | Tarea | Módulo | Esfuerzo |
|---|-------|--------|---------|
| 15 | Reporte ventas por categoría/vendedor/período (Excel+PDF) | Reportes Backend | Medio |
| 16 | Reporte de margen bruto por producto | Reportes Backend | Medio |
| 17 | Reporte de rotación de inventario | Reportes Backend | Bajo |
| 18 | Dashboard ejecutivo con KPIs configurables | Dashboard Frontend | Alto |
| 19 | Gráficos adicionales: comparativa meses, top clientes, margen | Dashboard Frontend | Medio |
| 20 | Reporte de cartera detallado con aging configurable | Cartera Frontend | Bajo |
| 21 | Reporte de comisiones por vendedor | Comisiones Frontend | Bajo |

### FASE 4 — Nómina Completa (1-2 meses)
*Cerrar brechas regulatorias de empleados*

| # | Tarea | Módulo | Esfuerzo |
|---|-------|--------|---------|
| 22 | Generación XML nómina electrónica DIAN + transmisión | Nómina Backend | Alto |
| 23 | Cálculo prestaciones sociales (prima, cesantías, vacaciones) | Nómina Backend | Alto |
| 24 | Colillas de pago PDF para empleados | Nómina Backend | Medio |
| 25 | Aportes sociales (ARL, EPS, AFP, caja compensación) | Nómina Backend | Alto |
| 26 | Archivos planos bancarios (PILA) | Nómina Backend | Medio |
| 27 | UI mejorada de nómina con novedades completas | Nómina Frontend | Medio |

### FASE 5 — Seguridad y UX (1 mes)
*Necesario para escalar clientes empresariales*

| # | Tarea | Módulo | Esfuerzo |
|---|-------|--------|---------|
| 28 | 2FA / MFA (TOTP) | Auth Backend + Frontend | Medio |
| 29 | Rate limiting en endpoints de login | Auth Backend | Bajo |
| 30 | Auditoría de cambios (quién hizo qué, cuándo) | Backend Global | Medio |
| 31 | JWT refresh token (reducir a 24h + refresh) | Auth Backend | Bajo |
| 32 | Secretos a variables de entorno (no en .properties) | DevOps | Bajo |
| 33 | PWA (manifest.json + service worker básico) | Frontend | Medio |

### FASE 6 — Diferenciación e Integraciones (2-3 meses)
*Para crecer en cuota de mercado*

| # | Tarea | Módulo | Esfuerzo |
|---|-------|--------|---------|
| 34 | WhatsApp Business API: envío de facturas/cotizaciones | Integraciones Backend | Alto |
| 35 | Agente de cobros automático por WhatsApp (recordatorios) | Cartera Backend + IA | Alto |
| 36 | Importación masiva desde Excel (productos, terceros, precios) | Admin Frontend+Backend | Medio |
| 37 | Integración WooCommerce / Shopify (webhook) | Integraciones Backend | Alto |
| 38 | Integración pasarela de pago (Wompi/Nequi QR) | POS Frontend+Backend | Alto |
| 39 | Conciliación bancaria (importar extractos CSV/OFX) | Tesorería | Alto |
| 40 | Información Exógena DIAN (reportes fiscales) | Contabilidad Backend | Alto |

### FASE 7 — Verticales de Industria (3-6 meses)

| # | Tarea | Módulo | Esfuerzo |
|---|-------|--------|---------|
| 41 | POS Gastronómico: mesas, comandas, cocina | POS Vertical | Muy Alto |
| 42 | Módulo de Órdenes de Servicio (talleres) | Servicios | Alto |
| 43 | Sector salud: MIPRES, autorización EPS | Salud Vertical | Alto |
| 44 | Programa de fidelización (puntos, descuentos) | POS Frontend+Backend | Medio |
| 45 | App móvil (React Native o capacitor) | Mobile | Muy Alto |

---

## 8. MODELO DE PRECIOS SUGERIDO

Basado en benchmarking de Siigo y Alegra para el mercado colombiano:

### Planes Recomendados para AURA POS

| Plan | Precio/mes | Target | Features |
|------|-----------|--------|---------|
| **Emprendedor** | $39.900 | 1 caja, hasta $15M ingresos/mes | POS + Inventario básico + Facturación electrónica + 1 usuario |
| **PyME** | $89.900 | Hasta 3 cajas, hasta $50M ingresos/mes | Todo + Compras + Cartera + Reportes básicos + 3 usuarios |
| **Pro** | $159.900 | Hasta 5 cajas, hasta $200M ingresos/mes | Todo + Contabilidad + Nómina + Reportes avanzados + 5 usuarios |
| **Enterprise** | $299.900+ | Ilimitado, multi-sucursal | Todo + API + Integraciones + Soporte prioritario |

**Módulos adicionales (a la carta):**
- Nómina: $39.900/mes (adicional)
- E-commerce Integration Pack: $29.900/mes
- POS GastroBar vertical: $49.900/mes adicional
- IA Analytics Pack: $29.900/mes

---

## 9. RESUMEN EJECUTIVO

### AURA POS — Posición Competitiva Actual

```
FORTALEZAS ✅                          DEBILIDADES ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• POS más potente que Alegra/Siigo     • Sin contabilidad real
  (multi-tab, multi-pago)             • Sin transmisión nómina DIAN
• Score crediticio único en PyME      • Sin documento equivalente POS
• Inventario con lotes/seriales       • Sin notas crédito electrónicas
• Comisiones técnicos integradas      • Sin conciliación bancaria
• Motor de precios dinámico (20+)     • Reportes muy básicos
• Multi-empresa nativo                • Sin 2FA / auditoría de cambios
• Arquitectura moderna (Angular 18)   • Sin app móvil
• Integración Factus (DIAN)           • Sin integraciones e-commerce
• Cartera avanzada con scoring        • Sin IA features
```

### Brecha Principal con Competidores

**vs Siigo:** AURA carece de contabilidad completa (PUC, estados financieros, NIIF) y nómina electrónica completa. Siigo tiene 35 años de profundidad contable que AURA necesita desarrollar.

**vs Alegra:** AURA no tiene IA (Alegra tiene 20+ features con GPT-5), ni integraciones e-commerce nativas, ni tienda online. La experiencia de usuario de Alegra es más pulida.

**Oportunidad:** AURA supera a ambos en POS (multi-órdenes), scoring de cartera, y gestión de inventario avanzada. Estos son diferenciadores reales que se deben comunicar y ampliar.

### Top 10 Prioridades de Implementación

1. 🔴 **Documento Equivalente Electrónico** (tiquete POS → DIAN) — Legal obligatorio
2. 🔴 **Notas Crédito Electrónicas** (devoluciones) — Legal obligatorio
3. 🔴 **Documento Soporte Compras** — Legal obligatorio
4. 🔴 **Módulo Contabilidad** (PUC + estados financieros) — Competir con Siigo/Alegra
5. 🔴 **Nómina Electrónica** (transmisión DIAN) — Legal obligatorio
6. 🟡 **Reportes Avanzados** — Retención de clientes
7. 🟡 **WhatsApp Business** (facturas + cobros) — Expectativa del mercado
8. 🟡 **2FA + Auditoría** — Seguridad empresarial
9. 🟡 **Importación masiva** (productos/terceros Excel) — Adopción inicial
10. 🟡 **Conciliación bancaria** — Valor contable

### Estimación de Esfuerzo Total

| Fase | Duración Estimada | Prioridad |
|------|-----------------|---------|
| Fase 1: Cumplimiento DIAN | 4-6 semanas | URGENTE |
| Fase 2: Contabilidad básica | 8-12 semanas | Alta |
| Fase 3: Reportes avanzados | 4-6 semanas | Alta |
| Fase 4: Nómina completa | 6-8 semanas | Alta |
| Fase 5: Seguridad/UX | 3-4 semanas | Media |
| Fase 6: Integraciones/IA | 8-12 semanas | Media |
| Fase 7: Verticales | 12-20 semanas | Baja |

**Total para alcanzar paridad competitiva con Alegra:** ~6-8 meses de desarrollo
**Total para superar a Alegra en POS:** ~4-6 meses (enfocado en fases 1-5)

---

*Documento generado: 2026-03-30*
*Versión: 1.0*
*Basado en: análisis del código fuente de aura-frontend y aura-back-old, y benchmarking público de Siigo.com y Alegra.com (marzo 2025)*
