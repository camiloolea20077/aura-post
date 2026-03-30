# HU-021 - Gestión de Locales (Frontend)

## 📌 Información General
- ID: HU-021-FRONTEND
- HU Original: HU-021 (EP-005)
- Estado: ✅ Implementada
- Fecha: 2026-03-27

---

## 🎯 Objetivo

Permitir gestionar locales (puntos de venta de vendedores) con información de ubicación, imagen, horarios y preferencias de visita.

---

## 📱 Componente Angular

### Ruta
- Path: `/ventas/locales`
- Componente: `IndexLocalesComponent`
- Módulo: `VentasModule` (nuevo)

### Estructura de Archivos
```
src/app/features/ventas/
├── locales/
│   ├── index-locales/
│   │   ├── index-locales.component.ts
│   │   ├── index-locales.component.html
│   │   └── index-locales.component.scss
│   ├── form-local/
│   │   ├── form-local.component.ts
│   │   ├── form-local.component.html
│   │   └── form-local.component.scss
│   └── models/
│       └── local.model.ts
└── services/
    └── local.service.ts
```

---

## 🔗 Endpoints Consumidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/locales` | Listar locales (paginado) |
| GET | `/api/locales/{id}` | Obtener local por ID |
| POST | `/api/locales` | Crear nuevo local |
| PUT | `/api/locales/{id}` | Actualizar local |
| DELETE | `/api/locales/{id}` | Eliminar local |

---

## 📦 Payload Examples

### GET /api/locales?page=0&rows=10 (Response)
```json
{
  "status": 200,
  "message": "Locales obtenidos",
  "error": false,
  "data": [
    {
      "id": 1,
      "nombre": "Tienda Principal",
      "direccion": "Calle 123 #45-67",
      "latitud": 4.7110,
      "longitud": -74.0721,
      "imagenFachada": "https://ejemplo.com/imagen.jpg",
      "vendedorActualNombre": "Juan Pérez",
      "vendedorAnteriorNombre": "Carlos López",
      "activo": true,
      "totalRows": 25
    }
  ]
}
```

### POST /api/locales (Request)
```json
{
  "nombre": "Nueva Tienda",
  "direccion": "Av. Principal 123",
  "latitud": 4.7200,
  "longitud": -74.0800,
  "imagenFachada": "https://ejemplo.com/nueva.jpg",
  "horarioJson": "{\"lunes\": {\"apertura\": \"08:00\", \"cierre\": \"18:00\"}}",
  "preferenciaDiasJson": "{\"dias\": [\"lunes\", \"miercoles\"], \"frecuenciaDias\": 7}",
  "vendedorActualId": 5
}
```

### GET /api/locales/1 (Response)
```json
{
  "status": 200,
  "message": "Local obtenido",
  "error": false,
  "data": {
    "id": 1,
    "empresaId": 1,
    "nombre": "Tienda Principal",
    "direccion": "Calle 123 #45-67",
    "latitud": 4.7110,
    "longitud": -74.0721,
    "imagenFachada": "https://ejemplo.com/imagen.jpg",
    "horarioJson": "{\"lunes\": {...}}",
    "preferenciaDiasJson": "{\"dias\": [...]",
    "vendedorActualId": 5,
    "vendedorActualNombre": "Juan Pérez",
    "vendedorAnteriorId": 3,
    "vendedorAnteriorNombre": "Carlos López",
    "activo": true
  }
}
```

---

## 🎨 UI/UX Requirements

### Index Component
- **Tabla**: Columnas [Nombre, Dirección, Vendedor Actual, Vendedor Anterior, Estado, Acciones]
- **Botones**: Nuevo local (icono plus), Refresh, Ver en Mapa
- **Acciones**: Editar, Eliminar, Ver Detalles
- **Buscar**: Input de búsqueda por nombre/dirección
- **Filtros**: Por vendedor actual, Por vendedor anterior

### Form Dialog (Create/Edit)
- **Tipo**: PrimeNG Dialog (700px width)
- **Campos**:
  - Nombre (InputText, requerido, max 150)
  - Dirección (InputText, requerido)
  - Imagen Fachada (InputText URL, opcional)
  - Geo ubicación:
    - Latitud (InputNumber)
    - Longitud (InputNumber)
    - Botón: "Seleccionar en Mapa" (abre mapa)
  - Horario (collapsible):
    - Lunes-Domingo: hora apertura/cierre
  - Preferencias de Visita:
    - Días preferidos (MultiSelect)
    - Frecuencia (InputNumber días)
  - Vendedor Actual (Dropdown, opcional)
- **Botones**: Guardar, Cancelar

### Confirm Dialog (Delete)
- **Título**: "¿Eliminar local?"
- **Mensaje**: "El local tiene visitas asociadas" (si aplica)
- **Botones**: Confirmar, Cancelar

---

## 📋 Modelo TypeScript

```typescript
export interface Local {
  id: number;
  empresaId: number;
  nombre: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  imagenFachada?: string;
  horarioJson?: string;
  preferenciaDiasJson?: string;
  vendedorActualId?: number;
  vendedorActualNombre?: string;
  vendedorAnteriorId?: number;
  vendedorAnteriorNombre?: string;
  activo: boolean;
}

export interface LocalTable {
  id: number;
  nombre: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  imagenFachada?: string;
  vendedorActualNombre?: string;
  vendedorAnteriorNombre?: string;
  activo: boolean;
  totalRows: number;
}

export interface CreateLocal {
  nombre: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  imagenFachada?: string;
  horarioJson?: string;
  preferenciaDiasJson?: string;
  vendedorActualId?: number;
}
```

---

## 🗺️ Integración con Mapa

Para la selección de ubicación:
- Usar Leaflet (OpenStreetMap) o Google Maps
- Click en el mapa → obtener lat/long
- Arrastar pin → actualizar lat/long

---

## ⚠️ Validaciones Frontend

- **Nombre**: Obligatorio, único por empresa, max 150 caracteres
- **Dirección**: Obligatorio, max 255 caracteres
- **URL Imagen**: Validar que sea URL válida si se ingresa
- **Latitud**: Entre -90 y 90
- **Longitud**: Entre -180 y 180
- **Horario**: JSON válido
- **Preferencias**: JSON válido