import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { Html5Qrcode } from 'html5-qrcode';

import { AlertService } from '../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { GpsService } from '../../../core/services/gps.service';
import { RutaService } from '../rutas/services/ruta.service';
import { VisitaService } from '../visitas/services/visita.service';
import {
  CreateVisitaAndConfirmarDto,
  RutaTableModel,
} from '../models/vendedor.model';
import { QrScannerComponent } from '../../../shared/components/qr-scanner/qr-scanner.component';
import { QrScanResult } from '../../../shared/services/qr.scanner.service';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
@Component({
  selector: 'app-escanear-qr',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    DialogModule,
    ToastModule,
    QrScannerComponent,
  ],
  providers: [MessageService],
  templateUrl: './escanear-qr.component.html',
  styleUrls: ['./escanear-qr.component.scss'],
})
export class EscanearQrComponent implements AfterViewInit, OnDestroy {
  @ViewChild('qrScanner', { static: false }) qrScannerRef!: ElementRef;

  scanning = false;
  scannerReady = false;
  localId: number | null = null;
  localNombre = '';
  vendedorId: number | null = null;
  usuarioNombre = '';

  showRutas = false;
  showNoRutaConfirm = false;
  rutas: RutaTableModel[] = [];
  selectedRutaId: number | null = null;
  saving = false;

  private html5QrCode: Html5Qrcode | null = null;
  private scannerInterval: any = null;

  constructor(
    private readonly indexDBService: IndexDBService,
    private readonly gpsService: GpsService,
    private readonly rutaService: RutaService,
    private readonly visitaService: VisitaService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    await this.loadVendedor();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  private async loadVendedor(): Promise<void> {
    const auth = await this.indexDBService.loadDataAuthDB();
    if (auth?.usuarioId) {
      this.vendedorId = auth.empleadoId ?? null;
      this.usuarioNombre = auth.nombreCompleto ?? '';
    } else {
      this.alert.showError('Error', 'No se encontró usuario logueado');
    }
    this.cdr.markForCheck();
  }

  private getDiaSemanaActual(): number {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
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

  async startScanner(): Promise<void> {
    if (this.scanning) return;

    const element = document.getElementById('qr-reader');
    if (!element) {
      setTimeout(() => this.startScanner(), 300);
      return;
    }

    this.scanning = true;
    this.scannerReady = false;
    this.cdr.markForCheck();

    try {
      this.html5QrCode = new Html5Qrcode('qr-reader');

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          this.onQrScanned(decodedText);
        },
        () => {},
      );
      this.scannerReady = true;
    } catch (err: any) {
      console.log(err);
      this.alert.showError(
        'Error',
        'No se pudo iniciar la cámara: ' + err.message,
      );
      this.stopScanner();
    }

    this.cdr.markForCheck();
  }

  stopScanner(): void {
    if (this.html5QrCode && this.html5QrCode.isScanning) {
      this.html5QrCode.stop().catch(() => {});
    }
    this.scanning = false;
    this.scannerReady = false;
    this.cdr.markForCheck();
  }

  async onQrScanned(data: string): Promise<void> {
    this.stopScanner();

    const localIdDecoded = this.decodeBase64(data);
    if (!localIdDecoded) {
      this.alert.showError('QR inválido', 'El código escaneado no es válido');
      this.cdr.markForCheck();
      return;
    }

    this.localId = localIdDecoded;
    this.localNombre = `Local #${localIdDecoded}`;
    this.cdr.markForCheck();

    await this.validarRuta();
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
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'Error al validar ruta',
      );
      this.scanning = false;
      this.cdr.markForCheck();
    }
  }

  async crearSinRutaConfirmado(): Promise<void> {
    this.showNoRutaConfirm = false;
    await this.crearVisita(null);
  }

  cancelarSinRuta(): void {
    this.showNoRutaConfirm = false;
    this.reset();
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
    const fecha = aFechaLocal(now);
    const hora = now.toTimeString().slice(0, 5);

    const dto: CreateVisitaAndConfirmarDto = {
      localId: this.localId,
      rutaId: rutaId,
      fechaProgramada: fecha,
      horaProgramada: hora,
      vendedorId: this.vendedorId,
      latitudLlegada: gps?.latitud ?? 0,
      longitudLlegada: gps?.longitud ?? 0,
    };

    if (!rutaId) {
      dto.observaciones = `Visita registrada sin ruta por: ${this.usuarioNombre}`;
    }

    try {
      await lastValueFrom(this.visitaService.crearConfirmada(dto));

      this.alert.showSuccess('Éxito', 'Visita creada correctamente');
      this.reset();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo crear la visita',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  private async crearVisita(rutaId: number | null): Promise<void> {
    await this.crearVisitaz(rutaId);
  }

  reset(): void {
    this.localId = null;
    this.localNombre = '';
    this.showRutas = false;
    this.showNoRutaConfirm = false;
    this.rutas = [];
    this.selectedRutaId = null;
    this.scanning = false;
    this.cdr.markForCheck();
  }

  onScanned(result: QrScanResult) {
    this.onQrScanned(result.data);
  }
}
