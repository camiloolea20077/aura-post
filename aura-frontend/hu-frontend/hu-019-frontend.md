# HU-019 - Asociación de Tipo de Empleado a Empleados (Frontend)

## 📌 Información General
- ID: HU-019-FRONTEND
- HU Original: HU-019 (EP-005)
- Estado: ✅ Implementada
- Fecha: 2026-03-27

---

## 🎯 Objetivo

Permitir seleccionar un tipo de empleado al crear o editar un empleado desde el formulario existente.

---

## 📱 Integración en Formulario de Empleados

### Ubicación
- Formulario existente: `FormEmpleadoComponent`
- Agregar dropdown de tipos de empleado

### Servicio Existente a Modificar
- `EmpleadoService` (ya existente)

### Nuevo Endpoint Consumido
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tipos-empleado` | Listar tipos de empleado activos |

---

## 📦 Payload Examples

### GET /api/tipos-empleado (Dropdown)
```json
{
  "status": 200,
  "message": "Tipos de empleado obtenidos",
  "error": false,
  "data": [
    { "id": 1, "nombre": "VENDEDOR", "descripcion": "..." },
    { "id": 2, "nombre": "CAJERO", "descripcion": "..." },
    { "id": 3, "nombre": "GERENTE", "descripcion": "..." },
    { "id": 4, "nombre": "ADMINISTRADOR", "descripcion": "..." },
    { "id": 5, "nombre": "OFICIOS", "descripcion": "..." }
  ]
}
```

---

## 🎨 UI/UX Requirements

### Formulario de Empleado (Modificaciones)

#### Nuevo Campo: Tipo de Empleado
- **Componente**: PrimeNG Dropdown
- **Label**: "Tipo de Empleado"
- **Placeholder**: "Seleccione un tipo"
- **Opciones**: Lista de tipos de empleado activos
- **Requerido**: ✅ Sí (obligatorio)
- **Filtro**: ✅ Habilitar filtro de búsqueda

#### Validaciones
- Si no hay tipos disponibles: Mostrar mensaje "No hay tipos de empleado configurados"
- Al guardar sin seleccionar: Error "El tipo de empleado es requerido"

---

## 🔄 Flujo de Integración

### 1. Cargar tipos al iniciar formulario
```
FormEmpleado (ngOnInit) 
  → EmpleadoService.getTiposEmpleado()
  → Cargar en dropdown.options
```

### 2. Guardar con tipo seleccionado
```
FormEmpleado (save) 
  → Validar tipo_empleado_id
  → Incluir en CreateEmpleadoDto.tipoEmpleadoId
  → HTTP POST /api/empleados/create
```

---

## 📋 Modelo TypeScript

```typescript
// En el DTO de empleado existente
interface CreateEmpleadoDto {
  // ... campos existentes
  tipoEmpleadoId?: number;  // NUEVO
}

// En el servicio
interface TipoEmpleado {
  id: number;
  nombre: string;
  descripcion?: string;
}
```

---

## ⚠️ Consideraciones

1. **Carga de tipos**: Cargar solo activos (`/api/tipos-empleado` ya filtra activos)
2. **Valor por defecto**: No mostrar valor seleccionado inicialmente
3. **Edición**: Al editar, setear el valor actual del empleado
4. **Compatibilidad**: El campo es opcional (nullable en BD) para mantener compatibilidad con empleados existentes