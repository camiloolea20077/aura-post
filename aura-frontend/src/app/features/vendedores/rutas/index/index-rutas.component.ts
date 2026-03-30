import {
  Component,
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
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormRutaComponent } from '../form/form-ruta.component';
import { RutaTableModel } from '../../models/vendedor.model';
import { RutaService } from '../services/ruta.service';

@Component({
  selector: 'app-index-rutas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    FormRutaComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-rutas.component.html',
  styleUrls: ['./index-rutas.component.scss'],
})
export class IndexRutasComponent implements OnInit {
  rows: RutaTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  selectedRuta: RutaTableModel | null = null;

  constructor(
    private readonly service: RutaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.page,
          rows: this.pageSize,
          search: this.search || null,
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

  nuevo(): void {
    this.selectedRuta = null;
    this.showForm = true;
  }

  onSaved(): void {
    this.showForm = false;
    this.selectedRuta = null;
    this.load();
  }

  editRuta(ruta: RutaTableModel): void {
    this.selectedRuta = ruta;
    this.showForm = true;
  }

  onFormClosed(): void {
    this.showForm = false;
    this.selectedRuta = null;
  }

  confirmDelete(ruta: RutaTableModel): void {
    this.confirm.confirm({
      message: `¿Eliminar la ruta <b>${ruta.nombre}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.delete(ruta.id),
    });
  }

  async delete(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.delete(id));
      this.alert.showSuccess('Eliminado', 'Ruta eliminada correctamente');
      this.load();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo eliminar');
    }
  }

  getSeverity(activo: boolean): 'success' | 'danger' {
    return activo ? 'success' : 'danger';
  }
}
