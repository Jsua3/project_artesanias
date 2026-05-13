import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntegrationStatus, ReleaseCheck, ServiceProbe, SystemHealth } from '../../../core/models/system-health.model';
import { SystemHealthService } from '../../../core/services/system-health.service';

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './system-health.component.html',
  styleUrl: './system-health.component.scss'
})
export class SystemHealthComponent implements OnInit {
  private systemHealth = inject(SystemHealthService);

  snapshot = signal<SystemHealth | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly upServices = computed(() => this.snapshot()?.services.filter(s => s.status === 'UP').length ?? 0);
  readonly totalServices = computed(() => this.snapshot()?.services.length ?? 0);
  readonly readyIntegrations = computed(() => this.snapshot()?.integrations.filter(i => i.configured).length ?? 0);
  readonly failedChecks = computed(() => this.snapshot()?.releaseChecklist.filter(c => c.status === 'FAIL').length ?? 0);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.systemHealth.snapshot().subscribe({
      next: response => {
        this.snapshot.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo leer la salud del sistema. Revisa sesion, permisos o api-gateway.');
        this.loading.set(false);
      }
    });
  }

  statusClass(status: string): string {
    const normalized = (status ?? '').toUpperCase();
    if (['READY', 'UP', 'PASS'].includes(normalized)) return 'is-good';
    if (['WARN'].includes(normalized)) return 'is-warn';
    return 'is-bad';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      READY: 'Listo',
      WARN: 'Atencion',
      BLOCKED: 'Bloqueado',
      UP: 'Arriba',
      DOWN: 'Caido',
      PASS: 'Pasa',
      FAIL: 'Falla'
    };
    return map[(status ?? '').toUpperCase()] ?? status;
  }

  integrationMeta(integration: IntegrationStatus): string[] {
    return Object.entries(integration.metadata ?? {})
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${this.humanize(key)}: ${value}`);
  }

  serviceIcon(service: ServiceProbe): string {
    if (service.kind === 'web') return 'language';
    if (service.kind === 'gateway') return 'hub';
    if (service.name.includes('ai')) return 'auto_awesome';
    return 'dns';
  }

  checkIcon(check: ReleaseCheck): string {
    return check.status === 'PASS' ? 'check_circle' : check.status === 'WARN' ? 'error' : 'cancel';
  }

  trackByName(_: number, item: { name: string }): string {
    return item.name;
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  private humanize(value: string): string {
    return value
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
