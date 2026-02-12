/**
 * 간단한 인메모리 캐시 구현
 * TTL (Time To Live) 기반 캐싱
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * 캐시 옵션
 */
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (기본값: 1시간)
}

/**
 * 인메모리 캐시 클래스
 */
export class Cache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private defaultTtl: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.ttl || 60 * 60 * 1000; // 기본 1시간
  }

  /**
   * 캐시에 값 저장
   * @param key - 캐시 키
   * @param value - 저장할 값
   * @param ttl - TTL (밀리초, 선택사항)
   */
  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTtl);
    this.store.set(key, { value, expiresAt });
  }

  /**
   * 캐시에서 값 조회
   * @param key - 캐시 키
   * @returns 캐시된 값 또는 undefined
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    // TTL 만료 확인
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * 캐시에 키가 존재하는지 확인
   * @param key - 캐시 키
   * @returns 존재 여부
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * 캐시에서 키 삭제
   * @param key - 캐시 키
   * @returns 삭제 성공 여부
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * 캐시 전체 삭제
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 만료된 항목 정리
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * 캐시 크기 반환
   */
  size(): number {
    return this.store.size;
  }

  /**
   * 캐시 히트율 측정용 통계 (간단한 구현)
   */
  getStats(): { size: number } {
    return {
      size: this.store.size,
    };
  }
}

/**
 * 문제 상세 정보 캐시 (싱글톤)
 * TTL: 1시간 (문제 메타데이터는 자주 변경되지 않음)
 */
export const problemCache = new Cache({ ttl: 60 * 60 * 1000 });

/**
 * 검색 결과 캐시 (싱글톤)
 * TTL: 10분 (검색 결과는 상대적으로 자주 변경될 수 있음)
 */
export const searchCache = new Cache({ ttl: 10 * 60 * 1000 });
