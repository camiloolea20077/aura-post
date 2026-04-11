# FRONTEND_AGENTS.MD - AURA POS

## Directivas de Desarrollo Angular 18 + PrimeNG 18

---

# ============================================================

# 1. STACK TECNOLÓGICO

# ============================================================

```
Angular 18 (Standalone Components)
PrimeNG 18
PrimeFlex
PrimeIcons
localforage (IndexedDB para sesión)
ReactiveFormsModule (formularios principales)
FormsModule (solo para inputs simples: búsqueda, filtros, carrito POS)
uuid (v4 para IDs de líneas en carrito/mermas/compras)
```

### Instalación base

```bash
ng new aura-pos --routing --style=scss --standalone
npm install primeng primeicons primeflex
npm install localforage
npm install chart.js
npm install uuid
npm install --save-dev @types/uuid
```

---

# ============================================================

# 2. ESTRUCTURA DEL PROYECTO

# ============================================================

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── global.interceptor.ts
│   │   ├── models/
│   │   │   └── auth.model.ts
│   │   └── services/
│   │       ├── auth.service.ts
│   │       └── index-db.service.ts
│   │
│   ├── shared/
│   │   ├── utils/
│   │   │   ├── models/
│   │   │   │   ├── cols.model.ts
│   │   │   │   ├── filter-table.ts
│   │   │   │   ├── response.model.ts
│   │   │   │   └── response-table.model.ts
│   │   │   └── pipes/
│   │   │       ├── alert.service.ts
│   │   │       └── helper.service.ts
│   │   └── components/
│   │
│   ├── layout/
│   │   ├── main-layout/
│   │   ├── sidebar/
│   │   └── topbar/
│   │
│   └── features/
│       ├── auth/login/
│       ├── dashboard/
│       ├── pos/                         ← pantalla táctil especial
│       ├── catalogo/
│       │   ├── categorias/
│       │   ├── marcas/
│       │   ├── unidades/
│       │   └── productos/
│       ├── precios/
│       ├── inventario/
│       ├── compras/
│       ├── ventas/
│       ├── mermas/
│       │   ├── index/
│       │   ├── form/                    ← dialog nueva merma
│       │   ├── detalle/                 ← dialog ver merma
│       │   ├── motivos/                 ← CRUD motivos
│       │   ├── models/
│       │   ├── services/
│       │   └── merma.routes.ts
│       ├── traslados/
│       ├── terceros/
│       ├── caja/
│       └── reportes/
│
├── assets/images/
│   ├── logo-aura.svg
│   └── logo-icon.svg
│
└── styles/
    ├── _variables.scss
    ├── _components.scss
    ├── _tables.scss
    ├── _forms.scss
    └── styles.scss
```

### Estructura interna de cada feature

```
features/mermas/
├── index/
│   ├── index-mermas.component.ts
│   ├── index-mermas.component.html
│   └── index-mermas.component.scss      ← SCSS propio, nunca compartido
├── form/
│   ├── form-merma.component.ts
│   ├── form-merma.component.html
│   └── form-merma.component.scss        ← SCSS propio
├── detalle/
│   ├── detalle-merma.component.ts
│   ├── detalle-merma.component.html
│   └── detalle-merma.component.scss     ← SCSS propio
├── motivos/
│   ├── index-motivos.component.ts/html/scss
│   └── form-motivo.component.ts/html/scss
├── models/
│   └── merma.model.ts                   ← todos los modelos en un solo archivo
├── services/
│   └── merma.service.ts
└── merma.routes.ts
```

**REGLA: Cada componente tiene su propio archivo SCSS. NUNCA archivos SCSS compartidos entre componentes.**

---

# ============================================================

# 3. MODELOS BASE COMPARTIDOS

# ============================================================

```typescript
// shared/utils/models/cols.model.ts
export class ColsModel {
  field: string;
  header: string;
  nameClass?: string;
  type?: string;
  visible?: boolean;
  width?: string;
  minWidth?: string;

