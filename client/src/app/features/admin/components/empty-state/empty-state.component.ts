import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
      @if (actionLabel) {
        <button mat-raised-button color="primary" (click)="onAction()">
          <mat-icon>{{ actionIcon }}</mat-icon>
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #bdbdbd;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 20px;
      font-weight: 500;
      color: #333;
      margin: 0 0 8px;
    }

    .empty-message {
      font-size: 14px;
      color: #666;
      margin: 0 0 24px;
      max-width: 400px;
    }

    button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'No data';
  @Input() message = 'There is nothing to display here yet.';
  @Input() actionLabel?: string;
  @Input() actionIcon = 'add';
  @Input() action?: () => void;

  onAction(): void {
    if (this.action) {
      this.action();
    }
  }
}
