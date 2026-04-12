# HU-022 - Asignación de Locales a Vendedores (Frontend)

## 📌 Información General
- ID: HU-022-FRONTEND
- HU Original: HU-022 (EP-005)
- Estado: ✅ Implementada
- Fecha: 2026-03-27

---

## 🎯 Objetivo

Permite asignar y reasignar locales a vendedores desde el formulario de locales (integrado en HU-021).

---

## 📱 Integración

Esta funcionalidad está integrada en el formulario de locales (HU-021).

### Nuevo Endpoint Consumido
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/empleados?tipo=VENDEDOR` | Listar vendedores (empleados tipo VENDEDOR) |

---

## 📦 Payload Examples

### GET /api/empleados?tipo=VENDEDOR (Dropdown)
```json
{
  "status": 200,
  "message": "Listado exitoso",
  "error": false,
  "data": {
    "content": [
      { "id": 5, "nombres": "Juan", "apellidos": "Pérez" },
      { "id": 8, "nombres": "María", "apellidos": "Gómez" }
    ],
    "totalRows": 2
  }
}
```

---

## 🎨 UI/UX Requirements

### Campo: Vendedor Actual (Form Local)

#### Dropdown
- **Componente**: PrimeNG Dropdown
- **Label**: "Vendedor Actual"
- **Placeholder**: "Seleccione un vendedor"
- **Opciones**: Lista de empleados con tipo "VENDEDOR"
- **Filtro**: Habilitar búsqueda

#### Mostrar Vendedor Anterior
- En modo ver/edición: Mostrar etiqueta "Vendedor Anterior: [Nombre]"
- Si existe vendedor anterior, mostrar en detalles

#### Reasignación
- Al seleccionar nuevo vendedor:
  1. El actual pasa a "vendedor_anterior"
  2. El nuevo se guarda como "vendedor_actual"
  3. No requiere confirmación adicional

---

## ⚠️ Consideraciones

1. **Cargar vendedores**: Solo cargar activos con tipo "VENDEDOR"
2. **Sin vendedor**: Permitir local sin vendedor (nullable)
3. **Historial**: Mostrar siempre el vendedor anterior si existe
4. **Validar existencia**: Si se pasa ID de vendedor, debe existir