# App Component Guide

## Overview
The `AppComponent` is the root component of the Angular 19 Hotel Booking application. It provides the main layout structure and bootstraps the entire application.

## File Structure

```
src/app/
├── app.component.ts       # Component logic
├── app.component.html     # Component template
├── app.component.scss     # Component styles
└── app.component.spec.ts  # Component tests
```

## Component Structure

### app.component.ts

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = environment.appName;
  version = environment.version;

  ngOnInit(): void {
    // Logs app info in development
  }
}
```

**Key Features**:
- ✅ Standalone component (Angular 19)
- ✅ Imports RouterOutlet for routing
- ✅ Imports Header and Footer components
- ✅ Uses environment configuration
- ✅ Logs app info in development

### app.component.html

```html
<div class="app-container">
  <app-header></app-header>
  <main class="main-content" role="main">
    <router-outlet />
  </main>
  <app-footer></app-footer>
</div>
```

**Layout Structure**:
1. **app-container**: Main flex container
2. **app-header**: Navigation (sticky)
3. **main-content**: Router outlet (flex-grow)
4. **app-footer**: Footer (sticky to bottom)

### app.component.scss

**Key Features**:
- ✅ Sticky footer layout using flexbox
- ✅ Global reset styles
- ✅ Responsive typography
- ✅ Custom scrollbar styling
- ✅ Accessibility features
- ✅ Print styles
- ✅ Utility classes

## Layout Explanation

### Sticky Footer Layout

The layout uses flexbox to create a sticky footer:

```scss
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;  // Full viewport height
}

.main-content {
  flex: 1;  // Takes remaining space
}
```

**How it works**:
1. Container is at least 100vh tall
2. Main content grows to fill available space
3. Footer is pushed to bottom
4. If content is short, footer stays at bottom
5. If content is long, footer appears after content

### Visual Representation

```
┌─────────────────────────┐
│       Header            │ ← Sticky at top
├─────────────────────────┤
│                         │
│     Main Content        │ ← Grows to fill space
│     (Router Outlet)     │
│                         │
├─────────────────────────┤
│       Footer            │ ← Sticky at bottom
└─────────────────────────┘
```

## Styling Features

### 1. Global Reset

```scss
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

**Purpose**: Ensures consistent styling across browsers.

### 2. Typography

```scss
body {
  font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Features**:
- Roboto font (Material Design)
- Responsive font sizes
- Smooth font rendering

### 3. Custom Scrollbar

```scss
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}
```

**Browsers**: Chrome, Edge, Safari

### 4. Accessibility

```scss
*:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
```

**Features**:
- Visible focus indicators
- Keyboard navigation support
- Screen reader friendly

### 5. Responsive Design

```scss
// Mobile
@media (max-width: 767px) {
  body { font-size: 14px; }
}

// Tablet
@media (min-width: 768px) and (max-width: 1023px) {
  body { font-size: 15px; }
}

// Desktop
@media (min-width: 1024px) {
  body { font-size: 16px; }
}
```

### 6. Print Styles

```scss
@media print {
  app-header,
  app-footer {
    display: none;  // Hide header/footer when printing
  }
}
```

## Utility Classes

The component includes utility classes for common styling needs:

### Spacing

```html
<div class="mt-2">Margin top</div>
<div class="mb-3">Margin bottom</div>
<div class="pt-1">Padding top</div>
<div class="pb-4">Padding bottom</div>
```

### Text Alignment

```html
<div class="text-center">Centered text</div>
<div class="text-left">Left aligned</div>
<div class="text-right">Right aligned</div>
```

### Display

```html
<div class="d-none">Hidden</div>
<div class="d-block">Block</div>
<div class="d-flex">Flexbox</div>
<div class="d-grid">Grid</div>
```

### Container

```html
<div class="container">Max-width container</div>
<div class="container-fluid">Full-width container</div>
```

## Component Lifecycle

### Initialization Flow

```
1. Component created
   ↓
2. Constructor runs
   ↓
3. ngOnInit() runs
   ↓
4. Logs app info (dev only)
   ↓
5. Template rendered
   ↓
6. Header component loaded
   ↓
7. Router outlet activated
   ↓
