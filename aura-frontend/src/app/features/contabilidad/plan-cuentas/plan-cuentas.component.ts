import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { PlanCuentasCacheService } from '../../../core/services/plan-cuentas-cache.service';
import { TreeNode } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  PlanCuentaModel,
  CreatePlanCuentaDto,
} from '../../../core/models/contabilidad.model';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { CuentaAutocompleteComponent } from '../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';

@Component({
  selector: 'app-plan-cuentas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CuentaAutocompleteComponent,
    PuedeDirective,
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TreeTableModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    TagModule,
    ToastModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    CheckboxModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './plan-cuentas.component.html',
  styleUrls: ['./plan-cuentas.component.scss'],
})
export class PlanCuentasComponent implements OnInit {
  cuentas: PlanCuentaModel[] = [];
  loading = false;
  showDialog = false;
  saving = false;
  editId: number | null = null;
  search = '';

  form: CreatePlanCuentaDto = this.emptyForm();

  readonly tipoOpts = [
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Pasivo', value: 'PASIVO' },
    { label: 'Patrimonio', value: 'PATRIMONIO' },
    { label: 'Ingreso', value: 'INGRESO' },
    { label: 'Gasto', value: 'GASTO' },
    { label: 'Costo', value: 'COSTO' },
    { label: 'Orden', value: 'ORDEN' },
  ];

  readonly naturalezaOpts = [
    { label: 'Débito', value: 'DEBITO' },
    { label: 'Crédito', value: 'CREDITO' },
  ];

  readonly nivelOpts = [1, 2, 3, 4, 5].map((n) => ({
    label: `Nivel ${n}`,
    value: n,
  }));

  /**
   * Árbol del PUC: clase → grupo → cuenta → subcuenta → auxiliar, cada nivel se
   * despliega en la misma tabla. Con búsqueda, se muestran las coincidencias con
   * todo su camino abierto.
   */
  nodos: TreeNode<PlanCuentaModel>[] = [];
  private expandidos = new Set<number>();

  /** Rearma el árbol con la búsqueda actual, conservando lo desplegado. */
  armarArbol(): void {
    const q = this.search.trim().toLowerCase();
    this.porCodigo = undefined;
    const porId = new Map(this.cuentas.map((c) => [c.id, c]));
    let visibles: Set<number> | null = null;
    if (q) {
      visibles = new Set<number>();
      for (const c of this.cuentas) {
        if (c.codigo.toLowerCase().startsWith(q) || c.nombre.toLowerCase().includes(q)) {
          // La coincidencia y todo su camino hasta la clase.
          let x: PlanCuentaModel | undefined = c;
          while (x && !visibles.has(x.id)) {
            visibles.add(x.id);
            const p = this.padreDe(x, porId);
            x = p != null ? porId.get(p) : undefined;
          }
        }
      }
    }
    const hijos = new Map<number | null, PlanCuentaModel[]>();
    for (const c of this.cuentas) {
      if (visibles && !visibles.has(c.id)) continue;
      const padre = this.padreDe(c, porId);
      if (!hijos.has(padre)) hijos.set(padre, []);
      hijos.get(padre)!.push(c);
    }
    const nodo = (c: PlanCuentaModel): TreeNode<PlanCuentaModel> => {
      const ch = (hijos.get(c.id) ?? []).sort((a, b) => a.codigo.localeCompare(b.codigo));
      return {
        key: String(c.id),
        data: c,
        // Con búsqueda se abre todo el camino; sin ella, lo que el usuario abrió.
        expanded: q ? true : this.expandidos.has(c.id),
        leaf: ch.length === 0,
        children: ch.map(nodo),
      };
    };
    this.nodos = (hijos.get(null) ?? [])
      .sort((a, b) => a.codigo.localeCompare(b.codigo))
      .map(nodo);
    this.cdr.markForCheck();
  }

  /**
   * Padre de la cuenta: el que trae guardado o, si le falta (cuentas creadas
   * por procesos viejos), la cuenta con el prefijo de código más largo.
   */
  private padreDe(c: PlanCuentaModel, porId: Map<number, PlanCuentaModel>): number | null {
    if (c.padreId != null && porId.has(c.padreId)) return c.padreId;
    if (!this.porCodigo) {
      this.porCodigo = new Map(this.cuentas.map((x) => [x.codigo, x.id]));
    }
    for (let largo = c.codigo.length - 1; largo >= 1; largo--) {
      const id = this.porCodigo.get(c.codigo.substring(0, largo));
      if (id != null) return id;
    }
    return null;
  }
  private porCodigo?: Map<string, number>;

  /**
   * Cada despliegue rearma la lista de filas con objetos nuevos; sin trackBy
   * Angular borraba y volvía a pintar todo el árbol, la página se encogía un
   * instante y el scroll saltaba arriba. Con la llave del nodo solo se agregan
   * las filas nuevas.
   */
  readonly porNodo = (_: number, fila: { node?: TreeNode<PlanCuentaModel> }) =>
    fila?.node?.key ?? fila;

