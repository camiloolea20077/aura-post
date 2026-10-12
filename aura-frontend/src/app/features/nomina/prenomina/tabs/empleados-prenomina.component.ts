import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { lastValueFrom } from 'rxjs';

import {
  CandidatoNominaModel,
  DocumentoNominaModel,
  EmpleadoDocumentoModel,
  OPCIONES_TIPO_LISTA,
  TipoListaNomina,
} from '../../../../core/models/nomina-documento.model';
import { NominaCatalogoService } from '../../../../core/services/nomina-catalogo.service';
import { NominaDocumentoService } from '../../../../core/services/nomina-documento.service';
import { NominaTipoVinculacionService } from '../../../../core/services/nomina-tipo-vinculacion.service';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';

type Opcion = { label: string; value: number };

/**
 * Pestaña Empleados de la prenómina: agregar por "tipo de lista" (un empleado,
 * vinculaciones, grupo, tipo de vinculación o todos), ver la lista y quitar.
 * Los que no entran se muestran con su causa.
 */
@Component({
  selector: 'app-empleados-prenomina',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
    TerceroAutocompleteComponent,
    PuedeDirective,
  ],
  templateUrl: './empleados-prenomina.component.html',
  styleUrls: ['./empleados-prenomina.component.scss'],
})
export class EmpleadosPrenominaComponent implements OnInit {
  @Input({ required: true }) documento!: DocumentoNominaModel;
  @Input() editable = false;
  /** Cambió la lista (para refrescar el conteo del encabezado). */
  @Output() cambio = new EventEmitter<void>();

  filas: EmpleadoDocumentoModel[] = [];
  /** Texto del buscador de la tabla (filtro global de p-table). */
  busqueda = '';
  seleccion: EmpleadoDocumentoModel[] = [];
  cargando = true;
  agregando = false;

  readonly opcionesTipoLista = OPCIONES_TIPO_LISTA;
  tipoLista: TipoListaNomina = 'EMPLEADO';
  terceroId: number | null = null;
  ids: number[] = [];

  vinculaciones: Opcion[] = [];
  grupos: Opcion[] = [];
  tiposVinculacion: Opcion[] = [];
  omitidos: CandidatoNominaModel[] = [];

  constructor(
    private readonly service: NominaDocumentoService,
    private readonly catalogos: NominaCatalogoService,
    private readonly tipos: NominaTipoVinculacionService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.cargar();
    if (this.editable) void this.cargarOpciones();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.empleados(this.documento.id));
      this.filas = res?.data ?? [];
    } catch {
      this.filas = [];
    } finally {
      this.seleccion = [];
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  /** Opciones de los selectores: vinculaciones que pueden entrar, grupos y tipos. */
  private async cargarOpciones(): Promise<void> {
    const [candidatos, grupos, tipos] = await Promise.allSettled([
      lastValueFrom(this.service.candidatos(this.documento.id)),
      lastValueFrom(this.catalogos.activos('grupos-nomina')),
      lastValueFrom(this.tipos.activos()),
    ]);
    if (candidatos.status === 'fulfilled') {
      this.vinculaciones = (candidatos.value?.data ?? [])
        .filter((c) => !c.motivo)
        .map((c) => ({
          label: `${c.codigoVinculacion ?? 'Sin código'} · ${c.empleadoNombre}`,
          value: c.contratoId,
        }));
    }
    if (grupos.status === 'fulfilled') {
      this.grupos = (grupos.value?.data ?? []).map((g) => ({ label: g.nombre, value: g.id }));
    }
    if (tipos.status === 'fulfilled') {
      this.tiposVinculacion = (tipos.value?.data ?? []).map((t) => ({ label: t.nombre, value: t.id }));
    }
    this.cdr.markForCheck();
  }

  /** Opciones del multiselect según el tipo de lista. */
  get opcionesIds(): Opcion[] {
    if (this.tipoLista === 'VINCULACION') return this.vinculaciones;
    if (this.tipoLista === 'GRUPO') return this.grupos;
    if (this.tipoLista === 'TIPO_VINCULACION') return this.tiposVinculacion;
    return [];
  }

  get puedeAgregar(): boolean {
    if (this.tipoLista === 'TODOS') return true;
    if (this.tipoLista === 'EMPLEADO') return !!this.terceroId;
    return this.ids.length > 0;
  }

  onTipoLista(): void {
    this.ids = [];
    this.terceroId = null;
  }

  async agregar(): Promise<void> {
    if (!this.puedeAgregar) return;
    const ids = this.tipoLista === 'EMPLEADO' ? [this.terceroId!] : this.tipoLista === 'TODOS' ? [] : this.ids;
    this.agregando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.agregarEmpleados(this.documento.id, { tipoLista: this.tipoLista, ids }),
      );
      const r = res.data;
      this.omitidos = r.omitidos;
      if (r.agregados > 0) {
        this.alert.showSuccess('Empleados', `${r.agregados} empleado(s) agregado(s)`);
      } else {
        this.alert.showWarn('Empleados', 'Ninguno se agregó: revise las causas abajo.');
      }
      this.onTipoLista();
      await this.cargar();
      void this.cargarOpciones();
      this.cambio.emit();
    } catch (err: any) {
      this.alert.showError('No se pudo agregar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.agregando = false;
      this.cdr.markForCheck();
    }
  }

  confirmarQuitar(filas: EmpleadoDocumentoModel[]): void {
    if (filas.length === 0) return;
    const quien = filas.length === 1 ? `a <b>${filas[0].empleadoNombre}</b>` : `<b>${filas.length}</b> empleados`;
    this.confirm.confirm({
      message: `¿Quitar ${quien} de la prenómina? Se pierde lo que tengan liquidado.`,
      header: 'Quitar empleados',
      icon: 'pi pi-user-minus',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.quitar(filas.map((f) => f.nominaId)),
    });
  }

  private async quitar(nominaIds: number[]): Promise<void> {
    try {
      await lastValueFrom(this.service.quitarEmpleados(this.documento.id, nominaIds));
      this.alert.showSuccess('Empleados', `${nominaIds.length} empleado(s) quitado(s)`);
      await this.cargar();
      void this.cargarOpciones();
      this.cambio.emit();
    } catch (err: any) {
      this.alert.showError('No se pudo quitar', err?.error?.message ?? 'Intente de nuevo.');
    }
  }

  cerrarOmitidos(): void {
    this.omitidos = [];
  }
}
