import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer>
      <p>&copy; 2024 Hotel Booking System. All rights reserved.</p>
    </footer>
  `,
  styles: [`
    footer {
      background-color: #f5f5f5;
      padding: 24px;
      text-align: center;
      margin-top: 48px;
    }
  `]
})
export class FooterComponent {}
