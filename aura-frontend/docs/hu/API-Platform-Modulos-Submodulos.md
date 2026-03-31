# API de Gestión de Módulos y Submódulos

## Endpoints de Módulos (HU-027)

### Listar todos los módulos
```http
GET /api/platform/modulos
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": 200,
  "message": "Módulos obtenidos",
  "error": false,
  "data": [
    {
      "id": 1,
      "nombre": "Catálogo",
      "codigo": "catalogo",
      "descripcion": "Gestión de productos, categorías y marcas",
      "orden": 1,
      "activo": true,
      "createdAt": "2026-01-01T10:00:00"
    }
  ]
}
```

### Obtener módulo por ID
```http
GET /api/platform/modulos/{id}
Authorization: Bearer {token}
```

### Crear módulo
```http
POST /api/platform/modulos
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Nuevo Módulo",
  "codigo": "nuevo-modulo",
  "descripcion": "Descripción del módulo",
  "orden": 11,
  "activo": true
}
```

### Actualizar módulo
```http
PUT /api/platform/modulos/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Módulo Actualizado",
  "descripcion": "Nueva descripción",
  "orden": 5,
  "activo": true
}
```

### Eliminar módulo
```http
DELETE /api/platform/modulos/{id}
Authorization: Bearer {token}
```

---

## Endpoints de Submódulos (HU-028)

### Listar todos los submódulos
```http
GET /api/platform/submodulos
Authorization: Bearer {token}
```

### Listar submódulos por módulo
```http
GET /api/platform/submodulos/modulo/{moduloId}
Authorization: Bearer {token}
```

### Obtener submódulo por ID
```http
GET /api/platform/submodulos/{id}
Authorization: Bearer {token}
```

### Crear submódulo
```http
POST /api/platform/submodulos
Authorization: Bearer {token}
Content-Type: application/json

{
  "moduloId": 1,
  "nombre": "Nuevo Submódulo",
  "codigo": "nuevo-submodulo",
  "descripcion": "Descripción del submódulo",
  "orden": 8,
  "activo": true
}
```

### Actualizar submódulo
```http
PUT /api/platform/submodulos/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Submódulo Actualizado",
  "descripcion": "Nueva descripción",
  "orden": 3,
  "activo": true
}
```

### Eliminar submódulo
```http
DELETE /api/platform/submodulos/{id}
Authorization: Bearer {token}
```

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - No autorizado |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## Validaciones

### Crear Módulo (CreateModuloDto)
| Campo | Tipo | Requerido | Validaciones |
|-------|------|-----------|--------------|
| nombre | String | Sí | max 100 caracteres |
| codigo | String | Sí | unique, max 50 caracteres, solo minúsculas y guiones |
| descripcion | String | No | max 500 caracteres |
| orden | Integer | No | default 0 |
| activo | Boolean | No | default true |

### Actualizar Módulo (UpdateModuloDto)
| Campo | Tipo | Requerido | Validaciones |
|-------|------|-----------|--------------|
| nombre | String | No | max 100 caracteres |
| descripcion | String | No | max 500 caracteres |
| orden | Integer | No | default 0 |
| activo | Boolean | No | default true |

### Crear Submódulo (CreateSubmoduloDto)
| Campo | Tipo | Requerido | Validaciones |
|-------|------|-----------|--------------|
| moduloId | Integer | Sí | debe existir |
| nombre | String | Sí | max 100 caracteres |
| codigo | String | Sí | unique dentro del módulo, max 50 caracteres |
| descripcion | String | No | max 500 caracteres |
| orden | Integer | No | default 0 |
| activo | Boolean | No | default true |

### Actualizar Submódulo (UpdateSubmoduloDto)
| Campo | Tipo | Requerido | Validaciones |
|-------|------|-----------|--------------|
| nombre | String | No | max 100 caracteres |
| descripcion | String | No | max 500 caracteres |
| orden | Integer | No | default 0 |
| activo | Boolean | No | default true |

---

## Notas

- Todos los endpoints requieren token JWT con rol PLATFORM_ADMIN
- Al eliminar un módulo, se eliminan en cascada sus submódulos
- No se puede crear dos módulos con el mismo código
- No se puede crear dos submódulos con el mismo código dentro del mismo módulo
