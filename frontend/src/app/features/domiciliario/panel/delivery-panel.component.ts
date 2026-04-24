import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryTrackingUpdateRequest, Venta } from '../../../core/models/venta.model';
import { AuthService } from '../../../core/services/auth.service';
import { VentaService } from '../../../core/services/venta.service';

interface ChecklistStep {
  key: keyof DeliveryTrackingUpdateRequest;
  label: string;
  icon: string;
  description: string;
}

const STEPS: ChecklistStep[] = [
  { key: 'packed',    label: 'Pedido empacado',          icon: 'inventory_2',     description: 'El artesano confirmó que el pedido está listo.' },
  { key: 'pickedUp',  label: 'Recogido en origen',       icon: 'storefront',      description: 'Domiciliario recogió el paquete donde el artesano.' },
  { key: 'onTheWay',  label: 'En camino al cliente',     icon: 'delivery_dining', description: 'El pedido está en ruta hacia el comprador.' },
  { key: 'delivered', label: 'Entregado al cliente',     icon: 'check_circle',    description: 'El cliente recibió su artesanía.' },
];

@Component({
  selector: 'app-delivery-panel',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './delivery-panel.component.html',
  styleUrl: './delivery-panel.component.scss'
})
export class DeliveryPanelComponent implements OnInit {
  private ventaService = inject(VentaService);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  readonly steps = STEPS;

  /* ── Estado de la lista de pedidos ──────────────────────────────────── */
  readonly allDeliveries = this.ventaService.deliveries;
  readonly loading = this.ventaService.deliveriesLoading;

  /** Pedidos disponibles (sin asignar o asignados a este courier). */
  readonly availableDeliveries = computed(() => {
    const myId = this.auth.currentUser()?.id;
    return this.allDeliveries().filter(
      v => !v.delivery.assignedCourierId || v.delivery.assignedCourierId === myId
    );
  });

  /** Pedido activo seleccionado para ver el detalle del checklist. */
  readonly selected = signal<Venta | null>(null);

  readonly savingId = signal<string | null>(null);

  /* ── Señales derivadas (computed) del pedido activo ─────────────────── */

  /**
   * Progreso calculado exclusivamente en el frontend con Signal.computed.
   * Cuenta los pasos marcados como true y los convierte a porcentaje.
   * No depende del campo `progress` del backend.
   */
  readonly progress = computed<number>(() => {
    const v = this.selected();
    if (!v) return 0;
    const { packed, pickedUp, onTheWay, delivered } = v.delivery;
    const completed = [packed, pickedUp, onTheWay, delivered].filter(Boolean).length;
    return Math.round((completed / STEPS.length) * 100);
  });

  /** Etiqueta descriptiva del progreso actual. */
  readonly progressLabel = computed<string>(() => {
    const p = this.progress();
    if (p === 0)   return 'Pendiente de alistamiento';
    if (p <= 25)   return 'Artesano alistando pedido';
    if (p <= 50)   return 'Domiciliario en camino al origen';
    if (p <= 75)   return 'Pedido recogido — en ruta al cliente';
    return 'Entregado exitosamente';
  });

  /** Color de la barra según el progreso. */
  readonly progressColor = computed<'primary' | 'accent' | 'warn'>(() => {
    const p = this.progress();
    if (p === 100) return 'accent';
    if (p >= 50)   return 'primary';
    return 'primary';
  });

  /** Verdadero si el domiciliario puede editar este pedido. */
  readonly canEdit = computed<boolean>(() => {
    const v = this.selected();
    if (!v) return false;
    if (this.auth.isAdmin()) return true;
    const myId = this.auth.currentUser()?.id;
    return !v.delivery.assignedCourierId || v.delivery.assignedCourierId === myId;
  });

  ngOnInit(): void {
    this.ventaService.loadDeliveries();
  }

  selectDelivery(venta: Venta): void {
    this.selected.set(venta);
  }

  deselectDelivery(): void {
    this.selected.set(null);
  }

  assignmentLabel(venta: Venta): string {
    if (!venta.delivery.assignedCourierId) return 'Disponible';
    return venta.delivery.assignedCourierId === this.auth.currentUser()?.id
      ? 'Tuyo'
      : 'Asignado';
  }

  isStepCompleted(step: ChecklistStep): boolean {
    return !!this.selected()?.[step.key as never] || !!this.selected()?.delivery[step.key];
  }

  getStepValue(step: ChecklistStep): boolean {
    return !!this.selected()?.delivery[step.key];
  }

  updateStep(step: ChecklistStep, checked: boolean): void {
    const v = this.selected();
    if (!v || !this.canEdit()) return;

    const payload = this.buildPayload(v, step.key, checked);
    this.savingId.set(v.id);

    this.ventaService.updateDeliveryTracking(v.id, payload).subscribe({
      next: updated => {
        // Actualizamos el selected con los datos frescos del backend
        this.selected.set(updated);
        this.savingId.set(null);
        this.snackBar.open('Seguimiento actualizado', 'OK', { duration: 2200 });
      },
      error: err => {
        this.savingId.set(null);
        this.snackBar.open(err.error?.message ?? 'No se pudo actualizar', 'OK', { duration: 3500 });
      }
    });
  }

  formatPrice(n: number): string {
    return '$ ' + n.toLocaleString('es-CO');
  }

  private buildPayload(
    venta: Venta,
    field: keyof DeliveryTrackingUpdateRequest,
    checked: boolean
  ): DeliveryTrackingUpdateRequest {
    const p: DeliveryTrackingUpdateRequest = {
      packed:    venta.delivery.packed,
      pickedUp:  venta.delivery.pickedUp,
      onTheWay:  venta.delivery.onTheWay,
      delivered: venta.delivery.delivered,
      [field]: checked
    };

    // Cascada hacia atrás: desmarcar un paso previo limpia los siguientes
    if (!p.packed)    { p.pickedUp = false; p.onTheWay = false; p.delivered = false; }
    if (!p.pickedUp)  { p.onTheWay = false; p.delivered = false; }
    if (!p.onTheWay)  { p.delivered = false; }

    // Cascada hacia adelante: marcar un paso implica los anteriores
    if (p.delivered)  { p.packed = true; p.pickedUp = true; p.onTheWay = true; }
    else if (p.onTheWay) { p.packed = true; p.pickedUp = true; }
    else if (p.pickedUp) { p.packed = true; }

    return p;
  }
}