  constructor(
    field: string,
    header: string,
    nameClass?: string,
    type?: string,
    visible: boolean = true,
  ) {
    this.field = field;
    this.header = header;
    this.nameClass = nameClass;
    this.type = type;
    this.visible = visible;
  }
}
```

```typescript
// shared/utils/models/filter-table.ts
export interface IFilterTable<T> {
  page: number;
  rows: number;
  search?: string | string[] | null;
  order_by?: string | string[] | null;
  title?: string;
  order?: string | string[] | null;
  params?: T | T[] | null;
}
```

```typescript
// shared/utils/models/response.model.ts
export class ResponseModel<T> {
  status: number;
  message: string;
  error: boolean;
  data: T;
  constructor(status: number, message: string, error: boolean, data: T) {
    this.status = status;
    this.message = message;
    this.error = error;
    this.data = data;
  }
}
```

```typescript
// shared/utils/models/response-table.model.ts
export class ResponseTableModel<T> {
  status: number;
  message: string;
  error: boolean;
  data: DataTable<T>;
  constructor(
    status: number,
    message: string,
    error: boolean,
    data: DataTable<T>,
  ) {
    this.status = status;
    this.message = message;
    this.error = error;
    this.data = data;
  }
}

export class DataTable<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  constructor(
    content: T[],
    totalElements: number,
    totalPages: number,
    size: number,
    number: number,
    first: boolean,
    last: boolean,
    empty: boolean,
  ) {
    this.content = content;
    this.totalElements = totalElements;
    this.totalPages = totalPages;
    this.size = size;
    this.number = number;
    this.first = first;
    this.last = last;
    this.empty = empty;
  }
}
```

---

# ============================================================

# 4. MODELOS POR MÓDULO

# ============================================================

**REGLA: Todos los modelos de un módulo van en un solo archivo `{modulo}.model.ts`.**

```typescript
// mermas/models/merma.model.ts — ejemplo de estructura completa

// ─── Motivo Merma ─────────────────────────────────────────────
export interface MotivoMermaModel {
  id: number;
  empresaId: number;
  nombre: string;
  afectaContabilidad: boolean;
}
export interface MotivoMermaTableModel {
  id: number;
  nombre: string;
  afectaContabilidad: boolean;
  totalRows: number;
}
export interface CreateMotivoMermaDto {
  nombre: string;
  afectaContabilidad: boolean;
}

// ─── Merma ────────────────────────────────────────────────────
export type EstadoMerma = "APROBADA" | "ANULADA";

export interface MermaModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  motivoId: number;
  motivoNombre: string;
  fecha: string;
  observacion: string | null;
  costoTotal: number;
  estado: EstadoMerma;
  detalles: MermaDetalleModel[];
}

export interface MermaTableModel {
  id: number;
  sucursalNombre: string;
  motivoNombre: string;
  fecha: string;
  costoTotal: number;
  estado: EstadoMerma;
  totalRows: number;
}

export interface CreateMermaDto {
  sucursalId: number;
  motivoId: number;
  observacion?: string | null;
  detalles: CreateMermaDetalleDto[];
}

// ─── UI types (solo para el frontend) ────────────────────────
export interface MermaLineaUI {
  _id: string; // UUID para trackBy — obligatorio en líneas dinámicas
  productoId: number | null;
  // ... resto de campos
}
```

---

# ============================================================

# 5. SERVICIO INDEXEDDB (SESIÓN)

# ============================================================

```typescript
// core/services/index-db.service.ts
import { Injectable } from "@angular/core";
import * as localForage from "localforage";
import { AuthResponse } from "../models/auth.model";

@Injectable({ providedIn: "root" })
export class IndexDBService {
  private readonly AUTH_KEY = "authResponse";

  constructor() {
    localForage.config({
      name: "aura-pos-db",
      version: 1.0,
      storeName: "authData",
    });
  }

  async saveAuthData(data: AuthResponse): Promise<void> {
    await localForage.setItem<AuthResponse>(this.AUTH_KEY, data);
  }

