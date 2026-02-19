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
ReactiveFormsModule (NUNCA ngModel para formularios)
```

### Instalación base
```bash
ng new aura-pos --routing --style=scss --standalone
npm install primeng primeicons primeflex
npm install localforage
npm install chart.js
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
│   │       └── (componentes reutilizables)
│   │
│   ├── layout/
│   │   ├── main-layout/
│   │   ├── sidebar/
│   │   └── topbar/
│   │
│   └── features/
│       ├── auth/
│       │   └── login/
│       ├── dashboard/
│       ├── pos/
│       ├── catalogo/
│       │   ├── categorias/
│       │   │   ├── index/               ← tabla
│       │   │   └── components/
│       │   │       └── form/            ← formulario en modal
│       │   ├── marcas/
│       │   ├── unidades/
│       │   └── productos/
│       ├── precios/
│       ├── inventario/
│       ├── compras/
│       ├── ventas/
│       ├── mermas/
│       ├── traslados/
│       ├── terceros/
│       ├── caja/
│       └── reportes/
│
├── assets/
│   └── images/
│       ├── logo-aura.svg
│       └── logo-icon.svg
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
features/categorias/
├── index/
│   ├── index-categorias.component.ts    ← lógica tabla + modal control
│   ├── index-categorias.component.html  ← tabla p-table
│   └── index-categorias.component.scss
├── components/
│   └── form/
│       ├── form-categorias.component.ts    ← lógica formulario
│       ├── form-categorias.component.html  ← dialog con form
│       └── form-categorias.component.scss
├── models/
│   ├── categoria.model.ts               ← modelo completo
│   ├── categoria-table.model.ts         ← modelo para tabla
│   ├── create-categoria.dto.ts
│   └── update-categoria.dto.ts
└── services/
    └── categoria.service.ts
