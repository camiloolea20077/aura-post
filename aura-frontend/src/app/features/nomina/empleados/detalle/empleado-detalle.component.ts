import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { lastValueFrom } from 'rxjs';

import { NominaService } from '../../../../core/services/nomina.service';
import { ContratoService } from '../../../../core/services/contrato.service';
import { EmpleadoModel } from '../../../../core/models/nomina.model';
import { ContratoTableModel } from '../../../../core/models/contrato.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormTerceroPlanoComponent } from '../../../terceros/form-plano/form-tercero-plano.component';
import { IndexContratosComponent } from '../../contratos/index/index-contratos.component';
import { AfiliacionesComponent } from '../../contratos/afiliaciones/afiliaciones.component';
import { RetefuenteComponent } from '../../contratos/retefuente/retefuente.component';
import { EmbargosComponent } from '../../contratos/embargos/embargos.component';

/**
 * Detalle de un empleado (maestro-detalle).
 *
 * <p>Arriba: su identidad, editada con el mismo formulario de terceros (un
 * empleado <b>es</b> un tercero). Abajo, tabs con lo que antes eran botones
 * sueltos por contrato: contratos, afiliaciones, retenciones y embargos.
 *
 * <p>Afiliaciones/retenciones/embargos son por contrato: operan sobre el
 * contrato seleccionado (el principal por defecto).
 */
@Component({
  selector: 'app-empleado-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TabViewModule,
    DropdownModule,
    SkeletonModule,
    ToggleSwitchModule,
    FormTerceroPlanoComponent,
    IndexContratosComponent,
    AfiliacionesComponent,
    RetefuenteComponent,
    EmbargosComponent,
  ],
  templateUrl: './empleado-detalle.component.html',
  styleUrls: ['./empleado-detalle.component.scss'],
})
export class EmpleadoDetalleComponent implements OnInit {
  empleadoId!: number;
  empleado: EmpleadoModel | null = null;
  loading = true;

  contratos: ContratoTableModel[] = [];
  /** Contrato sobre el que operan afiliaciones/retenciones/embargos. */
  contratoSelId: number | null = null;

  /** La identidad arranca recortada; se expande con un botón. */
  mostrarIdentidad = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly nominaService: NominaService,
    private readonly contratoService: ContratoService,
    private readonly alert: AlertService,
  ) {}

  ngOnInit(): void {
    this.empleadoId = +this.route.snapshot.params['id'];
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.nominaService.getEmpleadoById(this.empleadoId),
      );
      this.empleado = res?.data ?? null;
      await this.cargarContratos();
    } catch {
      this.alert.showError('Error', 'No se pudo cargar el empleado.');
    } finally {
      this.loading = false;
    }
  }

  async cargarContratos(): Promise<void> {
    const res = await lastValueFrom(
      this.contratoService.porEmpleado(this.empleadoId),
    );
    this.contratos = res?.data ?? [];
    // El principal activo; si no, el primer activo; si no, el primero.
    const elegido =
      this.contratos.find((c) => c.esPrincipal && c.estado === 'ACTIVO') ??
      this.contratos.find((c) => c.estado === 'ACTIVO') ??
      this.contratos[0];
    this.contratoSelId = elegido?.id ?? null;
  }

  get terceroId(): number | null {
    return this.empleado?.terceroId ?? null;
  }

  get nombre(): string {
    return this.empleado
      ? `${this.empleado.nombres} ${this.empleado.apellidos}`
      : 'Empleado';
  }

  /** Al guardar la identidad, recarga los datos y vuelve a recortar. */
  onIdentidadGuardada(): void {
    this.mostrarIdentidad = false;
    this.cargar();
  }

  /** Marca si este empleado requiere control de asistencia (config MIXTA). */
  async cambiarAsistencia(requiere: boolean): Promise<void> {
    if (!this.empleado) return;
    try {
      await lastValueFrom(
        this.nominaService.cambiarControlAsistencia(this.empleado.id, requiere),
      );
      this.empleado.requiereControlAsistencia = requiere;
      this.alert.showSuccess(
        'Guardado',
        requiere
          ? 'Este empleado requiere asistencia aprobada para liquidar.'
          : 'Este empleado se liquida sin control de asistencia.',
      );
    } catch {
      this.alert.showError('Error', 'No se pudo actualizar.');
    }
  }

  contratoLabel(c: ContratoTableModel): string {
    return `${c.tipoContrato} · ${c.cargo || 'Sin cargo'} (${c.estado})`;
  }

  volver(): void {
    this.router.navigate(['/nomina/empleados']);
  }
}
