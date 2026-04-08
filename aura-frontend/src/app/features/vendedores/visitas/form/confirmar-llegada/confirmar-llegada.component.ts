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
import { GpsService } from '../../../../../core/services/gps.service';
import { QrScannerComponent } from '../../../../../shared/components/qr-scanner/qr-scanner.component';
import { ScanResult } from '../../../../../shared/interfaces/scanner.interface';

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
    QrScannerComponent,
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
  observaciones = '';

  constructor(
    private readonly service: VisitaService,
    private readonly gpsService: GpsService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async onQrScanned(result: ScanResult): Promise<void> {
    await this.confirmarConGps();
  }

  async confirmarConGps(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();

    try {
      const gps = await this.gpsService.getCurrentPosition();

      const dto: ConfirmarLlegadaDto = {
        latitud: gps?.latitud ?? undefined,
        longitud: gps?.longitud ?? undefined,
        confirmacionManual: !gps,
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
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.observaciones = '';
    this.visible = false;
    this.visibleChange.emit(false);
  }
}