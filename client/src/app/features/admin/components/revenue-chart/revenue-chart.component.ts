import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ChartDataPoint {
  date: string;
  value: number;
}

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="chart-card">
      <mat-card-header>
        <mat-card-title>{{ title }}</mat-card-title>
        <mat-card-subtitle>{{ subtitle }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (loading) {
          <div class="chart-loading">
            <mat-spinner diameter="48"></mat-spinner>
          </div>
        } @else if (data.length === 0) {
          <div class="chart-empty">
            <span>No data available</span>
          </div>
        } @else {
          <div class="chart-container" #chartContainer>
            <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="xMidYMid meet">
              <!-- Grid Lines -->
              @for (line of gridLines; track line) {
                <line 
                  [attr.x1]="padding" 
                  [attr.y1]="line.y" 
                  [attr.x2]="width - padding" 
                  [attr.y2]="line.y" 
                  stroke="#e0e0e0" 
                  stroke-dasharray="4,4"/>
                <text 
                  [attr.x]="padding - 8" 
                  [attr.y]="line.y + 4" 
                  class="axis-label" 
                  text-anchor="end">
                  {{ line.label }}
                </text>
              }

              <!-- Area Fill -->
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#1a237e;stop-opacity:0.3"/>
                  <stop offset="100%" style="stop-color:#1a237e;stop-opacity:0.05"/>
                </linearGradient>
              </defs>
              <path [attr.d]="areaPath" fill="url(#areaGradient)"/>

              <!-- Line -->
              <path [attr.d]="linePath" fill="none" stroke="#1a237e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

              <!-- Data Points -->
              @for (point of chartPoints; track point.x) {
                <circle 
                  [attr.cx]="point.x" 
                  [attr.cy]="point.y" 
                  r="5" 
                  fill="#1a237e"
                  class="data-point"
                  (mouseenter)="showTooltip(point)"
                  (mouseleave)="hideTooltip()"/>
              }

              <!-- X-Axis Labels -->
              @for (label of xLabels; track label.x) {
                <text 
                  [attr.x]="label.x" 
                  [attr.y]="height - 8" 
                  class="axis-label" 
                  text-anchor="middle">
                  {{ label.text }}
                </text>
              }
            </svg>

            <!-- Tooltip -->
            @if (tooltipVisible) {
              <div class="tooltip" [style.left.px]="tooltipX" [style.top.px]="tooltipY">
                <div class="tooltip-date">{{ tooltipDate }}</div>
                <div class="tooltip-value">{{ tooltipValue | currency }}</div>
              </div>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .chart-card {
      height: 100%;
    }

    mat-card-header {
      padding-bottom: 16px;
    }

    mat-card-content {
      padding-top: 0;
    }

    .chart-loading, .chart-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: #666;
    }

    .chart-container {
      position: relative;
      width: 100%;
      min-height: 300px;
    }

    svg {
      width: 100%;
      height: 300px;
    }

    .axis-label {
      font-size: 11px;
      fill: #666;
    }

    .data-point {
      cursor: pointer;
      transition: r 150ms ease;
    }

    .data-point:hover {
      r: 7;
    }

    .tooltip {
      position: absolute;
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      pointer-events: none;
      transform: translate(-50%, -100%);
      margin-top: -10px;
      z-index: 10;
    }

    .tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #333;
    }

    .tooltip-date {
      opacity: 0.8;
      margin-bottom: 4px;
    }

    .tooltip-value {
      font-weight: 600;
      font-size: 14px;
    }
  `]
})
export class RevenueChartComponent implements OnChanges, AfterViewInit {
  @Input() data: ChartDataPoint[] = [];
  @Input() loading = false;
  @Input() title = 'Revenue';
  @Input() subtitle = 'Last 30 days';

  @ViewChild('chartContainer') chartContainer!: ElementRef;

  width = 800;
  height = 300;
  padding = 50;

  linePath = '';
  areaPath = '';
  chartPoints: { x: number; y: number; data: ChartDataPoint }[] = [];
  gridLines: { y: number; label: string }[] = [];
  xLabels: { x: number; text: string }[] = [];

  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipDate = '';
  tooltipValue = 0;

  ngAfterViewInit() {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.data || this.data.length === 0) return;

    const chartWidth = this.width - (this.padding * 2);
    const chartHeight = this.height - (this.padding * 2);

    const maxValue = Math.max(...this.data.map(d => d.value), 1);
    const minValue = 0;
    const valueRange = maxValue - minValue;

    // Calculate points
    this.chartPoints = this.data.map((point, index) => {
      const x = this.padding + (index / (this.data.length - 1)) * chartWidth;
      const y = this.padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      return { x, y, data: point };
    });

    // Generate line path
    this.linePath = this.chartPoints.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    // Generate area path
    const firstPoint = this.chartPoints[0];
    const lastPoint = this.chartPoints[this.chartPoints.length - 1];
    this.areaPath = this.linePath + 
      ` L ${lastPoint.x} ${this.height - this.padding}` +
      ` L ${firstPoint.x} ${this.height - this.padding} Z`;

    // Generate grid lines
    const gridCount = 5;
    this.gridLines = Array.from({ length: gridCount }, (_, i) => {
      const value = minValue + (valueRange * (gridCount - 1 - i) / (gridCount - 1));
      const y = this.padding + (i / (gridCount - 1)) * chartHeight;
      return { 
        y, 
        label: this.formatCurrency(value)
      };
    });

    // Generate X-axis labels (show every 5th date)
    this.xLabels = this.chartPoints
      .filter((_, index) => index % 5 === 0 || index === this.chartPoints.length - 1)
      .map(point => ({
        x: point.x,
        text: this.formatDate(point.data.date)
      }));
  }

  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  showTooltip(point: { x: number; y: number; data: ChartDataPoint }): void {
    this.tooltipVisible = true;
    this.tooltipX = point.x;
    this.tooltipY = point.y;
    this.tooltipDate = new Date(point.data.date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    this.tooltipValue = point.data.value;
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
  }
}
