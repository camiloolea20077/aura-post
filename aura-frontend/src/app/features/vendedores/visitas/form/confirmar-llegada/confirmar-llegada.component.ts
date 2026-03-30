import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  ConfirmarLlegadaDto,
  VisitaTableModel,
} from '../../../models/vendedor.model';
import { VisitaService } from '../../services/visita.service';
import { AlertService } from '../../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-confirmar-llegada',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './confirmar-llegada.component.html',
  styleUrls: ['./confirmar-llegada.component.scss'],
})
export class ConfirmarLlegadaComponent {
  @Input() visible = false;
  @Input() visita: VisitaTableModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmado = new EventEmitter<void>();

  loading = false;
  loadingGPS = false;
  observaciones = '';

  constructor(
    private readonly service: VisitaService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async getLocation(): Promise<void> {
    if (!navigator.geolocation) {
      this.alert.showError('Error', 'Geolocalización no soportada');
      return;
    }

    this.loadingGPS = true;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await this.confirmar(
          position.coords.latitude,
          position.coords.longitude,
          false,
        );
      },
      (error) => {
        this.loadingGPS = false;
        this.alert.showError('Error', 'No se pudo obtener ubicación');
        this.cdr.markForCheck();
      },
    );
  }

  async confirmarManual(): Promise<void> {
    await this.confirmar(null, null, true);
  }

  private async confirmar(
    lat: number | null,
    lng: number | null,
    manual: boolean,
  ): Promise<void> {
    this.loading = true;
    try {
      const dto: ConfirmarLlegadaDto = {
        latitud: lat ?? undefined,
        longitud: lng ?? undefined,
        confirmacionManual: manual,
        observaciones: this.observaciones || null,
      };
      await lastValueFrom(this.service.confirmar(this.visita!.id, dto));
      this.alert.showSuccess('Confirmado', 'Llegada confirmada correctamente');
      this.confirmado.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo confirmar',
      );
    } finally {
      this.loading = false;
      this.loadingGPS = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.observaciones = '';
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
