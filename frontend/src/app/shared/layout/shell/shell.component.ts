import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileDialogComponent } from './profile-dialog.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatDividerModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  auth = inject(AuthService);
  private dialog = inject(MatDialog);
  isMobile = signal(window.innerWidth < 992);
  sidenavOpen = signal(window.innerWidth >= 992);

  @HostListener('window:resize')
  onResize() {
    const mobile = window.innerWidth < 992;
    this.isMobile.set(mobile);
    if (!mobile) this.sidenavOpen.set(true);
  }

  toggleSidenav() {
    this.sidenavOpen.update(v => !v);
  }

  closeMobileSidenav() {
    if (this.isMobile()) {
      this.sidenavOpen.set(false);
    }
  }

  openProfileDialog() {
    this.dialog.open(ProfileDialogComponent, {
      width: '440px',
      maxWidth: '95vw'
    });
  }
}
