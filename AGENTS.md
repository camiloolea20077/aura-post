# AGENTS.md - AURA POS

## Build, Lint, and Test Commands

### Frontend (Angular 18 - aura-frontend)

```bash
# Development server
cd aura-frontend
npm start          # or: ng serve

# Build
npm run build      # or: ng build
npm run watch     # watch mode for development

# Testing
npm test          # runs all tests via Karma
ng test --watch=false --browsers=ChromeHeadless  # single run, CI
ng test --include='**/merma.service.spec.ts'     # run single test file
```

### Running a Single Test

To run a specific test file in Karma:

```bash
# Option 1: Using ng test with file pattern
ng test --include='**/path/to/file.spec.ts'

# Option 2: Using Karma config (edit karma.conf.js)
# Add: 'singleRun: true, bail: true' for CI mode
```

### Backend (aura-pos)

The backend is a Spring Boot 3 application. Build and test commands depend on Maven or Gradle:

```bash
# If using Maven
cd aura-pos
mvn clean install
mvn test

# If using Gradle
./gradlew build
./gradlew test
```

---

## Code Style Guidelines

### General Principles

- **TypeScript Strict Mode**: Enabled in `tsconfig.json` - all strict flags active
- **Angular 18 Standalone Components**: All components must be standalone
- **Change Detection**: Always use `ChangeDetectionStrategy.OnPush`
- **No ESLint/Prettier config found**: Follow existing code patterns

### Imports

```typescript
// Order (grouped):
// 1. Angular core
// 2. External libraries (PrimeNG, rxjs, etc.)
// 3. Internal shared
// 4. Internal features

import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { MermaService } from "../services/merma.service";
import { MermaModel } from "../models/merma.model";
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | kebab-case | `index-mermas.component.ts` |
| Classes | PascalCase | `MermaService`, `MermaModel` |
| Interfaces | PascalCase | `MermaModel`, `CreateMermaDto` |
| Types (unions) | PascalCase | `EstadoMerma = "APROBADA" \| "ANULADA"` |
| UI Types | PascalCase + UI suffix | `MermaLineaUI` |
| FormGroups | frm prefix | `frmMerma: FormGroup` |
| Variables | camelCase | `showForm`, `loading`, `rows` |
| Constants | SCREAMING_SNAKE_CASE | `private readonly BASE_URL` |
| UUID fields | _id suffix | `linea._id: string` |

### File Structure

```
features/{modulo}/
├── index/              # tabla principal
│   ├── index-{modulo}.component.ts
│   ├── index-{modulo}.component.html
│   └── index-{modulo}.component.scss
├── form/               # dialog crear/editar
├── detalle/            # dialog ver detalle
├── models/
│   └── {modulo}.model.ts   # todos los modelos en un archivo
├── services/
│   └── {modulo}.service.ts
└── {modulo}.routes.ts
```

### Components Pattern

```typescript
@Component({
  selector: 'app-index-mermas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule],
  providers: [MessageService, ConfirmationService],  // SOLO en index
  templateUrl: './index-mermas.component.html',
  styleUrls: ['./index-mermas.component.scss'],
})
export class IndexMermasComponent implements OnInit {
  constructor(private readonly cdr: ChangeDetectorRef) {}

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.service.page({ ... }));
      this.rows = res?.data?.content ?? [];
    } catch {
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();  // ALWAYS in finally
    }
  }
}
```

### Error Handling

```typescript
// ALWAYS use try/catch/finally for HTTP calls
async save(): Promise<void> {
  if (this.form.invalid) { 
    this.form.markAllAsTouched(); 
    return; 
  }
  this.loading = true;
  try {
    await lastValueFrom(this.service.create(this.form.value));
    this.saved.emit();
    this.close();
  } catch (err: unknown) {
    const message = (err as any)?.error?.message ?? 'Error desconocido';
    this.alert.showError('Error', message);
  } finally {
    this.loading = false;
    this.cdr.markForCheck();
  }
}
```

### Form Validation

```typescript
// ReactiveForms for DTOs (dialogs)
form = new FormGroup({
  nombre: new FormControl('', [Validators.required, Validators.maxLength(100)]),
  cantidad: new FormControl(1, [Validators.required, Validators.min(1)]),
});

// Helper method in component
isInvalid(field: string): boolean {
  const c = this.form.get(field);
  return !!(c?.invalid && c?.touched);
}

// ngModel allowed ONLY for:
// - Search/filters in tables
// - Dynamic lines (cart, purchases)
// - Autocomplete inputs
```

### Dynamic Lines (UUID + trackBy)

```typescript
import { v4 as uuid } from 'uuid';

interface LineaUI {
  _id: string;  // UUID - REQUIRED for trackBy
  productoId: number | null;
  cantidad: number;
}

addLinea(): void {
  this.lineas = [...this.lineas, {
    _id: uuid(),
    productoId: null,
    cantidad: 1,
  }];
  this.cdr.markForCheck();
}

trackById(_: number, item: LineaUI): string {
  return item._id;
}
```

### SCSS Guidelines

- **Each component has its own SCSS file** - never share between components
- Use CSS variables from `styles/_variables.scss`
- Copy helper classes to component that needs them

```scss
// Typical component variables
$indigo: #6366f1;
$red: #ef4444;
$border: #e2e8f0;
$text: #1e293b;
$muted: #94a3b8;
$mono: "JetBrains Mono", monospace;
```

### TypeScript Types

```typescript
// Use explicit types, avoid 'any' when possible
// Entity model
interface MermaModel {
  id: number;
  nombre: string;
  estado: EstadoMerma;
}

// DTOs
interface CreateMermaDto {
  motivoId: number;
  observacion?: string;
  detalles: CreateMermaDetalleDto[];
}

// Union types for states
type EstadoMerma = "APROBADA" | "ANULADA";

// UI types (frontend only)
interface MermaLineaUI {
  _id: string;
  productoId: number | null;
}
```

### API Patterns

```
POST   /page     → paginated list
GET    /         → simple list for dropdowns
GET    /{id}     → full detail with relations
POST   /         → create
PUT    /{id}     → update
DELETE /{id}     → delete
PATCH  /{id}/anular → state change
```

### Key Patterns to Follow

1. **OnPush + cdr.markForCheck()** - Always
2. **try/catch/finally** - All HTTP calls
3. **ReactiveForms** - Main form in dialogs
4. **ngModel standalone** - Only for filters/autocomplete/lines
5. **UUID for dynamic lines** - Always
6. **Dialog forms** - Never separate pages for create/edit
7. **Own SCSS per component** - Never share

---

## Related Documentation

- `aura-frontend/src/AGENTS.MD` - Complete frontend development guide
- `README.md` - Backend + Frontend integration guide
