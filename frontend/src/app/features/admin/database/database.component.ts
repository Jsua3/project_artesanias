import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AdminDbService, PagedResponse } from '../../../core/services/admin-db.service';

interface TabConfig {
  label: string;
  fetch: (page: number, size: number, search: string) => void;
  columns: string[];
}

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  template: `
    <div class="db-page">
      <h2 class="db-title">Base de Datos</h2>
      <p class="db-sub">Vista de solo lectura. Usa la búsqueda para filtrar.</p>

      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        @for (tab of tabs; track tab.label) {
          <mat-tab [label]="tab.label">
            <div class="tab-content">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar...</mat-label>
                <input matInput [formControl]="searchControl">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              @if (loading()) {
                <div class="loading-row"><mat-spinner diameter="36"></mat-spinner></div>
              } @else {
                <div class="table-wrap">
                  <table mat-table [dataSource]="rows()">
                    @for (col of currentColumns(); track col) {
                      <ng-container [matColumnDef]="col">
                        <th mat-header-cell *matHeaderCellDef>{{ col }}</th>
                        <td mat-cell *matCellDef="let row">{{ formatCell(row[col]) }}</td>
                      </ng-container>
                    }
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let row">
                        <button mat-icon-button (click)="viewDetail(row)" title="Ver JSON">
                          <mat-icon>open_in_new</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="allColumns()"></tr>
                    <tr mat-row *matRowDef="let row; columns: allColumns();"></tr>
                  </table>
                </div>
                <mat-paginator
                  [length]="totalElements()"
                  [pageSize]="pageSize"
                  [pageSizeOptions]="[10, 20, 50]"
                  (page)="onPage($event)">
                </mat-paginator>
              }
            </div>
          </mat-tab>
        }
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .db-page { padding: 24px; }
    .db-title { margin: 0 0 4px; font-size: 1.5rem; }
    .db-sub { color: #666; margin: 0 0 16px; }
    .tab-content { padding: 16px 0; }
    .search-field { width: 320px; margin-bottom: 12px; }
    .loading-row { display: flex; justify-content: center; padding: 32px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; }
    td, th { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8rem; }
  `]
})
export class DatabaseComponent implements OnInit {
  private db = inject(AdminDbService);
  private dialog = inject(MatDialog);

  loading = signal(false);
  rows = signal<any[]>([]);
  totalElements = signal(0);
  currentTabIndex = signal(0);
  searchControl = new FormControl('');
  pageSize = 20;
  currentPage = 0;

  tabs: TabConfig[] = [
    { label: 'Usuarios',   fetch: (p,s,q) => this.db.listUsers(p,s,q).subscribe(r => this.setData(r)), columns: ['id','username','role','approvalStatus','createdAt'] },
    { label: 'Artesanos',  fetch: (p,s,q) => this.db.listArtesanos(p,s,q).subscribe(r => this.setData(r)), columns: ['id','nombre','email','especialidad','active'] },
    { label: 'Artesanías', fetch: (p,s,q) => this.db.listProducts(p,s,q).subscribe(r => this.setData(r)), columns: ['id','name','sku','price','active'] },
    { label: 'Clientes',   fetch: (p,s,q) => this.db.listClientes(p,s,q).subscribe(r => this.setData(r)), columns: ['id','nombre','email','telefono','createdAt'] },
    { label: 'Pedidos',    fetch: (p,s,_) => this.db.listPedidos(p,s).subscribe(r => this.setData(r)), columns: ['id','estado','total','clienteId','createdAt'] },
    { label: 'Ventas',     fetch: (p,s,q) => this.db.listVentas(p,s,q).subscribe(r => this.setData(r)), columns: ['id','estado','total','clienteId','createdAt'] },
    { label: 'Eventos',    fetch: (p,s,q) => this.db.listEventos(p,s,q).subscribe(r => this.setData(r)), columns: ['id','nombre','localidad','estado','fechaInicio'] },
    { label: 'Posts',      fetch: (p,s,q) => this.db.listPosts(p,s,q).subscribe(r => this.setData(r)), columns: ['id','authorName','estado','createdAt'] },
  ];

  currentColumns = signal<string[]>(this.tabs[0].columns);

  allColumns(): string[] {
    return [...this.currentColumns(), 'actions'];
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.reload();
    });
    this.reload();
  }

  onTabChange(idx: number): void {
    this.currentTabIndex.set(idx);
    this.currentColumns.set(this.tabs[idx].columns);
    this.currentPage = 0;
    this.searchControl.setValue('', { emitEvent: false });
    this.reload();
  }

  onPage(e: PageEvent): void {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    const tab = this.tabs[this.currentTabIndex()];
    tab.fetch(this.currentPage, this.pageSize, this.searchControl.value ?? '');
  }

  private setData(r: PagedResponse<any>): void {
    this.rows.set(r.content);
    this.totalElements.set(r.totalElements);
    this.loading.set(false);
  }

  formatCell(v: any): string {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    const s = String(v);
    return s.length > 40 ? s.substring(0, 8).toUpperCase() + '...' : s;
  }

  viewDetail(row: any): void {
    const json = JSON.stringify(row, null, 2);
    this.dialog.open(JsonDetailDialog, { data: json, maxWidth: '600px', maxHeight: '80vh' });
  }
}

@Component({
  selector: 'app-json-detail-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h3 mat-dialog-title>Detalle</h3>
    <mat-dialog-content><pre>{{ data }}</pre></mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`pre { font-size: 0.75rem; white-space: pre-wrap; word-break: break-all; }`]
})
export class JsonDetailDialog {
  data = inject(MAT_DIALOG_DATA) as string;
}