```

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
    visible: boolean = true
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

  constructor(status: number, message: string, error: boolean, data: DataTable<T>) {
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
    empty: boolean
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
# 4. SERVICIO INDEXEDDB (SESIÓN)
# ============================================================

```typescript
// core/services/index-db.service.ts
import { Injectable } from '@angular/core';
import * as localForage from 'localforage';
import { AuthResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class IndexDBService {
  private readonly AUTH_KEY = 'authResponse';

  constructor() {
    localForage.config({
      name: 'aura-pos-db',
      version: 1.0,
      storeName: 'authData',
      description: 'Datos de sesión AURA POS',
    });
  }

  async saveAuthData(data: AuthResponse): Promise<void> {
    try {
      await localForage.setItem<AuthResponse>(this.AUTH_KEY, data);
    } catch (error) {
      console.error('Error guardando en IndexedDB:', error);
    }
  }

  async loadDataAuthDB(): Promise<AuthResponse | null> {
    try {
      const data = await localForage.getItem<AuthResponse>(this.AUTH_KEY);
      return data ?? null;
    } catch (error) {
      console.error('Error cargando de IndexedDB:', error);
      return null;
    }
  }

  async deleteDataAuthDB(): Promise<void> {
    try {
      await localForage.removeItem(this.AUTH_KEY);
    } catch (error) {
      console.error('Error eliminando de IndexedDB:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const data = await this.loadDataAuthDB();
    return !!data?.token;
  }

  async getToken(): Promise<string | null> {
    const data = await this.loadDataAuthDB();
    return data?.token ?? null;
  }

  async getEmpresaId(): Promise<number | null> {
    const data = await this.loadDataAuthDB();
    return data?.user?.empresaId ?? null;
  }

  async getSucursalId(): Promise<number | null> {
    const data = await this.loadDataAuthDB();
    return data?.user?.sucursalId ?? null;
  }

  async getUsuarioId(): Promise<number | null> {
    const data = await this.loadDataAuthDB();
    return data?.user?.id ?? null;
  }
}
```

```typescript
// core/models/auth.model.ts
export interface AuthResponse {
  token: string;
  user: UserAuth;
}

export interface UserAuth {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  empresaId: number;
  sucursalId: number;
  sucursalNombre: string;
  empresaNombre: string;
}
```

---

# ============================================================
# 5. INTERCEPTOR HTTP (CLASE, NO FUNCIONAL)
# ============================================================

```typescript
// core/interceptors/global.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/utils/pipes/alert.service';
import { IndexDBService } from 'src/app/core/services/index-db.service';
import { AuthResponse } from 'src/app/core/models/auth.model';

@Injectable()
export class GlobalInterceptor implements HttpInterceptor {
  constructor(
    private readonly indexDBService: IndexDBService,
    private readonly router: Router,
    private readonly alertService: AlertService
  ) {}

  intercept<T>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    return from(this.indexDBService.loadDataAuthDB()).pipe(
      switchMap((auth: AuthResponse | null) => {
        let headers = request.headers;

        if (auth?.token) {
          headers = headers
            .set('Authorization', `Bearer ${auth.token}`)
            .set('Accept', '*/*');
        }

        if (request.body instanceof FormData) {
          request = request.clone({ headers: headers.set('enctype', 'multipart/form-data') });
        } else {
          request = request.clone({ headers });
        }

        return next.handle(request).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              this.alertService.showError(
                'Sesión expirada',
                error.error?.message || 'Por favor, vuelva a iniciar sesión.'
              );
              this.indexDBService.deleteDataAuthDB();
              this.router.navigate(['/login']);
            }
            return throwError(() => error.error || error);
          })
        );
      })
    );
  }
}
```

Registrar en `app.config.ts`:
```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { GlobalInterceptor } from './core/interceptors/global.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: GlobalInterceptor, multi: true },
    // ...
  ]
};
```

---

# ============================================================
# 6. AUTH GUARD (CLASE, NO FUNCIONAL)
# ============================================================

```typescript
// core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const isLoginRoute = state.url === '/login';
    const isRootRoute = state.url === '/';

    return this.authService.getAuthResponse().toPromise().then((authResponse) => {
      const token = authResponse?.token;
      const isExpired = !token || this.authService.isTokenExpired(token);

      if (isRootRoute) {
        this.router.navigate([isExpired ? '/login' : '/dashboard']);
        return false;
      }

      if (isExpired) {
        if (!isLoginRoute) this.router.navigate(['/login']);
        return isLoginRoute;
      }

      if (isLoginRoute) {
        this.router.navigate(['/dashboard']);
        return false;
      }

      return true;
    });
  }
}
```

---

# ============================================================
# 7. PATRÓN DE SERVICIOS
# ============================================================

```typescript
// features/categorias/services/categoria.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IFilterTable } from 'src/app/shared/utils/models/filter-table';
import { ResponseModel } from 'src/app/shared/utils/models/response.model';
import { ResponseTableModel } from 'src/app/shared/utils/models/response-table.model';
import { CategoriaModel } from '../models/categoria.model';
import { CategoriaTableModel } from '../models/categoria-table.model';
import { CreateCategoriaDto } from '../models/create-categoria.dto';
import { UpdateCategoriaDto } from '../models/update-categoria.dto';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private readonly http: HttpClient) {}

  page(filter: IFilterTable<null>): Observable<ResponseTableModel<CategoriaTableModel>> {
    return this.http.post<ResponseTableModel<CategoriaTableModel>>(`${this.apiUrl}/page`, filter);
  }

  getById(id: number): Observable<ResponseModel<CategoriaModel>> {
    return this.http.get<ResponseModel<CategoriaModel>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCategoriaDto): Observable<ResponseModel<CategoriaModel>> {
    return this.http.post<ResponseModel<CategoriaModel>>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCategoriaDto): Observable<ResponseModel<CategoriaModel>> {
    return this.http.put<ResponseModel<CategoriaModel>>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<ResponseModel<boolean>> {
    return this.http.delete<ResponseModel<boolean>>(`${this.apiUrl}/${id}`);
  }

  // Lista para selectores (dropdowns)
  list(): Observable<ResponseModel<{ id: number; nombre: string }[]>> {
    return this.http.get<ResponseModel<{ id: number; nombre: string }[]>>(`${this.apiUrl}/list`);
  }
}
```

---

# ============================================================
# 8. REGLAS DE FORMULARIOS (CRÍTICO)
# ============================================================

## ✅ SIEMPRE usar ReactiveFormsModule + formControlName
## ❌ NUNCA usar ngModel en formularios

```typescript
// form-categorias.component.ts
@Component({
  selector: 'app-form-categorias',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,   // ← SIEMPRE
    // NUNCA FormsModule para binding de formularios
    InputTextModule,
    DropdownModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    InputTextareaModule,
    InputSwitchModule,
  ],
  providers: [MessageService],
  templateUrl: './form-categorias.component.html',
  styleUrls: ['./form-categorias.component.scss'],
})
export class FormCategoriasComponent implements OnInit, OnChanges {
  @Input() displayModal: boolean = false;
  @Input() categoriaId: number | null = null;
  @Input() slug: string = 'create';             // 'create' | 'edit'
  @Output() modalClosed = new EventEmitter<void>();
  @Output() categoriaSaved = new EventEmitter<CategoriaModel>();

