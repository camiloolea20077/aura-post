import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  LocalTableModel,
  CreateLocalDto,
  createLocalSimpleModel,
} from '../../models/vendedor.model';
import { LocalService } from '../services/local.service';
import { GeoService } from '../../../../shared/services/geo.service';
import {
  GeocodingService,
  GeocodingResult,
} from '../../../../shared/services/geocoding.service';
import { MapPickerComponent } from '../../../../shared/components/map-picker/map-picker.component';
import { AddressSearchComponent } from '../../../../shared/components/address-search/address-search.component';

const PATTERN_DIRECCION =
  /^(calle|carrera|transversal|diagonal|circunvalar|avenida|autopista|glorieta|malecon|malecón|boulevard|corredor|carretera|vereda|camino)\s+\d+[a-z]?\s*(bis)?\s*#\s*\d+[a-z]?\s*(bis)?\s*-\s*\d+$/i;

@Component({
  selector: 'app-form-local',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    DialogModule,
    CalendarModule,
    AutoCompleteModule,
    ProgressSpinnerModule,
    MapPickerComponent,
    AddressSearchComponent,
  ],
  templateUrl: './form-local.component.html',
  styleUrls: ['./form-local.component.scss'],
})
export class FormLocalComponent implements OnChanges {
  @Input() visible = false;
  @Input() local: LocalTableModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  loadingDepartamentos = false;
  loadingCiudades = false;
  loadingAddressSearch = false;
  countryCode = 'CO';
  query = '';

  get ciudadSelected(): boolean {
    return !!this.form.get('ciudadId')?.value;
  }

  departamentos: { label: string; value: number }[] = [];
  ciudades: { label: string; value: number; lat?: number; lng?: number }[] = [];
  addressResults: GeocodingResult[] = [];

  get isEdit(): boolean {
    return !!this.local;
  }

