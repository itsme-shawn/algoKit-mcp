/**
 * search_tags 도구 테스트
 */

import { describe, it, expect } from 'vitest';
import { searchTags, SearchTagsInputSchema } from '../../src/tools/search-tags.js';

describe('search_tags 도구', () => {
  describe('입력 스키마 검증', () => {
    it('유효한 query를 통과시켜야 함', () => {
      const validInput = {
        query: 'dp',
      };

      const result = SearchTagsInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('빈 문자열은 실패해야 함', () => {
      const invalidInput = {
        query: '',
      };

      const result = SearchTagsInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('query가 없으면 실패해야 함', () => {
      const invalidInput = {};

      const result = SearchTagsInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('도구 핸들러', () => {
    it(
      '실제 API 호출 테스트 - 한글 키워드 "다이나믹"',
      { timeout: 10000 },
      async () => {
        const input = {
          query: '다이나믹',
        };

        const result = await searchTags(input);

        expect(result).toContain('태그 검색 결과');
        expect(result).toContain('dp');
        expect(result).toContain('다이나믹 프로그래밍');
      }
    );

    it(
      '실제 API 호출 테스트 - 영문 키워드 "graph"',
      { timeout: 10000 },
      async () => {
        const input = {
          query: 'graph',
        };

        const result = await searchTags(input);

        expect(result).toContain('태그 검색 결과');
        expect(result).toContain('그래프');
      }
    );

    it(
      '실제 API 호출 테스트 - 부분 매칭 "gre"',
      { timeout: 10000 },
      async () => {
        const input = {
          query: 'gre',
        };

        const result = await searchTags(input);

        expect(result).toContain('태그 검색 결과');
        // "greedy" 태그가 포함되어야 함
        expect(result).toContain('greedy');
      }
    );

    it(
      '빈 결과 처리',
      { timeout: 10000 },
      async () => {
        const input = {
          query: 'xyznonexistenttag12345',
        };

        const result = await searchTags(input);

        expect(result).toContain('검색 결과가 없습니다');
      }
    );

    it('공백만 있는 query는 에러를 던져야 함', async () => {
      const input = {
        query: '   ',
      };

      await expect(searchTags(input)).rejects.toThrow('검색 키워드는 최소 1글자 이상이어야 합니다');
    });
  });
});
