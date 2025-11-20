import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="logo">
              <mat-icon>hotel</mat-icon>
              <span>LuxeStay</span>
            </div>
            <p>Premium hotel booking experience</p>
          </div>
          
          <div class="footer-links">
            <div class="link-group">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
            
            <div class="link-group">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
            </div>
            
            <div class="link-group">
              <h4>Connect</h4>
              <div class="social-links">
                <a href="#" class="social-icon"><mat-icon>facebook</mat-icon></a>
                <a href="#" class="social-icon"><mat-icon>twitter</mat-icon></a>
                <a href="#" class="social-icon"><mat-icon>instagram</mat-icon></a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2024 LuxeStay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
      color: #F9FAFB;
      margin-top: 4rem;
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2rem 1.5rem;
    }

    .footer-content {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 3rem;
      margin-bottom: 2rem;
    }

    .footer-brand {
      .logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #6366F1;
        }
        
        span {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
      
      p {
        color: #9CA3AF;
        margin: 0;
      }
    }

    .footer-links {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .link-group {
      h4 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #F9FAFB;
      }
      
      a {
        display: block;
        color: #9CA3AF;
        margin-bottom: 0.5rem;
        transition: color 300ms ease;
        
        &:hover {
          color: #6366F1;
        }
      }
    }

    .social-links {
      display: flex;
      gap: 0.75rem;
    }

    .social-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.1);
      color: #6366F1;
      transition: all 300ms ease;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      
      &:hover {
        background: #6366F1;
        color: white;
        transform: translateY(-2px);
      }
    }

    .footer-bottom {
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      
      p {
        color: #6B7280;
        margin: 0;
      }
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      
      .footer-links {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FooterComponent {}