  async loadDataAuthDB(): Promise<AuthResponse | null> {
    return (await localForage.getItem<AuthResponse>(this.AUTH_KEY)) ?? null;
  }

  async deleteDataAuthDB(): Promise<void> {
    await localForage.removeItem(this.AUTH_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const data = await this.loadDataAuthDB();
    return !!data?.token;
  }

  async getToken(): Promise<string | null> {
    return (await this.loadDataAuthDB())?.token ?? null;
  }
  async getEmpresaId(): Promise<number | null> {
    return (await this.loadDataAuthDB())?.user?.empresaId ?? null;
  }
  async getSucursalId(): Promise<number | null> {
    return (await this.loadDataAuthDB())?.user?.sucursalId ?? null;
  }
}
```

---

# ============================================================

# 6. INTERCEPTOR HTTP

# ============================================================

```typescript
// core/interceptors/global.interceptor.ts
@Injectable()
export class GlobalInterceptor implements HttpInterceptor {
  constructor(
    private readonly indexDBService: IndexDBService,
    private readonly router: Router,
    private readonly alertService: AlertService,
  ) {}

  intercept<T>(
    request: HttpRequest<T>,
    next: HttpHandler,
  ): Observable<HttpEvent<T>> {
    return from(this.indexDBService.loadDataAuthDB()).pipe(
      switchMap((auth) => {
        let headers = request.headers;
        if (auth?.token)
          headers = headers
            .set("Authorization", `Bearer ${auth.token}`)
            .set("Accept", "*/*");
        if (!(request.body instanceof FormData))
          request = request.clone({ headers });

        return next.handle(request).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              this.alertService.showError(
                "Sesión expirada",
                "Vuelva a iniciar sesión",
              );
              this.indexDBService.deleteDataAuthDB();
              this.router.navigate(["/login"]);
            }
            return throwError(() => error.error || error);
          }),
        );
      }),
    );
  }
}
```

---

# ============================================================

# 7. PATRÓN DE SERVICIOS

# ============================================================

```typescript
// mermas/services/merma.service.ts
@Injectable({ providedIn: "root" })
export class MermaService {
  private readonly base = `${environment.apiUrl}`;
  constructor(private readonly http: HttpClient) {}

  // Motivos
  pageMotivos(pageable: MermaPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}motivos-merma/page`, pageable);
  }
  getAllMotivos(): Observable<any> {
    return this.http.get<any>(`${this.base}motivos-merma`); // lista simple para dropdowns
  }
  createMotivo(dto: CreateMotivoMermaDto): Observable<any> {
    return this.http.post<any>(`${this.base}motivos-merma`, dto);
  }
  updateMotivo(id: number, dto: CreateMotivoMermaDto): Observable<any> {
    return this.http.put<any>(`${this.base}motivos-merma/${id}`, dto);
  }
  deleteMotivo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}motivos-merma/${id}`);
  }

  // Mermas
  page(pageable: MermaPageableDto): Observable<any> {
    return this.http.post<any>(`${this.base}mermas/page`, pageable);
  }
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}mermas/${id}`);
  }
  create(dto: CreateMermaDto): Observable<any> {
    return this.http.post<any>(`${this.base}mermas`, dto);
  }
  anular(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}mermas/${id}/anular`, {});
  }
}
```

**Convenciones de endpoints:**

- `POST /page` → paginado
- `GET /` → lista simple para dropdowns (`getAllMotivos`, `getAllProductos`, etc.)
- `GET /{id}` → detalle completo con relaciones
- `POST /` → crear
- `PUT /{id}` → actualizar
- `DELETE /{id}` → eliminar
- `PATCH /{id}/anular` → cambio de estado

---

# ============================================================

# 8. PATRÓN DE COMPONENTES — CHANGE DETECTION

# ============================================================

**REGLA: Todos los componentes usan `ChangeDetectionStrategy.OnPush` + `ChangeDetectorRef`.**

```typescript
@Component({
  selector: 'app-index-mermas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,   // ← SIEMPRE
  imports: [ ... ],
  providers: [ConfirmationService, MessageService],   // ← en el index, no en el form
  templateUrl: './index-mermas.component.html',
  styleUrls: ['./index-mermas.component.scss'],       // ← SCSS propio
})
export class IndexMermasComponent implements OnInit {
  constructor(private readonly cdr: ChangeDetectorRef) {}

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.service.page({ ... }));
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch {
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();   // ← SIEMPRE en el finally
    }
  }
}
```

---

# ============================================================

# 9. REGLAS DE FORMULARIOS

# ============================================================

## Formularios en dialogs (ReactiveFormsModule)

```typescript
// form-motivo.component.ts — patrón para formularios simples
export class FormMotivoComponent implements OnChanges {
  @Input()  visible = false;
  @Input()  motivo: MotivoMermaModel | null = null;   // null = crear, objeto = editar
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved         = new EventEmitter<void>();

