import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomDesignResponse, DesignNotificationResponse } from '../../../core/models/ai-design.model';
import { AiDesignService } from '../../../core/services/ai-design.service';

@Component({
  selector: 'app-my-designs',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './my-designs.component.html',
  styleUrl: './my-designs.component.scss'
})
export class MyDesignsComponent {
  private readonly ai = inject(AiDesignService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly designs = signal<CustomDesignResponse[]>([]);
  readonly notifications = signal<DesignNotificationResponse[]>([]);
  readonly unreadCount = signal(0);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ai.getMyDesigns().subscribe({
      next: designs => {
        this.designs.set(designs);
        this.loading.set(false);
        this.loadNotifications();
      },
      error: () => {
        this.error.set('No pudimos cargar tus disenos personalizados.');
        this.loading.set(false);
      }
    });
  }

  loadNotifications(): void {
    this.ai.getNotifications().subscribe({
      next: notifications => {
        this.notifications.set(notifications);
        this.unreadCount.set(notifications.filter(item => !item.read).length);
      }
    });
  }

  markAllRead(): void {
    this.ai.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.update(items => items.map(item => ({ ...item, read: true, readAt: new Date().toISOString() })));
        this.unreadCount.set(0);
      }
    });
  }

  notificationLink(notification: DesignNotificationResponse): string[] {
    return ['/mis-disenos', notification.designId];
  }

  formatCurrency(value: number): string {
    return '$ ' + (value ?? 0).toLocaleString('es-CO');
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'PENDING_QUOTE': return 'Pendiente de cotizacion';
      case 'IN_REVIEW': return 'En revision';
      case 'QUOTE_SENT': return 'Cotizacion enviada';
      case 'CUSTOMER_ACCEPTED': return 'Aceptado por cliente';
      case 'IN_PRODUCTION': return 'En produccion';
      case 'READY': return 'Listo';
      case 'NEEDS_CHANGES': return 'Necesita ajustes';
      case 'APPROVED_FOR_PRODUCT': return 'Aprobado por taller';
      case 'REJECTED': return 'No viable';
      case 'CANCELLED': return 'Cancelado';
      case 'ARCHIVED': return 'Archivado';
      default: return status;
    }
  }

  hasCustomerAlert(design: CustomDesignResponse): boolean {
    return ['QUOTE_SENT', 'NEEDS_CHANGES', 'READY'].includes(design.status) || !!design.reviewNotes;
  }

  statusClass(status: string): string {
    return `status status--${status.toLowerCase().replaceAll('_', '-')}`;
  }
}
