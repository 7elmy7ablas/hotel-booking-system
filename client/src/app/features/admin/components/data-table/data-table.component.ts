import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'date' | 'currency' | 'status' | 'actions';
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  template: `
    <div class="table-container">
      <!-- Search -->
      @if (showSearch) {
        <mat-form-field class="search-field" appearance="outline">
          <mat-label>Search</mat-label>
          <input matInput (keyup)="applyFilter($event)" [placeholder]="searchPlaceholder">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      }

      <!-- Loading State -->
      @if (loading) {
        <div class="loading-overlay">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      <!-- Table -->
      <div class="table-wrapper" [class.loading]="loading">
        <table mat-table [dataSource]="dataSource" matSort>
          <!-- Checkbox Column -->
          @if (selectable) {
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                <mat-checkbox
                  (change)="$event ? toggleAllRows() : null"
                  [checked]="selection.hasValue() && isAllSelected()"
                  [indeterminate]="selection.hasValue() && !isAllSelected()">
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let row">
                <mat-checkbox
                  (click)="$event.stopPropagation()"
                  (change)="$event ? selection.toggle(row) : null"
                  [checked]="selection.isSelected(row)">
                </mat-checkbox>
              </td>
            </ng-container>
          }

          <!-- Dynamic Columns -->
          @for (column of columns; track column.key) {
            <ng-container [matColumnDef]="column.key">
              <th mat-header-cell *matHeaderCellDef [mat-sort-header]="column.sortable ? column.key : ''" [style.width]="column.width">
                {{ column.label }}
              </th>
              <td mat-cell *matCellDef="let row" [style.width]="column.width">
                @switch (column.type) {
                  @case ('date') {
                    {{ row[column.key] | date:'mediumDate' }}
                  }
                  @case ('currency') {
                    {{ row[column.key] | currency }}
                  }
                  @case ('status') {
                    <span class="status-badge" [class]="'status--' + row[column.key]?.toLowerCase()">
                      {{ row[column.key] }}
                    </span>
                  }
                  @case ('actions') {
                    <ng-content select="[actions]"></ng-content>
                  }
                  @default {
                    {{ row[column.key] }}
                  }
                }
              </td>
            </ng-container>
          }

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
              [class.clickable]="clickable"
              (click)="clickable && rowClick.emit(row)"></tr>

          <!-- No Data Row -->
          <tr class="mat-row no-data-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="displayedColumns.length">
              <div class="no-data">
                <mat-icon>inbox</mat-icon>
                <span>{{ emptyMessage }}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Paginator -->
      @if (showPagination) {
        <mat-paginator 
          [pageSizeOptions]="pageSizeOptions"
          [pageSize]="pageSize"
          showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .table-container {
      position: relative;
    }

    .search-field {
      width: 300px;
      margin-bottom: 16px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .table-wrapper {
      overflow-x: auto;
      transition: opacity 200ms ease;
    }

    .table-wrapper.loading {
      opacity: 0.5;
      pointer-events: none;
    }

    table {
      width: 100%;
    }

    .mat-mdc-row.clickable {
      cursor: pointer;
    }

    .mat-mdc-row.clickable:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .status--pending {
      background: #fff3e0;
      color: #e65100;
    }

    .status--confirmed {
      background: #e3f2fd;
      color: #1565c0;
    }

    .status--checkedin {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status--checkedout {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .status--cancelled {
      background: #ffebee;
      color: #c62828;
    }

    .status--approved {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status--rejected {
      background: #ffebee;
      color: #c62828;
    }

    .status--active {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status--suspended {
      background: #ffebee;
      color: #c62828;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    mat-paginator {
      background: transparent;
    }
  `]
})
export class DataTableComponent<T> implements AfterViewInit {
  @Input() columns: TableColumn[] = [];
  @Input() set data(value: T[]) {
    this.dataSource.data = value || [];
  }
  @Input() loading = false;
  @Input() showSearch = true;
  @Input() showPagination = true;
  @Input() selectable = false;
  @Input() clickable = false;
  @Input() searchPlaceholder = 'Search...';
  @Input() emptyMessage = 'No data available';
  @Input() pageSize = 10;
  @Input() pageSizeOptions = [5, 10, 25, 50];

  @Output() rowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<T>();
  selection = new SelectionModel<T>(true, []);

  get displayedColumns(): string[] {
    const cols = this.columns.map(c => c.key);
    return this.selectable ? ['select', ...cols] : cols;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
    this.selectionChange.emit(this.selection.selected);
  }
}