  public frmCategoria!: FormGroup;
  public isEditMode: boolean = false;
  public isSubmitting: boolean = false;

  // Opciones para dropdowns
  public categoriasOptions: { label: string; value: number }[] = [];

  constructor(
    private readonly categoriaService: CategoriaService,
    private readonly messageService: MessageService,
    private readonly alertService: AlertService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategoriasPadre();
  }

  ngOnChanges(): void {
    if (this.displayModal) {
      this.isEditMode = !!this.categoriaId;

      if (this.isEditMode && this.categoriaId) {
        this.loadData(this.categoriaId);
      } else {
        this.resetForm();
      }
    }
  }

  private initForm(): void {
    this.frmCategoria = this.fb.group({
      nombre:     [null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      descripcion:[null],
      padreId:    [null],
      activo:     [true, Validators.required],
    });
  }

  private loadData(id: number): void {
    this.categoriaService.getById(id).subscribe({
      next: (response) => {
        if (response?.data) this.patchForm(response.data);
      },
      error: () => this.alertService.showError('Error', 'No se pudo cargar la categoría'),
    });
  }

  private patchForm(data: CategoriaModel): void {
    this.frmCategoria.patchValue({
      nombre:      data.nombre,
      descripcion: data.descripcion,
      padreId:     data.padreId,
      activo:      data.activo,
    });
  }

  private resetForm(): void {
    this.frmCategoria?.reset({ activo: true });
  }

  async saveCategoria(): Promise<void> {
    if (this.frmCategoria.invalid) {
      this.frmCategoria.markAllAsTouched();
      this.alertService.showError('Formulario inválido', 'Complete todos los campos requeridos');
      return;
    }

    this.isSubmitting = true;
    const dto = this.buildDto();

    try {
      const response = await lastValueFrom(
        this.isEditMode
          ? this.categoriaService.update(this.categoriaId!, dto as UpdateCategoriaDto)
          : this.categoriaService.create(dto as CreateCategoriaDto)
      );

      if (response?.status === 200 || response?.status === 201) {
        this.messageService.add({
          severity: 'success',
          summary: 'Operación exitosa',
          detail: this.isEditMode ? 'Categoría actualizada' : 'Categoría creada',
          life: 3000,
        });
        this.categoriaSaved.emit(response.data as CategoriaModel);
        this.closeModal();
      }
    } catch (error: any) {
      this.alertService.showError('Error', error?.message ?? 'Error desconocido');
    } finally {
      this.isSubmitting = false;
    }
  }

  private buildDto(): CreateCategoriaDto | UpdateCategoriaDto {
    return { ...this.frmCategoria.value };
  }

  closeModal(): void {
    this.displayModal = false;
    this.resetForm();
    this.modalClosed.emit();
  }

  onModalHide(): void {
    this.closeModal();
  }

  // Helper para validación en template
  isInvalid(field: string): boolean {
    const ctrl = this.frmCategoria.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  private loadCategoriasPadre(): void {
    this.categoriaService.list().subscribe({
      next: (res) => {
        this.categoriasOptions = (res.data ?? []).map(c => ({ label: c.nombre, value: c.id }));
      }
    });
  }
}
```

## Template del formulario (usando formControlName)

```html
<!-- form-categorias.component.html -->
<p-dialog
  [(visible)]="displayModal"
  [header]="isEditMode ? 'Editar Categoría' : 'Nueva Categoría'"
  [modal]="true"
  [closable]="true"
  [draggable]="false"
  [resizable]="false"
  styleClass="aura-dialog"
  [style]="{ width: '560px' }"
  (onHide)="onModalHide()">

  <div class="form-container">
    <form [formGroup]="frmCategoria">

      <!-- Nombre -->
      <div class="field">
        <label for="nombre">Nombre <span class="required">*</span></label>
        <input
          type="text"
          pInputText
          id="nombre"
          formControlName="nombre"
          placeholder="Nombre de la categoría"
          [class.ng-invalid]="isInvalid('nombre')"
          [class.ng-dirty]="frmCategoria.get('nombre')?.touched"
        />
        <small class="p-error" *ngIf="isInvalid('nombre')">
          El nombre es obligatorio
        </small>
      </div>

      <!-- Descripción -->
      <div class="field">
        <label for="descripcion">Descripción <span class="optional">(opcional)</span></label>
        <textarea
          pInputTextarea
          id="descripcion"
          formControlName="descripcion"
          rows="3"
          [autoResize]="true"
          placeholder="Descripción de la categoría"
        ></textarea>
      </div>

      <!-- Categoría Padre (dropdown) -->
      <div class="field">
        <label for="padreId">Categoría Padre <span class="optional">(opcional)</span></label>
        <p-dropdown
          id="padreId"
          formControlName="padreId"
          [options]="categoriasOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar categoría padre"
          [showClear]="true"
        />
      </div>

      <!-- Estado -->
      <div class="field-inline">
        <label for="activo">Activo</label>
        <p-inputSwitch id="activo" formControlName="activo" />
      </div>

    </form>
  </div>

  <ng-template pTemplate="footer">
    <div class="dialog-footer">
      <p-button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        (onClick)="closeModal()"
        [disabled]="isSubmitting"
      />
      <p-button
        label="Limpiar"
        icon="pi pi-refresh"
        severity="warning"
        [outlined]="true"
        (onClick)="resetForm()"
        [disabled]="isSubmitting"
      />
      <p-button
        [label]="isEditMode ? 'Actualizar' : 'Guardar'"
        [icon]="isEditMode ? 'pi pi-check' : 'pi pi-save'"
        (onClick)="saveCategoria()"
        [loading]="isSubmitting"
        [disabled]="frmCategoria.invalid"
        styleClass="btn-aura"
      />
    </div>
  </ng-template>
</p-dialog>

<p-toast />
```

---

# ============================================================
# 9. PATRÓN DE TABLA (INDEX COMPONENT)
# ============================================================

```typescript
// index-categorias.component.ts
@Component({
  selector: 'app-index-categorias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,          // Solo para globalFilter del input de búsqueda
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    FormCategoriasComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-categorias.component.html',
  styleUrls: ['./index-categorias.component.scss'],
})
export class IndexCategoriasComponent implements OnInit {
  // Modal state
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug: string = 'create';

  // Table state
  public items: CategoriaTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 10;
  public globalFilter: string = '';
  public filtersTable!: IFilterTable<null>;

  public cols: ColsModel[] = [
    { field: 'nombre',      header: 'Nombre',      type: 'string', nameClass: 'text-left' },
    { field: 'descripcion', header: 'Descripción', type: 'string', nameClass: 'text-left' },
    { field: 'padre',       header: 'Categoría Padre', type: 'string', nameClass: 'text-left' },
    { field: 'activo',      header: 'Estado',      type: 'icon',   nameClass: 'text-center' },
  ];

  constructor(
    private readonly categoriaService: CategoriaService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
    private readonly helperService: HelpersService
  ) {}

  ngOnInit(): void {
    this.loadColumnActions();
  }

  async loadTable(lazyTable: TableLazyLoadEvent): Promise<void> {
    this.loadingTable = true;
    this.filtersTable = this.buildTableParams(lazyTable);

    try {
      const response = await lastValueFrom(this.categoriaService.page(this.filtersTable));
      this.items = response.data?.content ?? [];
      this.totalRecords = response.data?.totalElements ?? 0;
    } catch {
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
    }
  }

  private buildTableParams(lazyTable: TableLazyLoadEvent): IFilterTable<null> {
    this.rowSize = lazyTable.rows ?? this.rowSize;
    const currentPage = lazyTable.first ? Math.floor(lazyTable.first / this.rowSize) : 0;
    return {
      page: currentPage,
      rows: this.rowSize,
      search: lazyTable.globalFilter ?? null,
      order: lazyTable.sortOrder === -1 ? 'desc' : 'asc',
      order_by: lazyTable.sortField ?? 'id',
    };
  }

  async loadColumnActions(): Promise<void> {
    const col = await this.helperService.showActionsTable();
    if (col) this.cols.push(col);
  }

  filterGlobal(event: Event): void {
    this.loadTable({
      first: 0,
      rows: this.rowSize,
      globalFilter: (event.target as HTMLInputElement)?.value ?? '',
    });
  }

  async delete(id: number): Promise<void> {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar esta categoría?',
      header: 'Eliminar registro',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await lastValueFrom(this.categoriaService.delete(id));
          if (response.status === 200) {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Categoría eliminada correctamente' });
            this.loadTable({ first: 0, rows: this.rowSize });
          }
        } catch {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la categoría' });
        }
      },
    });
  }

  // Modal handlers
  openCreate(): void {
    this.modalSlug = 'create';
    this.selectedId = null;
    this.showModal = true;
  }

  openEdit(item: CategoriaTableModel): void {
    this.modalSlug = 'edit';
    this.selectedId = item.id;
    this.showModal = true;
  }

  onModalClosed(): void {
    this.showModal = false;
    this.selectedId = null;
  }

  onItemSaved(): void {
    this.showModal = false;
    this.loadTable({ first: 0, rows: this.rowSize });
  }

  // Helpers de display
  getStatusSeverity(activo: boolean): string {
    return activo ? 'success' : 'danger';
  }

  getStatusLabel(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }
}
```

```html
<!-- index-categorias.component.html -->
<div class="main-container">
  <div class="card">
    <div class="card-header">
      <h4>Gestión de Categorías</h4>
    </div>

    <div class="card-content">
      <!-- Toolbar -->
      <div class="p-toolbar mb-4">
        <div class="toolbar-left"></div>
        <div class="toolbar-right">
          <p-button
            severity="success"
            label="Nueva Categoría"
            icon="pi pi-plus"
            (click)="openCreate()"
          />
        </div>
      </div>

      <!-- Tabla -->
      <p-table
        #dt
        [value]="items"
        [loading]="loadingTable"
        styleClass="p-datatable-gridlines"
        [paginator]="true"
        [rows]="rowSize"
        [rowsPerPageOptions]="[10, 25, 50]"
        [totalRecords]="totalRecords"
        [lazy]="true"
        (onLazyLoad)="loadTable($event)"
        [tableStyle]="{ 'min-width': '50rem' }"
        [scrollable]="true"
        scrollHeight="600px"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
      >
        <!-- Caption: Buscador -->
        <ng-template pTemplate="caption">
          <div class="table-header">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input
                pInputText
                type="text"
                [(ngModel)]="globalFilter"
                (input)="filterGlobal($event)"
                placeholder="Buscar..."
                class="search-input"
              />
            </span>
          </div>
        </ng-template>

        <!-- Headers -->
        <ng-template pTemplate="header">
          <tr>
            <th *ngFor="let col of cols"
                [pSortableColumn]="col.field !== 'actions' ? col.field : undefined"
                [class]="col.nameClass"
                [style]="col.minWidth">
              {{ col.header }}
              <p-sortIcon *ngIf="col.field !== 'actions'" [field]="col.field" />
            </th>
          </tr>
        </ng-template>

        <!-- Body -->
        <ng-template pTemplate="body" let-item>
          <tr>
            <td *ngFor="let col of cols" [class]="col.nameClass">

              <!-- Estado -->
              <p-tag *ngIf="col.type === 'icon'"
                [value]="getStatusLabel(item[col.field])"
                [severity]="getStatusSeverity(item[col.field])"
              />

              <!-- Texto -->
              <span *ngIf="col.type === 'string'">
                {{ item[col.field] || '—' }}
              </span>

              <!-- Acciones -->
              <div *ngIf="col.field === 'actions'" class="action-buttons">
                <p-button icon="pi pi-pencil" severity="info" size="small"
                  (onClick)="openEdit(item)" pTooltip="Editar" tooltipPosition="top" />
                <p-button icon="pi pi-trash" severity="danger" size="small"
                  (onClick)="delete(item.id)" pTooltip="Eliminar" tooltipPosition="top" />
              </div>

            </td>
          </tr>
        </ng-template>

        <!-- Empty -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="cols.length" class="text-center p-4">
              <div class="empty-state">
                <i class="pi pi-inbox" style="font-size: 3rem; opacity: 0.3"></i>
                <p>No hay categorías registradas</p>
              </div>
            </td>
          </tr>
        </ng-template>

      </p-table>
    </div>
  </div>
