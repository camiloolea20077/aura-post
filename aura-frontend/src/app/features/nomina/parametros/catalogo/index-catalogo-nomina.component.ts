import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  AtributoCatalogoModel,
  NominaCatalogoModel,
  TipoCatalogoNominaModel,
} from '../../../../core/models/nomina-parametros.model';
import { NominaCatalogoService } from '../../../../core/services/nomina-catalogo.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { textoAtributo } from './atributos-catalogo.util';
import { FormCatalogoNominaComponent } from './form-catalogo-nomina.component';

/**
 * Pantalla de un catálogo de nómina (niveles y tipos de cargo, tipos de
 * embargo, motivos de retiro…). Una sola pantalla sirve a todos: el catálogo
 * sale de la URL (/nomina/parametros/:catalogo) y sus columnas propias, de la
 * definición del back. Cada catálogo tiene su ítem de menú y su permiso.
 */
@Component({
  selector: 'app-index-catalogo-nomina',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    FormCatalogoNominaComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './index-catalogo-nomina.component.html',
  styleUrls: ['../parametros-index.scss'],
})
export class IndexCatalogoNominaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  catalogo = '';
  definicion: TipoCatalogoNominaModel | null = null;

  filas: NominaCatalogoModel[] = [];
  totalFilas = 0;
  cargando = true;
  busqueda = '';
  pagina = 0;
  tamano = 10;

  mostrarForm = false;
  seleccionado: NominaCatalogoModel | null = null;

  constructor(
    private readonly service: NominaCatalogoService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // El mismo componente se reutiliza al pasar de un catálogo a otro.
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => {
        this.catalogo = p.get('catalogo') ?? '';
        this.busqueda = '';
        this.pagina = 0;
        this.definicion = null;
        void this.iniciar();
      });
  }

  get permiso(): string {
    return `recursos-humanos.${this.catalogo}`;
  }

  get camposPropios(): AtributoCatalogoModel[] {
    return this.definicion?.atributos ?? [];
  }

  private async iniciar(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.tipo(this.catalogo));
      this.definicion = res.data;
    } catch {
      this.alert.showError(
        'Catálogo',
        'No se encontró el catálogo solicitado.',
      );
    }
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.page(this.catalogo, {
          page: this.pagina,
          rows: this.tamano,
          search: this.busqueda || null,
        }),
      );
      this.filas = res?.data?.content ?? [];
      this.totalFilas = res?.data?.totalElements ?? 0;
    } catch {
      this.filas = [];
      this.totalFilas = 0;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onPagina(e: { first: number; rows: number }): void {
    this.pagina = e.first / e.rows;
    this.tamano = e.rows;
    void this.cargar();
  }

  buscar(): void {
    this.pagina = 0;
    void this.cargar();
  }

  limpiarBusqueda(): void {
    if (!this.busqueda) return;
    this.busqueda = '';
    this.buscar();
  }

  nuevo(): void {
    this.seleccionado = null;
    this.mostrarForm = true;
  }

  editar(e: NominaCatalogoModel): void {
    this.seleccionado = e;
    this.mostrarForm = true;
  }

  textoAtributo(a: AtributoCatalogoModel, e: NominaCatalogoModel): string {
    return textoAtributo(a, e.atributos?.[a.nombre]);
  }

  confirmarEliminar(e: NominaCatalogoModel): void {
    this.confirm.confirm({
      message: `¿Eliminar <b>${e.nombre}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(e),
    });
  }

  private async eliminar(e: NominaCatalogoModel): Promise<void> {
    try {
      await lastValueFrom(this.service.eliminar(this.catalogo, e.id));
      this.alert.showSuccess('Eliminado', `${e.nombre} eliminado`);
      void this.cargar();
    } catch (err: any) {
      this.alert.showError(
        'No se pudo eliminar',
        err?.error?.message ?? 'Intente de nuevo.',
      );
    }
  }
}
