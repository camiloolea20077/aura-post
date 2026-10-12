import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { lastValueFrom } from 'rxjs';

import { EmpleadoModel } from '../../../../core/models/nomina.model';
import { NominaService } from '../../../../core/services/nomina.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormTerceroPlanoComponent } from '../../../terceros/form-plano/form-tercero-plano.component';
import { CuentasBancariasEmpleadoComponent } from '../hoja-vida/cuentas-bancarias-empleado.component';
import { ExperienciaEmpleadoComponent } from '../hoja-vida/experiencia-empleado.component';
import { FamiliaresEmpleadoComponent } from '../hoja-vida/familiares-empleado.component';

/**
 * Hoja de vida del empleado, en pestañas: datos personales (y control de
 * asistencia), banco, familia e historial laboral. Lo laboral de la empresa
 * —cargo, salario, centros de costo, aportes— se maneja en Vinculaciones.
 */
@Component({
  selector: 'app-empleado-editar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    SkeletonModule,
    TabViewModule,
    FormTerceroPlanoComponent,
    CuentasBancariasEmpleadoComponent,
    FamiliaresEmpleadoComponent,
    ExperienciaEmpleadoComponent,
  ],
  templateUrl: './empleado-editar.component.html',
  styleUrls: ['./empleado-editar.component.scss'],
})
export class EmpleadoEditarComponent implements OnInit {
  empleadoId!: number;
  empleado: EmpleadoModel | null = null;
  cargando = true;

  readonly opcionesAsistencia = [
    { label: 'Sí: exige la asistencia aprobada del período', value: true },
    { label: 'No: se liquida sin control de asistencia', value: false },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly nomina: NominaService,
    private readonly alert: AlertService,
  ) {}

  ngOnInit(): void {
    this.empleadoId = +this.route.snapshot.params['id'];
    void this.cargar();
  }

  get nombre(): string {
    return this.empleado ? `${this.empleado.nombres} ${this.empleado.apellidos}` : 'Empleado';
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    try {
      const res = await lastValueFrom(this.nomina.getEmpleadoById(this.empleadoId));
      this.empleado = res?.data ?? null;
    } catch {
      this.alert.showError('Empleado', 'No se pudo cargar el empleado.');
    } finally {
      this.cargando = false;
    }
  }

  /** Si su liquidación exige la asistencia aprobada (configuración MIXTA). */
  async cambiarAsistencia(requiere: boolean): Promise<void> {
    if (!this.empleado) return;
    try {
      await lastValueFrom(this.nomina.cambiarControlAsistencia(this.empleado.id, requiere));
      this.empleado.requiereControlAsistencia = requiere;
      this.alert.showSuccess('Guardado', 'Control de asistencia actualizado.');
    } catch {
      this.alert.showError('Error', 'No se pudo actualizar el control de asistencia.');
    }
  }

  volver(): void {
    void this.router.navigate(['/nomina/empleados']);
  }
}
