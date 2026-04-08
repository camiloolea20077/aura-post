import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { IndexDBService } from '../../../../core/services/index-db.service';
import { VendedorService } from '../../services/vendedor.service';
import { VendedorModel } from '../../models/vendedor.model';
import { PersonalLocalesComponent } from '../locales/personal-locales.component';
import { PersonalRutasComponent } from '../rutas/personal-rutas.component';
import { PersonalVisitasComponent } from '../visitas/personal-visitas.component';

@Component({
  selector: 'app-personal-index',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TabViewModule,
    ButtonModule,
    ToastModule,
    PersonalLocalesComponent,
    PersonalRutasComponent,
    PersonalVisitasComponent,
  ],
  providers: [MessageService],
  templateUrl: './personal-index.component.html',
  styleUrls: ['./personal-index.component.scss'],
})
export class PersonalIndexComponent implements OnInit {
  vendedorId: number | null = null;
  vendedor: VendedorModel | null = null;
  loading = true;

  activeTab = 0;

  constructor(
    private readonly indexDBService: IndexDBService,
    private readonly vendedorService: VendedorService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadVendedor();
  }

  private async loadVendedor(): Promise<void> {
    const auth = await this.indexDBService.loadDataAuthDB();
    if (auth?.usuarioId) {
      this.vendedorId = auth.empleadoId ?? null;
      await this.loadVendedorData();
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  private async loadVendedorData(): Promise<void> {
    if (!this.vendedorId) return;
    try {
      const res = await lastValueFrom(
        this.vendedorService.getById(this.vendedorId),
      );
      this.vendedor = res?.data ?? null;
    } catch {
      this.vendedor = null;
    }
    this.cdr.markForCheck();
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    this.cdr.markForCheck();
  }

  getVendedorId(): number | null {
    return this.vendedorId;
  }
}
