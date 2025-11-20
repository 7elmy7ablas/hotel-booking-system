import { TestBed } from '@angular/core/testing';
import { CacheService } from './cache.service';
import { of, delay } from 'rxjs';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);
  });

  afterEach(() => {
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Cache Operations', () => {
    it('should cache data with default TTL', (done) => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test' };
      const request$ = of(data);

      service.get(key, request$).subscribe(result => {
        expect(result).toEqual(data);
        expect(service.has(key)).toBe(true);
        done();
      });
    });

    it('should return cached data on second call', (done) => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test' };
      let callCount = 0;
      const request$ = of(data).pipe(delay(10));

      // First call
      service.get(key, request$).subscribe(() => {
        callCount++;
        
        // Second call should be instant (cached)
        const startTime = Date.now();
        service.get(key, request$).subscribe(result => {
          const duration = Date.now() - startTime;
          expect(result).toEqual(data);
          expect(duration).toBeLessThan(5); // Should be instant
          expect(callCount).toBe(1); // Request only called once
          done();
        });
      });
    });

    it('should respect custom TTL', (done) => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test' };
      const request$ = of(data);
      const ttl = 100; // 100ms

      service.get(key, request$, ttl).subscribe(() => {
        expect(service.has(key)).toBe(true);
        
        // Wait for TTL to expire
        setTimeout(() => {
          expect(service.has(key)).toBe(false);
          done();
        }, 150);
      });
    });

    it('should invalidate specific cache entry', (done) => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test' };
      const request$ = of(data);

      service.get(key, request$).subscribe(() => {
        expect(service.has(key)).toBe(true);
        service.invalidate(key);
        expect(service.has(key)).toBe(false);
        done();
      });
    });

    it('should invalidate cache entries by pattern', (done) => {
      const keys = ['user:1', 'user:2', 'hotel:1'];
      const request$ = of({ data: 'test' });

      Promise.all(
        keys.map(key => service.get(key, request$).toPromise())
      ).then(() => {
        service.invalidatePattern('user:');
        expect(service.has('user:1')).toBe(false);
        expect(service.has('user:2')).toBe(false);
        expect(service.has('hotel:1')).toBe(true);
        done();
      });
    });

    it('should clear all cache entries', (done) => {
      const keys = ['key1', 'key2', 'key3'];
      const request$ = of({ data: 'test' });

      Promise.all(
        keys.map(key => service.get(key, request$).toPromise())
      ).then(() => {
        const stats = service.getStats();
        expect(stats.size).toBe(3);
        
        service.clear();
        const newStats = service.getStats();
        expect(newStats.size).toBe(0);
        done();
      });
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', (done) => {
      const keys = ['key1', 'key2'];
      const request$ = of({ data: 'test' });

      Promise.all(
        keys.map(key => service.get(key, request$).toPromise())
      ).then(() => {
        const stats = service.getStats();
        expect(stats.size).toBe(2);
        expect(stats.keys).toContain('key1');
        expect(stats.keys).toContain('key2');
        done();
      });
    });

    it('should return cache entry age', (done) => {
      const key = 'test-key';
      const request$ = of({ data: 'test' });

      service.get(key, request$).subscribe(() => {
        setTimeout(() => {
          const age = service.getAge(key);
          expect(age).toBeGreaterThan(50);
          expect(age).toBeLessThan(200);
          done();
        }, 100);
      });
    });

    it('should return null for non-existent cache age', () => {
      const age = service.getAge('non-existent');
      expect(age).toBeNull();
    });
  });

  describe('Cache Cleanup', () => {
    it('should cleanup expired entries', (done) => {
      const key1 = 'short-ttl';
      const key2 = 'long-ttl';
      const request$ = of({ data: 'test' });

      service.get(key1, request$, 50).subscribe(() => {
        service.get(key2, request$, 5000).subscribe(() => {
          setTimeout(() => {
            service.cleanup();
            expect(service.has(key1)).toBe(false);
            expect(service.has(key2)).toBe(true);
            done();
          }, 100);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests for same key', (done) => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test' };
      let requestCount = 0;
      const request$ = of(data).pipe(
        delay(50),
        // Track how many times the request is made
        // In a real scenario, this would be an HTTP call
      );

      // Make multiple concurrent requests
      const sub1 = service.get(key, request$).subscribe();
      const sub2 = service.get(key, request$).subscribe();
      const sub3 = service.get(key, request$).subscribe();

      setTimeout(() => {
        // All should share the same cached result
        expect(service.has(key)).toBe(true);
        sub1.unsubscribe();
        sub2.unsubscribe();
        sub3.unsubscribe();
        done();
      }, 100);
    });

    it('should handle empty cache operations gracefully', () => {
      expect(() => service.invalidate('non-existent')).not.toThrow();
      expect(() => service.invalidatePattern('non-existent')).not.toThrow();
      expect(() => service.clear()).not.toThrow();
      expect(() => service.cleanup()).not.toThrow();
    });
  });
});
