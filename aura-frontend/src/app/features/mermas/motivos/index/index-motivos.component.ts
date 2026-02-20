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
import { MotivoMermaTableModel } from '../../../../core/models/merma.model';
import { MermaService } from '../../../../core/services/merma.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormMotivoComponent } from '../form/form-motivo.component';

@Component({
  selector: 'app-index-motivos',
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
    FormMotivoComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-motivos.component.html',
  styleUrls: ['./index-motivos.component.scss'],
})
export class IndexMotivosComponent implements OnInit {
  rows: MotivoMermaTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  selected: any = null;

  constructor(
    private readonly service: MermaService,
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
        this.service.pageMotivos({
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

  openCreate(): void {
    this.selected = null;
    this.showForm = true;
  }
  openEdit(m: any): void {
    this.selected = m;
    this.showForm = true;
  }

  confirmDelete(m: any): void {
    this.confirm.confirm({
      message: `¿Eliminar el motivo <b>${m.nombre}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.delete(m.id),
    });
  }

  async delete(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.deleteMotivo(id));
      this.alert.showSuccess('Eliminado', 'Motivo eliminado');
      this.load();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo eliminar',
      );
    }
  }

  onSaved(): void {
    this.load();
  }
}
