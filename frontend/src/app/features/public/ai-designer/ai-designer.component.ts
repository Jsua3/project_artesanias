import { Component, computed, inject, signal } from '@angular/core';
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
    MatProgressSpinnerModule
  ],
  templateUrl: './ai-designer.component.html',
  styleUrl: './ai-designer.component.scss'
})
export class AiDesignerComponent {
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
      text: 'Cuéntame que pieza quieres imaginar: uso, material, tamaño, color, territorio o presupuesto. Yo la convierto en una ficha de diseño artesanal y un preview 3D.'
    }
  ]);
  readonly spec = signal<DesignSpec | null>(null);
  readonly previewImage = signal<string | null>(null);
  readonly previewImageBase64 = signal<string | null>(null);
  readonly previewMimeType = signal<string | null>(null);
  readonly previewPrompt = signal<string | null>(null);
  readonly previewSource = signal<string | null>(null);
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
  readonly previewStyle = computed(() => {
    const p = this.spec()?.threeD;
    return {
      '--shape-height': `${Math.max(150, (p?.height ?? 1) * 180)}px`,
      '--shape-width': `${Math.max(110, (p?.radius ?? 0.6) * 220)}px`,
      '--shape-color': p?.materialColor ?? '#704A2E',
      '--shape-accent': p?.accentColor ?? '#C9A253',
      '--shape-curve': `${Math.round((p?.curvature ?? 0.2) * 36)}px`,
    };
  });
  readonly previewClass = computed(() => `preview-object preview-object--${this.spec()?.threeD.template || 'vase'}`);

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
        this.error.set('No pudimos generar el boceto visual. El preview 3D sigue disponible.');
        this.previewLoading.set(false);
      }
    });
  }

  confirmDesign(): void {
    const current = this.spec();
    if (!current || this.confirming()) return;
    if (!this.auth.isLoggedIn()) {
      this.error.set('Para enviar la solicitud al taller, inicia sesion como cliente. Puedes seguir explorando el diseno 3D sin iniciar sesion.');
      this.router.navigate(['/login']);
      return;
    }

    this.confirming.set(true);
    this.error.set(null);
    this.ai.confirmDesign({
      spec: current,
      customerNotes: this.customerNotes.value?.trim() || null,
      previewPrompt: this.previewPrompt(),
      previewImageBase64: this.previewImageBase64(),
      previewMimeType: this.previewMimeType(),
      previewSource: this.previewSource()
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