  form: FormGroup;
  loading = false;

  get isEdit(): boolean { return !!this.motivo; }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({ nombre: '', afectaContabilidad: true });  // reset al abrir
      if (this.motivo) this.form.patchValue({ ... });             // patch en edición
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    try {
      if (this.isEdit) {
        await lastValueFrom(this.service.update(this.motivo!.id, this.form.value));
      } else {
        await lastValueFrom(this.service.create(this.form.value));
      }
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo guardar');
    } finally {
      this.loading = false;
    }
  }

  close(): void { this.visible = false; this.visibleChange.emit(false); }
  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
```

## ngModel permitido en estos casos específicos

```
✅ ReactiveFormsModule + formControlName → formularios principales en dialogs
✅ ngModel (FormsModule) → inputs de búsqueda/filtro en tablas
✅ ngModel (FormsModule) → inputs de líneas dinámicas en carrito POS y formularios de compras/mermas
✅ ngModel (FormsModule) → searchProducto, globalFilter, categoriaActiva en POS
❌ NUNCA ngModel en formularios que se van a enviar al backend como DTO principal
```

---

# ============================================================

# 10. PATRÓN DE TABLA (INDEX COMPONENT)

# ============================================================

```typescript
export class IndexMermasComponent implements OnInit {
  rows: MermaTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = "";
  page = 0;
  pageSize = 10;

  // Control de dialogs — siempre en el index
  showForm = false; // dialog nueva/editar
  showDetalle = false; // dialog ver detalle
  mermaDetalle: MermaModel | null = null;
  loadingDetalle = false;

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.page,
          rows: this.pageSize,
          search: this.search || null,
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch {
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onPage(e: any): void {
    this.page = e.first / e.rows;
    this.pageSize = e.rows;
    this.load();
  }
  onSearch(): void {
    this.page = 0;
    this.load();
  }
  nueva(): void {
    this.showForm = true;
  } // abre dialog, NO navega a otra ruta
  onSaved(): void {
    this.load();
  } // recarga tabla al guardar
}
```

**REGLA: Los formularios de creación/edición son SIEMPRE dialogs (`p-dialog`), nunca páginas separadas con navegación.**

---

# ============================================================

# 11. PATRÓN DE DIALOG (FORM COMPONENT)

# ============================================================

```html
<!-- Estructura base de todo form dialog -->
<p-dialog
  [header]="isEdit ? 'Editar X' : 'Nuevo X'"
  [(visible)]="visible"
  (onHide)="close()"
  [modal]="true"
  [style]="{ width: '560px' }"
  [draggable]="false"
  [resizable]="false"
>
  <form [formGroup]="form" class="dialog-form">
    <!-- campos -->
  </form>