</div>

<!-- Form Modal -->
<app-form-categorias
  [displayModal]="showModal"
  [categoriaId]="selectedId"
  [slug]="modalSlug"
  (modalClosed)="onModalClosed()"
  (categoriaSaved)="onItemSaved()"
/>

<p-toast />
<p-confirmDialog />
```

---

# ============================================================
# 10. REGLAS DE ORO DEL DESARROLLO FRONTEND
# ============================================================

## Formularios
```
✅ ReactiveFormsModule + FormBuilder + FormGroup
✅ formControlName en todos los inputs
✅ [class.ng-invalid] + [class.ng-dirty] para validación visual
✅ frmX.markAllAsTouched() antes de validar
✅ isInvalid(field) como helper en el TS
✅ patchValue() para cargar datos en edición
✅ reset() con valores default al cerrar modal
❌ NUNCA ngModel en formularios
❌ NUNCA acceder a form.value sin validar primero
```

## Servicios y HTTP
```
✅ lastValueFrom() para convertir Observable a Promise en métodos async
✅ try/catch/finally en todas las llamadas HTTP
✅ finally para resetear isLoading/isSubmitting siempre
✅ ResponseModel<T> y ResponseTableModel<T> tipados
✅ Verificar response.status === 200 || 201
❌ NUNCA subscribe() sin manejar error
❌ NUNCA olvidar el finally
```

## Componentes
```
✅ Standalone components siempre
✅ Separar lógica: Index (tabla) y Form (modal) son componentes distintos
✅ @Input() + @Output() para comunicación padre-hijo
✅ ConfirmationService para eliminar (nunca confirm() nativo del browser)
✅ MessageService para toasts de éxito/error
✅ providers: [MessageService, ConfirmationService] en el index component
```

## Tabla
```
✅ ColsModel[] para definir columnas
✅ IFilterTable para parámetros de paginación
✅ [lazy]="true" + (onLazyLoad) en p-table
✅ loadTable(lazyTable: TableLazyLoadEvent) tipado
✅ buildTableParams() método privado para construir parámetros
✅ totalRecords desde response.data.totalElements
✅ loadColumnActions() para agregar columna de acciones dinámicamente
```

## Nomenclatura
```
✅ frm{Entidad}         → FormGroup (frmCategoria, frmProducto)
✅ index-{entidad}/     → carpeta del componente tabla
✅ form-{entidad}/      → carpeta del componente formulario
✅ {entidad}.service.ts → servicio
✅ {entidad}.model.ts   → modelo completo
✅ {entidad}-table.model.ts → modelo para tabla
✅ create-{entidad}.dto.ts  → DTO creación
✅ update-{entidad}.dto.ts  → DTO actualización
✅ showModal / selectedId / modalSlug → variables del modal en index
✅ isSubmitting / isEditMode          → flags del form
```

---

# ============================================================
# 11. DESIGN SYSTEM - AURA POS
# ============================================================

```scss
// styles/_variables.scss
:root {
  --aura-blue:          #2E6CF6;
  --aura-blue-light:    #4DA3FF;
  --aura-purple:        #7B4DFF;
  --aura-gradient:      linear-gradient(135deg, #2E6CF6 0%, #7B4DFF 100%);
  --aura-gradient-soft: linear-gradient(135deg, rgba(46,108,246,0.1) 0%, rgba(123,77,255,0.1) 100%);
  --aura-bg:            #F4F6FA;
  --aura-surface:       #FFFFFF;
  --aura-text:          #2D2D2D;
  --aura-text-muted:    #6B7280;
  --aura-border:        #E0E3EB;
  --aura-success:       #10B981;
  --aura-warning:       #F59E0B;
  --aura-danger:        #EF4444;
  --sidebar-width:      260px;
  --sidebar-collapsed:  72px;
}
```

### Tipografía
- **Principal**: `Outfit` (Google Fonts) — títulos, labels, botones
- **Numérica**: `JetBrains Mono` — precios, cantidades, códigos, IDs

### Botones
- Primario: degradado `--aura-gradient` con sombra azul
- Secundario: borde gris, fondo transparente
- Cancelar: borde gris, hover rojo
- Eliminar: severity="danger" de PrimeNG

### Cards
- `border-radius: 16px`
- `border: 1px solid var(--aura-border)`
- `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`

---

# ============================================================
# 12. CONFIGURACIÓN APP.CONFIG.TS
# ============================================================

```typescript
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageService, ConfirmationService } from 'primeng/api';
import { GlobalInterceptor } from './core/interceptors/global.interceptor';
import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeCo from '@angular/common/locales/es-CO';

