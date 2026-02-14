/**
 * ReviewTemplateGenerator 서비스 테스트 (Prompt-based Architecture)
 *
 * 테스트 범위:
 * - 기본 템플릿 생성 (구조, 필드, 마크다운)
 * - 마크다운 템플릿 내용 (섹션 존재 여부)
 * - hint_guide 포함 여부
 * - 관련 문제 추천
 * - Edge Cases (태그 없음, 관련 문제 없음, userNotes)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReviewTemplateGenerator } from '../../src/services/review-template-generator.js';
import { ProblemAnalyzer } from '../../src/services/problem-analyzer.js';
import type { SolvedAcClient } from '../../src/api/solvedac-client.js';
import {
  mockProblem1000,
  mockProblem1927,
  mockProblem11053,
} from '../__mocks__/solved-ac-responses.js';
import type { Problem } from '../../src/api/types.js';

describe('ReviewTemplateGenerator (Prompt-based)', () => {
  let generator: ReviewTemplateGenerator;
  let mockApiClient: {
    getProblem: ReturnType<typeof vi.fn>;
    searchProblems: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock API 클라이언트 생성
    mockApiClient = {
      getProblem: vi.fn(),
      searchProblems: vi.fn(),
    };

    // ProblemAnalyzer 생성 (Mock API 주입)
    const analyzer = new ProblemAnalyzer(
      mockApiClient as unknown as SolvedAcClient,
    );

    // ReviewTemplateGenerator 생성 (analyzer만 필요)
    generator = new ReviewTemplateGenerator(analyzer);
  });

  describe('1. 기본 템플릿 생성', () => {
    it('반환 구조: template, problem_data, related_problems, hint_guide 존재', async () => {
      // Given: Silver I 문제
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When
      const result = await generator.generate(1927);

      // Then: ReviewTemplate 인터페이스 검증
      expect(result).toHaveProperty('template');
      expect(result).toHaveProperty('problem_data');
      expect(result).toHaveProperty('related_problems');
      expect(result).toHaveProperty('hint_guide');
    });

    it('template이 문자열이고 문제번호/제목 포함', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When
      const result = await generator.generate(1927);

      // Then
      expect(typeof result.template).toBe('string');
      expect(result.template.length).toBeGreaterThan(0);
      expect(result.template).toContain('1927');
      expect(result.template).toContain('최소 힙');
    });

    it('problem_data에 id, title, tier, tags, stats 존재', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When
      const result = await generator.generate(1927);

      // Then: problem_data 필드 검증
      expect(result.problem_data).toHaveProperty('id');
      expect(result.problem_data).toHaveProperty('title');
      expect(result.problem_data).toHaveProperty('tier');
      expect(result.problem_data).toHaveProperty('tags');
      expect(result.problem_data).toHaveProperty('stats');

      expect(result.problem_data.id).toBe(1927);
      expect(result.problem_data.title).toBe('최소 힙');
      expect(result.problem_data.stats).toHaveProperty('acceptedUserCount');
      expect(result.problem_data.stats).toHaveProperty('averageTries');
      expect(result.problem_data.stats.acceptedUserCount).toBe(50000);
      expect(result.problem_data.stats.averageTries).toBe(2.5);
    });
  });

  describe('2. 마크다운 템플릿 내용', () => {
    it('"## 문제 정보" 섹션 존재', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When
      const result = await generator.generate(1927);

      // Then
      expect(result.template).toContain('## 문제 정보');
      expect(result.template).toContain('티어');
      expect(result.template).toContain('태그');
      expect(result.template).toContain('링크');
      expect(result.template).toContain('해결자 수');
      expect(result.template).toContain('평균 시도');
    });

    it('"## 풀이 접근법" 섹션 존재', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When
      const result = await generator.generate(1927);

      // Then
      expect(result.template).toContain('## 풀이 접근법');
    });

    it('userNotes 전달 시 "## 초기 메모" 섹션 포함', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });
      const userNotes = '우선순위 큐를 사용해서 풀었습니다.';

      // When
      const result = await generator.generate(1927, userNotes);

      // Then
      expect(result.template).toContain('## 초기 메모');
      expect(result.template).toContain(userNotes);
    });
  });

  describe('3. hint_guide 포함', () => {
    it('hint_guide가 ProblemAnalyzer의 결과와 동일', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When
      const result = await generator.generate(1927);

      // Then: HintGuide 구조 검증
      expect(result.hint_guide).toBeDefined();
      expect(result.hint_guide).toHaveProperty('context');
      expect(result.hint_guide).toHaveProperty('hint_levels');
      expect(result.hint_guide).toHaveProperty('review_prompts');

      expect(Array.isArray(result.hint_guide.hint_levels)).toBe(true);
      expect(result.hint_guide.hint_levels.length).toBe(3);
    });

    it('review_prompts 5개 필드 존재', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When
      const result = await generator.generate(1927);

      // Then: ReviewPrompts 필드 검증
      expect(result.hint_guide.review_prompts).toHaveProperty(
        'solution_approach',
      );
      expect(result.hint_guide.review_prompts).toHaveProperty(
        'time_complexity',
      );
      expect(result.hint_guide.review_prompts).toHaveProperty(
        'space_complexity',
      );
      expect(result.hint_guide.review_prompts).toHaveProperty('key_insights');
      expect(result.hint_guide.review_prompts).toHaveProperty('difficulties');

      // 각 프롬프트가 문자열인지 검증
      expect(
        typeof result.hint_guide.review_prompts.solution_approach,
      ).toBe('string');
      expect(typeof result.hint_guide.review_prompts.time_complexity).toBe(
        'string',
      );
      expect(typeof result.hint_guide.review_prompts.space_complexity).toBe(
        'string',
      );
      expect(typeof result.hint_guide.review_prompts.key_insights).toBe(
        'string',
      );
      expect(typeof result.hint_guide.review_prompts.difficulties).toBe(
        'string',
      );
    });
  });

  describe('4. 관련 문제', () => {
    it('유사 문제 있을 때: related_problems 배열에 포함', async () => {
      // Given: 유사 문제 있음
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 2,
        items: [
          {
            ...mockProblem1927,
            problemId: 11279,
            titleKo: '최대 힙',
          },
          {
            ...mockProblem1927,
            problemId: 1655,
            titleKo: '가운데를 말해요',
          },
        ],
      });

      // When
      const result = await generator.generate(1927);

      // Then
      expect(result.related_problems).toBeDefined();
      expect(Array.isArray(result.related_problems)).toBe(true);
      expect(result.related_problems.length).toBeGreaterThan(0);
      expect(result.related_problems[0].problemId).toBe(11279);
      expect(result.related_problems[0].titleKo).toBe('최대 힙');

      // 템플릿에도 포함되어 있는지 확인
      expect(result.template).toContain('11279');
      expect(result.template).toContain('최대 힙');
    });

    it('유사 문제 없을 때: 빈 배열', async () => {
      // Given: 유사 문제 없음
      mockApiClient.getProblem.mockResolvedValue(mockProblem1000);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When
      const result = await generator.generate(1000);

      // Then
      expect(result.related_problems).toBeDefined();
      expect(Array.isArray(result.related_problems)).toBe(true);
      expect(result.related_problems.length).toBe(0);

      // 템플릿에 "관련 문제 없음" 메시지 포함
      expect(result.template).toMatch(
        /관련 문제를 찾을 수 없습니다|관련 문제 없음/,
      );
    });
  });

  describe('5. Edge Cases', () => {
    it('태그 없는 문제: tags 빈 배열 처리', async () => {
      // Given: 태그 없는 문제
      const mockNoTagProblem: Problem = {
        ...mockProblem1000,
        tags: [],
      };
      mockApiClient.getProblem.mockResolvedValue(mockNoTagProblem);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When
      const result = await generator.generate(1000);

      // Then: 에러 발생하지 않음
      expect(result).toBeDefined();
      expect(result.problem_data.tags).toBeDefined();
      expect(Array.isArray(result.problem_data.tags)).toBe(true);
      expect(result.problem_data.tags.length).toBe(0);

      // 템플릿에 "태그 정보 없음" 메시지 포함
      expect(result.template).toContain('태그 정보 없음');
    });

    it('userNotes 없는 경우: "초기 메모" 섹션 미포함', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
      });

      // When: userNotes 없이 호출
      const result = await generator.generate(1927);

      // Then: "초기 메모" 섹션이 없어야 함
      expect(result.template).not.toContain('## 초기 메모');
    });
  });

  describe('추가: 복잡한 시나리오', () => {
    it('DP 문제: 태그 및 프롬프트 검증', async () => {
      // Given: DP 문제
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 1,
        items: [
          {
            ...mockProblem11053,
            problemId: 11054,
            titleKo: '가장 긴 바이토닉 부분 수열',
          },
        ],
      });

      // When
      const result = await generator.generate(11053);

      // Then
      expect(result.problem_data.id).toBe(11053);
      expect(result.problem_data.title).toBe('가장 긴 증가하는 부분 수열');
      expect(result.problem_data.tags).toContain('다이나믹 프로그래밍');

      // hint_guide 검증
      expect(result.hint_guide.context).toBeDefined();
      expect(result.hint_guide.hint_levels.length).toBe(3);

      // related_problems 검증
      expect(result.related_problems.length).toBe(1);
      expect(result.related_problems[0].problemId).toBe(11054);
    });

    it('마크다운 링크 형식 검증', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 1,
        items: [
          {
            ...mockProblem1927,
            problemId: 11279,
            titleKo: '최대 힙',
          },
        ],
      });

      // When
      const result = await generator.generate(1927);

      // Then: 문제 링크 형식 검증
      expect(result.template).toMatch(
        /\[BOJ \d+\]\(https:\/\/www\.acmicpc\.net\/problem\/\d+\)/,
      );

      // 관련 문제 링크 형식 검증
      expect(result.template).toMatch(
        /\[\d+\..+\]\(https:\/\/www\.acmicpc\.net\/problem\/\d+\)/,
      );
    });
  });
});
