import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject, delay, Subject } from 'rxjs';

import { SearchComponent } from './search.component';
import { HotelService } from '../../../services/hotel.service';
import { AuthService } from '../../../services/auth.service';
import { SelectedHotelService } from '../../../services/selected-hotel.service';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let hotelServiceSpy: jasmine.SpyObj<HotelService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let selectedHotelServiceSpy: jasmine.SpyObj<SelectedHotelService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let queryParams: BehaviorSubject<any>;

  const mockHotels = [
    { id: '1', name: 'Grand Hotel', city: 'Cairo', address: '123 Main St', rating: 4.5, description: 'A grand hotel', country: 'Egypt', amenities: ['WiFi', 'Pool'] },
    { id: '2', name: 'Beach Resort', city: 'Alexandria', address: '456 Beach Rd', rating: 4.8, description: 'Beach resort', country: 'Egypt', amenities: ['WiFi', 'Beach'] },
    { id: '3', name: 'Budget Inn', city: 'Cairo', address: '789 Budget St', rating: 3.5, description: 'Budget friendly', country: 'Egypt', amenities: ['WiFi'] }
  ];

  beforeEach(async () => {
    hotelServiceSpy = jasmine.createSpyObj('HotelService', ['getHotels']);
    authServiceSpy = jasmine.createSpyObj('AuthService', [], { isAuthenticated: false });
    selectedHotelServiceSpy = jasmine.createSpyObj('SelectedHotelService', ['setSelectedHotel']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    queryParams = new BehaviorSubject({});

    hotelServiceSpy.getHotels.and.returnValue(of(mockHotels));

    await TestBed.configureTestingModule({
      imports: [
        SearchComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: HotelService, useValue: hotelServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SelectedHotelService, useValue: selectedHotelServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams.asObservable() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize search form', () => {
      expect(component.searchForm).toBeDefined();
    });

    it('should have search control', () => {
      expect(component.searchForm.get('search')).toBeDefined();
    });

    it('should have city control', () => {
      expect(component.searchForm.get('city')).toBeDefined();
    });

    it('should have date controls', () => {
      expect(component.searchForm.get('checkInDate')).toBeDefined();
      expect(component.searchForm.get('checkOutDate')).toBeDefined();
    });

    it('should have guests control with default value', () => {
      expect(component.searchForm.get('guests')?.value).toBe(1);
    });

    it('should have price range controls', () => {
      expect(component.searchForm.get('minPrice')).toBeDefined();
      expect(component.searchForm.get('maxPrice')).toBeDefined();
    });

    it('should initialize empty hotels array', () => {
      expect(component.hotels).toBeDefined();
    });

    it('should not be loading after initialization', fakeAsync(() => {
      tick(500);
      expect(component.isLoading).toBeFalse();
    }));

    it('should set minDate to today', () => {
      const today = new Date();
      expect(component.minDate.toDateString()).toBe(today.toDateString());
    });
  });

  describe('Hotel Loading', () => {
    it('should call getHotels on init', () => {
      expect(hotelServiceSpy.getHotels).toHaveBeenCalled();
    });

    it('should populate hotels array', fakeAsync(() => {
      tick(500);
      expect(component.hotels.length).toBe(3);
    }));

    it('should populate filteredHotels array', fakeAsync(() => {
      tick(500);
      expect(component.filteredHotels.length).toBe(3);
    }));

    it('should handle empty response', fakeAsync(() => {
      hotelServiceSpy.getHotels.and.returnValue(of([]));
      component.loadAllHotels();
      tick(500);
      expect(component.hotels).toEqual([]);
    }));

    it('should handle error response', fakeAsync(() => {
      hotelServiceSpy.getHotels.and.returnValue(of(null as any));
      component.loadAllHotels();
      tick(500);
      expect(component.hotels).toEqual([]);
    }));

    it('should set loading to true during load', fakeAsync(() => {
      // Use a delayed observable to verify loading state
      const hotelsSubject = new Subject<any[]>();
      hotelServiceSpy.getHotels.and.returnValue(hotelsSubject.asObservable());
      
      component.isLoading = false;
      component.loadAllHotels();
      
      // Before observable emits, isLoading should be true
      expect(component.isLoading).toBeTrue();
      
      // Emit and complete
      hotelsSubject.next(mockHotels);
      hotelsSubject.complete();
      tick();
      
      // After observable emits, isLoading should be false
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('Search Filtering', () => {
    beforeEach(fakeAsync(() => {
      tick(500);
    }));

    it('should filter hotels by search term', fakeAsync(() => {
      component.searchForm.patchValue({ search: 'Grand' });
      tick(400);
      component.applyFilters();
      expect(component.filteredHotels.length).toBe(1);
      expect(component.filteredHotels[0].name).toBe('Grand Hotel');
    }));

    it('should filter hotels by city', fakeAsync(() => {
      component.searchForm.patchValue({ search: 'Cairo' });
      tick(400);
      component.applyFilters();
      expect(component.filteredHotels.length).toBe(2);
    }));

    it('should filter hotels case-insensitively', fakeAsync(() => {
      component.searchForm.patchValue({ search: 'GRAND' });
      tick(400);
      component.applyFilters();
      expect(component.filteredHotels.length).toBe(1);
    }));

    it('should return all hotels with empty search', fakeAsync(() => {
      component.searchForm.patchValue({ search: '' });
      tick(400);
      component.applyFilters();
      expect(component.filteredHotels.length).toBe(3);
    }));

    it('should return empty array for no matches', fakeAsync(() => {
      component.searchForm.patchValue({ search: 'nonexistent' });
      tick(400);
      component.applyFilters();
      expect(component.filteredHotels.length).toBe(0);
    }));

    it('should filter by address', fakeAsync(() => {
      component.searchForm.patchValue({ search: 'Beach Rd' });
      tick(400);
      component.applyFilters();
      expect(component.filteredHotels.length).toBe(1);
    }));
  });

  describe('Query Parameter Handling', () => {
    it('should read search query from URL', fakeAsync(() => {
      queryParams.next({ search: 'test search' });
      tick(500);
      expect(component.searchForm.get('search')?.value).toBe('test search');
    }));

    it('should handle empty query params', fakeAsync(() => {
      queryParams.next({});
      tick(500);
      expect(component.searchForm.get('search')?.value).toBe('');
    }));
  });

  describe('Form Debouncing', () => {
    it('should debounce search input', fakeAsync(() => {
      const applyFiltersSpy = spyOn(component, 'applyFilters');
      
      component.searchForm.patchValue({ search: 'a' });
      component.searchForm.patchValue({ search: 'ab' });
      component.searchForm.patchValue({ search: 'abc' });
      
      tick(200);
      expect(applyFiltersSpy).not.toHaveBeenCalled();
      
      tick(200);
      expect(applyFiltersSpy).toHaveBeenCalled();
    }));
  });

  describe('Authentication State', () => {
    it('should check authentication on init', () => {
      expect(component.isAuthenticated).toBeDefined();
    });

    it('should reflect auth service state', () => {
      expect(component.isAuthenticated).toBeFalse();
    });
  });

  describe('Default Image', () => {
    it('should have default hotel image URL', () => {
      expect(component.defaultHotelImage).toContain('unsplash');
    });
  });
});
