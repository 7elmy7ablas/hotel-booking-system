import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';
import { AccessibilityService } from '../services/accessibility.service';

/**
 * Focus Trap Directive
 * 
 * Traps keyboard focus within an element (useful for modals and dialogs)
 * Implements WCAG 2.1 AA keyboard navigation requirements
 * 
 * Usage:
 * <div appFocusTrap [trapActive]="isModalOpen">...</div>
 */
@Directive({
  selector: '[appFocusTrap]',
  standalone: true
})
export class FocusTrapDirective implements OnInit, OnDestroy {
  @Input() trapActive: boolean = true;
  
  private cleanup?: () => void;
  private previousFocus: HTMLElement | null = null;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private a11yService: AccessibilityService
  ) {}

  ngOnInit(): void {
    if (this.trapActive) {
      this.activateTrap();
    }
  }

  ngOnDestroy(): void {
    this.deactivateTrap();
  }

  private activateTrap(): void {
    // Store current focus to restore later
    this.previousFocus = document.activeElement as HTMLElement;

    // Focus first element in container
    setTimeout(() => {
      this.a11yService.focusFirstElement(this.elementRef.nativeElement);
    }, 100);

    // Trap focus
    this.cleanup = this.a11yService.trapFocus(this.elementRef.nativeElement);
  }

  private deactivateTrap(): void {
    // Cleanup trap
    if (this.cleanup) {
      this.cleanup();
    }

    // Restore previous focus
    if (this.previousFocus) {
      this.a11yService.restoreFocus(this.previousFocus);
    }
  }
}
