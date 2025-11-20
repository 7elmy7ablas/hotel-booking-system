import { Injectable } from '@angular/core';

/**
 * Accessibility Service
 * 
 * Provides utilities for managing accessibility features including:
 * - ARIA live region announcements
 * - Focus management
 * - Keyboard navigation helpers
 * - Screen reader utilities
 * 
 * WCAG 2.1 AA Compliance
 */
@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  constructor() {
    // Initialize ARIA live regions on service creation
    this.initializeLiveRegions();
  }

  /**
   * Initialize ARIA live regions for screen reader announcements
   */
  private initializeLiveRegions(): void {
    // Polite region for non-urgent announcements
    this.politeRegion = document.getElementById('aria-live-polite');
    if (!this.politeRegion) {
      this.politeRegion = this.createLiveRegion('aria-live-polite', 'polite');
    }

    // Assertive region for urgent announcements
    this.assertiveRegion = document.getElementById('aria-live-assertive');
    if (!this.assertiveRegion) {
      this.assertiveRegion = this.createLiveRegion('aria-live-assertive', 'assertive');
    }
  }

  /**
   * Create an ARIA live region element
   */
  private createLiveRegion(id: string, politeness: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    return region;
  }

  /**
   * Announce a message to screen readers (polite)
   * Use for non-urgent notifications
   */
  announce(message: string, delay: number = 100): void {
    if (!this.politeRegion) {
      this.initializeLiveRegions();
    }

    setTimeout(() => {
      if (this.politeRegion) {
        this.politeRegion.textContent = message;
        
        // Clear after 5 seconds to allow new announcements
        setTimeout(() => {
          if (this.politeRegion) {
            this.politeRegion.textContent = '';
          }
        }, 5000);
      }
    }, delay);
  }

  /**
   * Announce an urgent message to screen readers (assertive)
   * Use for errors and critical notifications
   */
  announceUrgent(message: string, delay: number = 100): void {
    if (!this.assertiveRegion) {
      this.initializeLiveRegions();
    }

    setTimeout(() => {
      if (this.assertiveRegion) {
        this.assertiveRegion.textContent = message;
        
        // Clear after 5 seconds
        setTimeout(() => {
          if (this.assertiveRegion) {
            this.assertiveRegion.textContent = '';
          }
        }, 5000);
      }
    }, delay);
  }

  /**
   * Set focus to an element by ID
   * Useful for skip links and focus management
   */
  focusElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      
      // Announce focus change to screen readers
      const label = element.getAttribute('aria-label') || 
                    element.getAttribute('title') || 
                    element.textContent?.trim() || 
                    'Element';
      this.announce(`Focused on ${label}`);
    }
  }

  /**
   * Set focus to the first focusable element within a container
   */
  focusFirstElement(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): Element[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  }

  /**
   * Trap focus within a container (useful for modals)
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Check if an element is visible to screen readers
   */
  isVisibleToScreenReader(element: HTMLElement): boolean {
    const ariaHidden = element.getAttribute('aria-hidden') === 'true';
    const hidden = element.hasAttribute('hidden');
    const displayNone = window.getComputedStyle(element).display === 'none';
    const visibilityHidden = window.getComputedStyle(element).visibility === 'hidden';

    return !ariaHidden && !hidden && !displayNone && !visibilityHidden;
  }

  /**
   * Generate a unique ID for accessibility purposes
   */
  generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Announce page navigation to screen readers
   */
  announceNavigation(pageName: string): void {
    this.announce(`Navigated to ${pageName} page`);
  }

  /**
   * Announce form validation errors
   */
  announceFormErrors(errors: string[]): void {
    const message = errors.length === 1
      ? `Form error: ${errors[0]}`
      : `Form has ${errors.length} errors: ${errors.join(', ')}`;
    
    this.announceUrgent(message);
  }

  /**
   * Announce loading state
   */
  announceLoading(isLoading: boolean, context: string = 'content'): void {
    if (isLoading) {
      this.announce(`Loading ${context}, please wait`);
    } else {
      this.announce(`${context} loaded`);
    }
  }

  /**
   * Announce search results
   */
  announceSearchResults(count: number, query: string): void {
    if (count === 0) {
      this.announce(`No results found for "${query}"`);
    } else if (count === 1) {
      this.announce(`1 result found for "${query}"`);
    } else {
      this.announce(`${count} results found for "${query}"`);
    }
  }

  /**
   * Announce table updates
   */
  announceTableUpdate(rowCount: number, tableName: string = 'table'): void {
    this.announce(`${tableName} updated with ${rowCount} rows`);
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if user prefers high contrast
   */
  prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Get the current focus element
   */
  getCurrentFocus(): Element | null {
    return document.activeElement;
  }

  /**
   * Restore focus to a previously focused element
   */
  restoreFocus(element: HTMLElement | null): void {
    if (element && element.focus) {
      element.focus();
    }
  }
}
