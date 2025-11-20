import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  userName = '';
  userEmail = '';
  isMobileMenuOpen = false;
  isUserMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check initial authentication state
    this.updateAuthState();
    
    // Note: Using polling instead of observable since we're using signals now
    // In a production app, you might want to use effect() or computed() from Angular signals
    setInterval(() => {
      this.updateAuthState();
    }, 1000);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  updateAuthState(): void {
    this.isAuthenticated = this.authService.isAuthenticated;
    const user = this.authService.getCurrentUser();
    
    if (user) {
      this.userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      this.userEmail = user.email;
    } else {
      this.userName = '';
      this.userEmail = '';
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    // Prevent body scroll when menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }
}