  onExpand(e: { node: TreeNode<PlanCuentaModel> }): void {
    if (e.node.data) this.expandidos.add(e.node.data.id);
    this.conservarScroll();
  }

  onCollapse(e: { node: TreeNode<PlanCuentaModel> }): void {
    if (e.node.data) this.expandidos.delete(e.node.data.id);
    this.conservarScroll();
  }

  /** Por si acaso: deja el scroll donde estaba después de repintar. */
  private conservarScroll(): void {
    const cont = document.querySelector('.aura-content') as HTMLElement | null;
    const y = cont?.scrollTop ?? window.scrollY;
    requestAnimationFrame(() => {
      if (cont) cont.scrollTop = y;
      else window.scrollTo({ top: y });
    });
  }

  /** Abre todo hasta el nivel indicado (1 = solo clases, 5 = todo). */
  expandirHasta(nivel: number): void {
    this.expandidos = new Set(
      this.cuentas.filter((c) => c.nivel < nivel).map((c) => c.id),
    );
    this.armarArbol();
  }

  get totalCuentas(): number {
    return this.cuentas.length;
  }

  get padreOpts() {
    return [
      { label: '— Sin padre —', value: null },
      ...this.cuentas.map((c) => ({
        label: `${c.codigo} - ${c.nombre}`,
        value: c.id,
      })),
    ];
  }

  constructor(
    private readonly service: ContabilidadService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly cachePlan: PlanCuentasCacheService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    // Los buscadores de cuenta de las demás pantallas deben ver los cambios.
    this.cachePlan.invalidar();
    try {
      const res = await lastValueFrom(this.service.listarPlan());
      this.cuentas = res?.data ?? [];
      this.armarArbol();
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo cargar el plan de cuentas',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  seedPUC(): void {
    this.confirmationService.confirm({
      message:
        '¿Cargar el PUC completo (clases 1 a 9 con grupos, cuentas, subcuentas y auxiliares)? ' +
        'Solo se agregan las cuentas que falten: las que ya tiene no cambian.',
      header: 'Cargar PUC completo',
      icon: 'pi pi-database',
      acceptLabel: 'Sí, cargar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          const res = await lastValueFrom(this.service.seedPUC());
          await this.cargar();
          this.alertService.showSuccess(
            'PUC cargado',
            res?.message ?? 'Plan de cuentas completo',
          );
        } catch {
          this.alertService.showError('Error', 'No se pudo cargar el PUC');
        }
      },
    });
  }

  abrirNuevo(): void {
    this.editId = null;
    this.form = this.emptyForm();
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  /** Nueva cuenta debajo de otra: hereda tipo y naturaleza, y el código empieza como el del padre. */
  abrirNuevaHija(p: PlanCuentaModel): void {
    this.editId = null;
    this.form = {
      ...this.emptyForm(),
      codigo: p.codigo,
      tipo: p.tipo,
      naturaleza: p.naturaleza,
      nivel: Math.min((p.nivel ?? 1) + 1, 5),
      padreId: p.id,
      auxiliar: true,
    };
    this.expandidos.add(p.id);
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  abrirEditar(c: PlanCuentaModel): void {
    this.editId = c.id;
    this.form = {
      codigo: c.codigo,
      nombre: c.nombre,
      tipo: c.tipo,
      naturaleza: c.naturaleza,
      nivel: c.nivel,
      padreId: c.padreId ?? null,
      auxiliar: c.auxiliar,
      esMedioPago: !!c.esMedioPago,
      codigoDian: c.codigoDian ?? '',
    };
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (!this.form.codigo || !this.form.nombre || !this.form.tipo) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.editId) {
        await lastValueFrom(
          this.service.actualizarCuenta(this.editId, this.form),
        );
        this.alertService.showSuccess('Actualizado', '');
      } else {
        await lastValueFrom(this.service.crearCuenta(this.form));
        this.alertService.showSuccess('Cuenta creada', '');
      }
      this.showDialog = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo guardar',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  eliminar(c: PlanCuentaModel): void {
    this.confirmationService.confirm({
      message: `¿Desactivar la cuenta "${c.codigo} - ${c.nombre}"?`,
      header: 'Desactivar cuenta',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminarCuenta(c.id));
          await this.cargar();
          this.alertService.showSuccess('Cuenta desactivada', '');
        } catch {
          this.alertService.showError('Error', 'No se pudo desactivar');
        }
      },
    });
  }

  tipoSeverity(
    tipo: string,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const map: Record<
      string,
      'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'
    > = {
      ACTIVO: 'info',
      PASIVO: 'danger',
      PATRIMONIO: 'warn',
      INGRESO: 'success',
      GASTO: 'secondary',
      COSTO: 'contrast',
      ORDEN: 'secondary',
    };
    return map[tipo] ?? 'secondary';
  }

  private emptyForm(): CreatePlanCuentaDto {
    return {
      codigo: '',
      nombre: '',
      tipo: '',
      naturaleza: 'DEBITO',
      nivel: 1,
      padreId: null,
      auxiliar: false,
      esMedioPago: false,
      codigoDian: '',
    };
  }
}