8. Footer component loaded
```

### Development Logging

In development mode, the component logs:

```
🏨 Hotel Booking System v1.0.0
📍 Environment: Development
🔗 API URL: https://localhost:7291/api
```

## Imports

### Required Imports

```typescript
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/shared/header/header.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { environment } from '../environments/environment';
```

**Why each import**:
- `Component, OnInit`: Angular core decorators
- `RouterOutlet`: Required for routing
- `HeaderComponent`: Application header
- `FooterComponent`: Application footer
- `environment`: Configuration values

## Testing

### Unit Test Example

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have title', () => {
    expect(component.title).toBe('Hotel Booking System');
  });

  it('should render header', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('should render footer', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });

  it('should render router outlet', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
```

## Customization

### Change Layout

To modify the layout structure:

1. **Add sidebar**:
```html
<div class="app-container">
  <app-header></app-header>
  <div class="content-wrapper">
    <aside class="sidebar">...</aside>
    <main class="main-content">
      <router-outlet />
    </main>
  </div>
  <app-footer></app-footer>
</div>
```

2. **Remove footer**:
```html
<div class="app-container">
  <app-header></app-header>
  <main class="main-content">
    <router-outlet />
  </main>
</div>
```

3. **Add loading indicator**:
```html
<div class="app-container">
  <app-header></app-header>
  <app-loading *ngIf="isLoading"></app-loading>
  <main class="main-content" *ngIf="!isLoading">
    <router-outlet />
  </main>
  <app-footer></app-footer>
</div>
```

### Change Styling

To modify global styles:

1. **Change font**:
```scss
body {
  font-family: 'Open Sans', sans-serif;
}
```

2. **Change background**:
```scss
body {
  background-color: #ffffff;
}
```

3. **Change scrollbar**:
```scss
::-webkit-scrollbar-thumb {
  background: #667eea;
}
```

## Best Practices

### 1. Keep Component Simple
```typescript
// ✅ Good - Simple root component
export class AppComponent {
  title = environment.appName;
}

// ❌ Bad - Too much logic in root
export class AppComponent {
  // Complex business logic
  // API calls
  // State management
}
```

### 2. Use Semantic HTML
```html
<!-- ✅ Good - Semantic elements -->
<header>...</header>
<main role="main">...</main>
<footer>...</footer>

<!-- ❌ Bad - Generic divs -->
<div class="header">...</div>
<div class="main">...</div>
<div class="footer">...</div>
```

### 3. Accessibility
```html
<!-- ✅ Good - Accessible -->
<main role="main" aria-label="Main content">
  <router-outlet />
</main>

<!-- ❌ Bad - No accessibility -->
<div>
  <router-outlet />
</div>
```

### 4. Performance
```typescript
// ✅ Good - Lazy load components
imports: [RouterOutlet, HeaderComponent, FooterComponent]

// ❌ Bad - Import everything
imports: [CommonModule, FormsModule, HttpClientModule, ...]
```

## Troubleshooting

### Issue: Footer not sticking to bottom

**Problem**: Footer appears in middle of page

**Solution**:
```scss
.app-container {
  min-height: 100vh;  // Ensure this is set
}

.main-content {
  flex: 1;  // Ensure this is set
}
```

### Issue: Horizontal scrollbar appearing

**Problem**: Page scrolls horizontally

**Solution**:
```scss
.app-container {
  overflow-x: hidden;
}

body {
  overflow-x: hidden;
}
```

### Issue: Header not sticky

**Problem**: Header scrolls with content

**Solution**: Add to header component:
```scss
app-header {
  position: sticky;
  top: 0;
  z-index: 1000;
}
```

### Issue: Styles not applying

**Problem**: Global styles not working

**Solution**:
```scss
// Use ::ng-deep for global styles
::ng-deep body {
  // styles here
}
```

## Related Files

- `app.config.ts` - Application configuration
- `app.routes.ts` - Route definitions
- `main.ts` - Application bootstrap
- `components/shared/header/` - Header component
- `components/shared/footer/` - Footer component

## Additional Resources

- [Angular Components](https://angular.io/guide/component-overview)
- [Angular Standalone](https://angular.io/guide/standalone-components)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
