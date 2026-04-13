import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="upload-container" [class.has-image]="currentImage()"
         (click)="fileInput.click()"
         (dragover)="onDragOver($event)"
         (dragleave)="onDragLeave($event)"
         (drop)="onDrop($event)"
         [class.dragover]="isDragging()">

      @if (processing()) {
        <div class="upload-overlay">
          <mat-spinner diameter="32" />
          <span>Procesando...</span>
        </div>
      } @else if (currentImage()) {
        <img [src]="currentImage()" [alt]="alt" class="preview-image" />
        <div class="upload-overlay hover-overlay">
          <mat-icon>photo_camera</mat-icon>
          <span>Cambiar imagen</span>
        </div>
      } @else {
        <div class="upload-placeholder">
          <mat-icon>add_photo_alternate</mat-icon>
          <span>{{ placeholder }}</span>
          <span class="hint">Arrastra o haz clic</span>
        </div>
      }

      <input #fileInput type="file" accept="image/*" hidden
             (change)="onFileSelected($event)" />
    </div>

    @if (currentImage()) {
      <button mat-button class="remove-btn" (click)="removeImage($event)">
        <mat-icon>close</mat-icon> Quitar imagen
      </button>
    }
  `,
  styles: [`
    :host { display: block; }

    .upload-container {
      position: relative;
      width: 100%;
      aspect-ratio: 4/3;
      max-height: 260px;
      border: 2px dashed rgba(166, 124, 82, 0.3);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(166, 124, 82, 0.03);

      &:hover {
        border-color: var(--terracotta, #A67C52);
        background: rgba(166, 124, 82, 0.06);
      }

      &.dragover {
        border-color: var(--terracotta, #A67C52);
        background: rgba(166, 124, 82, 0.1);
        transform: scale(1.02);
      }

      &.has-image {
        border-style: solid;
        border-color: rgba(166, 124, 82, 0.15);
      }
    }

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .upload-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: rgba(58, 53, 48, 0.5);
      color: white;
      font-size: 0.85rem;

      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }

    .hover-overlay {
      opacity: 0;
      transition: opacity 0.3s ease;

      .upload-container:hover & {
        opacity: 1;
      }
    }

    .upload-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--text-light, #7A7370);

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--terracotta-light, #C49A6C);
      }

      span { font-size: 0.9rem; }

      .hint {
        font-size: 0.75rem;
        opacity: 0.6;
      }
    }

    .remove-btn {
      margin-top: 8px;
      font-size: 0.8rem;
      color: var(--danger, #C0392B) !important;
    }
  `]
})
export class ImageUploadComponent {
  @Input() currentImage = signal<string | null>(null);
  @Input() placeholder = 'Agregar imagen';
  @Input() alt = 'Imagen';
  @Input() maxWidth = 600;
  @Input() maxHeight = 600;
  @Input() quality = 0.8;
  @Output() imageChange = new EventEmitter<string | null>();

  processing = signal(false);
  isDragging = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.processFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file);
      input.value = ''; // Reset so same file can be re-selected
    }
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.currentImage.set(null);
    this.imageChange.emit(null);
  }

  private processFile(file: File): void {
    this.processing.set(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if needed
        if (width > this.maxWidth || height > this.maxHeight) {
          const ratio = Math.min(this.maxWidth / width, this.maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', this.quality);
        this.currentImage.set(dataUrl);
        this.imageChange.emit(dataUrl);
        this.processing.set(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}
