import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HotelService } from './hotel.service';
import { CacheService } from './cache.service';
import { ErrorHandlingService } from './error-handling.service';
import { SanitizationService } from './sanitization.service';
import { Hotel, Room, SearchCriteria } from '../models/hotel.model';
import { environment } from '../../environments/environment';

describe('HotelService', () => {
  let service: HotelService;
  let httpMock: HttpTestingController;
  let cacheService: CacheService;

  const mockHotels: Hotel[] = [
    {
      id: '1',
      name: 'Test Hotel',
      description: 'A test hotel',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      rating: 4.5,
      amenities: ['WiFi', 'Pool'],
      imageUrl: 'test.jpg'
    }
  ];

  const mockRooms: Room[] = [
    {
      id: '1',
      hotelId: '1',
      roomNumber: '101',
      type: 'Standard',
      capacity: 2,
      pricePerNight: 100,
      isAvailable: true,
      amenities: ['TV', 'AC']
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HotelService,
        CacheService,
        ErrorHandlingService,
        SanitizationService
      ]
    });

    service = TestBed.inject(HotelService);
    httpMock = TestBed.inject(HttpTestingController);
    cacheService = TestBed.inject(CacheService);
  });

  afterEach(() => {
    httpMock.verify();
    cacheService.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHotels', () => {
    it('should fetch hotels from API', (done) => {
      service.getHotels().subscribe(hotels => {
        expect(hotels).toEqual(mockHotels);
        expect(hotels.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.hotels}`);
      expect(req.request.method).toBe('GET');
      req.flush({ items: mockHotels });
    });

    it('should cache hotels response', (done) => {
      // First call
      service.getHotels().subscribe(() => {
        // Second call should use cache
        service.getHotels().subscribe(hotels => {
          expect(hotels).toEqual(mockHotels);
          done();
        });
      });

      // Only one HTTP request should be made
      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.hotels}`);
      req.flush({ items: mockHotels });
    });

    it('should handle empty response', (done) => {
      service.getHotels().subscribe(hotels => {
        expect(hotels).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.hotels}`);
      req.flush(null);
    });

    it('should handle API errors', (done) => {
      service.getHotels().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.hotels}`);
      req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getHotelById', () => {
    it('should fetch hotel by ID', (done) => {
      const hotelId = '1';
      
      service.getHotelById(hotelId).subscribe(hotel => {
        expect(hotel).toEqual(mockHotels[0]);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.hotels}/${hotelId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHotels[0]);
    });

    it('should cache hotel details', (done) => {
      const hotelId = '1';
      
      service.getHotelById(hotelId).subscribe(() => {
        service.getHotelById(hotelId).subscribe(hotel => {
          expect(hotel).toEqual(mockHotels[0]);
          done();
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.hotels}/${hotelId}`);
      req.flush(mockHotels[0]);
    });
  });

  describe('searchHotels', () => {
    it('should search hotels with criteria', (done) => {
      const criteria: SearchCriteria = {
        city: 'Test City',
        guests: 2
      };

      service.searchHotels(criteria).subscribe(hotels => {
        expect(hotels).toEqual(mockHotels);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/search') && 
        req.params.has('city') &&
        req.params.has('guests')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockHotels);
    });

    it('should sanitize search criteria', (done) => {
      const criteria: SearchCriteria = {
        city: '<script>alert("xss")</script>Test',
        guests: 2
      };

      service.searchHotels(criteria).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/search'));
      // Verify that the city parameter doesn't contain script tags
      expect(req.request.params.get('city')).not.toContain('<script>');
      req.flush(mockHotels);
    });
  });

  describe('getRoomsByHotelId', () => {
    it('should fetch rooms for hotel', (done) => {
      const hotelId = '1';

      service.getRoomsByHotelId(hotelId).subscribe(rooms => {
        expect(rooms).toEqual(mockRooms);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.hotels}/${hotelId}/rooms`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRooms);
    });

    it('should cache rooms response', (done) => {
      const hotelId = '1';

      service.getRoomsByHotelId(hotelId).subscribe(() => {
        service.getRoomsByHotelId(hotelId).subscribe(rooms => {
          expect(rooms).toEqual(mockRooms);
          done();
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.hotels}/${hotelId}/rooms`);
      req.flush(mockRooms);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate hotel caches', () => {
      spyOn(cacheService, 'invalidate');
      
      service.invalidateHotelCaches('1');
      
      expect(cacheService.invalidate).toHaveBeenCalledWith('hotel:1');
      expect(cacheService.invalidate).toHaveBeenCalledWith('rooms:hotel:1');
      expect(cacheService.invalidate).toHaveBeenCalledWith('hotels:all');
    });

    it('should invalidate all hotels when no ID provided', () => {
      spyOn(cacheService, 'invalidate');
      
      service.invalidateHotelCaches();
      
      expect(cacheService.invalidate).toHaveBeenCalledWith('hotels:all');
    });
  });
});
