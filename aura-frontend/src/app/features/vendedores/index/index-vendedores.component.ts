import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom, Subscription } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import { VendedorModel } from '../models/vendedor.model';
import { VendedorService } from '../services/vendedor.service';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import {
  SocketService,
  MonitorMessage,
  MonitorLocation,
} from '../../../shared/services/socket.service';
import { MapPickerComponent } from '../../../shared/components/map-picker/map-picker.component';

import { aFechaHoraLocal } from '../../../shared/utils/fecha.util';
interface VendedorExtended extends VendedorModel {
  online: boolean;
  location: MonitorLocation | null;
  lastUpdate: string | null;
  battery: string | null;
  status: string | null;
}

@Component({
  selector: 'app-index-vendedores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    PaginatorModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    ToastModule,
    DialogModule,
    MapPickerComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-vendedores.component.html',
  styleUrls: ['./index-vendedores.component.scss'],
})
export class IndexVendedoresComponent implements OnInit, OnDestroy {
  rows: VendedorExtended[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;
  first = 0;

  showMapDialog = false;
  selectedLocation: { lat: number; lng: number } | null = null;

  private socketSub?: Subscription;

  constructor(
    private readonly service: VendedorService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
    private readonly socketService: SocketService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.connectSocket();
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.pageVendedores({
          page: this.page,
          rows: this.pageSize,
          search: this.search || null,
          params: {
            activo: true,
            cargo: 'VENDEDOR',
          },
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
    this.first = e.first;
    this.page = e.first / e.rows;
    this.pageSize = e.rows;
    this.load();
  }

  onSearch(): void {
    this.page = 0;
    this.load();
  }

  getSeverity(activo: boolean): 'success' | 'danger' {
    return activo ? 'success' : 'danger';
  }

  private connectSocket(): void {
    this.socketService.connectMonitor('viewer', undefined, 'VENDEDOR');

    this.socketSub = this.socketService.messages$.subscribe(
      (msg: MonitorMessage) => {
        if (msg.providerId) {
          this.updateVendedorFromSocket(msg.providerId, msg.data, msg.type);
        }
      },
    );
  }

  private updateVendedorFromSocket(
    providerId: string,
    data: any,
    type: string,
  ): void {
    const vendedorId = parseInt(providerId, 10);
    const idx = this.rows.findIndex((v) => v.usuarioId === vendedorId);

    if (idx === -1) return;

    const v = this.rows[idx];
    v.online = ['connect', 'update'].includes(type);
    v.location = data?.location ?? null;
    v.lastUpdate = aFechaHoraLocal(new Date());
    v.battery = data?.battery ?? null;
    v.status = data?.status ?? null;

    this.rows = [...this.rows];
    this.cdr.markForCheck();
  }

  openLocationMap(vendedor: VendedorExtended): void {
    if (!vendedor.location) return;
    this.selectedLocation = {
      lat: vendedor.location.lat,
      lng: vendedor.location.lng,
    };
    this.showMapDialog = true;
    this.cdr.markForCheck();
  }

  closeMapDialog(): void {
    this.showMapDialog = false;
    this.selectedLocation = null;
    this.cdr.markForCheck();
  }
}
