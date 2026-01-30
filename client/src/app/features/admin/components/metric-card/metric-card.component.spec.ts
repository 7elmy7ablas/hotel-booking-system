import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricCardComponent, MetricCardData } from './metric-card.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MetricCardComponent', () => {
  let component: MetricCardComponent;
  let fixture: ComponentFixture<MetricCardComponent>;

  const mockMetricData: MetricCardData = {
    title: 'Total Bookings',
    value: '150',
    icon: 'book_online',
    color: 'primary'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricCardComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MetricCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display metric data when provided', () => {
    component.data = mockMetricData;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.metric-title').textContent).toContain('Total Bookings');
    expect(compiled.querySelector('.metric-value').textContent).toContain('150');
  });

  it('should show loading spinner when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('mat-spinner')).toBeTruthy();
    expect(compiled.querySelector('.metric-content')).toBeFalsy();
  });

  it('should hide loading spinner when loading is false', () => {
    component.data = mockMetricData;
    component.loading = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('mat-spinner')).toBeFalsy();
    expect(compiled.querySelector('.metric-content')).toBeTruthy();
  });

  it('should apply correct color class', () => {
    component.data = { ...mockMetricData, color: 'success' };
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.metric-card--success')).toBeTruthy();
  });

  it('should display trend when provided', () => {
    component.data = {
      ...mockMetricData,
      trend: { value: 12, isPositive: true }
    };
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const trend = compiled.querySelector('.metric-trend');
    expect(trend).toBeTruthy();
    expect(trend.textContent).toContain('12%');
    expect(trend.classList.contains('positive')).toBeTruthy();
  });

  it('should display negative trend correctly', () => {
    component.data = {
      ...mockMetricData,
      trend: { value: 5, isPositive: false }
    };
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const trend = compiled.querySelector('.metric-trend');
    expect(trend.classList.contains('negative')).toBeTruthy();
  });

  it('should use primary as default color', () => {
    component.data = { title: 'Test', value: '100', icon: 'test' };
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.metric-card--primary')).toBeTruthy();
  });
});
