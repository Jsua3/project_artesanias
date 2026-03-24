import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe, SlicePipe } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { MovementLog, StockSnapshot } from '../../core/models/report.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    MatTabsModule, MatTableModule, MatCardModule,
    MatIconModule, MatProgressSpinnerModule, MatChipsModule, DatePipe, SlicePipe
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);

  loading = signal(true);
  summary: StockSnapshot[] = [];
  history: MovementLog[] = [];
  alerts: StockSnapshot[] = [];

  summaryColumns = ['productId', 'currentQuantity', 'lastUpdated'];
  historyColumns = ['timestamp', 'productId', 'type', 'quantity', 'performedBy'];
  alertColumns = ['productId', 'currentQuantity', 'lastUpdated'];

  ngOnInit(): void {
    Promise.all([
      this.reportService.getSummary().toPromise(),
      this.reportService.getHistory().toPromise(),
      this.reportService.getAlerts(5).toPromise()
    ]).then(([summary, history, alerts]) => {
      this.summary = summary ?? [];
      this.history = history ?? [];
      this.alerts = alerts ?? [];
      this.loading.set(false);
    }).catch(() => this.loading.set(false));
  }
}
