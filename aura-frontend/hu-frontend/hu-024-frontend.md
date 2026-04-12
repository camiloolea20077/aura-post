# HU-024 - Programación de Visitas (Frontend)

## 📌 Información General
- ID: HU-024-FRONTEND
- HU Original: HU-024 (EP-005)
- Estado: ✅ Implementada
- Fecha: 2026-03-27

---

## 🎯 Objetivo

Permitir programar, gestionar y confirmar visitas a locales, incluyendo vista de calendario y confirmación de llegada con ubicación.

---

## 📱 Componente Angular

### Ruta
- Path: `/ventas/visitas`
- Componente: `IndexVisitasComponent`
- Módulo: `VentasModule`

### Estructura de Archivos
```
src/app/features/ventas/
├── visitas/
│   ├── index-visitas/
│   ├── form-visita/
│   └── services/
│       └── visita.service.ts
```

---

## 🔗 Endpoints Consumidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/visitas` | Listar visitas (paginado) |
| GET | `/api/visitas/hoy` | Visitas del día (vendedor autenticado) |
| GET | `/api/visitas/{id}` | Obtener visita por ID |
| POST | `/api/visitas` | Crear visita manual |
| POST | `/api/visitas/{id}/confirmar` | Confirmar llegada |
| DELETE | `/api/visitas/{id}` | Cancelar visita |

---

## 📦 Payload Examples

### GET /api/visitas?page=0&rows=10 (Response)
```json
{
  "status": 200,
  "message": "Visitas obtenidas",
  "error": false,
  "data": [
    {
      "id": 1,
      "localNombre": "Tienda Principal",
      "localDireccion": "Calle 123",
      "vendedorNombre": "Juan Pérez",
      "rutaNombre": "Ruta Norte",
      "fechaProgramada": "2026-03-27T09:00:00",
      "horaProgramada": "09:00",
      "estado": "PROGRAMADA",
      "totalRows": 25
    }
  ]
}
```

### GET /api/visitas/hoy (Response)
```json
{
  "status": 200,
  "message": "Visitas del día obtenidas",
  "error": false,
  "data": [
    {
      "id": 1,
      "localNombre": "Tienda Principal",
      "localDireccion": "Calle 123",
      "vendedorNombre": "Juan Pérez",
      "rutaNombre": "Ruta Norte",
      "fechaProgramada": "2026-03-27T09:00:00",
      "horaProgramada": "09:00",
      "estado": "PROGRAMADA",
      "totalRows": 0
    }
  ]
}
```

### POST /api/visitas (Request)
```json
{
  "localId": 5,
  "rutaId": 1,
  "fechaProgramada": "2026-03-27T10:00:00",
  "horaProgramada": "10:00"
}
```

### POST /api/visitas/1/confirmar (Request - con GPS)
```json
{
  "latitud": 4.7110,
  "longitud": -74.0721,
  "confirmacionManual": false,
  "observaciones": "Llegué al local"
}
```

### POST /api/visitas/1/confirmar (Request - manual)
```json
{
  "confirmacionManual": true,
  "observaciones": "Confirmación manual"
}
```

---

## 🎨 UI/UX Requirements

### Index Component - Vista Lista
- **Tabla**: Columnas [Local, Vendedor, Ruta, Fecha/Hora, Estado, Acciones]
- **Filtros**: Por vendedor, por fecha (Desde/Hasta), por estado
- **Estados**: PROGRAMADA (amarillo), COMPLETADA (verde), CANCELADA (rojo)
- **Acciones**: Ver detalles, Completar, Cancelar

### Index Component - Vista Calendario
- **Componente**: PrimeNG FullCalendar o similar
- **Vista**: Mensual/Semanal/Diaria
- **Eventos**: Clickeables para ver detalles
- **Arrastrar**: Para reprogramar fecha (opcional)

### Dialog: Programar Visitas desde Ruta
- **Trigger**: Botón "Programar" en detalles de ruta
- **Campos**:
  - Fecha (DatePicker, requerido)
  - Hora inicio (TimePicker)
  - Generar para todos los locales de la ruta

### Dialog: Confirmar Llegada (Mobile/Vendedor)
- **Título**: "Confirmar Llegada"
- **Info**: Nombre del local, dirección
- **Acciones**:
  - Botón: "Confirmar con GPS" (usa geolocalización del navegador)
  - Botón: "Confirmar Manualmente" (sin verificación)
- ** Campo**: Observaciones (textarea)

### Panel del Vendedor (Ruta del Día)
- **Acceso**: `/ventas/mi-ruta` o desde dashboard
- **Contenido**: Lista de locales a visitar hoy
- **Por cada visita**:
  - Nombre del local, dirección
  - Hora programada
  - Botón: "Confirmar Llegada"
  - Estado visual (pendiente/completada)

---

## 📋 Modelo TypeScript

```typescript
export interface Visita {
  id: number;
  empresaId: number;
  localId: number;
  localNombre: string;
  localDireccion: string;
  vendedorId: number;
  vendedorNombre: string;
  rutaId?: number;
  rutaNombre?: string;
  fechaProgramada: string;
  horaProgramada?: string;
  fechaReal?: string;
  latitudLlegada?: number;
  longitudLlegada?: number;
  estado: 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA';
  observaciones?: string;
}

export interface CreateVisita {
  localId: number;
  rutaId?: number;
  fechaProgramada: string;
  horaProgramada?: string;
}

export interface ConfirmarLlegada {
  latitud?: number;
  longitud?: number;
  confirmacionManual?: boolean;
  observaciones?: string;
}
```

---

## 📍 Geolocalización (Browser API)

```typescript
// Obtener ubicación actual
navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
  },
  (error) => {
    console.error('Error getting location:', error);
  }
);
```

---

## ⚠️ Consideraciones

1. **Permisos**: Solicitar permiso de ubicación al confirmar con GPS
2. **Offline**: Guardar en localStorage si no hay conexión (opcional)
3. **Distancia**: Validar que esté a máximo 100m del local
4. **Hora real**: Se registra automáticamente al confirmar
5. **Estados**: No permitir completar una ya completada o cancelada