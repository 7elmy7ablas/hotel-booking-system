import { Injectable } from '@angular/core';

/**
 * Accessibility Service
 * 
 * Provides utilities for managing accessibility features throughout the application.
 * Helps ensure WCAG 2.1 AA compliance.
 */
@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  
  /**
   * Announce message to screen readers
   * Uses ARIA live region
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const liveRegion = this.getOrCreateLiveRegion(priority);
    
    // Clear and set new message
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  }

  /**
   * Get or create ARIA live region for announcements
   */
  private getOrCreateLiveRegion(priority: 'polite' | 'assertive'): HTMLElement {
    const id = `aria-live-${priority}`;
    let liveRegion = document.getElementById(id);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = id;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    return liveRegion;
  }

  /**
   * Set focus to element by ID
   */
  setFocus(elementId: string, delay: number = 0): void {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
      }
    }, delay);
  }

  /**
   * Trap focus within a container (for modals, dialogs)
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
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
   * Generate unique ID for form controls
   */
  generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if element is visible to screen readers
   */
  isVisibleToScreenReader(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.getAttribute('aria-hidden') !== 'true';
  }

  /**
   * Get accessible name for element
   */
  getAccessibleName(element: HTMLElement): string {
    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || '';
    }
    
    // Check associated label
    if (element instanceof HTMLInputElement) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || '';
    }
    
    // Check title
    const title = element.getAttribute('title');
    if (title) return title;
    
    // Check text content
    return element.textContent || '';
  }

  /**
   * Validate color contrast ratio
   * Returns true if contrast meets WCAG AA standards (4.5:1 for normal text)
   */
  validateContrast(foreground: string, background: string): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return ratio >= 4.5; // WCAG AA standard for normal text
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   */
  private getLuminance(color: string): number {
    // This is a simplified version - in production, use a proper color library
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}
