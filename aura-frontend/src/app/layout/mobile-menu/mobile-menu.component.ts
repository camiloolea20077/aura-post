import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { StateStore } from '../../core/store/state';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ConfirmDialogModule, TooltipModule],
  providers: [ConfirmationService],
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.scss'],
})
export class MobileMenuComponent {
  @Input() userName = '';
  @Output() closeMenu = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  public readonly stateStore = inject(StateStore);

  public open = false;
  public expandedGroups = new Set<string>();

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly confirmationService: ConfirmationService,
  ) {}

  toggle(): void {
    this.open = !this.open;
    this.cdr.markForCheck();
  }

  close(): void {
    this.open = false;
    this.closeMenu.emit();
    this.cdr.markForCheck();
  }

  toggleGroup(label: string): void {
    if (this.expandedGroups.has(label)) {
      this.expandedGroups.delete(label);
    } else {
      this.expandedGroups.add(label);
    }
    this.cdr.markForCheck();
  }

  isGroupExpanded(label: string): boolean {
    return this.expandedGroups.has(label);
  }

  onNavigate(): void {
    this.close();
  }

  confirmLogout(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Sí, cerrar sesión',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.close();
        this.logout.emit();
      },
    });
  }
}
