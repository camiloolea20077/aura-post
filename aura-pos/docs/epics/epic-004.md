# EP-004: Módulo de Cuentas por Cobrar y Cuentas por Pagar

## Descripción
Módulo para la gestión de cuentas por cobrar (clientes) y cuentas por pagar (proveedores), incluyendo el registro de abonos y cálculos de saldos pendientes.

## Criterios de Aceptación
- [ ] El usuario puede visualizar una lista paginada de cuentas por cobrar con filtros
- [ ] El usuario puede visualizar una lista paginada de cuentas por pagar con filtros
- [ ] El usuario puede crear cuentas por cobrar de forma manual (sin venta asociada)
- [ ] El usuario puede crear cuentas por pagar de forma manual (sin compra asociada)
- [ ] El usuario puede registrar abonos a cuentas por cobrar (entradas de caja)
- [ ] El usuario puede registrar abonos a cuentas por pagar (salidas de caja)
- [ ] El sistema calcula automáticamente: total deuda, total abonado y saldo pendiente
- [ ] El sistema actualiza el estado de la cuenta cuando se paga completamente
- [ ] Todas las consultas filtran por empresa_id del JWT
- [ ] Validaciones: no permitir abonos mayores al saldo pendiente

## Dependencias
- EP-001: Módulo de Empresa y Sucursales
- EP-002: Módulo de Terceros (Clientes y Proveedores)
- EP-003: Módulo de Ventas y Compras

## Módulos a Crear
```
src/main/java/com/cloud_technological/aura_pos/
├── controllers/
│   ├── cuentas_cobrar/
│   │   └── CuentasCobrarController.java
│   └── cuentas_pagar/
│       └── CuentasPagarController.java
├── dto/
│   ├── cuentas_cobrar/
│   │   ├── CuentaCobrarDto.java
│   │   ├── CuentaCobrarTableDto.java
│   │   ├── CreateCuentaCobrarDto.java
│   │   └── AbonoCobrarDto.java
│   └── cuentas_pagar/
│       ├── CuentaPagarDto.java
│       ├── CuentaPagarTableDto.java
│       ├── CreateCuentaPagarDto.java
│       └── AbonoPagarDto.java
├── entity/
│   ├── CuentaCobrarEntity.java
│   ├── CuentaPagarEntity.java
│   ├── AbonoCobrarEntity.java
│   └── AbonoPagarEntity.java
├── mappers/
│   ├── CuentaCobrarMapper.java
│   └── CuentaPagarMapper.java
├── repositories/
│   ├── cuentas_cobrar/
│   │   ├── CuentaCobrarJPARepository.java
│   │   └── CuentaCobrarQueryRepository.java
│   └── cuentas_pagar/
│       ├── CuentaPagarJPARepository.java
│       └── CuentaPagarQueryRepository.java
└── services/
    ├── CuentaCobrarService.java
    ├── CuentaCobrarServiceImpl.java
    ├── CuentaPagarService.java
    └── CuentaPagarServiceImpl.java
```
