import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit {
  @Input() appLazyLoad: string = '';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            observer.unobserve(this.el.nativeElement);
          }
        });
      });

      observer.observe(this.el.nativeElement);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      this.loadImage();
    }
  }

  private loadImage(): void {
    const img = this.el.nativeElement;
    if (this.appLazyLoad) {
      img.src = this.appLazyLoad;
    }
  }
}