registerLocaleData(localeCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    { provide: HTTP_INTERCEPTORS, useClass: GlobalInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'es-CO' },
    MessageService,
    ConfirmationService,
  ]
};
```

---

# ============================================================
# 13. VARIABLES DE ENTORNO
# ============================================================

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.aurapos.co/api',
};
```

---

# ============================================================
# 14. ORDEN DE DESARROLLO DE CADA MÓDULO
# ============================================================

Para cada feature nueva, seguir este orden:

```
1. Crear modelos:
   - {entidad}.model.ts
   - {entidad}-table.model.ts
   - create-{entidad}.dto.ts
   - update-{entidad}.dto.ts

2. Crear servicio:
   - {entidad}.service.ts
   (page, getById, create, update, delete, list)

3. Crear componente formulario (form/):
   - initForm() con FormBuilder
   - ngOnChanges() para cargar datos en edición
   - patchForm() para cargar datos
   - buildDto() para construir el objeto
   - saveEntity() con validación, try/catch/finally

4. Crear componente tabla (index/):
   - cols: ColsModel[] con columnas
   - loadTable(lazyTable) con lastValueFrom
   - buildTableParams() privado
   - openCreate() / openEdit(item)
   - delete(id) con ConfirmationService
   - onItemSaved() recarga tabla

5. Agregar ruta en app.routes.ts

6. Agregar ítem en sidebar menu config
```

---

# ============================================================
# 15. CHECKLIST ANTES DE HACER COMMIT
# ============================================================

```
□ ¿El formulario usa formControlName? (NO ngModel)
□ ¿Todos los campos requeridos tienen Validators.required?
□ ¿Los errores se muestran con isInvalid(field)?
□ ¿El servicio está tipado con ResponseModel<T>?
□ ¿Todas las llamadas HTTP tienen try/catch/finally?
□ ¿isSubmitting se resetea en el finally?
□ ¿El modal emite modalClosed y entitySaved?
□ ¿La tabla usa [lazy]="true" y (onLazyLoad)?
□ ¿El delete usa ConfirmationService?
□ ¿Los toasts usan MessageService con severity correcto?
□ ¿El componente es standalone: true?
□ ¿Los imports del componente incluyen todo lo necesario?
```