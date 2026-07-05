import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { LaboralService } from '../../core/services/laboral.service';
import { AlertService } from '../../shared/pipes/alert.service';
import { JornadaConfigModel } from '../../core/models/laboral.model';

@Component({
  selector: 'app-config-laboral',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './config-laboral.component.html',
  styleUrls: ['./config-laboral.component.scss'],
})
export class ConfigLaboralComponent implements OnInit {
  rows: JornadaConfigModel[] = [];
  loading = false;
  showForm = false;
  saving = false;
  form: JornadaConfigModel = this.empty();

  // p-calendar usa Date; el modelo va como "yyyy-MM-dd".
  vigInicio: Date | null = null;
  vigFin: Date | null = null;

  constructor(
    private readonly service: LaboralService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.jornadaList());
      this.rows = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la configuración');
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  nuevo(): void {
    this.form = this.empty();
    this.vigInicio = null;
    this.vigFin = null;
    this.showForm = true;
    this.cdr.markForCheck();
  }

  editar(c: JornadaConfigModel): void {
    this.form = { ...c };
    this.vigInicio = this.parse(c.fechaInicioVigencia);
    this.vigFin = this.parse(c.fechaFinVigencia);
    this.showForm = true;
    this.cdr.markForCheck();
  }

  cancelar(): void {
    this.showForm = false;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    this.form.fechaInicioVigencia = this.toISO(this.vigInicio) ?? '';
    this.form.fechaFinVigencia = this.toISO(this.vigFin);
    if (!this.form.fechaInicioVigencia) {
      this.alertService.showWarn('Requerido', 'La fecha de inicio de vigencia es obligatoria');
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.jornadaGuardar(this.form));
      this.alertService.showSuccess('Guardado', 'Configuración guardada');
      this.showForm = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo guardar');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  eliminar(c: JornadaConfigModel): void {
    if (!c.id) return;
    this.confirmationService.confirm({
      header: 'Eliminar configuración',
      message: `¿Eliminar la vigencia desde ${c.fechaInicioVigencia}?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await lastValueFrom(this.service.jornadaEliminar(c.id!));
          this.alertService.showSuccess('Eliminada', 'Configuración eliminada');
          await this.cargar();
        } catch (e: any) {
          this.alertService.showError('Error', e?.error?.message ?? 'No se pudo eliminar');
        }
      },
    });
  }

  private toISO(d: Date | null): string | null {
    if (!d) return null;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private parse(s?: string | null): Date | null {
    return s ? new Date(s + 'T00:00:00') : null;
  }

  private empty(): JornadaConfigModel {
    return {
      fechaInicioVigencia: '',
      fechaFinVigencia: null,
      horasSemanalesLegales: 42,
      horasMensualesBase: 210,
      horaDiurnaInicio: '06:00',
      horaDiurnaFin: '19:00',
      horaNocturnaInicio: '19:00',
      horaNocturnaFin: '06:00',
      recargoNocturno: 35,
      recargoExtraDiurna: 25,
      recargoExtraNocturna: 75,
      recargoDominicalFestivo: 90,
      maxHorasExtraDia: 2,
      maxHorasExtraSemana: 12,
      aplicaExcepcionSectorial: false,
      sectorExcepcion: null,
    };
  }
}
