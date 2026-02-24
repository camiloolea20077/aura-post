# AGENTS.md - AURA POS

This file provides guidelines for agents working on the AURA POS backend codebase.

## Project Overview

- **Framework**: Spring Boot 3.5.10
- **Language**: Java 17
- **Database**: PostgreSQL
- **Build Tool**: Maven
- **Security**: Spring Security 6 with JWT
- **API Documentation**: Swagger (springfox)

## Build Commands

```bash
# Build project
mvn clean install

# Run application
mvn spring-boot:run

# Run tests
mvn test

# Run single test class
mvn test -Dtest=TestClassName

# Run single test method
mvn test -Dtest=TestClassName#testMethodName

# Package (skip tests)
mvn package -DskipTests
```

## Project Structure

```
src/main/java/com/cloud_technological/aura_pos/
├── config/           # Configuration classes
├── controllers/      # REST controllers (@RestController)
├── dto/              # Data Transfer Objects
│   └── [module]/     # DTOs organized by module
├── entity/           # JPA entities
├── mappers/          # MapStruct mappers
├── repositories/     # JPA repositories + Query repositories
│   ├── [module]/     # JPA repositories
│   └── [module]/
│       └── QueryRepository.java  # Custom JDBC queries
├── security/         # JWT, SecurityConfig, SecurityUtils
├── services/         # Service interfaces + implementations
│   └── implementations/
├── utils/            # Utilities, DTOs (PageableDto, ApiResponse)
```

## Code Style Guidelines

### Architecture Pattern

Follow **CQRS Light**:
1. **Controller**: Receive HTTP requests, validate DTOs, return ApiResponse. NO business logic.
2. **Service (Interface + Impl)**: Contains business logic, manages transactions (@Transactional).
3. **Mapper**: MapStruct for DTO <-> Entity conversions.
4. **Repository**: JPA for simple CRUD; QueryRepository (JDBC) for complex queries.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Entities | PascalCase, singular | `Producto`, `Venta` |
| Controllers | `XxxController` | `ProductoController` |
| Services | `XxxService` + `XxxServiceImpl` | `ProductoService`, `ProductoServiceImpl` |
| Repositories | `XxxRepository` | `ProductoRepository` |
| Query Repositories | `XxxQueryRepository` | `ProductoQueryRepository` |
| DTOs | `XxxDto`, `CreateXxxDto`, `UpdateXxxDto`, `XxxTableDto` | `ProductoDto`, `CreateProductoDto` |
| Mappers | `XxxMapper` | `ProductoMapper` |
| Tables | snake_case | `producto`, `venta_detalle` |
| Columns | snake_case | `empresa_id`, `fecha_creacion` |

### Package by Module

DTOs, entities, repositories, services, and controllers should be organized by module:
```
dto/productos/
  ├── CreateProductoDto.java
  ├── ProductoDto.java
  ├── ProductoTableDto.java
  └── UpdateProductoDto.java
```

### DTO Structure

- **XxxDto**: Full detail (form/get by ID)
- **XxxTableDto**: Paginated table (includes `totalRows`)
- **CreateXxxDto**: Creation request (with validations)
- **UpdateXxxDto**: Update request (all fields optional)

### Security Rules

- **ALWAYS** extract `empresaId` from JWT token via `SecurityUtils.getEmpresaId()`
- **NEVER** accept `empresaId` from request body or header
- Use `SecurityUtils.getSucursalId()`, `getUsuarioId()`, `getRol()` as needed

### Pagination

- All list endpoints use `POST /page` with `PageableDto`
- Query must use `COUNT(*) OVER() AS total_rows`
- Return `PageImpl` as response

### Database Patterns

**Soft Delete**:
- Entities with `deleted_at`: Use `@Where(clause = "deleted_at IS NULL")`
- Entities with `activo` boolean flag: Filter in queries

**Inventory Rules** (CRITICAL):
1. Stock is NEVER modified directly
2. All stock changes go through `movimiento_inventario` (immutable)
3. Every movement records `saldo_anterior` and `saldo_nuevo`
4. Anulations must validate stock availability (never negative)

**QueryRepository Pattern**:
- Use for complex queries, reports, paginated lists
- Use `NamedParameterJdbcTemplate`
- Return DTOs directly with `BeanPropertyRowMapper`
- Methods: `existeNombre()`, `existeNombreExcluyendo()`

### Import Order

```java
// 1. Java/Jakarta
import java.util.*;
import javax.validation.*;

// 2. Spring
import org.springframework.beans.factory.annotation.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

// 3. Project imports (grouped by package)
import com.cloud_technological.aura_pos.dto.*;
import com.cloud_technological.aura_pos.services.*;
import com.cloud_technological.aura_pos.repositories.*;
```

### Error Handling

- Use `GlobalException` for custom errors
- All controller responses wrap in `ApiResponse<T>`
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Error)

### Lombok Usage

Use `@Data`, `@Entity`, `@Table`, `@Service`, `@Repository`, `@Autowired` appropriately. Avoid manual getters/setters.

### MapStruct

- One mapper per module
- Mark relationships as ignored in mapper, assign manually in Service

### Testing

- Tests go in `src/test/java/com/cloud_technological/aura_pos/`
- Use JUnit 5 (`org.junit.jupiter.api.*`)
- Use `@SpringBootTest` for integration tests
- Single test execution: `mvn test -Dtest=ClassName#methodName`

### Common Patterns

**Creating a new module** (in order):
1. SQL migration (if new table)
2. Entity
3. DTOs
4. JPARepository (simple queries)
5. QueryRepository (complex queries, paginated)
6. Mapper (MapStruct)
7. Service Interface + Implementation
8. Controller

**Multi-company filtering**:
```java
Integer empresaId = securityUtils.getEmpresaId();
// Always filter queries by empresaId
```

## API Response Format

```json
{
  "status": 200,
  "message": "Description",
  "error": false,
  "data": { ... }
}
```

## Key Files

- Security: `src/main/java/com/cloud_technological/aura_pos/security/`
- Exception handling: `src/main/java/com/cloud_technological/aura_pos/utils/GlobalException.java`
- API Response: `src/main/java/com/cloud_technological/aura_pos/utils/ApiResponse.java`
- SecurityUtils: `src/main/java/com/cloud_technological/aura_pos/utils/SecurityUtils.java`
