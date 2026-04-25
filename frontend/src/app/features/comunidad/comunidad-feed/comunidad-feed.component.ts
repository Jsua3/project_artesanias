import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { ComunidadPost, CreatePostRequest } from '../../../core/models/comunidad.model';
import { AuthService } from '../../../core/services/auth.service';
import { CensorshipService } from '../../../core/services/censorship.service';
import { ComunidadService } from '../../../core/services/comunidad.service';
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
        <div>
          <span class="feed-kicker">Gremio Rebecca</span>
          <h1>Comunidad Artesana</h1>
          <p class="feed-sub">Comparte ideas, logros y noticias con el gremio</p>
        </div>
        <div class="feed-badges">
          <span>Lenguaje moderado</span>
          <span>Imagenes preparadas para revision</span>
        </div>
      </header>

      @if (auth.isArtesano() || auth.isAdmin()) {
        <app-post-form
          [submitting]="submitting()"
          (submitted)="onSubmit($event)"
        />
      }

      @if (loading()) {
        <div class="loading-wrap">
          <mat-progress-spinner mode="indeterminate" diameter="40" />
        </div>
      } @else if (posts().length === 0) {
        <div class="empty-feed">
          <mat-icon>groups</mat-icon>
          <p>Se el primero en publicar algo en la comunidad.</p>
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
              <span class="moderation-chip" [class.pending]="post.estado !== 'ACTIVO'">{{ post.estado }}</span>
            </div>
            <p class="post-content">{{ softContent(post.content) }}</p>
            @if (post.imageUrl) {
              <img [src]="post.imageUrl" alt="Imagen de la publicacion" class="post-image" />
            }
            <div class="post-actions">
              <button mat-button class="like-btn" (click)="toggleLike(post)">
                <mat-icon>{{ post.likedByMe ? 'favorite' : 'favorite_border' }}</mat-icon> {{ post.likesCount }}
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
    .feed-shell { max-width: 820px; margin: 0 auto; padding: 28px 16px 60px; display: flex; flex-direction: column; gap: 20px; }
    .feed-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding: 22px; border-radius: 20px; background: linear-gradient(145deg, rgba(255,255,255,.72), rgba(255,255,255,.34)), rgba(255,255,255,.42); border: 1px solid rgba(255,255,255,.48); backdrop-filter: blur(12px) saturate(1.1); box-shadow: 0 12px 30px rgba(58,53,48,.06), inset 0 1px 0 rgba(255,255,255,.72); }
    .feed-kicker { display: block; margin-bottom: 8px; color: #a67c52; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
    .feed-header h1 { margin: 0 0 4px; font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 600; }
    .feed-sub { margin: 0; font-family: 'Outfit', sans-serif; font-size: 14px; color: #6b6259; }
    .feed-badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
    .feed-badges span { padding: 7px 11px; border-radius: 999px; background: rgba(166,124,82,.10); color: #8b6340; font-size: 11px; font-weight: 700; letter-spacing: .04em; }
    .loading-wrap, .empty-feed { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px; color: #6b6259; font-family: 'Outfit', sans-serif; text-align: center; }
    .empty-feed mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ece5db; }
    .post-item { background: linear-gradient(145deg, rgba(255,255,255,.72), rgba(255,255,255,.34)), rgba(255,255,255,.42); border: 1px solid rgba(255,255,255,.48); border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 14px; backdrop-filter: blur(12px) saturate(1.1); box-shadow: 0 12px 30px rgba(58,53,48,.06), inset 0 1px 0 rgba(255,255,255,.72); }
    .post-item__author { display: flex; align-items: center; gap: 12px; }
    .post-avatar, .post-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #f0e9de; display: flex; align-items: center; justify-content: center; }
    strong { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; color: #2d2a26; display: block; }
    .post-date { font-family: 'Outfit', sans-serif; font-size: 12px; color: #6b6259; }
    .moderation-chip { margin-left: auto; padding: 5px 10px; border-radius: 999px; background: rgba(138,154,123,.14); color: #4f6945; font-size: 11px; font-weight: 800; letter-spacing: .06em; }
    .moderation-chip.pending { background: rgba(166,124,82,.14); color: #8b6340; }
    .post-content { margin: 0; font-family: 'Outfit', sans-serif; font-size: 15px; line-height: 1.65; color: #2d2a26; white-space: pre-wrap; }
    .post-image { width: 100%; border-radius: 10px; object-fit: cover; max-height: 320px; }
    .post-actions { display: flex; align-items: center; gap: 4px; padding-top: 4px; border-top: 1px solid rgba(166,124,82,.10); }
    .post-actions button { border-radius: 999px; }
    .delete-btn { color: #d73a3a !important; margin-left: auto; }
    @media (max-width: 640px) { .feed-header { align-items: flex-start; flex-direction: column; } .feed-badges { justify-content: flex-start; } }
  `]
})
export class ComunidadFeedComponent implements OnInit {
  auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private censor = inject(CensorshipService);
  private comunidadService = inject(ComunidadService);

  readonly posts = signal<ComunidadPost[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);

  ngOnInit(): void {
    this.loadPosts();
  }

  onSubmit(req: CreatePostRequest): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.submitting.set(true);
    this.comunidadService.createPost({
      ...req,
      authorName: user.displayName || user.username,
      authorAvatarUrl: user.avatarUrl ?? null
    }).pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: post => {
        this.posts.update(p => [post, ...p]);
        this.snackBar.open('Publicacion creada', 'OK', { duration: 2200 });
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Publicacion bloqueada por moderacion', 'OK', { duration: 3500 });
      }
    });
  }

  deletePost(postId: string): void {
    this.comunidadService.deletePost(postId).subscribe({
      next: () => {
        this.posts.update(p => p.filter(x => x.id !== postId));
        this.snackBar.open('Publicacion eliminada', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('No se pudo eliminar la publicacion', 'OK', { duration: 2500 })
    });
  }

  toggleLike(post: ComunidadPost): void {
    this.comunidadService.toggleLike(post.id).subscribe({
      next: updated => {
        this.posts.update(posts => posts.map(item => item.id === updated.id ? updated : item));
      }
    });
  }

  softContent(content: string): string {
    return this.censor.softFilter(content);
  }

  private loadPosts(): void {
    this.loading.set(true);
    this.comunidadService.getPosts().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: posts => this.posts.set(posts),
      error: () => this.snackBar.open('No se pudo cargar la comunidad', 'OK', { duration: 2500 })
    });
  }
}
