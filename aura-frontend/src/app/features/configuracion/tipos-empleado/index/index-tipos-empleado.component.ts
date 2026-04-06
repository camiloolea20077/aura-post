import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { TipoEmpleadoService } from '../services/tipo-empleado.service';
import {
  TipoEmpleadoTableModel,
  TipoEmpleadoModel,
} from '../models/tipo-empleado.model';
import { FormTipoEmpleadoComponent } from '../form/form-tipo-empleado.component';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-tipos-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    FormTipoEmpleadoComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-tipos-empleado.component.html',
  styleUrls: ['./index-tipos-empleado.component.scss'],
})
export class IndexTiposEmpleadoComponent implements OnInit {
  rows: TipoEmpleadoTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';

  showForm = false;
  tipoEmpleadoEdit: TipoEmpleadoModel | null = null;

  constructor(
    private readonly service: TipoEmpleadoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly alertService: AlertService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.service.getAll());
      this.rows = res?.data?.map((t) => ({
        ...t,
        totalRows: res.data.length,
      })) ?? [];
      this.totalRows = this.rows.length;
    } catch {
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  nuevo(): void {
    this.tipoEmpleadoEdit = null;
    this.showForm = true;
  }

  editar(tipo: TipoEmpleadoTableModel): void {
    this.tipoEmpleadoEdit = tipo as unknown as TipoEmpleadoModel;
    this.showForm = true;
  }

  async eliminar(tipo: TipoEmpleadoTableModel): Promise<void> {
    try {
      await lastValueFrom(this.service.delete(tipo.id));
      this.alertService.showSuccess('Eliminado', 'Tipo de empleado eliminado');
      await this.load();
    } catch (err: unknown) {
      const msg = (err as any)?.error?.message ?? 'No se pudo eliminar';
      this.alertService.showError('Error', msg);
    }
  }

  onSaved(): void {
    this.showForm = false;
    this.tipoEmpleadoEdit = null;
    this.load();
  }
}