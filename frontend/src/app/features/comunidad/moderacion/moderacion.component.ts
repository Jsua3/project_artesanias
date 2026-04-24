import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ComunidadPost, EventoPropuesta } from '../../../core/models/comunidad.model';

@Component({
  selector: 'app-moderacion',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTabsModule],
  template: `
    <div class="mod-shell">
      <header class="mod-header">
        <mat-icon class="header-icon">shield</mat-icon>
        <div>
          <h1>Moderación</h1>
          <p>Revisa publicaciones de la comunidad y solicitudes de eventos</p>
        </div>
      </header>

      <mat-tab-group animationDuration="200ms">
        <!-- Tab: Feed de la comunidad -->
        <mat-tab label="Feed comunidad">
          @if (posts().length === 0) {
            <div class="empty-mod"><mat-icon>check_circle</mat-icon><p>No hay publicaciones para moderar.</p></div>
          } @else {
            <div class="post-list">
              @for (post of posts(); track post.id) {
                <div class="mod-card" [class.reported]="post.estado === 'REPORTADO'">
                  <div class="mod-card__meta">
                    <strong>{{ post.authorName }}</strong>
                    <span class="mod-date">{{ post.createdAt | date:'d MMM yyyy, HH:mm' }}</span>
                    @if (post.estado === 'REPORTADO') {
                      <span class="chip-reported">Reportado</span>
                    }
                  </div>
                  <p class="mod-content">{{ post.content }}</p>
                  <div class="mod-actions">
                    <button mat-stroked-button color="warn" (click)="removePost(post.id)">
                      <mat-icon>delete</mat-icon> Eliminar
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </mat-tab>

        <!-- Tab: Eventos pendientes -->
        <mat-tab label="Propuestas de eventos">
          @if (pendingEventos().length === 0) {
            <div class="empty-mod"><mat-icon>event_available</mat-icon><p>No hay eventos pendientes de aprobación.</p></div>
          } @else {
            <div class="post-list">
              @for (ev of pendingEventos(); track ev.id) {
                <div class="mod-card">
                  <div class="mod-card__meta">
                    <strong>{{ ev.nombre }}</strong>
                    <span class="mod-date">{{ ev.artesanoNombre }}</span>
                  </div>
                  <p class="mod-content">{{ ev.localidad }} · {{ ev.fechaInicio | date:'d MMM' }} → {{ ev.fechaFin | date:'d MMM yyyy' }}</p>
                  <p class="mod-content">{{ ev.organizacion }}</p>
                  <div class="mod-actions">
                    <button mat-stroked-button class="approve-btn" (click)="approveEvento(ev.id)">
                      <mat-icon>check</mat-icon> Aprobar
                    </button>
                    <button mat-stroked-button color="warn" (click)="rejectEvento(ev.id)">
                      <mat-icon>close</mat-icon> Rechazar
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .mod-shell { padding: 28px 24px 60px; max-width: 860px; margin: 0 auto; }
    .mod-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
    .mod-header h1 { margin: 0 0 4px; font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 500; }
    .mod-header p { margin: 0; font-family: 'Outfit', sans-serif; font-size: 13px; color: #6b6259; }
    .header-icon { font-size: 34px; width: 34px; height: 34px; color: #A67C52; }
    .empty-mod { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: #6b6259; font-family: 'Outfit', sans-serif; }
    .empty-mod mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ece5db; }
    .post-list { display: flex; flex-direction: column; gap: 12px; padding: 20px 0; }
    .mod-card { background: #fff; border: 1px solid #ece5db; border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
    .mod-card.reported { border-color: #f5a623; background: rgba(245,166,35,.04); }
    .mod-card__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    strong { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; color: #2d2a26; }
    .mod-date { font-family: 'Outfit', sans-serif; font-size: 12px; color: #6b6259; }
    .chip-reported { padding: 2px 8px; border-radius: 999px; background: rgba(245,166,35,.15); color: #b07a10; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; }
    .mod-content { margin: 0; font-family: 'Outfit', sans-serif; font-size: 14px; color: #2d2a26; }
    .mod-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .approve-btn { color: #2e8a65 !important; border-color: #2e8a65 !important; }
  `]
})
export class ModeracionComponent implements OnInit {
  private snackBar = inject(MatSnackBar);

  readonly posts = signal<ComunidadPost[]>([]);
  readonly pendingEventos = signal<EventoPropuesta[]>([]);

  ngOnInit(): void {
    // TODO: cargar desde backend (posts con estado REPORTADO o todos, eventos PENDIENTES)
  }

  removePost(id: string): void {
    // TODO: llamar al backend
    this.posts.update(p => p.filter(x => x.id !== id));
    this.snackBar.open('Publicación eliminada', 'OK', { duration: 2000 });
  }

  approveEvento(id: string): void {
    // TODO: llamar al backend
    this.pendingEventos.update(ev => ev.filter(x => x.id !== id));
    this.snackBar.open('Evento aprobado', 'OK', { duration: 2000 });
  }

  rejectEvento(id: string): void {
    // TODO: llamar al backend
    this.pendingEventos.update(ev => ev.filter(x => x.id !== id));
    this.snackBar.open('Evento rechazado', 'OK', { duration: 2000 });
  }
}
