import { Injectable } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CacheEntry<T> {
  data: Observable<T>;
  timestamp: number;
  ttl: number;
}

/**
 * Cache Service with TTL (Time To Live)
 * 
 * Provides intelligent caching for API requests with configurable expiration.
 * Prevents redundant API calls and improves application performance.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data or execute request if cache is expired/missing
   * 
   * @param key - Unique cache key
   * @param request - Observable to execute if cache miss
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   * @returns Observable with cached or fresh data
   */
  get<T>(key: string, request: Observable<T>, ttl: number = this.DEFAULT_TTL): Observable<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Check if cache exists and is still valid
    if (cached && (now - cached.timestamp) < cached.ttl) {
      console.log(`📦 Cache HIT for key: ${key}`);
      return cached.data;
    }

    console.log(`🌐 Cache MISS for key: ${key} - Fetching fresh data`);

    // Create new cache entry with shareReplay to prevent multiple subscriptions
    const data$ = request.pipe(
      shareReplay({
        bufferSize: 1,
        refCount: true
      }),
      tap(() => {
        console.log(`✅ Cache STORED for key: ${key}`);
      })
    );

    this.cache.set(key, {
      data: data$,
      timestamp: now,
      ttl
    });

    return data$;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`🗑️ Cache INVALIDATED for key: ${key}`);
    }
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`🗑️ Cache INVALIDATED for key: ${key}`);
    });

    if (keysToDelete.length > 0) {
      console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache CLEARED - Removed ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    const isValid = (now - cached.timestamp) < cached.ttl;

    if (!isValid) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache entry age in milliseconds
   */
  getAge(key: string): number | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    return Date.now() - cached.timestamp;
  }

  /**
   * Cleanup expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if ((now - entry.timestamp) >= entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache CLEANUP - Removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Set up automatic cleanup interval
   */
  startAutoCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      this.cleanup();
    }, intervalMs);
    console.log(`🔄 Auto cleanup started - Running every ${intervalMs}ms`);
  }
}
