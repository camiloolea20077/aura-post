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
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { LocalTableModel, CreateLocalDto } from '../../models/vendedor.model';
import { LocalService } from '../../locales/services/local.service';

@Component({
  selector: 'app-personal-locales',
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
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './personal-locales.component.html',
  styleUrls: ['./personal-locales.component.scss'],
})
export class PersonalLocalesComponent implements OnInit {
  @Input() vendedorId: number | null = null;

  rows: LocalTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  form: any;
  editingLocal: LocalTableModel | null = null;
  saving = false;

  constructor(
    private readonly localService: LocalService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.vendedorId) {
      this.load();
    }
  }

  private initForm(): void {
    this.form = {
      nombre: '',
      direccion: '',
      barrio: '',
      ciudadId: null,
      ciudadNombre: '',
    };
  }

  async load(): Promise<void> {
    if (!this.vendedorId) return;
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.localService.page({
          page: this.page,
          rows: this.pageSize,
          search: this.search || null,
          params: { vendedorActualId: this.vendedorId },
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
    this.editingLocal = null;
    this.initForm();
    this.showForm = true;
    this.cdr.markForCheck();
  }

  editLocal(local: LocalTableModel): void {
    this.editingLocal = local;
    this.form = {
      nombre: local.nombre,
      direccion: local.direccion,
      barrio: local.barrio ?? '',
      ciudadId: local.ciudadId,
    };
    this.showForm = true;
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    if (!this.form.nombre || !this.form.direccion || !this.vendedorId) {
      this.alert.showError('Error', 'Nombre y dirección son requeridos');
      return;
    }

    this.saving = true;
    try {
      const dto: CreateLocalDto = {
        nombre: this.form.nombre,
        direccion: this.form.direccion,
        barrio: this.form.barrio || null,
        ciudadId: this.form.ciudadId ?? null,
        vendedorActualId: this.vendedorId,
      };

      if (this.editingLocal) {
        await lastValueFrom(this.localService.update(this.editingLocal.id, dto));
        this.alert.showSuccess('Actualizado', 'Local actualizado correctamente');
      } else {
        await lastValueFrom(this.localService.create(dto));
        this.alert.showSuccess('Creado', 'Local creado correctamente');
      }
      this.showForm = false;
      this.load();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo guardar');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.editingLocal = null;
    this.initForm();
    this.cdr.markForCheck();
  }

  getSeverity(activo: boolean): 'success' | 'danger' {
    return activo ? 'success' : 'danger';
  }
}