# HU-023 - Gestión de Rutas (Frontend)

## 📌 Información General
- ID: HU-023-FRONTEND
- HU Original: HU-023 (EP-005)
- Estado: ✅ Implementada
- Fecha: 2026-03-27

---

## 🎯 Objetivo

Permitir crear y gestionar rutas de visita con locales ordenados, incluyendo precarga de rutas anteriores.

---

## 📱 Componente Angular

### Ruta
- Path: `/ventas/rutas`
- Componente: `IndexRutasComponent`
- Módulo: `VentasModule`

### Estructura de Archivos
```
src/app/features/ventas/
├── rutas/
│   ├── index-rutas/
│   │   ├── index-rutas.component.ts
│   │   ├── index-rutas.component.html
│   │   └── index-rutas.component.scss
│   ├── form-ruta/
│   │   ├── form-ruta.component.ts
│   │   └── form-ruta.component.html
│   └── services/
│       └── ruta.service.ts
```

---

## 🔗 Endpoints Consumidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/rutas` | Listar rutas (paginado) |
| GET | `/api/rutas/{id}` | Obtener ruta por ID |
| POST | `/api/rutas` | Crear nueva ruta |
| PUT | `/api/rutas/{id}` | Actualizar ruta |
| DELETE | `/api/rutas/{id}` | Eliminar ruta |
| GET | `/api/locales?vendedorActualId={id}` | Listar locales por vendedor |

---

## 📦 Payload Examples

### GET /api/rutas?page=0&rows=10 (Response)
```json
{
  "status": 200,
  "message": "Rutas obtenidas",
  "error": false,
  "data": [
    {
      "id": 1,
      "nombre": "Ruta Norte",
      "vendedorNombre": "Juan Pérez",
      "cantidadLocales": 5,
      "activo": true,
      "totalRows": 10
    }
  ]
}
```

### POST /api/rutas (Request)
```json
{
  "vendedorId": 5,
  "nombre": "Ruta Centro",
  "descripcion": "Ruta por el centro de la ciudad",
  "locales": [
    { "localId": 1, "orden": 1 },
    { "localId": 3, "orden": 2 },
    { "localId": 5, "orden": 3 }
  ]
}
```

### GET /api/rutas/1 (Response)
```json
{
  "status": 200,
  "message": "Ruta obtenida",
  "error": false,
  "data": {
    "id": 1,
    "empresaId": 1,
    "vendedorId": 5,
    "vendedorNombre": "Juan Pérez",
    "nombre": "Ruta Norte",
    "descripcion": "Ruta por el norte",
    "activo": true
  }
}
```

---

## 🎨 UI/UX Requirements

### Index Component
- **Tabla**: Columnas [Nombre, Vendedor, # Locales, Estado, Acciones]
- **Botones**: Nueva ruta, Refresh
- **Filtros**: Por vendedor
- **Acciones**: Editar, Eliminar, Ver Detalles, Programar Visitas

### Form Dialog (Create/Edit)

#### Precarga de Ruta Anterior
- **Botón**: "Cargar Ruta Anterior" (icono copy)
- **Dropdown**: Lista de rutas existentes
- ** behavior**: Al seleccionar, cargar datos de esa ruta

#### Campos del Formulario
- Nombre (InputText, requerido)
- Descripción (Textarea, opcional)
- Vendedor (Dropdown, requerido)
- Locales (PickList o OrderList):
  - Source: Lista de locales disponibles
  - Target: Locales ordenados de la ruta
  - Drag & drop para reordenar

#### Botones de Acción
- Guardar, Cancelar

### Detalles de Ruta
- Mostrar mapa con pines de locales en orden
- Lista de locales con número de orden
- Botón: "Programar Visitas" → abre dialog para seleccionar fecha

---

## 📋 Modelo TypeScript

```typescript
export interface Ruta {
  id: number;
  empresaId: number;
  vendedorId: number;
  vendedorNombre: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface RutaTable {
  id: number;
  nombre: string;
  vendedorNombre: string;
  cantidadLocales: number;
  activo: boolean;
  totalRows: number;
}

export interface RutaLocal {
  localId: number;
  localNombre?: string;
  localDireccion?: string;
  orden: number;
}

export interface CreateRuta {
  vendedorId: number;
  nombre: string;
  descripcion?: string;
  locales: RutaLocal[];
}
```

---

## ⚠️ Validaciones

- **Nombre**: Obligatorio, único por empresa
- **Vendedor**: Obligatorio
- **Locales**: Mínimo 1, máximo 50
- **Orden**: Valores 1, 2, 3... sin duplicados