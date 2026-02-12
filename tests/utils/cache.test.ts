/**
 * cache.ts 단위 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Cache } from '../../src/utils/cache.js';

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    cache = new Cache<string>({ ttl: 1000 }); // 1초 TTL
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });
  });

  describe('TTL (Time To Live)', () => {
    it(
      'should expire values after TTL',
      { timeout: 2000 },
      async () => {
        cache.set('key1', 'value1', 100); // 100ms TTL
        expect(cache.get('key1')).toBe('value1');

        // 150ms 대기 (TTL 만료 후)
        await new Promise((resolve) => setTimeout(resolve, 150));

        expect(cache.get('key1')).toBeUndefined();
      }
    );

    it('should not expire values before TTL', () => {
      cache.set('key1', 'value1', 10000); // 10초 TTL
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('has', () => {
    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it(
      'should return false for expired keys',
      { timeout: 2000 },
      async () => {
        cache.set('key1', 'value1', 100);
        expect(cache.has('key1')).toBe(true);

        await new Promise((resolve) => setTimeout(resolve, 150));

        expect(cache.has('key1')).toBe(false);
      }
    );
  });

  describe('delete', () => {
    it('should delete values', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return false for non-existent keys', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
      expect(cache.size()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it(
      'should remove only expired entries',
      { timeout: 2000 },
      async () => {
        cache.set('key1', 'value1', 100); // 100ms TTL
        cache.set('key2', 'value2', 10000); // 10초 TTL

        await new Promise((resolve) => setTimeout(resolve, 150));

        cache.cleanup();

        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBe('value2');
        expect(cache.size()).toBe(1);
      }
    );
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });
  });
});