  <ng-template pTemplate="footer">
    <button
      pButton
      label="Cancelar"
      icon="pi pi-times"
      class="p-button-text"
      (click)="close()"
    ></button>
    <button
      pButton
      [label]="isEdit ? 'Actualizar' : 'Guardar'"
      icon="pi pi-check"
      class="btn-aura"
      [loading]="loading"
      (click)="save()"
    ></button>
  </ng-template>
</p-dialog>
```

**Ancho recomendado por tipo de dialog:**

- Formulario simple (1-2 campos): `width: '420px'`
- Formulario estándar: `width: '560px'`
- Formulario con líneas dinámicas (compras, mermas): `width: '860px'`
- Detalle/vista: `width: '780px'`

---

# ============================================================

# 12. PATRÓN DE LÍNEAS DINÁMICAS (COMPRAS, MERMAS, VENTAS)

# ============================================================

Para formularios con filas dinámicas (detalle de compra, merma, etc.):

```typescript
// Siempre usar UUID para identificar líneas
import { v4 as uuid } from 'uuid';

export interface MermaLineaUI {
  _id: string;           // UUID — obligatorio para trackBy
  productoId: number | null;
  productoNombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotalCosto: number; // calculado en calcLinea()
  // ... resto de campos UI
}

// En el componente:
addLinea(): void {
  this.lineas = [...this.lineas, {
    _id: uuid(),
    productoId: null, productoNombre: '',
    cantidad: 1, costoUnitario: 0, subtotalCosto: 0,
  }];
  this.cdr.markForCheck();
}

removeLinea(id: string): void {
  this.lineas = this.lineas.filter(l => l._id !== id);
  this.cdr.markForCheck();
}

private calcLinea(linea: MermaLineaUI): void {
  linea.subtotalCosto = linea.cantidad * linea.costoUnitario;
}

// trackBy obligatorio en *ngFor de líneas
trackById(_: number, l: MermaLineaUI): string { return l._id; }
```

```html
<!-- Template líneas con ngModel (FormsModule) -->
<div class="line-row" *ngFor="let l of lineas; trackBy: trackById">
  <p-autoComplete
    [(ngModel)]="l.productoNombre"
    [ngModelOptions]="{standalone: true}"
    ...
  />
  <p-inputNumber
    [ngModel]="l.cantidad"
    [ngModelOptions]="{standalone: true}"
    (ngModelChange)="updateCantidad(l, $event)"
    ...
  />
</div>
```

---

# ============================================================

# 13. MÓDULO POS — PANTALLA ESPECIAL

# ============================================================

El POS tiene un layout de 2 paneles que ocupa toda la pantalla:

```typescript
// Características especiales del POS:
// 1. Verifica turno activo al init
// 2. Carga productos via GET /productos/pos
// 3. Carrito con líneas UI (CartItem[])
// 4. Modal de pago separado (ModalPagoComponent)
// 5. Soporte para productos PESABLE vs ESTANDAR

export interface CartItem {
  _id: string; // UUID
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  precio: number; // precioFinal (con descuento automático aplicado)
  cantidad: number;
  descuento: number; // descuento manual en $
  descuentoAuto: string | null; // nombre de regla de descuento automática
  impuesto: number; // porcentaje IVA
  impuestoValor: number; // IVA calculado en $ (por calcLine)
  subtotal: number; // precio*cantidad - descuento + IVA
  esPesable: boolean; // si true: input decimal libre, sin botones +/-
  unidadMedida: string; // kg, lt, und, etc.
  showDescuento: boolean; // toggle UI del input de descuento manual
}
```

**Getters de totales en POS:**

```typescript
get subtotal(): number { return this.cart.reduce((s, c) => s + c.precio * c.cantidad, 0); }
get descTotal(): number { return this.cart.reduce((s, c) => s + c.descuento, 0); }
get impTotal(): number  { return this.cart.reduce((s, c) => s + c.impuestoValor, 0); }  // en $, no en %
get total(): number     { return this.subtotal - this.descTotal + this.impTotal; }
```

**calcLine — fórmula correcta:**

```typescript
private calcLine(item: CartItem): void {
  const base     = item.precio * item.cantidad;
  const baseNeta = Math.max(0, base - item.descuento);
  const iva      = baseNeta * (item.impuesto / 100);
  item.impuestoValor = iva;
  item.subtotal      = baseNeta + iva;
}
// ← Llamar calcLine() SIEMPRE al insertar y al modificar cantidad/descuento
```

**Descuentos automáticos:**
El endpoint `/productos/pos` devuelve `precioFinal`, `descuentoNombre`, `descuentoValor`.
El frontend usa `precioFinal` como precio base del CartItem.

---

# ============================================================

# 14. MÓDULO MERMAS

# ============================================================

**Flujo completo:**

```
IndexMermas → botón "Registrar merma" → abre FormMerma (dialog)
    ↓ saved
Recarga tabla

IndexMermas → clic en fila → abre DetalleMerma (dialog)
DetalleMerma → botón "Anular" → confirmAnular() en IndexMermas
```

**Sub-módulo Motivos:**

```
/mermas         → IndexMermasComponent
/mermas/motivos → IndexMotivosComponent (CRUD de motivos, dialog FormMotivoComponent)
```

**Validaciones de negocio en el formulario:**

- Al menos 1 línea
- Todos los productos seleccionados
- cantidad > 0
- cantidad <= stockActual (mostrar stock-pill en rojo si supera)
- Si manejaLotes = true → loteId obligatorio

---

# ============================================================

# 15. SCSS POR COMPONENTE — CONVENCIONES

# ============================================================

**Variables base (repetir en cada SCSS de módulo):**

```scss
$indigo: #6366f1;
$red: #ef4444;
$orange: #f97316;
$emerald: #10b981;
$border: #e2e8f0;
$text: #1e293b;
$muted: #94a3b8;
$bg: #f8fafc;
$card: #ffffff;
$font: "Outfit", sans-serif;
$mono: "JetBrains Mono", monospace;
```

**Clases helper estándar (repetir en cada componente que las use):**

```scss
.fw-600 {
  font-weight: 600;
}
.fw-700 {
  font-weight: 700;
}
.mono {
  font-family: $mono;
}
.text-muted {
  color: $muted;
}
.text-danger {
  color: $red;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.w-full {
  width: 100%;
}
```

**Header de módulo estándar:**

```scss
.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }
  .header-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(99, 102, 241, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    i {
      font-size: 1.1rem;
      color: $indigo;
    }
  }
  .header-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: $text;
    margin: 0;
  }
  .header-sub {
    font-size: 0.78rem;
    color: $muted;
    margin: 0;
  }
}
```

**Tabla card estándar:**

```scss
.table-card {
  background: #fff;
  border: 1.5px solid $border;
  border-radius: 16px;
  overflow: hidden;
}
.clickable-row {
  cursor: pointer;
  &:hover {
    background: #fafbff !important;
  }
}
.empty-row {
  text-align: center;
  color: $muted;
  font-size: 0.85rem;
  padding: 2rem !important;
}
```

**Botón primario Aura:**

```scss
::ng-deep .btn-primary.p-button {
  background: linear-gradient(135deg, $indigo, #818cf8) !important;
  border: none !important;
  font-weight: 600 !important;
}
```

---

# ============================================================

# 16. DESIGN SYSTEM - AURA POS

# ============================================================

```scss
// styles/_variables.scss
:root {
  --aura-blue: #2e6cf6;
  --aura-blue-light: #4da3ff;
  --aura-purple: #7b4dff;
  --aura-gradient: linear-gradient(135deg, #2e6cf6 0%, #7b4dff 100%);
  --aura-gradient-soft: linear-gradient(
    135deg,
    rgba(46, 108, 246, 0.1) 0%,
    rgba(123, 77, 255, 0.1) 100%
  );
  --aura-bg: #f4f6fa;
  --aura-surface: #ffffff;
  --aura-text: #2d2d2d;
  --aura-text-muted: #6b7280;
  --aura-border: #e0e3eb;
  --aura-success: #10b981;
  --aura-warning: #f59e0b;
  --aura-danger: #ef4444;
  --sidebar-width: 260px;
  --sidebar-collapsed: 72px;
}
```

**Tipografía:**

- Principal: `Outfit` (Google Fonts) — títulos, labels, botones
- Numérica: `JetBrains Mono` — precios, cantidades, códigos, IDs

**Cards:**

- `border-radius: 16px`
- `border: 1.5px solid var(--aura-border)`

---

# ============================================================

# 17. CONFIGURACIÓN APP.CONFIG.TS

# ============================================================

```typescript
import { ApplicationConfig, LOCALE_ID } from "@angular/core";
import { provideRouter } from "@angular/router";
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from "@angular/common/http";
import { provideAnimations } from "@angular/platform-browser/animations";
import { GlobalInterceptor } from "./core/interceptors/global.interceptor";
import { routes } from "./app.routes";
import { registerLocaleData } from "@angular/common";
import localeCo from "@angular/common/locales/es-CO";

registerLocaleData(localeCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    { provide: HTTP_INTERCEPTORS, useClass: GlobalInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: "es-CO" },
  ],
};
```

---

# ============================================================

# 18. RUTAS — LAZY LOADING

# ============================================================

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: "",
    canActivate: [AuthGuard],
    component: MainLayoutComponent,
    children: [
      {
        path: "dashboard",
        loadComponent: () => import("./features/dashboard/..."),
      },
      {
        path: "pos",
        loadComponent: () =>
          import("./features/pos/pos.component").then((m) => m.PosComponent),
      },
      {
        path: "mermas",
        loadChildren: () =>
          import("./features/mermas/merma.routes").then((m) => m.MERMA_ROUTES),
      },
      {
        path: "traslados",
        loadChildren: () =>
          import("./features/traslados/traslado.routes").then(
            (m) => m.TRASLADO_ROUTES,
          ),
      },
      // ...
    ],
  },
  { path: "login", loadComponent: () => import("./features/auth/login/...") },
];

// merma.routes.ts — estructura de sub-rutas
export const MERMA_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./index/index-mermas.component").then(
        (m) => m.IndexMermasComponent,
      ),
  },
  {
    path: "motivos",
    loadComponent: () =>
      import("./motivos/index-motivos.component").then(
        (m) => m.IndexMotivosComponent,
      ),
  },
  // SIN ruta /nueva — los formularios son dialogs
];
```

---

# ============================================================

# 19. VARIABLES DE ENTORNO

# ============================================================

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: "http://localhost:8080/api/", // ← con slash al final
};
```

---

# ============================================================

# 20. FORMATEO DE MONEDA

# ============================================================

Todos los componentes usan el mismo helper local (no pipe global):

```typescript
formatCOP = (v: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v ?? 0);
```

---

# ============================================================

# 21. REGLAS DE ORO

# ============================================================

## Formularios

```
✅ ReactiveFormsModule + formControlName → formularios DTO (dialogs)
✅ FormsModule + ngModel → filtros de búsqueda, líneas dinámicas de carrito
✅ ngOnChanges() → resetear y cargar datos al abrir dialog
✅ form.markAllAsTouched() antes de validar
✅ isInvalid(field) como helper en el TS
✅ try/catch/finally en TODAS las llamadas HTTP
✅ finally: loading = false + cdr.markForCheck()
❌ NUNCA ngModel en el formGroup principal
❌ NUNCA olvidar el finally
```

## Componentes

```
✅ Standalone + ChangeDetectionStrategy.OnPush SIEMPRE
✅ cdr.markForCheck() después de cualquier cambio asíncrono
✅ providers: [MessageService, ConfirmationService] SOLO en el index component
✅ Los dialogs (form, detalle) NO declaran providers propios
✅ @Input()/@Output() para comunicación padre-hijo
✅ SCSS propio por cada componente — NUNCA compartido
✅ Formularios de creación = dialog, NUNCA página separada
```

## Tablas

```
✅ [lazy]="true" + (onPage) para paginación server-side
✅ totalRows desde res?.data?.totalElements ?? 0
✅ ConfirmationService para confirmación de eliminación/anulación
✅ clickable-row con (click)="verDetalle(m)" para abrir detalle
✅ (click)="$event.stopPropagation()" en celda de acciones
```

## Inventario y Stock

```
✅ calcLine() llamar SIEMPRE al insertar item Y al modificar cantidad/descuento
✅ impTotal en $ (suma de impuestoValor), NO en porcentaje
✅ UUID (_id) obligatorio en líneas dinámicas para trackBy
✅ Validar cantidad <= stockActual antes de guardar
✅ Mostrar visual (pill rojo) si cantidad supera stock
```

## Nomenclatura

```
✅ index-{entidad}/  → componente tabla
✅ form-{entidad}/   → componente dialog crear/editar
✅ detalle-{entidad}/ → componente dialog ver detalle
✅ frm{Entidad}      → FormGroup (frmMerma, frmProducto)
✅ showForm / showDetalle → flags de visibilidad de dialogs en index
✅ isEdit            → boolean derivado de si hay objeto de edición
✅ loading / loadingDetalle → flags de carga separados
✅ onSaved()         → emitido por form, recibe index para recargar tabla
```

---

# ============================================================

# 22. ORDEN DE DESARROLLO DE CADA MÓDULO

# ============================================================

```
1. models/{modulo}.model.ts
   - XxxModel (detalle completo)
   - XxxTableModel (+ totalRows para paginado)
   - CreateXxxDto / UpdateXxxDto
   - XxxLineaUI (si tiene líneas dinámicas, con _id: string)

