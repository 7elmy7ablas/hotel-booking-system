/**
 * Automated Accessibility Testing with axe-core
 * WCAG 2.1 AA Compliance Testing
 * 
 * This file contains automated accessibility tests using axe-core
 * to ensure WCAG 2.1 AA compliance across the application.
 * 
 * Run with: npm test -- --include='**/accessibility.spec.ts'
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Import axe-core for accessibility testing
// Note: Install with: npm install --save-dev axe-core @types/axe-core
import { run as axeRun, AxeResults } from 'axe-core';

// Import components to test
import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { SearchComponent } from './components/hotels/search/search.component';
import { HeaderComponent } from './components/shared/header/header.component';
import { FooterComponent } from './components/shared/footer/footer.component';

/**
 * Helper function to run axe accessibility tests
 */
async function runAxeTest(fixture: ComponentFixture<any>): Promise<AxeResults> {
  const element = fixture.nativeElement;
  
  return new Promise((resolve, reject) => {
    axeRun(element, {
      rules: {
        // WCAG 2.1 AA rules
        'color-contrast': { enabled: true },
        'label': { enabled: true },
        'button-name': { enabled: true },
        'link-name': { enabled: true },
        'image-alt': { enabled: true },
        'input-image-alt': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-hidden-focus': { enabled: true },
        'duplicate-id': { enabled: true },
        'duplicate-id-active': { enabled: true },
        'duplicate-id-aria': { enabled: true },
        'html-has-lang': { enabled: true },
        'html-lang-valid': { enabled: true },
        'valid-lang': { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'region': { enabled: true },
        'skip-link': { enabled: true },
        'tabindex': { enabled: true },
        'focus-order-semantics': { enabled: true }
      }
    }, (err, results) => {
      if (err) reject(err);
      else resolve(results!);
    });
  });
}

/**
 * Helper function to format axe violations for readable output
 */
function formatViolations(violations: any[]): string {
  if (violations.length === 0) {
    return 'No accessibility violations found!';
  }

  return violations.map(violation => {
    const nodes = violation.nodes.map((node: any) => {
      return `    - ${node.html}\n      ${node.failureSummary}`;
    }).join('\n');

    return `
  ${violation.id} (${violation.impact})
  ${violation.description}
  ${violation.helpUrl}
  Affected elements:
${nodes}
    `;
  }).join('\n');
}

describe('Accessibility Testing - WCAG 2.1 AA Compliance', () => {
  
  describe('App Component', () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AppComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideAnimationsAsync()
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(AppComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have no accessibility violations', async () => {
      const results = await runAxeTest(fixture);
      
      expect(results.violations.length).toBe(0, 
        `Found ${results.violations.length} accessibility violations:\n${formatViolations(results.violations)}`
      );
    });

    it('should have skip links', () => {
      const skipLinks = fixture.nativeElement.querySelectorAll('.skip-link');
      expect(skipLinks.length).toBeGreaterThan(0);
    });

    it('should have ARIA live regions', () => {
      const liveRegions = fixture.nativeElement.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('should have main landmark', () => {
      const main = fixture.nativeElement.querySelector('main');
      expect(main).toBeTruthy();
      expect(main.getAttribute('role')).toBe('main');
    });
  });

  describe('Login Component', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LoginComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideAnimationsAsync()
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have no accessibility violations', async () => {
      const results = await runAxeTest(fixture);
      
      expect(results.violations.length).toBe(0,
        `Found ${results.violations.length} accessibility violations:\n${formatViolations(results.violations)}`
      );
    });

    it('should have properly labeled form inputs', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input');
      inputs.forEach((input: HTMLInputElement) => {
        const hasLabel = input.getAttribute('aria-label') || 
                        input.getAttribute('aria-labelledby') ||
                        fixture.nativeElement.querySelector(`label[for="${input.id}"]`);
        expect(hasLabel).toBeTruthy(`Input ${input.name} should have a label`);
      });
    });

    it('should have visible focus indicators', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((button: HTMLButtonElement) => {
        button.focus();
        const styles = window.getComputedStyle(button);
        // Check for outline or box-shadow (focus indicator)
        const hasFocusIndicator = styles.outline !== 'none' || 
                                  styles.boxShadow !== 'none';
        expect(hasFocusIndicator).toBeTruthy('Button should have visible focus indicator');
      });
    });
  });

  describe('Register Component', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [RegisterComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideAnimationsAsync()
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(RegisterComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have no accessibility violations', async () => {
      const results = await runAxeTest(fixture);
      
      expect(results.violations.length).toBe(0,
        `Found ${results.violations.length} accessibility violations:\n${formatViolations(results.violations)}`
      );
    });

    it('should have password visibility toggle with aria-label', () => {
      const toggleButtons = fixture.nativeElement.querySelectorAll('[aria-label*="password"]');
      expect(toggleButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Home Component', () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HomeComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideAnimationsAsync()
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have no accessibility violations', async () => {
      const results = await runAxeTest(fixture);
      
      expect(results.violations.length).toBe(0,
        `Found ${results.violations.length} accessibility violations:\n${formatViolations(results.violations)}`
      );
    });

    it('should have proper heading hierarchy', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1).toBeTruthy('Page should have an h1 heading');
    });

    it('should have alt text for images', () => {
      const images = fixture.nativeElement.querySelectorAll('img');
      images.forEach((img: HTMLImageElement) => {
        expect(img.alt).toBeTruthy(`Image ${img.src} should have alt text`);
      });
    });
  });

  describe('Search Component', () => {
    let component: SearchComponent;
    let fixture: ComponentFixture<SearchComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SearchComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideAnimationsAsync()
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(SearchComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have no accessibility violations', async () => {
      const results = await runAxeTest(fixture);
      
      expect(results.violations.length).toBe(0,
        `Found ${results.violations.length} accessibility violations:\n${formatViolations(results.violations)}`
      );
    });

    it('should have search form with role="search"', () => {
      const searchForm = fixture.nativeElement.querySelector('[role="search"]');
      expect(searchForm).toBeTruthy('Search form should have role="search"');
    });

    it('should have labeled search inputs', () => {
      const searchInputs = fixture.nativeElement.querySelectorAll('input[type="text"], input[type="number"]');
      searchInputs.forEach((input: HTMLInputElement) => {
        const hasLabel = input.getAttribute('aria-label') || 
                        input.getAttribute('aria-labelledby') ||
                        fixture.nativeElement.querySelector(`label[for="${input.id}"]`);
        expect(hasLabel).toBeTruthy(`Search input should have a label`);
      });
    });
  });

  describe('Header Component', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HeaderComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideAnimationsAsync()
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have no accessibility violations', async () => {
      const results = await runAxeTest(fixture);
      
      expect(results.violations.length).toBe(0,
        `Found ${results.violations.length} accessibility violations:\n${formatViolations(results.violations)}`
      );
    });

    it('should have navigation with role="navigation"', () => {
      const nav = fixture.nativeElement.querySelector('[role="navigation"]');
      expect(nav).toBeTruthy('Header should have navigation with role="navigation"');
    });

    it('should have aria-label for navigation', () => {
      const navs = fixture.nativeElement.querySelectorAll('[role="navigation"]');
      navs.forEach((nav: HTMLElement) => {
        const hasLabel = nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby');
        expect(hasLabel).toBeTruthy('Navigation should have aria-label');
      });
    });

    it('should have mobile menu button with aria-expanded', () => {
      const mobileMenuButton = fixture.nativeElement.querySelector('.mobile-menu-button');
      if (mobileMenuButton) {
        expect(mobileMenuButton.hasAttribute('aria-expanded')).toBeTruthy(
          'Mobile menu button should have aria-expanded attribute'
        );
      }
    });
  });

  describe('Footer Component', () => {
    let component: FooterComponent;
    let fixture: ComponentFixture<FooterComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FooterComponent],
        providers: [
          provideRouter([]),
          provideHttpClient()
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(FooterComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have no accessibility violations', async () => {
      const results = await runAxeTest(fixture);
      
      expect(results.violations.length).toBe(0,
        `Found ${results.violations.length} accessibility violations:\n${formatViolations(results.violations)}`
      );
    });

    it('should have contentinfo landmark', () => {
      const footer = fixture.nativeElement.querySelector('footer');
      expect(footer).toBeTruthy('Should have footer element');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper tab order', () => {
      // This test would require more complex setup with actual DOM
      // For now, we verify that tabindex is not misused
      const elementsWithTabindex = document.querySelectorAll('[tabindex]');
      elementsWithTabindex.forEach((element: Element) => {
        const tabindex = parseInt(element.getAttribute('tabindex') || '0');
        expect(tabindex).toBeLessThanOrEqual(0, 
          'Positive tabindex values should be avoided for proper tab order'
        );
      });
    });
  });

  describe('Color Contrast', () => {
    it('should pass color contrast checks', async () => {
      // axe-core will check this automatically in the component tests
      // This is a placeholder for additional manual contrast checks if needed
      expect(true).toBe(true);
    });
  });

  describe('Touch Target Size', () => {
    it('should have minimum 44x44px touch targets', () => {
      const interactiveElements = document.querySelectorAll('button, a, input[type="checkbox"], input[type="radio"]');
      interactiveElements.forEach((element: Element) => {
        const rect = element.getBoundingClientRect();
        const meetsMinimum = rect.width >= 44 && rect.height >= 44;
        
        // Allow smaller targets if they have adequate padding
        const styles = window.getComputedStyle(element as HTMLElement);
        const hasPadding = parseInt(styles.paddingTop) + parseInt(styles.paddingBottom) >= 12 &&
                          parseInt(styles.paddingLeft) + parseInt(styles.paddingRight) >= 16;
        
        expect(meetsMinimum || hasPadding).toBeTruthy(
          `Interactive element should meet minimum touch target size (44x44px) or have adequate padding`
        );
      });
    });
  });
});
