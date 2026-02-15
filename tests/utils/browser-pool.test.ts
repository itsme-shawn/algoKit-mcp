/**
 * BrowserPool 단위 테스트
 *
 * Phase 7 - Task 7.1: Puppeteer 설치 및 BrowserPool 구현
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserPool } from '../../src/utils/browser-pool.js';

describe('BrowserPool', () => {
  let pool: BrowserPool;

  beforeEach(() => {
    // 각 테스트 전 싱글톤 초기화
    BrowserPool.resetInstance();
    pool = BrowserPool.getInstance({ maxSize: 2, timeout: 5000 });
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    await pool.closeAll();
    BrowserPool.resetInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const pool1 = BrowserPool.getInstance();
      const pool2 = BrowserPool.getInstance();

      expect(pool1).toBe(pool2);
    });

    it('should accept options on first call', () => {
      BrowserPool.resetInstance();
      const pool = BrowserPool.getInstance({ maxSize: 3 });
      const status = pool.getStatus();

      expect(status.total).toBe(0); // 아직 브라우저 생성 안 됨
    });
  });

  describe('acquire', () => {
    it('should create browser instance on first acquire', async () => {
      const browser = await pool.acquire();

      expect(browser).toBeDefined();
      expect(browser.isConnected()).toBe(true);

      await pool.release(browser);
    });

    it('should reuse existing browser instance', async () => {
      const browser1 = await pool.acquire();
      await pool.release(browser1);

      const browser2 = await pool.acquire();
      expect(browser2).toBe(browser1); // 동일 인스턴스 재사용

      await pool.release(browser2);
    });

    it('should create multiple browsers up to maxSize', async () => {
      const browser1 = await pool.acquire();
      const browser2 = await pool.acquire();

      const status = pool.getStatus();
      expect(status.total).toBe(2);
      expect(status.active).toBe(2);

      await pool.release(browser1);
      await pool.release(browser2);
    });

    it('should throw timeout error when pool is full', async () => {
      BrowserPool.resetInstance();
      const pool = BrowserPool.getInstance({ maxSize: 1, timeout: 1000 });
      const browser1 = await pool.acquire();

      // 두 번째 요청은 타임아웃
      await expect(pool.acquire()).rejects.toThrow('Browser acquire timeout');

      await pool.release(browser1);
    }, 10000);

    it('should restart browser after threshold', async () => {
      BrowserPool.resetInstance();
      const pool = BrowserPool.getInstance({
        maxSize: 1,
        restartThreshold: 2,
      });

      const browser1 = await pool.acquire();
      await pool.release(browser1);

      // 2회 사용 (재시작 발동)
      const browser2 = await pool.acquire();
      expect(browser2).not.toBe(browser1); // 재시작으로 새 인스턴스

      await pool.release(browser2);
    }, 15000);
  });

  describe('release', () => {
    it('should release browser back to pool', async () => {
      const browser = await pool.acquire();
      await pool.release(browser);

      const status = pool.getStatus();
      expect(status.total).toBe(1);
      expect(status.active).toBe(1);
    });

    it('should pass browser to waiting acquire', async () => {
      BrowserPool.resetInstance();
      const pool = BrowserPool.getInstance({ maxSize: 1 });
      const browser1 = await pool.acquire();

      // 두 번째 요청 (대기)
      const acquirePromise = pool.acquire();

      // 첫 브라우저 반환
      await pool.release(browser1);

      // 대기 중인 요청이 즉시 받아야 함
      const browser2 = await acquirePromise;
      expect(browser2).toBe(browser1);

      await pool.release(browser2);
    }, 10000);
  });

  describe('closeAll', () => {
    it('should close all browser instances', async () => {
      const browser1 = await pool.acquire();
      const browser2 = await pool.acquire();

      await pool.closeAll();

      expect(browser1.isConnected()).toBe(false);
      expect(browser2.isConnected()).toBe(false);

      const status = pool.getStatus();
      expect(status.total).toBe(0);
    });

    it('should reject waiting acquire requests', async () => {
      BrowserPool.resetInstance();
      const pool = BrowserPool.getInstance({ maxSize: 1 });
      await pool.acquire();

      // 대기 중인 요청
      const acquirePromise = pool.acquire();

      // rejection handler를 먼저 등록하여 unhandled rejection 방지
      const rejectionCheck = expect(acquirePromise).rejects.toThrow(
        'BrowserPool is closing'
      );

      // 풀 닫기
      await pool.closeAll();

      // 대기 중인 요청 거부 확인
      await rejectionCheck;
    }, 10000);
  });

  describe('getStatus', () => {
    it('should return correct pool status', async () => {
      const browser1 = await pool.acquire();
      const browser2 = await pool.acquire();

      const status = pool.getStatus();
      expect(status.total).toBe(2);
      expect(status.active).toBe(2);
      expect(status.waiting).toBe(0);

      await pool.release(browser1);
      await pool.release(browser2);
    });

    it('should track waiting requests', async () => {
      BrowserPool.resetInstance();
      const pool = BrowserPool.getInstance({ maxSize: 1, timeout: 2000 });
      await pool.acquire();

      // 대기 중인 요청
      const acquirePromise = pool.acquire();

      const status = pool.getStatus();
      expect(status.waiting).toBe(1);

      // rejection handler를 먼저 등록하여 unhandled rejection 방지
      const rejectionCheck = expect(acquirePromise).rejects.toThrow();

      // 정리
      await pool.closeAll();
      await rejectionCheck;
    }, 10000);
  });
});
