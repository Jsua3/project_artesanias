import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiDesignService } from '../../../core/services/ai-design.service';
import { AuthService } from '../../../core/services/auth.service';
import { CustomDesignResponse, DesignSpec } from '../../../core/models/ai-design.model';
import { Craft3DCapture, Craft3DViewerComponent } from './craft-3d-viewer.component';

interface ChatMessage {
  role: 'cliente' | 'agente';
  text: string;
}

@Component({
  selector: 'app-ai-designer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    Craft3DViewerComponent
  ],
  templateUrl: './ai-designer.component.html',
  styleUrl: './ai-designer.component.scss'
})
export class AiDesignerComponent {
  @ViewChild(Craft3DViewerComponent) private readonly craftViewer?: Craft3DViewerComponent;

  private readonly ai = inject(AiDesignService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly prompt = new FormControl(
    'Quiero una lampara de guadua para sala, inspirada en Filandia, con tonos calidos y maximo 35 cm.',
    [Validators.required, Validators.minLength(8), Validators.maxLength(1500)]
  );
  readonly customerNotes = new FormControl('', [Validators.maxLength(800)]);

  readonly loading = signal(false);
  readonly previewLoading = signal(false);
  readonly confirming = signal(false);
  readonly error = signal<string | null>(null);
  readonly messages = signal<ChatMessage[]>([
    {
      role: 'agente',
      text: 'Cuéntame que pieza quieres imaginar: uso, material, tamaño, color, territorio o presupuesto. Yo la convierto en una ficha artesanal y un modelo 3D real para observar desde todos los angulos.'
    }
  ]);
  readonly spec = signal<DesignSpec | null>(null);
  readonly previewImage = signal<string | null>(null);
  readonly previewImageBase64 = signal<string | null>(null);
  readonly previewMimeType = signal<string | null>(null);
  readonly previewPrompt = signal<string | null>(null);
  readonly previewSource = signal<string | null>(null);
  readonly modelPreviewBase64 = signal<string | null>(null);
  readonly modelPreviewMimeType = signal<string | null>(null);
  readonly savedDesign = signal<CustomDesignResponse | null>(null);

  readonly hasSpec = computed(() => this.spec() !== null);
  readonly isLoggedIn = computed(() => this.auth.isLoggedIn());
  readonly priceLabel = computed(() => {
    const price = this.spec()?.estimatedPrice ?? 0;
    return '$ ' + price.toLocaleString('es-CO');
  });
  readonly priceItems = computed(() => {
    const breakdown = this.spec()?.priceBreakdown;
    if (!breakdown) return [];
    return [
      { label: 'Base', value: breakdown.basePrice },
      { label: 'Materiales', value: breakdown.materialCost },
      { label: 'Complejidad', value: breakdown.complexityCost },
      { label: 'Tamaño', value: breakdown.sizeCost },
      { label: 'Acabado', value: breakdown.finishCost },
    ];
  });
  send(): void {
    if (this.loading()) return;
    this.prompt.markAsTouched();
    if (this.prompt.invalid) return;

    const text = this.prompt.value?.trim() ?? '';
    this.messages.update(items => [...items, { role: 'cliente', text }]);
    this.loading.set(true);
    this.error.set(null);

    this.ai.sendMessage({ message: text, currentSpec: this.spec() }).subscribe({
      next: response => {
        this.spec.set(response.spec);
        this.savedDesign.set(null);
        this.previewImage.set(null);
        this.previewImageBase64.set(null);
        this.previewMimeType.set(null);
        this.previewPrompt.set(response.previewPrompt);
        this.previewSource.set(response.source);
        this.modelPreviewBase64.set(null);
        this.modelPreviewMimeType.set(null);
        this.messages.update(items => [...items, { role: 'agente', text: response.reply }]);
        this.prompt.setValue('');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos hablar con el agente. Intenta de nuevo en un momento.');
        this.loading.set(false);
      }
    });
  }

  onModelCaptured(capture: Craft3DCapture): void {
    this.modelPreviewBase64.set(capture.imageBase64);
    this.modelPreviewMimeType.set(capture.mimeType);
    this.previewSource.set(capture.source);
  }

  useSuggestion(text: string): void {
    this.prompt.setValue(text);
    this.send();
  }

  generatePreview(): void {
    const current = this.spec();
    if (!current || this.previewLoading()) return;

    this.previewLoading.set(true);
    this.error.set(null);
    this.ai.generatePreview(current).subscribe({
      next: response => {
        this.previewImageBase64.set(response.imageBase64 ?? null);
        this.previewMimeType.set(response.mimeType ?? null);
        this.previewPrompt.set(response.prompt);
        this.previewImage.set(response.imageBase64 ? `data:${response.mimeType};base64,${response.imageBase64}` : null);
        this.previewSource.set(response.source);
        this.previewLoading.set(false);
      },
      error: () => {
        this.error.set('No pudimos generar el boceto visual. El modelo 3D interactivo sigue disponible.');
        this.previewLoading.set(false);
      }
    });
  }

  confirmDesign(): void {
    this.confirmDesignNow();
  }

  private confirmDesignNow(): void {
    const current = this.spec();
    if (!current || this.confirming()) return;
    if (!this.auth.isLoggedIn()) {
      this.error.set('Para enviar la solicitud al taller, inicia sesion como cliente. Puedes seguir explorando el diseno 3D sin iniciar sesion.');
      this.router.navigate(['/login']);
      return;
    }

    this.confirming.set(true);
    this.error.set(null);
    if (!this.previewImageBase64() && !this.modelPreviewBase64()) {
      const capture = this.craftViewer?.captureDataUrl();
      if (capture) {
        this.onModelCaptured(capture);
      }
    }

    const imageBase64 = this.previewImageBase64() ?? this.modelPreviewBase64();
    const mimeType = this.previewMimeType() ?? this.modelPreviewMimeType();
    const source = this.previewImageBase64() ? this.previewSource() : imageBase64 ? 'threejs' : this.previewSource();

    this.ai.confirmDesign({
      spec: current,
      customerNotes: this.customerNotes.value?.trim() || null,
      previewPrompt: this.previewPrompt(),
      previewImageBase64: imageBase64,
      previewMimeType: mimeType,
      previewSource: source
    }).subscribe({
      next: response => {
        this.savedDesign.set(response);
        this.spec.set(response.spec);
        this.confirming.set(false);
        this.messages.update(items => [
          ...items,
          {
            role: 'agente',
            text: `Listo: cree la solicitud ${response.id.slice(0, 8)} para cotizacion. Queda en estado pendiente mientras el taller valida fabricacion, materiales y entrega.`
          }
        ]);
      },
      error: () => {
        this.error.set('No pudimos crear la solicitud. Revisa tu sesion e intenta de nuevo.');
        this.confirming.set(false);
      }
    });
  }

  trackMessage(index: number): number {
    return index;
  }

  formatCurrency(value: number): string {
    return '$ ' + value.toLocaleString('es-CO');
  }
}
