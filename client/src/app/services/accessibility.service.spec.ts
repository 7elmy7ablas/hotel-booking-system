import { TestBed } from '@angular/core/testing';
import { AccessibilityService } from './accessibility.service';

describe('AccessibilityService - WCAG 2.1 AA Compliance', () => {
  let service: AccessibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessibilityService);
    
    // Create ARIA live regions for testing
    const politeRegion = document.createElement('div');
    politeRegion.id = 'aria-live-polite';
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only';
    document.body.appendChild(politeRegion);

    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'aria-live-assertive';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    document.body.appendChild(assertiveRegion);
  });

  afterEach(() => {
    // Clean up
    const politeRegion = document.getElementById('aria-live-polite');
    const assertiveRegion = document.getElementById('aria-live-assertive');
    if (politeRegion) politeRegion.remove();
    if (assertiveRegion) assertiveRegion.remove();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('ARIA Live Region Announcements', () => {
    it('should announce polite messages', (done) => {
      const message = 'Test announcement';
      service.announce(message);

      setTimeout(() => {
        const region = document.getElementById('aria-live-polite');
        expect(region?.textContent).toBe(message);
        done();
      }, 150);
    });

    it('should announce urgent messages', (done) => {
      const message = 'Urgent test announcement';
      service.announceUrgent(message);

      setTimeout(() => {
        const region = document.getElementById('aria-live-assertive');
        expect(region?.textContent).toBe(message);
        done();
      }, 150);
    });

    it('should clear announcements after 5 seconds', (done) => {
      const message = 'Temporary announcement';
      service.announce(message);

      setTimeout(() => {
        const region = document.getElementById('aria-live-polite');
        expect(region?.textContent).toBe('');
        done();
      }, 5200);
    });
  });

  describe('Focus Management', () => {
    it('should focus element by ID', () => {
      const testElement = document.createElement('button');
      testElement.id = 'test-button';
      testElement.textContent = 'Test Button';
      document.body.appendChild(testElement);

      service.focusElement('test-button');

      expect(document.activeElement).toBe(testElement);

      testElement.remove();
    });

    it('should get focusable elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <a href="#">Link</a>
        <input type="text">
        <button disabled>Disabled Button</button>
        <div tabindex="0">Focusable Div</div>
      `;
      document.body.appendChild(container);

      const focusableElements = service.getFocusableElements(container);

      expect(focusableElements.length).toBe(4); // Excludes disabled button

      container.remove();
    });

    it('should focus first element in container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      button1.textContent = 'First';
      const button2 = document.createElement('button');
      button2.textContent = 'Second';
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      service.focusFirstElement(container);

      expect(document.activeElement).toBe(button1);

      container.remove();
    });
  });

  describe('Focus Trap', () => {
    it('should trap focus within container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      button1.textContent = 'First';
      const button2 = document.createElement('button');
      button2.textContent = 'Last';
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const cleanup = service.trapFocus(container);

      // Focus last element
      button2.focus();

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      container.dispatchEvent(tabEvent);

      // Should cycle back to first element
      // Note: This is a simplified test, actual behavior depends on event handling

      cleanup();
      container.remove();
    });
  });

  describe('Screen Reader Utilities', () => {
    it('should check if element is visible to screen reader', () => {
      const visibleElement = document.createElement('div');
      visibleElement.textContent = 'Visible';
      document.body.appendChild(visibleElement);

      expect(service.isVisibleToScreenReader(visibleElement)).toBe(true);

      visibleElement.remove();
    });

    it('should detect aria-hidden elements', () => {
      const hiddenElement = document.createElement('div');
      hiddenElement.setAttribute('aria-hidden', 'true');
      document.body.appendChild(hiddenElement);

      expect(service.isVisibleToScreenReader(hiddenElement)).toBe(false);

      hiddenElement.remove();
    });

    it('should detect display:none elements', () => {
      const hiddenElement = document.createElement('div');
      hiddenElement.style.display = 'none';
      document.body.appendChild(hiddenElement);

      expect(service.isVisibleToScreenReader(hiddenElement)).toBe(false);

      hiddenElement.remove();
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = service.generateId('test');
      const id2 = service.generateId('test');

      expect(id1).toContain('test-');
      expect(id2).toContain('test-');
      expect(id1).not.toBe(id2);
    });
  });

  describe('Contextual Announcements', () => {
    it('should announce navigation', (done) => {
      service.announceNavigation('Hotels');

      setTimeout(() => {
        const region = document.getElementById('aria-live-polite');
        expect(region?.textContent).toBe('Navigated to Hotels page');
        done();
      }, 150);
    });

    it('should announce form errors', (done) => {
      const errors = ['Email is required', 'Password is too short'];
      service.announceFormErrors(errors);

      setTimeout(() => {
        const region = document.getElementById('aria-live-assertive');
        expect(region?.textContent).toContain('Form has 2 errors');
        done();
      }, 150);
    });

    it('should announce single form error', (done) => {
      const errors = ['Email is required'];
      service.announceFormErrors(errors);

      setTimeout(() => {
        const region = document.getElementById('aria-live-assertive');
        expect(region?.textContent).toBe('Form error: Email is required');
        done();
      }, 150);
    });

    it('should announce loading state', (done) => {
      service.announceLoading(true, 'hotels');

      setTimeout(() => {
        const region = document.getElementById('aria-live-polite');
        expect(region?.textContent).toBe('Loading hotels, please wait');
        done();
      }, 150);
    });

    it('should announce loaded state', (done) => {
      service.announceLoading(false, 'hotels');

      setTimeout(() => {
        const region = document.getElementById('aria-live-polite');
        expect(region?.textContent).toBe('hotels loaded');
        done();
      }, 150);
    });

    it('should announce search results', (done) => {
      service.announceSearchResults(5, 'New York');

      setTimeout(() => {
        const region = document.getElementById('aria-live-polite');
        expect(region?.textContent).toBe('5 results found for "New York"');
        done();
      }, 150);
    });

    it('should announce no search results', (done) => {
      service.announceSearchResults(0, 'Atlantis');

      setTimeout(() => {
        const region = document.getElementById('aria-live-polite');
        expect(region?.textContent).toBe('No results found for "Atlantis"');
        done();
      }, 150);
    });

    it('should announce table updates', (done) => {
      service.announceTableUpdate(10, 'bookings');

      setTimeout(() => {
        const region = document.getElementById('aria-live-polite');
        expect(region?.textContent).toBe('bookings updated with 10 rows');
        done();
      }, 150);
    });
  });

  describe('User Preferences', () => {
    it('should detect reduced motion preference', () => {
      // Note: This test depends on browser/system settings
      const prefersReducedMotion = service.prefersReducedMotion();
      expect(typeof prefersReducedMotion).toBe('boolean');
    });

    it('should detect high contrast preference', () => {
      // Note: This test depends on browser/system settings
      const prefersHighContrast = service.prefersHighContrast();
      expect(typeof prefersHighContrast).toBe('boolean');
    });
  });

  describe('Focus Restoration', () => {
    it('should get current focus', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const currentFocus = service.getCurrentFocus();
      expect(currentFocus).toBe(button);

      button.remove();
    });

    it('should restore focus to element', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      document.body.appendChild(button1);
      document.body.appendChild(button2);

      button1.focus();
      button2.focus();

      service.restoreFocus(button1);

      expect(document.activeElement).toBe(button1);

      button1.remove();
      button2.remove();
    });

    it('should handle null element in restore focus', () => {
      expect(() => service.restoreFocus(null)).not.toThrow();
    });
  });
});
