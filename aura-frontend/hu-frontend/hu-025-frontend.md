# HU-025 - Listar Locales por Vendedor (Frontend)

## 📌 Información General
- ID: HU-025-FRONTEND
- HU Original: HU-025 (EP-005)
- Estado: ✅ Implementada
- Fecha: 2026-03-27

---

## 🎯 Objetivo

Permitir filtrar y listar locales según el vendedor actual asignado.

---

## 📱 Componente Angular

### Ruta
- Path: `/ventas/locales` (módulo existente)
- Componente: `IndexLocalesComponent` (modificar)
- Agregar filtro por vendedor

### Endpoint Consumido
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/locales?vendedorActualId={id}` | Listar locales filtrados por vendedor |

---

## 🎨 UI/UX Requirements

### Filtro: Vendedor (Index Locales)

#### Ubicación
- Encima de la tabla, junto a otros filtros
- Mismo componente que HU-021

#### Dropdown
- **Componente**: PrimeNG Dropdown
- **Placeholder**: "Todos los vendedores"
- **Opciones**: Lista de empleados tipo "VENDEDOR"
- ** behavior**: Al seleccionar, recargar tabla con filtro

#### behavior
```
Dropdown (onChange)
  → GET /api/locales?vendedorActualId={selectedId}
  → Actualizar tabla
```

---

## 📦 Payload Examples

### GET /api/locales?vendedorActualId=5&page=0&rows=10 (Response)
```json
{
  "status": 200,
  "message": "Locales obtenidos",
  "error": false,
  "data": [
    {
      "id": 1,
      "nombre": "Tienda Principal",
      "direccion": "Calle 123",
      "vendedorActualNombre": "Juan Pérez",
      "vendedorAnteriorNombre": "Carlos López",
      "activo": true,
      "totalRows": 8
    }
  ]
}
```

---

## ⚠️ Consideraciones

1. **Combinar filtros**: Compatible con búsqueda por nombre
2. **Sin vendedor**: Opción "Sin vendedor asignado"
3. **Limpiar**: Botón para quitar filtro