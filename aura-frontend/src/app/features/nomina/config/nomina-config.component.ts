import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { NominaService } from '../../../core/services/nomina.service';
import {
  NominaConfigModel,
  ModoNomina,
  Periodicidad,
} from '../../../core/models/nomina.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-nomina-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ToastModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './nomina-config.component.html',
  styleUrls: ['./nomina-config.component.scss'],
})
export class NominaConfigComponent implements OnInit {
  public loading = true;
  public saving = false;
  public config: NominaConfigModel | null = null;

  public modoOpts = [
    { label: 'Simplificado', value: 'SIMPLIFICADO' },
    { label: 'Completo (con EPS, ARL, Pensión)', value: 'COMPLETO' },
  ];

  public periodicidadOpts = [
    { label: 'Mensual', value: 'MENSUAL' },
    { label: 'Quincenal', value: 'QUINCENAL' },
    { label: 'Semanal', value: 'SEMANAL' },
  ];

  public modoLiquidacionOpts = [
    { label: 'Sin asistencia', value: 'SIN_ASISTENCIA' },
    { label: 'Asistencia obligatoria', value: 'CON_ASISTENCIA_OBLIGATORIA' },
    { label: 'Mixta', value: 'MIXTA' },
  ];

  constructor(
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.nominaService.getConfig());
      this.config = res?.data ?? null;
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo cargar la configuración',
      );
    } finally {
      this.loading = false;
    }
  }

  async save(): Promise<void> {
    if (!this.config) return;
    this.saving = true;
    try {
      const res = await lastValueFrom(
        this.nominaService.saveConfig(this.config),
      );
      this.config = res?.data ?? this.config;
      this.alertService.showSuccess(
        'Guardado',
        'Configuración actualizada correctamente',
      );
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo guardar la configuración',
      );
    } finally {
      this.saving = false;
    }
  }

  get esCompleto(): boolean {
    return this.config?.modoNomina === 'COMPLETO';
  }
}
