import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomDesignResponse } from '../../core/models/ai-design.model';
import { AiDesignService } from '../../core/services/ai-design.service';

@Component({
  selector: 'app-custom-design-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './custom-design-detail.component.html',
  styleUrl: './custom-design-detail.component.scss'
})
export class CustomDesignDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ai = inject(AiDesignService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly design = signal<CustomDesignResponse | null>(null);
  readonly isWorkshop = computed(() => this.router.url.startsWith('/disenos-personalizados'));
  readonly backLink = computed(() => this.isWorkshop() ? '/disenos-personalizados' : '/mis-disenos');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No encontramos el identificador del diseno.');
      this.loading.set(false);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.ai.getDesign(id).subscribe({
      next: design => {
        this.design.set(design);
        this.loading.set(false);
        this.markRelatedNotificationRead(design.id);
      },
      error: () => {
        this.error.set('No pudimos cargar el detalle de este diseno.');
        this.loading.set(false);
      }
    });
  }

  previewDataUrl(design: CustomDesignResponse): string | null {
    if (!design.previewImageBase64) return null;
    return `data:${design.previewMimeType || 'image/png'};base64,${design.previewImageBase64}`;
  }

  previewStyle(design: CustomDesignResponse): Record<string, string> {
    const params = design.spec.threeD;
    return {
      '--shape-height': `${Math.max(150, (params?.height ?? 1) * 180)}px`,
      '--shape-width': `${Math.max(110, (params?.radius ?? 0.6) * 220)}px`,
      '--shape-color': params?.materialColor ?? '#704A2E',
      '--shape-accent': params?.accentColor ?? '#C9A253',
      '--shape-curve': `${Math.round((params?.curvature ?? 0.2) * 36)}px`
    };
  }

  previewClass(design: CustomDesignResponse): string {
    return `preview-object preview-object--${design.spec.threeD?.template || 'vase'}`;
  }

  priceItems(design: CustomDesignResponse): Array<{ label: string; value: number }> {
    const price = design.priceBreakdown;
    return [
      { label: 'Base', value: price.basePrice },
      { label: 'Materiales', value: price.materialCost },
      { label: 'Complejidad', value: price.complexityCost },
      { label: 'Tamano', value: price.sizeCost },
      { label: 'Acabado', value: price.finishCost }
    ];
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

  statusClass(status: string): string {
    return `status status--${status.toLowerCase().replaceAll('_', '-')}`;
  }

  customerAlert(design: CustomDesignResponse): string | null {
    if (this.isWorkshop()) return null;
    if (design.status === 'QUOTE_SENT') return 'El taller ya envio una cotizacion. Revisa la respuesta antes de aceptar.';
    if (design.status === 'NEEDS_CHANGES') return 'El taller necesita ajustes para continuar con tu encargo.';
    if (design.status === 'READY') return 'Tu pieza personalizada esta lista para el siguiente paso.';
    if (design.reviewNotes) return 'Tienes una respuesta nueva del taller.';
    return null;
  }

  private markRelatedNotificationRead(designId: string): void {
    if (this.isWorkshop()) return;
    this.ai.getNotifications().subscribe({
      next: notifications => {
        const unread = notifications.find(item => item.designId === designId && !item.read);
        if (unread) {
          this.ai.markNotificationRead(unread.id).subscribe();
        }
      }
    });
  }
}
