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
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  RutaTableModel,
  CreateRutaDto,
  LocalTableModel,
} from '../../models/vendedor.model';
import { RutaService } from '../../rutas/services/ruta.service';
import { LocalService } from '../../locales/services/local.service';

@Component({
  selector: 'app-personal-rutas',
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
    MultiSelectModule,
    DropdownModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './personal-rutas.component.html',
  styleUrls: ['./personal-rutas.component.scss'],
})
export class PersonalRutasComponent implements OnInit {
  @Input() vendedorId: number | null = null;

  rows: RutaTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  form: any;
  editingRuta: RutaTableModel | null = null;
  saving = false;

  diasSemana = [
    { label: 'Lunes', value: 1, abrev: 'Lun' },
    { label: 'Martes', value: 2, abrev: 'Mar' },
    { label: 'Miércoles', value: 3, abrev: 'Mié' },
    { label: 'Jueves', value: 4, abrev: 'Jue' },
    { label: 'Viernes', value: 5, abrev: 'Vie' },
    { label: 'Sábado', value: 6, abrev: 'Sáb' },
    { label: 'Domingo', value: 7, abrev: 'Dom' },
  ];

  locales: LocalTableModel[] = [];
  loadingLocales = false;

  constructor(
    private readonly rutaService: RutaService,
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
      descripcion: '',
      diaSemana: [],
      localIds: [],
    };
  }

  async load(): Promise<void> {
    if (!this.vendedorId) return;
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.rutaService.page({
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

  async loadLocales(): Promise<void> {
    if (!this.vendedorId) return;
    this.loadingLocales = true;
    try {
      const res = await lastValueFrom(
        this.localService.page({
          page: 0,
          rows: 100,
          params: { vendedorActualId: this.vendedorId },
        }),
      );
      this.locales = res?.data?.content ?? [];
    } catch {
      this.locales = [];
    } finally {
      this.loadingLocales = false;
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
    this.editingRuta = null;
    this.initForm();
    this.loadLocales();
    this.showForm = true;
    this.cdr.markForCheck();
  }

  async editRuta(ruta: RutaTableModel): Promise<void> {
    this.editingRuta = ruta;
    this.loadLocales();
    try {
      const res = await lastValueFrom(this.rutaService.getById(ruta.id));
      const data = res?.data;
      this.form = {
        nombre: data.nombre.replace(/\s*\([^)]+\)\s*$/, '').trim(),
        descripcion: data.descripcion ?? '',
        diaSemana: [data.diaSemana],
        localIds: data.localIds ?? [],
      };
    } catch {
      this.form = {
        nombre: ruta.nombre,
        descripcion: ruta.descripcion ?? '',
        diaSemana: [ruta.diaSemana],
        localIds: [],
      };
    }
    this.showForm = true;
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    if (!this.form.nombre || !this.vendedorId) {
      this.alert.showError('Error', 'El nombre es requerido');
      return;
    }

    const dias = Array.isArray(this.form.diaSemana)
      ? this.form.diaSemana
      : this.form.diaSemana
        ? [this.form.diaSemana]
        : [];

    if (dias.length === 0) {
      this.alert.showError('Error', 'Seleccione al menos un día de la semana');
      return;
    }

    this.saving = true;
    try {
      if (this.editingRuta) {
        const dto: CreateRutaDto = {
          nombre: this.form.nombre,
          descripcion: this.form.descripcion || null,
          diaSemana: dias[0],
          vendedorId: this.vendedorId!,
          localIds: this.form.localIds ?? [],
        };
        await lastValueFrom(this.rutaService.update(this.editingRuta.id, dto));
        this.alert.showSuccess('Actualizado', 'Ruta actualizada correctamente');
      } else {
        for (const dia of dias) {
          const diaInfo = this.diasSemana.find((d) => d.value === dia);
          const nombreConDia = diaInfo
            ? `${this.form.nombre} (${diaInfo.abrev})`
            : this.form.nombre;
          const dto: CreateRutaDto = {
            nombre: nombreConDia,
            descripcion: this.form.descripcion || null,
            diaSemana: dia,
            vendedorId: this.vendedorId!,
            localIds: this.form.localIds ?? [],
          };
          await lastValueFrom(this.rutaService.create(dto));
        }
        this.alert.showSuccess('Creado', 'Ruta(s) creada(s) correctamente');
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
    this.editingRuta = null;
    this.initForm();
    this.locales = [];
    this.cdr.markForCheck();
  }

  getSeverity(activo: boolean): 'success' | 'danger' {
    return activo ? 'success' : 'danger';
  }

  getDiaSemanaNombre(dia: number | null): string {
    if (!dia) return '-';
    const d = this.diasSemana.find((x) => x.value === dia);
    return d ? d.label : '-';
  }
}