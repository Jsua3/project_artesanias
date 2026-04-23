import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Venta } from '../../../core/models/venta.model';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { VentaService } from '../../../core/services/venta.service';
import { VentaFormComponent } from '../../ventas/venta-form/venta-form.component';

@Component({
  selector: 'app-pedido-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './pedido-list.component.html',
  styleUrl: './pedido-list.component.scss'
})
export class PedidoListComponent implements OnInit {
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private dialog = inject(MatDialog);
  auth = inject(AuthService);

  readonly clienteMap = this.clienteService.clienteMap;
  readonly loading = computed(() =>
    this.auth.isDomiciliario()
      ? this.ventaService.deliveriesLoading()
      : this.ventaService.loading()
  );

  readonly pedidos = computed(() => {
    const source = this.auth.isDomiciliario()
      ? this.ventaService.deliveries()
      : this.ventaService.ventas();

    return source
      .filter(venta => venta.estado !== 'ANULADA')
      .slice()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  });

  readonly subtitle = computed(() =>
    this.auth.isDomiciliario()
      ? 'Aqui ves los pedidos disponibles o asignados a ti con el avance del envio.'
      : 'Aqui se centralizan los pedidos de clientes y el progreso de cada envio.'
  );

  ngOnInit(): void {
    this.reload();
    this.clienteService.loadAll();
  }

  reload(): void {
    if (this.auth.isDomiciliario()) {
      this.ventaService.loadDeliveries();
      return;
    }

    this.ventaService.loadAll();
  }

  openForm(): void {
    if (!this.auth.canAccessOperations()) {
      return;
    }

    const ref = this.dialog.open(VentaFormComponent, { width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.reload();
      }
    });
  }

  getClienteNombre(clienteId: string): string {
    return this.clienteMap().get(clienteId) ?? clienteId;
  }

  itemCount(venta: Venta): number {
    return venta.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
  }

  referenceCount(venta: Venta): number {
    return venta.detalles.length;
  }

  stageLabel(venta: Venta): string {
    switch (venta.delivery.stage) {
      case 'EMPACADO':
        return 'Pedido empacado';
      case 'RECOGIDO':
        return 'Recogido por domiciliario';
      case 'EN_RUTA':
        return 'En camino al cliente';
      case 'ENTREGADO':
        return 'Entregado al cliente';
      default:
        return 'Pendiente de alistamiento';
    }
  }

  assignmentLabel(venta: Venta): string {
    if (!venta.delivery.assignedCourierId) {
      return 'Sin asignar';
    }

    return venta.delivery.assignedCourierId === this.auth.currentUser()?.id
      ? 'Asignado a ti'
      : 'Domiciliario asignado';
  }
}
