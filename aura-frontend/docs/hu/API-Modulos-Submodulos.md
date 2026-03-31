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
      "activo": true
    }
  ]
}
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

## Endpoints de Permisos por Empresa (HU-029, HU-030)

### Obtener permisos de una empresa
```http
GET /api/platform/empresas/{empresaId}/permisos
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": 200,
  "message": "Permisos obtenidos",
  "error": false,
  "data": {
    "empresaId": 1,
    "empresaNombre": "Empresa Demo",
    "empresaNit": "900123456",
    "modulos": [
      {
        "moduloId": 1,
        "moduloCodigo": "catalogo",
        "moduloNombre": "Catálogo",
        "activo": true,
        "submodulos": [
          {
            "submoduloId": 1,
            "submoduloCodigo": "productos",
            "submoduloNombre": "Productos",
            "activo": true
          }
        ]
      }
    ]
  }
}
```

### Actualizar permisos de una empresa
```http
PUT /api/platform/empresas/{empresaId}/permisos
Authorization: Bearer {token}
Content-Type: application/json

{
  "modulos": [
    {
      "moduloId": 1,
      "activo": true,
      "submodulos": [
        {
          "submoduloId": 1,
          "activo": true
        },
        {
          "submoduloId": 2,
          "activo": false
        }
      ]
    },
    {
      "moduloId": 2,
      "activo": false
    }
  ]
}
```

---

## Endpoints Públicos (HU-032)

### Obtener permisos por NIT (sin auth)
```http
GET /api/public/empresas/{nit}/permisos
```

### Obtener módulos por ID de empresa (sin auth)
```http
GET /api/public/empresas/{empresaId}/modulos
```

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 |OK - Solicitud exitosa |
| 201 |Created - Recurso creado |
| 400 |Bad Request - Datos inválidos |
| 401 |Unauthorized - No autenticado |
| 403 |Forbidden - No autorizado |
| 404 |Not Found - Recurso no encontrado |
| 500 |Internal Server Error - Error del servidor |

---

## Validaciones

### Módulo
- **nombre**: Required, max 100 caracteres
- **codigo**: Required, unique, max 50 caracteres, solo minúsculas y guiones
- **descripcion**: Optional, max 500 caracteres
- **orden**: Optional, default 0
- **activo**: Optional, default true

### Submódulo
- **moduloId**: Required
- **nombre**: Required, max 100 caracteres
- **codigo**: Required, unique dentro del módulo, max 50 caracteres
- **descripcion**: Optional, max 500 caracteres
- **orden**: Optional, default 0
- **activo**: Optional, default true

---

## Notas

- Todos los endpoints de `/api/platform/**` requieren token JWT con rol PLATFORM_ADMIN
- Los endpoints de `/api/public/**` son públicos (sin autenticación)
- Al eliminar un módulo, se eliminan en cascada sus submódulos
- No se puede crear dos módulos con el mismo código
- No se puede crear dos submódulos con el mismo código dentro del mismo módulo
