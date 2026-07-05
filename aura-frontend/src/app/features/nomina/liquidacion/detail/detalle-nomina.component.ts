import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { NominaService } from '../../../../core/services/nomina.service';
import {
  AddNovedadDto,
  EstadoNomina,
  NominaModel,
  TipoNovedad,
} from '../../../../core/models/nomina.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-detalle-nomina',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    DropdownModule,
    InputTextModule,
    TooltipModule,
  ],
  templateUrl: './detalle-nomina.component.html',
  styleUrls: ['./detalle-nomina.component.scss'],
})
export class DetalleNominaComponent implements OnChanges {
  @Input() visible = false;
  @Input() nominaId: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() actualizada = new EventEmitter<void>();

  public nomina: NominaModel | null = null;
  public loading = false;
  public aprobando = false;
  public pagando = false;
  public anulando = false;
  public agregando = false;

  // Form novedad
  public showFormNovedad = false;
  public novedad: AddNovedadDto = this.emptyNovedad();

  public tipoNovedadOpts = [
    { label: 'Hora extra diurna', value: 'HORA_EXTRA_DIURNA' },
    { label: 'Hora extra nocturna', value: 'HORA_EXTRA_NOCTURNA' },
    { label: 'Hora extra dominical', value: 'HORA_EXTRA_DOMINICAL' },
    { label: 'Hora extra festivo', value: 'HORA_EXTRA_FESTIVO' },
    { label: 'Incapacidad', value: 'INCAPACIDAD' },
    { label: 'Licencia remunerada', value: 'LICENCIA_REMUNERADA' },
    { label: 'Bono', value: 'BONO' },
    { label: 'Comisión', value: 'COMISION' },
    { label: 'Préstamo (descuento)', value: 'PRESTAMO' },
    { label: 'Embargo (descuento)', value: 'EMBARGO' },
    { label: 'Otro devengo', value: 'OTRO_DEVENGO' },
    { label: 'Otro descuento', value: 'OTRO_DESCUENTO' },
  ];

  constructor(
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue && this.nominaId) {
      this.load();
    }
    if (!changes['visible']?.currentValue) {
      this.nomina = null;
      this.showFormNovedad = false;
    }
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.nominaService.getNominaById(this.nominaId!),
      );
      this.nomina = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la nómina');
    } finally {
      this.loading = false;
    }
  }

  async aprobar(): Promise<void> {
    if (!this.nomina) return;
    this.aprobando = true;
    try {
      const res = await lastValueFrom(
        this.nominaService.aprobar(this.nomina.id),
      );
      this.nomina = res?.data ?? this.nomina;
      this.alertService.showSuccess(
        'Aprobada',
        'Nómina aprobada correctamente',
      );
      this.actualizada.emit();
    } catch {
      this.alertService.showError('Error', 'No se pudo aprobar la nómina');
    } finally {
      this.aprobando = false;
    }
  }

  async pagar(): Promise<void> {
    if (!this.nomina) return;
    this.pagando = true;
    try {
      const res = await lastValueFrom(
        this.nominaService.pagarNomina(this.nomina.id),
      );
      this.nomina = res?.data ?? this.nomina;
      this.alertService.showSuccess('Pagada', 'Nómina marcada como pagada');
      this.actualizada.emit();
    } catch {
      this.alertService.showError('Error', 'No se pudo pagar la nómina');
    } finally {
      this.pagando = false;
    }
  }

  async anular(): Promise<void> {
    if (!this.nomina || !confirm('¿Anular esta nómina?')) return;
    this.anulando = true;
    try {
      await lastValueFrom(this.nominaService.anularNomina(this.nomina.id));
      this.alertService.showSuccess('Anulada', 'Nómina anulada');
      this.actualizada.emit();
    } catch {
      this.alertService.showError('Error', 'No se pudo anular la nómina');
    } finally {
      this.anulando = false;
    }
  }

  async agregarNovedad(): Promise<void> {
    if (!this.nomina || !this.novedad.tipo || !this.novedad.valorUnitario) {
      this.alertService.showWarn(
        'Requerido',
        'Completa el tipo y valor de la novedad',
      );
      return;
    }
    this.agregando = true;
    try {
      const res = await lastValueFrom(
        this.nominaService.agregarNovedad(this.nomina.id, this.novedad),
      );
      this.nomina = res?.data ?? this.nomina;
      this.novedad = this.emptyNovedad();
      this.showFormNovedad = false;
      this.alertService.showSuccess(
        'Agregada',
        'Novedad agregada y nómina recalculada',
      );
    } catch {
      this.alertService.showError('Error', 'No se pudo agregar la novedad');
    } finally {
      this.agregando = false;
    }
  }

  async eliminarNovedad(novedadId: number): Promise<void> {
    if (!this.nomina || !confirm('¿Eliminar esta novedad?')) return;
    try {
      const res = await lastValueFrom(
        this.nominaService.eliminarNovedad(this.nomina.id, novedadId),
      );
      this.nomina = res?.data ?? this.nomina;
      this.alertService.showSuccess(
        'Eliminada',
        'Novedad eliminada y nómina recalculada',
      );
    } catch {
      this.alertService.showError('Error', 'No se pudo eliminar la novedad');
    }
  }

  close(): void {
    this.closed.emit();
  }

  get puedeEditar(): boolean {
    return this.nomina?.estado === 'BORRADOR';
  }

  get puedeAprobar(): boolean {
    return this.nomina?.estado === 'BORRADOR';
  }

  get puedePagar(): boolean {
    return this.nomina?.estado === 'APROBADO';
  }

  estadoSeverity(e: EstadoNomina): TagSeverity {
    const m: Record<EstadoNomina, TagSeverity> = {
      BORRADOR: 'warn',
      APROBADO: 'success',
      PAGADO: 'info',
      ANULADO: 'danger',
    };
    return m[e];
  }

  formatMonto(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  tipoNovedadLabel(tipo: TipoNovedad): string {
    return this.tipoNovedadOpts.find((o) => o.value === tipo)?.label ?? tipo;
  }

  private emptyNovedad(): AddNovedadDto {
    return {
      tipo: '' as TipoNovedad,
      descripcion: null,
      cantidad: 1,
      valorUnitario: 0,
    };
  }
}
