import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Category } from '../../../core/models/category.model';
import { CategoryFormComponent } from '../category-form/category-form.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  displayedColumns = ['name', 'actions'];

  // Signals derivados del servicio
  readonly categories = this.categoryService.categories;
  readonly loading = this.categoryService.loading;

  ngOnInit(): void {
    this.categoryService.loadAll();
  }

  openForm(category?: Category): void {
    const ref = this.dialog.open(CategoryFormComponent, {
      width: '360px',
      data: category ?? null
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.categoryService.loadAll();
    });
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar esta categoría?')) return;
    this.categoryService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Categoría eliminada', 'OK', { duration: 3000 });
        this.categoryService.loadAll();
      },
      error: () => this.snackBar.open('Error al eliminar la categoría', 'OK', { duration: 3000 })
    });
  }
}
