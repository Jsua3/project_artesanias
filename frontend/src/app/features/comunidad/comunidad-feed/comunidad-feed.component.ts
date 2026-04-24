import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ComunidadPost, CreatePostRequest } from '../../../core/models/comunidad.model';
import { AuthService } from '../../../core/services/auth.service';
import { PostFormComponent } from '../post-form/post-form.component';

@Component({
  selector: 'app-comunidad-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PostFormComponent,
  ],
  template: `
    <div class="feed-shell">
      <header class="feed-header">
        <h1>Comunidad Artesana</h1>
        <p class="feed-sub">Comparte ideas, logros y noticias con el gremio</p>
      </header>

      <!-- Formulario de nueva publicación -->
      @if (auth.isArtesano() || auth.isAdmin()) {
        <app-post-form
          [submitting]="submitting()"
          (submitted)="onSubmit($event)"
        />
      }

      <!-- Lista de publicaciones -->
      @if (loading()) {
        <div class="loading-wrap">
          <mat-progress-spinner mode="indeterminate" diameter="40" />
        </div>
      } @else if (posts().length === 0) {
        <div class="empty-feed">
          <mat-icon>groups</mat-icon>
          <p>Sé el primero en publicar algo en la comunidad.</p>
        </div>
      } @else {
        @for (post of posts(); track post.id) {
          <article class="post-item">
            <div class="post-item__author">
              @if (post.authorAvatarUrl) {
                <img [src]="post.authorAvatarUrl" [alt]="post.authorName" class="post-avatar" />
              } @else {
                <div class="post-avatar-placeholder"><mat-icon>person</mat-icon></div>
              }
              <div>
                <strong>{{ post.authorName }}</strong>
                <span class="post-date">{{ post.createdAt | date:'d MMM yyyy, HH:mm' }}</span>
              </div>
            </div>
            <p class="post-content">{{ post.content }}</p>
            @if (post.imageUrl) {
              <img [src]="post.imageUrl" alt="Imagen de la publicación" class="post-image" />
            }
            <div class="post-actions">
              <button mat-button class="like-btn">
                <mat-icon>favorite_border</mat-icon> {{ post.likesCount }}
              </button>
              <button mat-button>
                <mat-icon>chat_bubble_outline</mat-icon> {{ post.commentsCount }}
              </button>
              @if (auth.isAdmin()) {
                <button mat-icon-button class="delete-btn" (click)="deletePost(post.id)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              }
            </div>
          </article>
        }
      }
    </div>
  `,
  styles: [`
    .feed-shell { max-width: 720px; margin: 0 auto; padding: 28px 16px 60px; display: flex; flex-direction: column; gap: 20px; }
    .feed-header h1 { margin: 0 0 4px; font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 500; }
    .feed-sub { margin: 0; font-family: 'Outfit', sans-serif; font-size: 14px; color: #6b6259; }
    .loading-wrap, .empty-feed { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px; color: #6b6259; font-family: 'Outfit', sans-serif; text-align: center; }
    .empty-feed mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ece5db; }
    .post-item { background: #fff; border: 1px solid #ece5db; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .post-item__author { display: flex; align-items: center; gap: 12px; }
    .post-avatar, .post-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #f0e9de; display: flex; align-items: center; justify-content: center; }
    strong { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; color: #2d2a26; display: block; }
    .post-date { font-family: 'Outfit', sans-serif; font-size: 12px; color: #6b6259; }
    .post-content { margin: 0; font-family: 'Outfit', sans-serif; font-size: 15px; line-height: 1.65; color: #2d2a26; white-space: pre-wrap; }
    .post-image { width: 100%; border-radius: 10px; object-fit: cover; max-height: 320px; }
    .post-actions { display: flex; align-items: center; gap: 4px; }
    .delete-btn { color: #d73a3a !important; margin-left: auto; }
  `]
})
export class ComunidadFeedComponent implements OnInit {
  auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly posts = signal<ComunidadPost[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);

  ngOnInit(): void {
    // TODO: cargar posts desde backend cuando esté disponible
    this.loading.set(false);
  }

  onSubmit(req: CreatePostRequest): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.submitting.set(true);
    // TODO: llamar al backend
    // Simulación optimista
    const newPost: ComunidadPost = {
      id: crypto.randomUUID(),
      authorId: user.id,
      authorName: user.displayName || user.username,
      authorAvatarUrl: user.avatarUrl,
      content: req.content,
      imageUrl: req.imageUrl,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0,
      estado: 'ACTIVO'
    };

    setTimeout(() => {
      this.posts.update(p => [newPost, ...p]);
      this.submitting.set(false);
      this.snackBar.open('Publicación creada', 'OK', { duration: 2200 });
    }, 600);
  }

  deletePost(postId: string): void {
    // TODO: llamar al backend para moderación
    this.posts.update(p => p.filter(x => x.id !== postId));
    this.snackBar.open('Publicación eliminada', 'OK', { duration: 2000 });
  }
}