  diasSemana = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
    { label: 'Sábado', value: 6 },
    { label: 'Domingo', value: 7 },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: LocalService,
    private readonly geoService: GeoService,
    private readonly geocodingService: GeocodingService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      nombre: [null, [Validators.required, Validators.maxLength(100)]],
      direccion: [
        {
          value: null,
          disabled: true,
        },
        [Validators.required, Validators.maxLength(200)],
      ],
      barrio: [null, [Validators.maxLength(200)]],
      ciudadId: [null, [Validators.required]],
      ciudadNombre: [null],
      ciudad: [null],
      departamentoId: [null, [Validators.required]],
      departamentoNombre: [null],
      latitud: [null],
      longitud: [null],
      telefono: [null, [Validators.required, Validators.maxLength(20)]],
      email: [null, [Validators.email, Validators.maxLength(200)]],
      horaApertura: [new Date(2024, 0, 1, 6, 0)],
      horaCierre: [new Date(2024, 0, 1, 18, 0)],
      diaInicioSemana: [null],
      diaFinSemana: [null],
      preferenciaVisita: ['', [Validators.maxLength(500)]],
      rutaId: [null],
      vendedorActualId: [null],
    });
  }

  async ngOnChanges(): Promise<void> {
    if (this.visible) {
      this.form.reset({
        nombre: '',
        direccion: '',
        barrio: null,
        ciudadId: null,
        departamentoId: null,
        latitud: null,
        longitud: null,
        telefono: null,
        email: null,
        horaApertura: new Date(2024, 0, 1, 6, 0),
        horaCierre: new Date(2024, 0, 1, 18, 0),
        diaInicioSemana: null,
        diaFinSemana: null,
        preferenciaVisita: null,
        rutaId: null,
        vendedorActualId: null,
      });
      await this.loadDepartamentos();
      if (this.local) {
        await this.loadLocal();
      }
    }
  }

  async loadDepartamentos(): Promise<void> {
    this.loadingDepartamentos = true;
    try {
      const res = await lastValueFrom(
        this.geoService.getDepartamentos(this.countryCode),
      );
      this.departamentos =
        res?.data?.map((d) => ({
          label: d.name,
          value: d.id,
        })) ?? [];
    } catch {
      this.departamentos = [];
    } finally {
      this.loadingDepartamentos = false;
      this.cdr.markForCheck();
    }
  }

  async onDepartamentoChange(departamentoId: number | null): Promise<void> {
    const depto = this.departamentos.find((d) => d.value === departamentoId);
    this.form.patchValue({
      ciudadId: null,
      latitud: null,
      longitud: null,
      ciudad: null,
      departamentoId,
      departamentoNombre: depto?.label ?? null,
    });
    this.ciudades = [];
    if (departamentoId) {
      this.loadingCiudades = true;
      try {
        const res = await lastValueFrom(
          this.geoService.getCiudades(departamentoId),
        );
        this.ciudades =
          res?.data?.map((c) => ({
            label: c.name,
            value: c.id,
            lat: c.latitude ? parseFloat(c.latitude) : undefined,
            lng: c.longitude ? parseFloat(c.longitude) : undefined,
          })) ?? [];
      } catch {
        this.ciudades = [];
      } finally {
        this.loadingCiudades = false;
        this.cdr.markForCheck();
      }
    }
  }

  onCiudadChange(ciudadId: number | null): void {
    if (!ciudadId) {
      this.form.get('direccion')?.disable();
      this.form.patchValue({
        latitud: null,
        longitud: null,
        ciudadNombre: null,
        ciudad: null,
      });
      return;
    }
    this.form.get('direccion')?.enable();
    const ciudad = this.ciudades.find((c) => c.value === ciudadId);
    const deptoNombre = this.form.get('departamentoNombre')?.value;
    if (ciudad?.lat && ciudad?.lng) {
      const ciudadConDepto = deptoNombre
        ? `${ciudad.label}(${deptoNombre})`
        : ciudad.label;
      this.form.patchValue({
        latitud: ciudad.lat,
        longitud: ciudad.lng,
        ciudadNombre: ciudad.label,
        ciudad: ciudadConDepto,
      });
    }
  }

  async loadLocal(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.getById(this.local!.id));
      const data = res?.data;
      if (data) {
        const savedLat = data.latitud;
        const savedLng = data.longitud;
        const ciudadConDepto = data.departamentoNombre
          ? `${data.ciudadNombre} (${data.departamentoNombre})`
          : data.ciudadNombre;

        if (data.departamentoId) {
          await this.onDepartamentoChange(data.departamentoId);
        }
        this.form.patchValue({
          nombre: data.nombre,
          direccion: data.direccion,
          barrio: data.barrio,
          ciudadId: data.ciudadId,
          ciudadNombre: data.ciudadNombre,
          ciudad: ciudadConDepto,
          departamentoId: data.departamentoId,
          departamentoNombre: data.departamentoNombre,
          latitud: savedLat,
          longitud: savedLng,
          telefono: data.telefono,
          email: data.email,
          horaApertura: data.horaApertura,
          horaCierre: data.horaCierre,
          diaInicioSemana: data.diaInicioSemana,
          diaFinSemana: data.diaFinSemana,
          preferenciaVisita: data.preferenciaVisita,
          rutaId: data.rutaId,
          vendedorActualId: data.vendedorActualId,
        });
      }
    } catch {
      this.alert.showError('Error', 'No se pudo cargar el local');
    } finally {
      this.cdr.markForCheck();
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alert.showError('Error', 'Formulario inválido');
      return;
    }
    this.loading = true;
    try {
      const dto: createLocalSimpleModel = {
        nombre: this.form.value.nombre,
        direccion: this.form.value.direccion,
        ciudad: this.form.value.ciudad,
        ciudadId: this.form.value.ciudadId,
        barrio: this.form.value.barrio,
        latitud: this.form.value.latitud,
        longitud: this.form.value.longitud,
        imagenFachada: '',
        horarioJson: '',
        preferenciaDiasJson: '',
        vendedorActualId: null,
      };

      if (this.isEdit) {
        await lastValueFrom(this.service.update(this.local!.id, dto));
        this.alert.showSuccess(
          'Actualizado',
          'Local actualizado correctamente',
        );
      } else {
        await lastValueFrom(this.service.create(dto));
        this.alert.showSuccess('Creado', 'Local creado correctamente');
      }
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    if (!c) return false;
    return c.invalid && (c.touched || c.dirty);
  }

  async onMapCoordinatesChange(coords: {
    lat: number;
    lng: number;
  }): Promise<void> {
    this.form.patchValue({
      latitud: coords.lat,
      longitud: coords.lng,
    });

    // Revierte geocodificación para intentar obtener la dirección
    try {
      const res = await lastValueFrom(
        this.geocodingService.reverseGeocode(coords.lat, coords.lng),
      );
      if (res && res.display_name) {
        // Solo actualizamos si la dirección está vacía para no sobrescribir cambios manuales
        if (!this.form.get('direccion')?.value) {
          this.form.patchValue({
            direccion: res.display_name.split(',')[0],
          });
        }
      }
    } catch {
      // Ignorar errores en reversa
    } finally {
      this.cdr.markForCheck();
    }
  }

  async searchAddress(event: { query: string }): Promise<void> {
    const query = event.query.trim();
    if (query.length < 4) {
      this.addressResults = [];
      return;
    }
    this.query = query;
    this.loadingAddressSearch = true;
    try {
      const res = await lastValueFrom(
        this.geocodingService.searchAddress(
          `${query}, ${this.form.get('ciudadNombre')?.value}, Colombia`,
        ),
      );
      this.addressResults = res ?? [];
    } catch {
      this.addressResults = [];
    } finally {
      this.loadingAddressSearch = false;
      this.cdr.markForCheck();
    }
  }

  onAddressSelect(result: GeocodingResult): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    let direccion = result.display_name.split(',')[0].trim();
    if (result.address?.road) {
      direccion = result.address.road;
      if (result.address.house_number) {
        direccion += ` #${result.address.house_number}`;
      } else {
        direccion += ` #${String(this.query.split('#')[1] ?? '').trim()}`;
      }
    }

    if (direccion) {
      this.form.get('direccion')?.setErrors(null);
      this.form.get('direccion')?.updateValueAndValidity();
    }

    let barrio = this.form.get('barrio')?.value || null;
    if (!barrio) {
      barrio = result.address?.neighbourhood || result.address?.suburb;
    }

    this.form.patchValue({
      latitud: lat,
      longitud: lng,
      direccion: direccion,
      barrio,
    });
    this.cdr.markForCheck();
  }

  onLocation($event: Event) {
    console.log('location', $event);
  }
}
