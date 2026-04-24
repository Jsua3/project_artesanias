import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CreatePostRequest } from '../../../core/models/comunidad.model';
import { AuthService } from '../../../core/services/auth.service';
import { CensorshipService } from '../../../core/services/censorship.service';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.scss'
})
export class PostFormComponent implements OnDestroy {
  @Input() submitting = false;
  @Output() submitted = new EventEmitter<CreatePostRequest>();

  auth = inject(AuthService);
  private censor = inject(CensorshipService);

  readonly content = signal('');
  readonly imagePreview = signal<string | null>(null);
  readonly imageBase64 = signal<string | null>(null);
  readonly validationError = signal<string | null>(null);
  readonly isDragging = signal(false);

  private fileInput: HTMLInputElement | null = null;
  private objectUrl: string | null = null;

  /** Caracteres restantes para el límite. */
  readonly remaining = computed(() => this.censor.remainingChars(this.content()));

  /** Verdadero cuando el texto tiene contenido prohibido (advertencia en tiempo real). */
  readonly hasBanned = computed(() => this.censor.hasBannedContent(this.content()));

  /** Indica si el formulario está listo para enviar. */
  readonly canSubmit = computed(() =>
    this.content().trim().length >= 3
    && !this.censor.isOverLimit(this.content())
    && !this.submitting
  );

  readonly avatarUrl = computed(() => this.auth.currentUser()?.avatarUrl ?? null);
  readonly displayName = computed(() =>
    this.auth.currentUser()?.displayName || this.auth.currentUser()?.username || 'Artesano'
  );

  onContentChange(value: string): void {
    this.content.set(value);
    this.validationError.set(null);
  }

  onImageClick(): void {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'image/*';
      this.fileInput.onchange = (e) => this.handleFile((e.target as HTMLInputElement).files?.[0]);
    }
    this.fileInput.click();
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    this.handleFile(e.dataTransfer?.files?.[0]);
  }

  removeImage(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.imagePreview.set(null);
    this.imageBase64.set(null);
  }

  submit(): void {
    const result = this.censor.validate(this.content());
    if (!result.valid) {
      this.validationError.set(result.reason ?? 'Contenido no permitido.');
      return;
    }

    const payload: CreatePostRequest = {
      content: this.content().trim(),
      imageUrl: this.imageBase64() ?? null
    };

    this.submitted.emit(payload);
    this.content.set('');
    this.removeImage();
    this.validationError.set(null);
  }

  ngOnDestroy(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.fileInput = null;
  }

  private handleFile(file?: File): void {
    if (!file || !file.type.startsWith('image/')) return;

    // Limitar a 2 MB
    if (file.size > 2 * 1024 * 1024) {
      this.validationError.set('La imagen no puede superar 2 MB.');
      return;
    }

    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.compressImage(dataUrl, 800, 0.75, (compressed) => {
        this.imagePreview.set(compressed);
        this.imageBase64.set(compressed);
      });
    };
    reader.readAsDataURL(file);
  }

  /** Comprime la imagen a max `maxWidth`px con calidad JPEG `quality`. */
  private compressImage(
    src: string,
    maxWidth: number,
    quality: number,
    cb: (dataUrl: string) => void
  ): void {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.naturalWidth);
      const w = Math.round(img.naturalWidth * ratio);
      const h = Math.round(img.naturalHeight * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = src;
  }
}
