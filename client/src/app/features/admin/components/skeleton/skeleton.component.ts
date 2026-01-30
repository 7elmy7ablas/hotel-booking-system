import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('card') {
        <div class="skeleton skeleton-card">
          <div class="skeleton-icon"></div>
          <div class="skeleton-content">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line long"></div>
          </div>
        </div>
      }
      @case ('table-row') {
        <div class="skeleton skeleton-table-row">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-cell"></div>
          }
        </div>
      }
      @case ('chart') {
        <div class="skeleton skeleton-chart">
          <div class="skeleton-bars">
            @for (i of [1,2,3,4,5,6,7]; track i) {
              <div class="skeleton-bar" [style.height.%]="30 + (i * 10)"></div>
            }
          </div>
        </div>
      }
      @default {
        <div class="skeleton skeleton-line" [class]="width"></div>
      }
    }
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .skeleton-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(90deg, #e8e8e8 25%, #d8d8d8 50%, #e8e8e8 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .skeleton-line {
      height: 16px;
      border-radius: 4px;
    }

    .skeleton-line.short {
      width: 60%;
    }

    .skeleton-line.long {
      width: 40%;
      height: 24px;
    }

    .skeleton-table-row {
      display: flex;
      gap: 16px;
      padding: 12px 16px;
      background: white;
    }

    .skeleton-cell {
      flex: 1;
      height: 20px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-chart {
      padding: 20px;
      background: white;
      border-radius: 12px;
      height: 300px;
    }

    .skeleton-bars {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      height: 100%;
    }

    .skeleton-bar {
      flex: 1;
      border-radius: 4px 4px 0 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .short { width: 30%; }
    .medium { width: 60%; }
    .full { width: 100%; }
  `]
})
export class SkeletonComponent {
  @Input() type: 'line' | 'card' | 'table-row' | 'chart' = 'line';
  @Input() width: 'short' | 'medium' | 'full' = 'full';
}
