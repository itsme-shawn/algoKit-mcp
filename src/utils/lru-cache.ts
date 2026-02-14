/**
 * LRU (Least Recently Used) 캐시 구현
 *
 * 특징:
 * - Doubly Linked List + Map으로 O(1) 조회/삽입/제거
 * - TTL 기반 만료 처리
 * - 캐시 통계 수집 (hits, misses, evictions)
 * - 제네릭 타입 지원
 *
 * 알고리즘:
 * - Head: 가장 최근 사용된 항목
 * - Tail: 가장 오래된 항목 (제거 대상)
 * - get() 또는 set() 시 항목을 Head로 이동
 * - 용량 초과 시 Tail 제거 (LRU eviction)
 */

export interface CacheNode<K, V> {
  key: K;
  value: V;
  expiresAt: number; // timestamp (ms)
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  size: number;
  capacity: number;
}

/**
 * LRUCache 클래스
 *
 * @template K - 키 타입
 * @template V - 값 타입
 */
export class LRUCache<K, V> {
  private cache = new Map<K, CacheNode<K, V>>();
  private head: CacheNode<K, V> | null = null;
  private tail: CacheNode<K, V> | null = null;
  private capacity: number;
  private defaultTtl: number;

  // 통계
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  /**
   * LRUCache 생성자
   *
   * @param capacity - 최대 항목 수 (기본 100)
   * @param defaultTtl - 기본 TTL (밀리초, 기본 1시간)
   * @throws {Error} capacity가 0 이하인 경우
   */
  constructor(capacity: number = 100, defaultTtl: number = 3600000) {
    if (capacity <= 0) {
      throw new Error('Capacity must be positive');
    }
    this.capacity = capacity;
    this.defaultTtl = defaultTtl;
  }

  /**
   * 값 저장 또는 업데이트
   *
   * @param key - 저장할 키
   * @param value - 저장할 값
   * @param ttl - TTL (밀리초, 선택사항)
   */
  set(key: K, value: V, ttl?: number): void {
    const existingNode = this.cache.get(key);

    // TTL 계산 (음수는 기본 TTL 사용)
    const effectiveTtl = ttl !== undefined && ttl >= 0 ? ttl : this.defaultTtl;
    const expiresAt = Date.now() + effectiveTtl;

    if (existingNode) {
      // 기존 노드 업데이트
      existingNode.value = value;
      existingNode.expiresAt = expiresAt;
      this.moveToHead(existingNode);
    } else {
      // 새 노드 생성
      const newNode: CacheNode<K, V> = {
        key,
        value,
        expiresAt,
        prev: null,
        next: null,
      };

      this.cache.set(key, newNode);
      this.addToHead(newNode);

      // 용량 초과 시 LRU 제거
      if (this.cache.size > this.capacity) {
        this.evictLRU();
      }
    }
  }

  /**
   * 값 조회
   *
   * @param key - 조회할 키
   * @returns 캐시된 값 또는 undefined (미스 또는 만료)
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.stats.misses++;
      return undefined;
    }

    // TTL 확인
    if (Date.now() > node.expiresAt) {
      this.removeNode(node);
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // 최근 사용 항목으로 이동
    this.moveToHead(node);
    this.stats.hits++;
    return node.value;
  }

  /**
   * 키 존재 여부 확인
   *
   * @param key - 확인할 키
   * @returns 키가 존재하고 만료되지 않았으면 true
   */
  has(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    // TTL 확인
    if (Date.now() > node.expiresAt) {
      this.removeNode(node);
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 키 삭제
   *
   * @param key - 삭제할 키
   * @returns 삭제 성공 시 true, 키가 없으면 false
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  /**
   * 캐시 전체 삭제 및 통계 초기화
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * 캐시 크기 조회
   *
   * @returns 현재 캐시 항목 수
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 캐시 통계 조회
   *
   * @returns 캐시 통계 (hits, misses, evictions, hitRate)
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate,
      size: this.cache.size,
      capacity: this.capacity,
    };
  }

  /**
   * 만료된 항목 일괄 제거
   */
  cleanup(): void {
    const now = Date.now();
    const keysToRemove: K[] = [];

    for (const [key, node] of this.cache.entries()) {
      if (now > node.expiresAt) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      const node = this.cache.get(key);
      if (node) {
        this.removeNode(node);
        this.cache.delete(key);
      }
    }
  }

  // ========== 내부 메서드 (Doubly Linked List 관리) ==========

  /**
   * 노드를 Head로 이동 (최근 사용됨)
   *
   * @param node - 이동할 노드
   */
  private moveToHead(node: CacheNode<K, V>): void {
    if (node === this.head) return;

    // 기존 위치에서 제거
    this.removeNode(node);

    // Head로 이동
    this.addToHead(node);
  }

  /**
   * 노드를 Head에 추가
   *
   * @param node - 추가할 노드
   */
  private addToHead(node: CacheNode<K, V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * 노드를 Linked List에서 제거
   *
   * @param node - 제거할 노드
   */
  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // node가 head인 경우
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // node가 tail인 경우
      this.tail = node.prev;
    }
  }

  /**
   * LRU 제거 (Tail 제거)
   */
  private evictLRU(): void {
    if (!this.tail) return;

    const node = this.tail;
    this.removeNode(node);
    this.cache.delete(node.key);
    this.stats.evictions++;
  }
}
