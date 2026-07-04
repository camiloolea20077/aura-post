import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { lastValueFrom } from 'rxjs';

import { ObligacionService } from '../../../core/services/obligacion.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { CreateObligacionDto } from '../../../core/models/obligacion.model';
import { AlertService } from '../../../shared/pipes/alert.service';
import { TerceroPickerComponent } from '../../../shared/components/tercero-picker/tercero-picker.component';

@Component({
  selector: 'app-form-obligacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    TerceroPickerComponent,
  ],
  templateUrl: './form-obligacion.component.html',
  styleUrls: ['./form-obligacion.component.scss'],
})
export class FormObligacionComponent implements OnInit {
  frm: FormGroup;
  saving = false;

  cuentasBancariasOpts: { label: string; value: number }[] = [];
  terceroId: number | null = null;
  terceroNombre: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ObligacionService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly router: Router,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      entidad: ['', Validators.required],
      numero: [''],
      cuentaBancariaId: [null, Validators.required],
      montoPrincipal: [null, [Validators.required, Validators.min(1)]],
      tasaMensual: [null, [Validators.required, Validators.min(0)]],
      plazoMeses: [null, [Validators.required, Validators.min(1)]],
      fechaDesembolso: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadCuentasBancarias();
  }

  private async loadCuentasBancarias(): Promise<void> {
    try {
      const res = await lastValueFrom(this.cuentaBancariaService.list());
      this.cuentasBancariasOpts = (res?.data ?? [])
        .filter((c) => c.activa)
        .map((c) => ({ label: c.nombre, value: c.id }));
      this.cdr.markForCheck();
    } catch {
      this.cuentasBancariasOpts = [];
    }
  }

  onTerceroSel(ev: { id: number; nombre: string } | null): void {
    this.terceroId = ev?.id ?? null;
    this.terceroNombre = ev?.nombre ?? null;
    // Autocompleta el nombre de la entidad con el del tercero elegido.
    if (ev?.nombre) this.frm.patchValue({ entidad: ev.nombre });
  }

  private fmtFecha(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async guardar(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      this.alert.showError('Validación', 'Completa los campos obligatorios.');
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const v = this.frm.value;
      const dto: CreateObligacionDto = {
        entidad: v.entidad,
        numero: v.numero || null,
        montoPrincipal: v.montoPrincipal,
        tasaMensual: v.tasaMensual,
        plazoMeses: v.plazoMeses,
        fechaDesembolso: this.fmtFecha(v.fechaDesembolso),
        terceroId: this.terceroId,
        cuentaBancariaId: v.cuentaBancariaId,
      };
      const res = await lastValueFrom(this.service.crear(dto));
      this.alert.showSuccess('Listo', 'Préstamo creado con su tabla de amortización.');
      this.router.navigate(['/obligaciones', res.data.id]);
    } catch {
      this.alert.showError('Error', 'No se pudo crear el préstamo.');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.router.navigate(['/obligaciones']);
  }
}
