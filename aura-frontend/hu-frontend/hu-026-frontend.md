# HU-026 - Listar Todos los Locales de la Empresa (Frontend)

## 📌 Información General
- ID: HU-026-FRONTEND
- HU Original: HU-026 (EP-005)
- Estado: ✅ Implementada
- Fecha: 2026-03-27

---

## 🎯 Objetivo

Permitir visualizar todos los locales de la empresa con filtros y opciones de búsqueda.

---

## 📱 Componente Angular

### Ruta
- Path: `/ventas/locales` (módulo existente)
- Componente: `IndexLocalesComponent`
- Es la vista principal de locales (HU-021)

---

## 🎨 UI/UX Requirements

### Index Component - Locales

#### Sin Filtros (Ver todos)
- Al cargar sin filtros, muestra todos los locales de la empresa
- Paginación: 10, 25, 50, 100 por página

#### Buscador
- **Input**: Búsqueda por nombre o dirección
- ** behavior**: ILIKE search en backend
- **Debounce**: 300ms

#### Filtros Avanzados
- Vendedor Actual (Dropdown)
- Vendedor Anterior (Dropdown)
- Estado (Activo/Inactivo)

#### Acciones por Local
- Ver detalles (dialog)
- Editar (dialog)
- Eliminar (confirm dialog)
- Ver en mapa (abre modal con mapa)

#### Ver en Mapa (Modal)
- **Componente**: Leaflet/OpenStreetMap
- **Contenido**: Mapa con pines de todos los locales visibles
- **Info**: Al hacer click en pin, mostrar info del local

---

## 🔄 Resumen de Vistas

| Vista | Endpoint | Descripción |
|-------|----------|-------------|
| Todos | GET /api/locales | Ver todos los locales |
| Por Vendedor | GET /api/locales?vendedorActualId=X | Ver locales de un vendedor |
| Busqueda | GET /api/locales?search=texto | Buscar por nombre/dirección |
| Por Estado | GET /api/locales?activo=true/false | Filtrar por estado |

---

## ⚠️ Consideraciones

1. **Total en footer**: Mostrar "Total: X locales"
2. **Ordenar**: Click en headers de columna para ordenar
3. **Mapa**: Solo cargar cuando se solicite (no al inicio)