import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../../core/models/auth.model';

@Component({
  selector: 'app-artisan-requests',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatTableModule],
  template: `
    <div class="page-container animate-in">
      <div class="page-header">
        <div>
          <h2 class="page-title">Solicitudes de artesano</h2>
          <p class="page-subtitle">Aprueba o rechaza las cuentas que solicitan acceso como artesano.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner /></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="requests()" class="full-width">
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let user">{{ user.username }}</td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Solicitud</th>
              <td mat-cell *matCellDef="let user">{{ user.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let user">{{ user.approvalStatus }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let user">
                <button mat-stroked-button color="primary" (click)="review(user.id, 'APPROVED')">Aprobar</button>
                <button mat-stroked-button color="warn" (click)="review(user.id, 'REJECTED')">Rechazar</button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          @if (requests().length === 0) {
            <p class="empty-msg">No hay solicitudes pendientes.</p>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 32px; max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-title { margin: 0 0 4px; font-family: 'Cormorant Garamond', serif; font-size: 2rem; color: var(--charcoal); }
    .page-subtitle { margin: 0; color: var(--text-light); }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .full-width { width: 100%; }
    .empty-msg { margin: 16px; color: var(--text-light); }
    td button + button { margin-left: 8px; }
  `]
})
export class ArtisanRequestsComponent implements OnInit {
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['username', 'createdAt', 'status', 'actions'];
  loading = signal(false);
  requests = signal<UserProfile[]>([]);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.authService.getPendingArtisanRequests().subscribe({
      next: requests => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No fue posible cargar las solicitudes', 'OK', { duration: 3000 });
      }
    });
  }

  review(userId: string, decision: 'APPROVED' | 'REJECTED'): void {
    this.authService.reviewArtisanRequest(userId, decision).subscribe({
      next: () => {
        this.snackBar.open(decision === 'APPROVED' ? 'Solicitud aprobada' : 'Solicitud rechazada', 'OK', { duration: 3000 });
        this.loadRequests();
      },
      error: () => this.snackBar.open('No fue posible actualizar la solicitud', 'OK', { duration: 3000 })
    });
  }
}
