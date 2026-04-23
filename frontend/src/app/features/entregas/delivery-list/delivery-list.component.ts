import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryTrackingUpdateRequest, Venta } from '../../../core/models/venta.model';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { VentaService } from '../../../core/services/venta.service';

@Component({
  selector: 'app-delivery-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './delivery-list.component.html',
  styleUrl: './delivery-list.component.scss'
})
export class DeliveryListComponent implements OnInit {
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  readonly deliveries = this.ventaService.deliveries;
  readonly loading = this.ventaService.deliveriesLoading;
  readonly clienteMap = this.clienteService.clienteMap;
  readonly savingId = signal<string | null>(null);

  ngOnInit(): void {
    this.ventaService.loadDeliveries();
    this.clienteService.loadAll();
  }

  getClienteNombre(clienteId: string): string {
    return this.clienteMap().get(clienteId) ?? clienteId;
  }

  updateStep(venta: Venta, field: keyof DeliveryTrackingUpdateRequest, checked: boolean): void {
    if (!this.canEdit(venta)) {
      return;
    }

    const payload = this.buildPayload(venta, field, checked);
    this.savingId.set(venta.id);
    this.ventaService.updateDeliveryTracking(venta.id, payload).subscribe({
      next: () => {
        this.savingId.set(null);
        this.snackBar.open('Seguimiento actualizado', 'OK', { duration: 2500 });
      },
      error: (error) => {
        this.savingId.set(null);
        this.snackBar.open(error.error?.message || 'No fue posible actualizar la entrega', 'OK', { duration: 3500 });
      }
    });
  }

  canEdit(venta: Venta): boolean {
    if (this.auth.isAdmin()) {
      return true;
    }

    const currentUserId = this.auth.currentUser()?.id;
    return !venta.delivery.assignedCourierId || venta.delivery.assignedCourierId === currentUserId;
  }

  assignmentLabel(venta: Venta): string {
    if (!venta.delivery.assignedCourierId) {
      return 'Disponible';
    }

    return venta.delivery.assignedCourierId === this.auth.currentUser()?.id
      ? 'Asignada a ti'
      : 'Asignada';
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

  private buildPayload(venta: Venta, field: keyof DeliveryTrackingUpdateRequest, checked: boolean): DeliveryTrackingUpdateRequest {
    const payload: DeliveryTrackingUpdateRequest = {
      packed: venta.delivery.packed,
      pickedUp: venta.delivery.pickedUp,
      onTheWay: venta.delivery.onTheWay,
      delivered: venta.delivery.delivered,
      [field]: checked
    };

    if (!payload.packed) {
      payload.pickedUp = false;
      payload.onTheWay = false;
      payload.delivered = false;
    }
    if (payload.pickedUp) {
      payload.packed = true;
    } else {
      payload.onTheWay = false;
      payload.delivered = false;
    }
    if (payload.onTheWay) {
      payload.packed = true;
      payload.pickedUp = true;
    } else {
      payload.delivered = false;
    }
    if (payload.delivered) {
      payload.packed = true;
      payload.pickedUp = true;
      payload.onTheWay = true;
    }

    return payload;
  }
}
