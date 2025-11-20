import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Directive({
  selector: '[appDebounce]',
  standalone: true
})
export class DebounceDirective implements OnInit, OnDestroy {
  @Input() debounceTime = 500;
  @Output() debounceEvent = new EventEmitter();
  
  private clicks = new Subject();
  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.subscription = this.clicks
      .pipe(debounceTime(this.debounceTime))
      .subscribe(e => this.debounceEvent.emit(e));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  @HostListener('input', ['$event'])
  clickEvent(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }
}
