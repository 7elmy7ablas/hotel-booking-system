import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  @Input() appImageFallback: string = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop';
  private hasError = false;

  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError(): void {
    if (!this.hasError) {
      this.hasError = true;
      const img = this.el.nativeElement;
      img.src = this.appImageFallback;
    }
  }
}
