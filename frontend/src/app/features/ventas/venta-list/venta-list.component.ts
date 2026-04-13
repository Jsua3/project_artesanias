import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// MatChipsModule removed — using custom status-badge spans
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VentaService } from '../../../core/services/venta.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/services/auth.service';
import { Venta } from '../../../core/models/venta.model';
import { VentaFormComponent } from '../venta-form/venta-form.component';

@Component({
  selector: 'app-venta-list',
  standalone: true,
  imports: [
    CurrencyPipe, DatePipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule
  ],
  templateUrl: './venta-list.component.html'
})
export class VentaListComponent implements OnInit {
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  displayedColumns = ['fecha', 'cliente', 'total', 'estado', 'actions'];

  readonly ventas = this.ventaService.ventas;
  readonly loading = this.ventaService.loading;
  readonly clienteMap = this.clienteService.clienteMap;

  getClienteNombre(clienteId: string): string {
    return this.clienteMap().get(clienteId) ?? clienteId;
  }

  ngOnInit(): void {
    this.ventaService.loadAll();
    this.clienteService.loadAll();
  }

  openForm(): void {
    const ref = this.dialog.open(VentaFormComponent, { width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.ventaService.loadAll();
    });
  }

  anular(venta: Venta): void {
    if (!confirm(`¿Anular la venta por ${venta.total}?`)) return;
    this.ventaService.anular(venta.id).subscribe({
      next: () => this.snackBar.open('Venta anulada', 'OK', { duration: 3000 }),
      error: () => this.snackBar.open('Error al anular', 'OK', { duration: 3000 })
    });
  }
}
