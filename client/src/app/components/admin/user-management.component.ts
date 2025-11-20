import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="management-container">
      <h2>User Management</h2>
      <p>Manage user accounts and roles</p>
      <div class="placeholder">
        <p>User management interface</p>
      </div>
    </div>
  `,
  styles: [`
    .management-container { padding: 24px; }
    .placeholder { background: white; padding: 48px; border-radius: 12px; text-align: center; }
  `]
})
export class UserManagementComponent {}
