import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { lastValueFrom } from 'rxjs';

import { NominaService } from '../../../../core/services/nomina.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormTerceroPlanoComponent } from '../../../terceros/form-plano/form-tercero-plano.component';

/**
 * Alta de un empleado (flujo nuevo).
 *
 * <p>Se crea primero la identidad como tercero (con el form plano, rol EMPLEADO
 * y datos bancarios). Al guardarse, se crea el empleado enlazado y se cae en su
 * ficha, donde se agrega el primer contrato (salario, tipo, ARL). Así los datos
 * no se duplican: el banco vive en el tercero, el salario en el contrato.
 */
@Component({
  selector: 'app-empleado-nuevo',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormTerceroPlanoComponent],
  templateUrl: './empleado-nuevo.component.html',
})
export class EmpleadoNuevoComponent {
  creando = false;

  constructor(
    private readonly router: Router,
    private readonly nominaService: NominaService,
    private readonly alert: AlertService,
  ) {}

  /** El form de tercero ya guardó la identidad; ahora se crea el empleado. */
  async onTerceroGuardado(terceroId: number | undefined): Promise<void> {
    if (!terceroId || this.creando) return;
    this.creando = true;
    try {
      const res = await lastValueFrom(this.nominaService.crearEmpleadoDesdeTercero(terceroId));
      const empleadoId = res?.data?.id;
      this.alert.showSuccess('Empleado creado', 'Ahora crea su contrato en la ficha.');
      if (empleadoId) {
        this.router.navigate(['/nomina/empleados', empleadoId, 'ficha']);
      } else {
        this.router.navigate(['/nomina/empleados']);
      }
    } catch (err: any) {
      // Si el tercero quedó creado pero el empleado no, el mensaje del backend
      // lo explica (p. ej. documento duplicado).
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo crear el empleado.');
    } finally {
      this.creando = false;
    }
  }

  volver(): void {
    this.router.navigate(['/nomina/empleados']);
  }
}
