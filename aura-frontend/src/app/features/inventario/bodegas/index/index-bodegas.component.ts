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
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { BodegaTableModel } from '../../../../core/models/bodega.model';
import { BodegaService } from '../../../../core/services/bodega.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormBodegaComponent } from '../form/form-bodega.component';

@Component({
  selector: 'app-index-bodegas',
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
    FormBodegaComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-bodegas.component.html',
  styleUrls: ['./index-bodegas.component.scss'],
})
export class IndexBodegasComponent implements OnInit {
  rows: BodegaTableModel[] = [];
  totalRows = 0;
  loading = true;
  searchQuery = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  selected: BodegaTableModel | null = null;

  constructor(
    private readonly service: BodegaService,
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
          search: this.searchQuery || null,
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch {
      // 206 = sin registros, no es un error que valga un toast
      this.rows = [];
      this.totalRows = 0;
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

  clearSearch(): void {
    if (!this.searchQuery) return;
    this.searchQuery = '';
    this.onSearch();
  }

  openCreate(): void {
    this.selected = null;
    this.showForm = true;
  }

  openEdit(b: BodegaTableModel): void {
    this.selected = b;
    this.showForm = true;
  }

  confirmDelete(b: BodegaTableModel): void {
    this.confirm.confirm({
      message: `¿Eliminar la bodega <b>${b.nombre}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.delete(b.id),
    });
  }

  private async delete(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.delete(id));
      this.alert.showSuccess('Eliminada', 'Bodega eliminada');
      this.load();
    } catch (err: any) {
      // El back frena si ya tiene saldo o kardex: el mensaje explica por qué.
      this.alert.showError(
        'No se pudo eliminar',
        err?.error?.message ?? 'No se pudo eliminar la bodega',
      );
    }
  }

  onSaved(): void {
    this.load();
  }
}
