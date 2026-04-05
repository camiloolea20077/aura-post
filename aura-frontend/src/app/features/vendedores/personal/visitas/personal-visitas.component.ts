import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../../core/services/index-db.service';
import { GpsService } from '../../../../core/services/gps.service';
import { QrScannerComponent } from '../../../../shared/components/qr-scanner/qr-scanner.component';
import { ScanResult } from '../../../../shared/interfaces/scanner.interface';
import { RutaService } from '../../rutas/services/ruta.service';
import { LocalService } from '../../locales/services/local.service';
import { VisitaService } from '../../visitas/services/visita.service';
import {
  VisitaTableModel,
  CreateVisitaDto,
  RutaTableModel,
  CreateVisitaAndConfirmarDto,
} from '../../models/vendedor.model';

@Component({
  selector: 'app-personal-visitas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    DialogModule,
    DropdownModule,
    ToastModule,
    QrScannerComponent,
  ],
  providers: [MessageService],
  templateUrl: './personal-visitas.component.html',
  styleUrls: ['./personal-visitas.component.scss'],
})
export class PersonalVisitasComponent implements OnInit {
  @Input() vendedorId: number | null = null;

  rows: VisitaTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showScanner = false;
  showNoRutaConfirm = false;
  scanning = false;
  localId: number | null = null;
  localNombre = '';

  rutas: RutaTableModel[] = [];
  selectedRutaId: number | null = null;
  saving = false;
  usuarioNombre: string = '';

  constructor(
    private readonly indexDBService: IndexDBService,
    private readonly gpsService: GpsService,
    private readonly rutaService: RutaService,
    private readonly visitaService: VisitaService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadVendedor();
    if (this.vendedorId) {
      this.load();
    }
  }

  private getDiaSemanaActual(): number {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  }

  private async loadVendedor(): Promise<void> {
    const auth = await this.indexDBService.loadDataAuthDB();
    if (auth?.usuarioId) {
      this.usuarioNombre = auth.nombreCompleto ?? '';
      this.vendedorId = 1; // TODO: Obtener el vendedorId del usuario logueado
    } else {
      this.alert.showError('Error', 'No se encontró usuario logueado');
    }
    this.cdr.markForCheck();
  }

  private decodeBase64(encoded: string): number | null {
    try {
      const decoded = atob(encoded);
      const id = parseInt(decoded, 10);
      return isNaN(id) ? null : id;
    } catch {
      return null;
    }
  }

  async load(): Promise<void> {
    if (!this.vendedorId) return;
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.visitaService.page({
          page: this.page,
          rows: this.pageSize,
          search: this.search || null,
          params: { vendedorId: this.vendedorId },
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch {
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onPage(e: any): void {
    this.page = e.first / e.rows;
    this.pageSize = e.rows;
    this.load();
  }

  onSearch(): void {
    this.page = 0;
    this.load();
  }

  nuevaConQR(): void {
    this.showScanner = true;
    this.resetForm();
    this.cdr.markForCheck();
  }

  onQrScanned(result: ScanResult): void {
    this.showScanner = false;
    const data = result.data;
    const localIdDecoded = this.decodeBase64(data);

    if (!localIdDecoded) {
      this.alert.showError('QR inválido', 'El código no es válido');
      this.cdr.markForCheck();
      return;
    }

    this.localId = localIdDecoded;
    this.localNombre = `Local #${localIdDecoded}`;
    this.cdr.markForCheck();

    this.validarRuta();
  }

  private async validarRuta(): Promise<void> {
    if (!this.vendedorId || !this.localId) return;

    try {
      const diaSemana = this.getDiaSemanaActual();
      const res = await lastValueFrom(
        this.rutaService.validar(this.vendedorId, this.localId, diaSemana),
      );

      const rutaId = res?.data?.rutaId;
      if (rutaId) {
        await this.crearVisita(rutaId);
      } else {
        this.showNoRutaConfirm = true;
        this.cdr.markForCheck();
      }
    } catch (err: any) {
      this.showNoRutaConfirm = true;
      this.cdr.markForCheck();
    }
  }

  async crearSinRutaConfirmado(): Promise<void> {
    this.showNoRutaConfirm = false;
    await this.crearVisita(null);
  }

  cancelarSinRuta(): void {
    this.showNoRutaConfirm = false;
    this.resetForm();
  }

  async crearConRuta(): Promise<void> {
    if (!this.localId || !this.selectedRutaId) return;
    await this.crearVisita(this.selectedRutaId);
  }

  async crearSinRuta(): Promise<void> {
    if (!this.localId) return;
    await this.crearVisita(null);
  }

  private async crearVisitaz(rutaId: number | null): Promise<void> {
    if (!this.localId) return;

    this.saving = true;
    this.cdr.markForCheck();

    const gps = await this.gpsService.getCurrentPosition();

    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().slice(0, 5);

    const dto: CreateVisitaAndConfirmarDto = {
      localId: this.localId,
      rutaId: rutaId,
      fechaProgramada: fecha,
      horaProgramada: hora,
      latitudLlegada: gps?.latitud ?? 0,
      longitudLlegada: gps?.longitud ?? 0,
      vendedorId: this.vendedorId,
    };

    if (!rutaId) {
      dto.observaciones = `Visita registrada sin ruta por: ${this.usuarioNombre}`;
    }

    try {
      await lastValueFrom(this.visitaService.crearConfirmada(dto));

      this.alert.showSuccess('Éxito', 'Visita creada correctamente');
      this.resetForm();
      this.load();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo crear');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  private async crearVisita(rutaId: number | null): Promise<void> {
    await this.crearVisitaz(rutaId);
  }

  resetForm(): void {
    this.localId = null;
    this.localNombre = '';
    this.showNoRutaConfirm = false;
    this.rutas = [];
    this.selectedRutaId = null;
    this.scanning = false;
    this.cdr.markForCheck();
  }

  getSeverity(
    estado: string,
  ):
    | 'success'
    | 'secondary'
    | 'info'
    | 'warn'
    | 'danger'
    | 'contrast'
    | undefined {
    switch (estado) {
      case 'COMPLETADA':
        return 'success';
      case 'PROGRAMADA':
        return 'warn';
      case 'CANCELADA':
        return 'danger';
      default:
        return 'info';
    }
  }
}
