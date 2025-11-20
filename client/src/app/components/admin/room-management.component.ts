import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="management-container">
      <h2>Room Management</h2>
      <p>Manage rooms for each hotel</p>
      <div class="placeholder">
        <p>Room management interface</p>
      </div>
    </div>
  `,
  styles: [`
    .management-container { padding: 24px; }
    .placeholder { background: white; padding: 48px; border-radius: 12px; text-align: center; }
  `]
})
export class RoomManagementComponent {}
