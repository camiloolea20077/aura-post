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
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { LaboralService } from '../../core/services/laboral.service';
import { AlertService } from '../../shared/pipes/alert.service';
import { CalendarioDiaModel } from '../../core/models/laboral.model';

@Component({
  selector: 'app-calendario-laboral',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    CheckboxModule,
    DialogModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './calendario-laboral.component.html',
  styleUrls: ['./calendario-laboral.component.scss'],
})
export class CalendarioLaboralComponent implements OnInit {
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;

  rows: CalendarioDiaModel[] = [];
  loading = false;
  cargandoFestivos = false;

  showAdd = false;
  saving = false;
  form: CalendarioDiaModel = this.empty();
  diaFecha: Date | null = null;

  readonly mesOpts = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];

  readonly tipoOpts = [
    { label: 'Festivo nacional', value: 'FESTIVO_NACIONAL' },
    { label: 'Festivo regional', value: 'FESTIVO_REGIONAL' },
    { label: 'Descanso de empresa', value: 'DESCANSO_EMPRESA' },
    { label: 'Cierre operativo', value: 'CIERRE_OPERATIVO' },
    { label: 'Compensatorio', value: 'COMPENSATORIO' },
  ];

  constructor(
    private readonly service: LaboralService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  async cargar(): Promise<void> {
    const desde = `${this.anio}-${this.pad(this.mes)}-01`;
    const ultimo = new Date(this.anio, this.mes, 0).getDate();
    const hasta = `${this.anio}-${this.pad(this.mes)}-${this.pad(ultimo)}`;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.calendarioList(desde, hasta));
      this.rows = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el calendario');
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async cargarFestivos(): Promise<void> {
    this.cargandoFestivos = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.cargarFestivos(this.anio));
      this.alertService.showSuccess('Festivos cargados', `Se agregaron ${res?.data ?? 0} festivos de ${this.anio}.`);
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudieron cargar los festivos');
    } finally {
      this.cargandoFestivos = false;
      this.cdr.markForCheck();
    }
  }

  abrirAgregar(): void {
    this.form = this.empty();
    this.diaFecha = new Date(this.anio, this.mes - 1, 1);
    this.showAdd = true;
    this.cdr.markForCheck();
  }

  async guardarDia(): Promise<void> {
    if (!this.diaFecha) {
      this.alertService.showWarn('Requerido', 'La fecha es obligatoria');
      return;
    }
    this.form.fecha = `${this.diaFecha.getFullYear()}-${this.pad(this.diaFecha.getMonth() + 1)}-${this.pad(this.diaFecha.getDate())}`;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const dto: CalendarioDiaModel = {
        ...this.form,
        esFestivoNacional: this.form.tipoDia === 'FESTIVO_NACIONAL',
        esFestivoRegional: this.form.tipoDia === 'FESTIVO_REGIONAL',
        esDescansoEmpresa: this.form.tipoDia === 'DESCANSO_EMPRESA',
        origen: 'MANUAL',
      };
      await lastValueFrom(this.service.calendarioGuardar(dto));
      this.alertService.showSuccess('Guardado', 'Día agregado al calendario');
      this.showAdd = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo guardar el día');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  anular(d: CalendarioDiaModel): void {
    if (!d.id) return;
    this.confirmationService.confirm({
      header: 'Anular día',
      message: `¿Anular ${d.fecha}${d.nombre ? ' — ' + d.nombre : ''}?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await lastValueFrom(this.service.calendarioAnular(d.id!));
          this.alertService.showSuccess('Anulado', 'Día anulado');
          await this.cargar();
        } catch (e: any) {
          this.alertService.showError('Error', e?.error?.message ?? 'No se pudo anular');
        }
      },
    });
  }

  tipoSeverity(tipo: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const m: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      FESTIVO_NACIONAL: 'danger',
      FESTIVO_REGIONAL: 'warn',
      DESCANSO_EMPRESA: 'info',
      CIERRE_OPERATIVO: 'secondary',
      COMPENSATORIO: 'info',
      DOMINGO: 'secondary',
      LABORAL: 'success',
    };
    return m[tipo] ?? 'secondary';
  }

  private empty(): CalendarioDiaModel {
    return {
      fecha: '',
      tipoDia: 'FESTIVO_REGIONAL',
      nombre: null,
      aplicaRecargo: true,
    };
  }
}
