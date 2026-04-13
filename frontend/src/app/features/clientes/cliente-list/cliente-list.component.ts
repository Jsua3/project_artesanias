import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClienteService } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cliente } from '../../../core/models/cliente.model';
import { ClienteFormComponent } from '../cliente-form/cliente-form.component';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule
  ],
  templateUrl: './cliente-list.component.html'
})
export class ClienteListComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  displayedColumns = ['nombre', 'telefono', 'email', 'direccion', 'actions'];

  readonly clientes = this.clienteService.clientes;
  readonly loading = this.clienteService.loading;

  ngOnInit(): void {
    this.clienteService.loadAll();
  }

  openForm(cliente?: Cliente): void {
    const ref = this.dialog.open(ClienteFormComponent, {
      width: '480px',
      data: cliente ?? null
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.clienteService.loadAll();
    });
  }
}
