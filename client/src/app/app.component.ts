/**
 * Root Application Component
 * 
 * This is the main component that bootstraps the entire application.
 * It provides the layout structure with header, main content area, and footer.
 * 
 * Layout Structure:
 * - Header: Navigation and user menu
 * - Main Content: Router outlet for page content
 * - Footer: Links and copyright information
 * 
 * @standalone true - Uses Angular 19 standalone architecture
 */

import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/shared/header/header.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { ToastComponent } from './components/shared/toast/toast.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,      // Required for routing
    HeaderComponent,   // Application header with navigation
    FooterComponent,   // Application footer
    ToastComponent     // Toast notifications
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  /**
   * Application title
   * Used in browser tab and meta tags
   */
  title = environment.appName;

  /**
   * Application version
   * Can be displayed in footer or about page
   */
  version = environment.version;

  ngOnInit(): void {
    // Always log API URL for debugging
    console.log(`🏨 ${this.title} v${this.version}`);
    console.log(`📍 Environment: ${environment.production ? 'Production' : 'Development'}`);
    console.log(`🔗 API URL: ${environment.apiUrl}`);
    
    // Additional logging in development
    if (environment.features.enableLogging) {
      console.log(`🔧 Debug Mode: ${environment.features.enableDebugMode}`);
      console.log(`📊 Mock Data: ${environment.features.enableMockData}`);
    }
  }
}