2. services/{modulo}.service.ts
   - page(pageable) → POST /page
   - getById(id)    → GET /{id}
   - create(dto)    → POST /
   - update(id,dto) → PUT /{id}
   - delete(id)     → DELETE /{id}
   - anular(id)     → PATCH /{id}/anular (si aplica)
   - getAll()       → GET / (lista simple para dropdowns)

3. form/{modulo}.component.ts/html/scss
   - @Input() visible + @Output() visibleChange (two-way binding)
   - @Output() saved
   - ngOnChanges() para reset y carga en edición
   - p-dialog como contenedor
   - Líneas dinámicas con uuid si aplica

4. detalle/{modulo}.component.ts/html/scss (si aplica)
   - @Input() visible, loading, data
   - @Output() visibleChange, anular (si aplica)

5. index/{modulo}.component.ts/html/scss
   - showForm, showDetalle como flags
   - Tabla lazy con paginado server-side
   - Importar form y detalle components
   - providers: [ConfirmationService, MessageService]

6. {modulo}.routes.ts
   - path '' → index
   - path 'sub' → sub-índices (motivos, etc.)
   - SIN ruta /nueva

7. Agregar en app.routes.ts (loadChildren)
8. Agregar ítem en sidebar menu
```

---

# ============================================================

# 23. CHECKLIST ANTES DE HACER COMMIT

# ============================================================

```
□ ¿ChangeDetectionStrategy.OnPush en todos los componentes?
□ ¿cdr.markForCheck() en todos los finally y callbacks async?
□ ¿El formulario principal usa formControlName (no ngModel)?
□ ¿Las líneas dinámicas tienen _id: string con uuid?
□ ¿calcLine() se llama al insertar Y al modificar?
□ ¿impTotal suma valores en $ (impuestoValor), no porcentajes?
□ ¿Todos los try/catch tienen finally con loading = false?
□ ¿El dialog tiene ngOnChanges con reset al abrirse?
□ ¿providers: [MessageService, ConfirmationService] solo en index?
□ ¿Cada componente tiene su propio SCSS (no compartido)?
□ ¿El formulario es dialog y NO navega a otra ruta?
□ ¿La tabla tiene (click)="$event.stopPropagation()" en acciones?
□ ¿formatCOP usa ?? 0 para evitar NaN?
□ ¿El componente es standalone: true?
```
