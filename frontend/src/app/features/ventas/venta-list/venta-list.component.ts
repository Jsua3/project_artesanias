import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Venta } from '../../../core/models/venta.model';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { VentaService } from '../../../core/services/venta.service';
import { VentaFormComponent } from '../venta-form/venta-form.component';

@Component({
  selector: 'app-venta-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './venta-list.component.html',
  styleUrl: './venta-list.component.scss'
})
export class VentaListComponent implements OnInit {
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  displayedColumns = ['fecha', 'cliente', 'total', 'delivery', 'estado', 'actions'];

  readonly ventas = this.ventaService.ventas;
  readonly loading = this.ventaService.loading;
  readonly clienteMap = this.clienteService.clienteMap;

  ngOnInit(): void {
    this.ventaService.loadAll();
    this.clienteService.loadAll();
  }

  getClienteNombre(clienteId: string): string {
    return this.clienteMap().get(clienteId) ?? clienteId;
  }

  openForm(): void {
    const ref = this.dialog.open(VentaFormComponent, {
      width: '960px',
      maxWidth: '96vw',
      panelClass: 'venta-liquid-dialog'
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.ventaService.loadAll();
      }
    });
  }

  anular(venta: Venta): void {
    if (!confirm(`Anular la venta por ${venta.total}?`)) {
      return;
    }

    this.ventaService.anular(venta.id).subscribe({
      next: () => this.snackBar.open('Venta anulada', 'OK', { duration: 3000 }),
      error: () => this.snackBar.open('Error al anular', 'OK', { duration: 3000 })
    });
  }

  deliveryStageLabel(venta: Venta): string {
    switch (venta.delivery.stage) {
      case 'EMPACADO':
        return 'Empacado';
      case 'RECOGIDO':
        return 'Recogido';
      case 'EN_RUTA':
        return 'En ruta';
      case 'ENTREGADO':
        return 'Entregado';
      default:
        return 'Pendiente';
    }
  }
}
