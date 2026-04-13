import { Component, OnInit, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// MatChipsModule removed — using custom status-badge spans
import { DatePipe, SlicePipe } from '@angular/common';
import { ReportService } from '../../core/services/report.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    MatTabsModule, MatTableModule, MatCardModule,
    MatIconModule, MatProgressSpinnerModule, DatePipe, SlicePipe
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private productService = inject(ProductService);

  // Signals derivados del servicio
  readonly loading = this.reportService.loading;
  readonly summary = this.reportService.summary;
  readonly history = this.reportService.history;
  readonly alerts = this.reportService.alerts;
  readonly productMap = this.productService.productMap;

  summaryColumns = ['productId', 'currentQuantity', 'lastUpdated'];
  historyColumns = ['timestamp', 'productId', 'type', 'quantity', 'performedBy'];
  alertColumns = ['productId', 'currentQuantity', 'lastUpdated'];

  ngOnInit(): void {
    this.reportService.loadAll();
    this.productService.loadAll();
  }

  getProductName(productId: string): string {
    return this.productMap().get(productId) ?? productId.substring(0, 8) + '...';
  }
}
