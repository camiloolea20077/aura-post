import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { IndexDBService } from '../../../core/services/index-db.service';

@Component({
  selector: 'app-platform-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ToastModule],
  templateUrl: './platform-layout.component.html',
  styleUrl: './platform-layout.component.scss',
})
export class PlatformLayoutComponent {
  constructor(
    private readonly router: Router,
    private readonly indexDB: IndexDBService, // ← agregar
  ) {}

  async logout(): Promise<void> {
    await this.indexDB.deleteDataAuthDB(); // ← borra la sesión real
    this.router.navigate(['/login']);
  }
}
