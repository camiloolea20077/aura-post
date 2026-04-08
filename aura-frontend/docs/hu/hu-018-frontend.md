# HU-018 - Gestión de Tipos de Empleado (Frontend)

## 📌 Información General
- ID: HU-018-FRONTEND
- HU Original: HU-018 (EP-005)
- Estado: ✅ Implementada
- Fecha: 2026-03-27

---

## 🎯 Objetivo

Permitir al usuario gestionar los tipos de empleado (Vendedor, Cajero, Gerente, Administrador, Oficios) desde una interfaz visual.

---

## 📱 Componente Angular

### Ruta
- Path: `/configuracion/tipos-empleado`
- Componente: `IndexTiposEmpleadoComponent`
- Módulo: `ConfiguracionModule`

### Estructura de Archivos
```
src/app/features/configuracion/
├── index-tipos-empleado/
│   ├── index-tipos-empleado.component.ts
│   ├── index-tipos-empleado.component.html
│   └── index-tipos-empleado.component.scss
├── form-tipo-empleado/
│   ├── form-tipo-empleado.component.ts
│   └── form-tipo-empleado.component.html
└── services/
    └── tipo-empleado.service.ts
```

---

## 🔗 Endpoints Consumidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tipos-empleado` | Listar todos los tipos de empleado |
| GET | `/api/tipos-empleado/{id}` | Obtener tipo por ID |
| POST | `/api/tipos-empleado` | Crear nuevo tipo |
| PUT | `/api/tipos-empleado/{id}` | Actualizar tipo |
| DELETE | `/api/tipos-empleado/{id}` | Eliminar tipo (soft delete) |

---

## 📊 Flujo de Datos

### 1. Listar Tipos de Empleado
```
Service → HTTP GET → /api/tipos-empleado
← Response (ApiResponse<List<TipoEmpleadoDto>>)
```

### 2. Crear Tipo de Empleado
```
Form → Service → HTTP POST → /api/tipos-empleado
Body: { nombre: string, descripcion?: string }
← Response (ApiResponse<TipoEmpleadoDto>)
```

### 3. Editar Tipo de Empleado
```
Form (prellenado) → Service → HTTP PUT → /api/tipos-empleado/{id}
Body: { nombre?: string, descripcion?: string }
← Response (ApiResponse<TipoEmpleadoDto>)
```

### 4. Eliminar Tipo de Empleado
```
Table → Confirm Dialog → Service → HTTP DELETE → /api/tipos-empleado/{id}
← Response (ApiResponse<void>)
```

---

## 📦 Payload Examples

### GET /api/tipos-empleado (Response)
```json
{
  "status": 200,
  "message": "Tipos de empleado obtenidos",
  "error": false,
  "data": [
    {
      "id": 1,
      "empresaId": 1,
      "nombre": "VENDEDOR",
      "descripcion": "Empleado encargado de vender productos",
      "activo": true
    },
    {
      "id": 2,
      "empresaId": 1,
      "nombre": "CAJERO",
      "descripcion": "Empleado de caja",
      "activo": true
    }
  ]
}
```

### POST /api/tipos-empleado (Request)
```json
{
  "nombre": "SUPERVISOR",
  "descripcion": "Encargado de supervisar vendedores"
}
```

### POST /api/tipos-empleado (Response)
```json
{
  "status": 200,
  "message": "Tipo de empleado creado",
  "error": false,
  "data": {
    "id": 6,
    "empresaId": 1,
    "nombre": "SUPERVISOR",
    "descripcion": "Encargado de supervisar vendedores",
    "activo": true
  }
}
```

### PUT /api/tipos-empleado/1 (Request)
```json
{
  "nombre": "VENDEDOR PREMIUM",
  "descripcion": "Vendedor con ventas altas"
}
```

### DELETE /api/tipos-empleado/1 (Response)
```json
{
  "status": 200,
  "message": "Tipo de empleado eliminado",
  "error": false,
  "data": null
}
```

---

## 🎨 UI/UX Requirements

### Index Component
- **Tabla**: Columnas [ID, Nombre, Descripción, Estado, Acciones]
- **Botones**: Nuevo tipo (icono plus), Refresh
- **Acciones por fila**: Editar (pencil), Eliminar (trash)
- **Buscar**: Input de búsqueda por nombre
- **Paginación**: PrimeNG Table con paginator

### Form Dialog
- **Tipo**: PrimeNG Dialog
- **Campos**:
  - Nombre (InputText, requerido)
  - Descripción (Textarea, opcional)
- **Botones**: Guardar, Cancelar
- **Validaciones**: Nombre obligatorio, nombre único

### Confirm Dialog
- **Título**: "¿Eliminar tipo de empleado?"
- **Mensaje**: "Esta acción no se puede deshacer. ¿Está seguro?"
- **Botones**: Confirmar, Cancelar

---

## 🔄 Casos de Uso

### happy path
1. Usuario accede a `/configuracion/tipos-empleado`
2. Sistema carga tabla con tipos de empleado
3. Usuario hace clic en "Nuevo Tipo"
4. Sistema muestra dialog con formulario vacío
5. Usuario ingresa nombre y descripción
6. Sistema valida y crea el tipo
7. Sistema muestra mensaje de éxito

### Validación de nombre único
1. Usuario intenta crear tipo con nombre existente
2. Sistema muestra error "Ya existe un tipo de empleado con este nombre"

### Validación de eliminación
1. Usuario intenta eliminar tipo con empleados asociados
2. Sistema muestra error "No se puede eliminar, existen empleados asociados a este tipo"

---

## 📋 Modelo TypeScript

```typescript
export interface TipoEmpleado {
  id: number;
  empresaId: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface CreateTipoEmpleado {
  nombre: string;
  descripcion?: string;
}

export interface UpdateTipoEmpleado {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
```

---

## ⚠️ Validaciones Frontend

- **Nombre**: Obligatorio, max 50 caracteres
- **Descripción**: Opcional, max 255 caracteres
- **Unique**: Validar nombre único antes de enviar (opcional)
- **Delete**: Mostrar diálogo de confirmación siempre