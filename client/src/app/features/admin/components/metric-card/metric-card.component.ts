import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface MetricCardData {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'accent' | 'success' | 'warning';
}

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="metric-card" [class]="'metric-card--' + (data?.color || 'primary')">
      @if (loading) {
        <div class="metric-loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (data) {
        <div class="metric-content">
          <div class="metric-icon">
            <mat-icon>{{ data.icon }}</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-title">{{ data.title }}</span>
            <span class="metric-value">{{ data.value }}</span>
            @if (data.trend) {
              <span class="metric-trend" [class.positive]="data.trend.isPositive" [class.negative]="!data.trend.isPositive">
                <mat-icon>{{ data.trend.isPositive ? 'trending_up' : 'trending_down' }}</mat-icon>
                {{ data.trend.value }}%
              </span>
            }
          </div>
        </div>
      }
    </mat-card>
  `,
  styles: [`
    .metric-card {
      padding: 20px;
      border-radius: 12px;
      transition: transform 200ms ease, box-shadow 200ms ease;
      cursor: default;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .metric-card--primary {
      background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
      color: white;
    }

    .metric-card--accent {
      background: linear-gradient(135deg, #00695c 0%, #26a69a 100%);
      color: white;
    }

    .metric-card--success {
      background: linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%);
      color: white;
    }

    .metric-card--warning {
      background: linear-gradient(135deg, #ef6c00 0%, #ffa726 100%);
      color: white;
    }

    .metric-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80px;
    }

    .metric-loading mat-spinner {
      --mdc-circular-progress-active-indicator-color: rgba(255, 255, 255, 0.8);
    }

    .metric-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .metric-icon {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .metric-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .metric-title {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 500;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .metric-trend mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .metric-trend.positive {
      color: #b9f6ca;
    }

    .metric-trend.negative {
      color: #ffcdd2;
    }
  `]
})
export class MetricCardComponent {
  @Input() data?: MetricCardData;
  @Input() loading = false;
}
