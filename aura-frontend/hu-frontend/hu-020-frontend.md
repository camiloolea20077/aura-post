# HU-020 - Listado de Empleados por Tipo (Frontend)

## 📌 Información General
- ID: HU-020-FRONTEND
- HU Original: HU-020 (EP-005)
- Estado: ✅ Implementada
- Fecha: 2026-03-27

---

## 🎯 Objetivo

Permitir filtrar y listar empleados según su tipo de empleado desde la interfaz existente de empleados.

---

## 📱 Componente Angular

### Ruta
- Path: `/nomina/empleados` (módulo existente)
- Componente: `IndexEmpleadoComponent` (modificar)
- Filtro adicional: Dropdown de tipos de empleado

### Servicio Existente
- `EmpleadoService` (ya existente)

### Nuevo Endpoint Consumido
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tipos-empleado` | Listar tipos para el dropdown |

### Endpoint Existente a Consumir
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/empleados/page` | Listar empleados (ya existe) |

---

## 📦 Payload Examples

### GET /api/tipos-empleado (Dropdown)
```json
{
  "status": 200,
  "message": "Tipos de empleado obtenidos",
  "error": false,
  "data": [
    { "id": 1, "nombre": "VENDEDOR" },
    { "id": 2, "nombre": "CAJERO" },
    { "id": 3, "nombre": "GERENTE" }
  ]
}
```

### POST /api/empleados/page (Request con filtro)
```json
{
  "page": 0,
  "rows": 10,
  "search": "",
  "order_by": "nombres",
  "order": "asc",
  "params": {
    "tipoEmpleadoId": 1
  }
}
```

---

## 🎨 UI/UX Requirements

### Modificaciones en Index de Empleados

#### Filtro: Tipo de Empleado
- **Componente**: PrimeNG Dropdown
- **Ubicación**: Encima de la tabla, junto a otros filtros
- **Placeholder**: "Todos los tipos"
- **Opciones**: Lista de tipos activos
- ** behavior**: Al seleccionar, recargar tabla con filtro

#### Tabla Existente
- Agregar columna "Tipo" mostrando el tipo de empleado
- Existing columns: ID, Nombres, Apellidos, Cargo, Estado

---

## 🔄 Flujo de Datos

### 1. Cargar filtro de tipos
```
IndexEmpleado (ngOnInit) 
  → TipoEmpleadoService.getAll()
  → dropdown.options = data
```

### 2. Aplicar filtro
```
Dropdown (onChange)
  → pageable.params.tipoEmpleadoId = selectedId
  → EmpleadoService.page(pageable)
  → Actualizar tabla
```

---

## 📋 Modelo TypeScript

```typescript
// Filtro para empleados
interface EmpleadoFilter {
  tipoEmpleadoId?: number;
}

// Response de empleado con tipo
interface EmpleadoTableDto {
  id: number;
  nombres: string;
  apellidos: string;
  tipoEmpleado?: string;
  activo: boolean;
}
```

---

## ⚠️ Consideraciones

1. **Filtro opcional**: Por defecto mostrar todos ("Todos los tipos")
2. **Combinación**: Compatible con filtros existentes (search, activo)
3. **Limpiar**: Botón para limpiar filtros