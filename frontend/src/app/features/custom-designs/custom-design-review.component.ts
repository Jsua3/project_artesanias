import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomDesignResponse, CustomDesignStatus } from '../../core/models/ai-design.model';
import { ProductDraft } from '../../core/models/product.model';
import { AiDesignService } from '../../core/services/ai-design.service';
import { ProductFormComponent } from '../products/product-form/product-form.component';

@Component({
  selector: 'app-custom-design-review',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './custom-design-review.component.html',
  styleUrl: './custom-design-review.component.scss'
})
export class CustomDesignReviewComponent {
  private readonly ai = inject(AiDesignService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly savingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly designs = signal<CustomDesignResponse[]>([]);
  readonly selected = signal<CustomDesignResponse | null>(null);
  readonly statusControl = new FormControl<CustomDesignStatus>('IN_REVIEW', { nonNullable: true });
  readonly reviewNotes = new FormControl('', [Validators.maxLength(800)]);

  readonly pendingCount = computed(() => this.designs().filter(item => item.status === 'PENDING_QUOTE').length);
  readonly approvedCount = computed(() => this.designs().filter(item => item.status === 'APPROVED_FOR_PRODUCT').length);

  readonly statuses: Array<{ value: CustomDesignStatus; label: string }> = [
    { value: 'PENDING_QUOTE', label: 'Pendiente' },
    { value: 'IN_REVIEW', label: 'En revision' },
    { value: 'QUOTE_SENT', label: 'Cotizacion enviada' },
    { value: 'CUSTOMER_ACCEPTED', label: 'Aceptado por cliente' },
    { value: 'IN_PRODUCTION', label: 'En produccion' },
    { value: 'READY', label: 'Listo' },
    { value: 'NEEDS_CHANGES', label: 'Pedir ajustes' },
    { value: 'APPROVED_FOR_PRODUCT', label: 'Aprobar para producto' },
    { value: 'REJECTED', label: 'No viable' },
    { value: 'CANCELLED', label: 'Cancelado' },
    { value: 'ARCHIVED', label: 'Archivar' }
  ];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ai.getReviewQueue().subscribe({
      next: designs => {
        this.designs.set(designs);
        this.select(designs[0] ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar las solicitudes personalizadas.');
        this.loading.set(false);
      }
    });
  }

  select(design: CustomDesignResponse | null): void {
    this.selected.set(design);
    this.statusControl.setValue((design?.status as CustomDesignStatus) || 'IN_REVIEW');
    this.reviewNotes.setValue(design?.reviewNotes ?? '');
  }

  saveStatus(): void {
    const design = this.selected();
    if (!design || this.reviewNotes.invalid) return;
    this.savingId.set(design.id);
    this.ai.updateStatus(design.id, {
      status: this.statusControl.value,
      reviewNotes: this.reviewNotes.value?.trim() || null
    }).subscribe({
      next: updated => {
        this.designs.update(items => items.map(item => item.id === updated.id ? updated : item));
        this.select(updated);
        this.savingId.set(null);
        this.snack.open('Solicitud actualizada', 'OK', { duration: 2600 });
      },
      error: () => {
        this.savingId.set(null);
        this.snack.open('No fue posible actualizar la solicitud', 'OK', { duration: 3200 });
      }
    });
  }

  copyProductDraft(design: CustomDesignResponse): void {
    const lines = [
      design.title,
      '',
      design.spec.artisanStory,
      '',
      `Material: ${design.spec.primaryMaterial}`,
      `Acabado: ${design.spec.finish}`,
      `Medidas: ${design.spec.dimensions.heightCm} x ${design.spec.dimensions.widthCm} x ${design.spec.dimensions.depthCm} cm`,
      `Territorio: ${design.spec.territory}`,
      `Precio sugerido: ${this.formatCurrency(design.estimatedPrice)}`,
      `Solicitud IA: ${design.id}`
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    this.snack.open('Ficha copiada para crear el producto en catalogo', 'OK', { duration: 2800 });
  }

  createProductFromDesign(design: CustomDesignResponse): void {
    if (design.status !== 'APPROVED_FOR_PRODUCT') {
      this.snack.open('Aprueba la solicitud antes de crearla como producto.', 'OK', { duration: 3000 });
      return;
    }

    const draft: ProductDraft = {
      name: design.title,
      description: this.productDescription(design),
      price: design.estimatedPrice,
      stockMinimo: 1,
      sourceLabel: `Diseño IA #${design.id.slice(0, 8)}`
    };

    const ref = this.dialog.open(ProductFormComponent, {
      width: '620px',
      maxWidth: '95vw',
      data: { draft }
    });

    ref.afterClosed().subscribe(created => {
      if (!created) return;
      const note = [
        this.reviewNotes.value?.trim(),
        `Producto creado desde diseño IA #${design.id.slice(0, 8)}.`
      ].filter(Boolean).join('\n');
      this.reviewNotes.setValue(note);
      this.snack.open('Producto creado en catalogo. La solicitud queda marcada con la nota.', 'OK', { duration: 3400 });
      this.saveStatus();
    });
  }

  formatCurrency(value: number): string {
    return '$ ' + (value ?? 0).toLocaleString('es-CO');
  }

  statusLabel(status: string): string {
    return this.statuses.find(item => item.value === status)?.label ?? status;
  }

  statusClass(status: string): string {
    return `status status--${status.toLowerCase().replaceAll('_', '-')}`;
  }

  private productDescription(design: CustomDesignResponse): string {
    const spec = design.spec;
    return [
      spec.artisanStory,
      '',
      `Territorio: ${spec.territory}.`,
      `Material principal: ${spec.primaryMaterial}.`,
      `Materiales secundarios: ${spec.secondaryMaterials.join(', ') || 'sin secundarios definidos'}.`,
      `Acabado: ${spec.finish}. Patron: ${spec.pattern}.`,
      `Medidas aproximadas: ${spec.dimensions.heightCm} x ${spec.dimensions.widthCm} x ${spec.dimensions.depthCm} cm. Diametro: ${spec.dimensions.diameterCm} cm.`,
      `Complejidad: ${spec.complexity}. Tiempo estimado de taller: ${design.estimatedDays} dias.`,
      '',
      'Ruta de fabricacion:',
      ...spec.makingSteps.map((step, index) => `${index + 1}. ${step}`),
      '',
      `Origen: solicitud de diseño IA ${design.id}.`
    ].join('\n');
  }
}
