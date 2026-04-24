import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateEventoRequest, EventoPropuesta } from '../../../core/models/comunidad.model';
import { AuthService } from '../../../core/services/auth.service';

const EMPTY_FORM: CreateEventoRequest = {
  organizacion: '',
  nombre: '',
  localidad: '',
  direccionExacta: '',
  fechaInicio: '',
  fechaFin: '',
  hora: '',
  descripcion: ''
};

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <div class="eventos-shell">
      <header class="eventos-header">
        <h1>Eventos y ferias</h1>
        <p>Propón un evento artesanal para que el administrador lo apruebe.</p>
      </header>

      <!-- Formulario de propuesta -->
      <section class="evento-form-card">
        <h2><mat-icon>event</mat-icon> Nueva propuesta</h2>
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Organización</mat-label>
            <input matInput [(ngModel)]="form().organizacion" placeholder="Ej: Alcaldía de Salento" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Nombre del evento</mat-label>
            <input matInput [(ngModel)]="form().nombre" placeholder="Ej: Feria Nacional de Artesanías" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Localidad / Municipio</mat-label>
            <input matInput [(ngModel)]="form().localidad" placeholder="Ej: Salento, Quindío" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Dirección exacta</mat-label>
            <input matInput [(ngModel)]="form().direccionExacta" placeholder="Ej: Parque principal, calle 6 #4-18" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha inicio</mat-label>
            <input matInput type="date" [(ngModel)]="form().fechaInicio" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha fin</mat-label>
            <input matInput type="date" [(ngModel)]="form().fechaFin" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hora de inicio</mat-label>
            <input matInput type="time" [(ngModel)]="form().hora" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-col">
            <mat-label>Descripción (opcional)</mat-label>
            <textarea matInput rows="3" [(ngModel)]="form().descripcion" placeholder="Detalles adicionales…"></textarea>
          </mat-form-field>
        </div>
        <button mat-raised-button class="submit-btn" [disabled]="submitting()" (click)="submitEvento()">
          <mat-icon>send</mat-icon>
          Enviar propuesta
        </button>
      </section>

      <!-- Mis propuestas -->
      @if (eventos().length > 0) {
        <section class="mis-eventos">
          <h2>Mis propuestas</h2>
          @for (ev of eventos(); track ev.id) {
            <div class="evento-item" [class.aprobado]="ev.estado === 'APROBADO'" [class.rechazado]="ev.estado === 'RECHAZADO'">
              <div class="evento-item__header">
                <strong>{{ ev.nombre }}</strong>
                <span class="estado-chip estado-{{ ev.estado.toLowerCase() }}">{{ ev.estado }}</span>
              </div>
              <p class="evento-meta">{{ ev.localidad }} · {{ ev.fechaInicio | date:'d MMM yyyy' }} → {{ ev.fechaFin | date:'d MMM yyyy' }}</p>
              <p class="evento-org">{{ ev.organizacion }}</p>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .eventos-shell { max-width: 860px; margin: 0 auto; padding: 28px 16px 60px; display: flex; flex-direction: column; gap: 28px; }
    .eventos-header h1 { margin: 0 0 4px; font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 500; }
    .eventos-header p { margin: 0; font-family: 'Outfit', sans-serif; font-size: 14px; color: #6b6259; }
    .evento-form-card { background: #fff; border: 1px solid #ece5db; border-radius: 16px; padding: 24px; }
    .evento-form-card h2 { display: flex; align-items: center; gap: 10px; margin: 0 0 20px; font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .full-col { grid-column: 1 / -1; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
    .submit-btn { background: #A67C52 !important; color: #fff !important; border-radius: 999px !important; }
    .mis-eventos { display: flex; flex-direction: column; gap: 12px; }
    .mis-eventos h2 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; margin: 0 0 8px; }
    .evento-item { background: #fff; border: 1px solid #ece5db; border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
    .evento-item__header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    strong { font-family: 'Outfit', sans-serif; font-size: 15px; color: #2d2a26; }
    .estado-chip { padding: 3px 10px; border-radius: 999px; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .estado-pendiente { background: rgba(200,123,42,.12); color: #c87b2a; }
    .estado-aprobado { background: rgba(76,175,138,.12); color: #2e8a65; }
    .estado-rechazado { background: rgba(215,58,58,.1); color: #d73a3a; }
    .evento-meta, .evento-org { margin: 0; font-family: 'Outfit', sans-serif; font-size: 13px; color: #6b6259; }
  `]
})
export class EventosComponent implements OnInit {
  auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly form = signal<CreateEventoRequest>({ ...EMPTY_FORM });
  readonly eventos = signal<EventoPropuesta[]>([]);
  readonly submitting = signal(false);

  ngOnInit(): void {
    // TODO: cargar propuestas del artesano desde backend
  }

  submitEvento(): void {
    const f = this.form();
    if (!f.organizacion || !f.nombre || !f.localidad || !f.fechaInicio || !f.fechaFin || !f.hora) {
      this.snackBar.open('Completa todos los campos obligatorios', 'OK', { duration: 3000 });
      return;
    }

    this.submitting.set(true);
    // TODO: llamar al backend
    const user = this.auth.currentUser();
    const nuevo: EventoPropuesta = {
      id: crypto.randomUUID(),
      artesanoId: user?.id ?? '',
      artesanoNombre: user?.displayName || user?.username,
      ...f,
      estado: 'PENDIENTE',
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      this.eventos.update(ev => [nuevo, ...ev]);
      this.form.set({ ...EMPTY_FORM });
      this.submitting.set(false);
      this.snackBar.open('Propuesta enviada. Pendiente de aprobación.', 'OK', { duration: 3000 });
    }, 500);
  }
}
