import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Optimized Image Directive
 * 
 * Automatically applies lazy loading and WebP format support to images.
 * Improves page load performance by deferring off-screen images.
 */
@Directive({
  selector: 'img[appOptimizedImage]',
  standalone: true
})
export class OptimizedImageDirective implements OnInit {
  @Input() appOptimizedImage: string = '';
  @Input() fallbackSrc: string = '';
  @Input() alt: string = '';

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const img = this.el.nativeElement;

    // Enable lazy loading
    this.renderer.setAttribute(img, 'loading', 'lazy');

    // Add decoding attribute for better performance
    this.renderer.setAttribute(img, 'decoding', 'async');

    // Set alt text for accessibility
    if (this.alt) {
      this.renderer.setAttribute(img, 'alt', this.alt);
    }

    // Try to use WebP format if supported
    if (this.supportsWebP()) {
      const webpSrc = this.convertToWebP(this.appOptimizedImage || img.src);
      if (webpSrc) {
        this.loadImageWithFallback(webpSrc, this.appOptimizedImage || img.src);
      }
    }

    // Add error handler for fallback
    this.renderer.listen(img, 'error', () => {
      if (this.fallbackSrc && img.src !== this.fallbackSrc) {
        console.log(`Image failed to load, using fallback: ${this.fallbackSrc}`);
        this.renderer.setAttribute(img, 'src', this.fallbackSrc);
      }
    });

    // Add intersection observer for better lazy loading control
    this.setupIntersectionObserver();
  }

  /**
   * Check if browser supports WebP format
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  }

  /**
   * Convert image URL to WebP format
   */
  private convertToWebP(src: string): string | null {
    if (!src) return null;

    // Check if it's an Unsplash URL (common in the app)
    if (src.includes('unsplash.com')) {
      // Add WebP format parameter
      const url = new URL(src);
      url.searchParams.set('fm', 'webp');
      url.searchParams.set('q', '80'); // Quality 80%
      return url.toString();
    }

    // For other URLs, try to replace extension
    if (src.match(/\.(jpg|jpeg|png)$/i)) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    return null;
  }

  /**
   * Load image with fallback to original format
   */
  private loadImageWithFallback(webpSrc: string, originalSrc: string): void {
    const img = this.el.nativeElement;
    const testImg = new Image();

    testImg.onload = () => {
      this.renderer.setAttribute(img, 'src', webpSrc);
      console.log(`Using WebP format: ${webpSrc}`);
    };

    testImg.onerror = () => {
      this.renderer.setAttribute(img, 'src', originalSrc);
      console.log(`WebP not available, using original: ${originalSrc}`);
    };

    testImg.src = webpSrc;
  }

  /**
   * Setup Intersection Observer for advanced lazy loading
   */
  private setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      const img = this.el.nativeElement;
      const dataSrc = img.getAttribute('data-src');

      if (dataSrc) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.renderer.setAttribute(img, 'src', dataSrc);
              this.renderer.removeAttribute(img, 'data-src');
              observer.unobserve(img);
            }
          });
        }, {
          rootMargin: '50px' // Start loading 50px before image enters viewport
        });

        observer.observe(img);
      }
    }
  }
}
