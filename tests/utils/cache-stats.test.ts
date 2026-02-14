/**
 * CacheStatsCollector 단위 테스트
 *
 * Test Suite:
 * 1. 기본 동작 (TC-STATS-001 ~ TC-STATS-004): 4개
 *
 * 총 4개 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CacheStatsCollector } from '../../src/utils/cache-stats.js';

/**
 * Test Suite 1: CacheStats 기본 동작 (4개)
 */
describe('CacheStatsCollector', () => {
  let collector: CacheStatsCollector;

  beforeEach(() => {
    collector = new CacheStatsCollector();
  });

  /**
   * TC-STATS-001: 통계 기록 및 조회
   */
  it('TC-STATS-001: should record and retrieve cache stats', () => {
    collector.record('problems', {
      hits: 80,
      misses: 20,
      evictions: 5,
      size: 95,
      capacity: 100,
    });

    const stats = collector.get('problems');
    expect(stats).toBeDefined();
    expect(stats!.totalRequests).toBe(100);
    expect(stats!.hitRate).toBeCloseTo(0.8);
  });

  /**
   * TC-STATS-002: 여러 캐시 통계 관리
   */
  it('TC-STATS-002: should manage multiple cache stats', () => {
    collector.record('problems', {
      hits: 80,
      misses: 20,
      evictions: 5,
      size: 95,
      capacity: 100,
    });
    collector.record('tags', {
      hits: 90,
      misses: 10,
      evictions: 0,
      size: 100,
      capacity: 100,
    });

    const all = collector.getAll();
    expect(all.size).toBe(2);
    expect(all.has('problems')).toBe(true);
    expect(all.has('tags')).toBe(true);
  });

  /**
   * TC-STATS-003: 보고서 생성
   */
  it('TC-STATS-003: should generate report', () => {
    collector.record('problems', {
      hits: 80,
      misses: 20,
      evictions: 5,
      size: 95,
      capacity: 100,
    });

    const report = collector.generateReport();
    expect(report).toContain('캐시: problems');
    expect(report).toContain('총 요청: 100');
    expect(report).toContain('히트: 80');
    expect(report).toContain('제거: 5');
  });

  /**
   * TC-STATS-004: reset() 메서드
   */
  it('TC-STATS-004: should reset all stats', () => {
    collector.record('problems', {
      hits: 80,
      misses: 20,
      evictions: 5,
      size: 95,
      capacity: 100,
    });
    collector.reset();

    const all = collector.getAll();
    expect(all.size).toBe(0);
  });
});
