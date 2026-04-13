import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArtesanoService } from '../../../core/services/artesano.service';
import { AuthService } from '../../../core/services/auth.service';
import { Artesano } from '../../../core/models/artesano.model';
import { ArtesanoFormComponent } from '../artesano-form/artesano-form.component';

@Component({
  selector: 'app-artesano-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule
  ],
  templateUrl: './artesano-list.component.html'
})
export class ArtesanoListComponent implements OnInit {
  private artesanoService = inject(ArtesanoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  displayedColumns = ['nombre', 'especialidad', 'telefono', 'email', 'ubicacion', 'actions'];

  readonly artesanos = this.artesanoService.artesanos;
  readonly loading = this.artesanoService.loading;

  ngOnInit(): void {
    this.artesanoService.loadAll();
  }

  openForm(artesano?: Artesano): void {
    const ref = this.dialog.open(ArtesanoFormComponent, {
      width: '500px',
      data: artesano ?? null
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.artesanoService.loadAll();
    });
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar este artesano?')) return;
    this.artesanoService.delete(id).subscribe({
      next: () => this.snackBar.open('Artesano eliminado', 'OK', { duration: 3000 }),
      error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
    });
  }
}
