/**
 * 캐시 통계 수집기
 *
 * 여러 캐시의 통계를 중앙에서 관리하고 보고서 생성
 */

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  capacity: number;
}

export interface AggregatedCacheStats {
  totalRequests: number;
  hitRate: number;
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  capacity: number;
}

/**
 * CacheStatsCollector 클래스
 *
 * 여러 캐시의 통계를 수집하고 관리
 */
export class CacheStatsCollector {
  private stats = new Map<string, AggregatedCacheStats>();

  /**
   * 캐시 통계 기록
   *
   * @param cacheName - 캐시 이름 (예: 'problems', 'tags')
   * @param metrics - 캐시 메트릭
   */
  record(cacheName: string, metrics: CacheMetrics): void {
    const totalRequests = metrics.hits + metrics.misses;
    const hitRate = totalRequests > 0 ? metrics.hits / totalRequests : 0;

    this.stats.set(cacheName, {
      totalRequests,
      hitRate,
      hits: metrics.hits,
      misses: metrics.misses,
      evictions: metrics.evictions,
      size: metrics.size,
      capacity: metrics.capacity,
    });
  }

  /**
   * 특정 캐시 통계 조회
   *
   * @param cacheName - 캐시 이름
   * @returns 캐시 통계 또는 undefined
   */
  get(cacheName: string): AggregatedCacheStats | undefined {
    return this.stats.get(cacheName);
  }

  /**
   * 모든 캐시 통계 조회
   *
   * @returns 모든 캐시 통계 Map
   */
  getAll(): Map<string, AggregatedCacheStats> {
    return new Map(this.stats);
  }

  /**
   * 모든 캐시 통계 초기화
   */
  reset(): void {
    this.stats.clear();
  }

  /**
   * 보고서 생성
   *
   * @returns 텍스트 형식의 통계 보고서
   */
  generateReport(): string {
    if (this.stats.size === 0) {
      return '캐시 통계가 없습니다.';
    }

    const lines: string[] = ['=== 캐시 통계 보고서 ==='];

    for (const [cacheName, stats] of this.stats.entries()) {
      lines.push('');
      lines.push(`캐시: ${cacheName}`);
      lines.push(`총 요청: ${stats.totalRequests}`);
      lines.push(
        `히트: ${stats.hits} (${(stats.hitRate * 100).toFixed(2)}%)`
      );
      lines.push(`미스: ${stats.misses}`);
      lines.push(`제거: ${stats.evictions}`);
      lines.push(`크기: ${stats.size}/${stats.capacity}`);
    }

    lines.push('');
    return lines.join('\n');
  }
}
