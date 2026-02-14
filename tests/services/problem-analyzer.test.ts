/**
 * ProblemAnalyzer 서비스 테스트 (프롬프트 기반 아키텍처)
 *
 * 테스트 범위:
 * - 기본 분석 (문제 데이터, 난이도, 태그, 유사 문제)
 * - 힌트 가이드 구조 (3단계 레벨, 라벨, 프롬프트)
 * - 템플릿 변수 치환 (problemId, problemTitle, tags, tier 등)
 * - 컨텍스트 요약
 * - 유사 문제 검색 로직
 * - 난이도 컨텍스트 (백분위 계산)
 * - 결정적 출력 (같은 입력 → 같은 출력)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProblemAnalyzer } from '../../src/services/problem-analyzer.js';
import type { SolvedAcClient } from '../../src/api/solvedac-client.js';
import {
  mockProblem1000,
  mockProblem1927,
  mockProblem11053,
  mockSearchResult,
} from '../__mocks__/solved-ac-responses.js';
import type { Problem } from '../../src/api/types.js';

describe('ProblemAnalyzer (프롬프트 기반)', () => {
  let analyzer: ProblemAnalyzer;
  let mockApiClient: {
    getProblem: ReturnType<typeof vi.fn>;
    searchProblems: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockApiClient = {
      getProblem: vi.fn(),
      searchProblems: vi.fn(),
    };
    analyzer = new ProblemAnalyzer(mockApiClient as unknown as SolvedAcClient);
  });

  describe('1. 기본 분석', () => {
    it('DP 문제 분석 (mockProblem11053, level 14, Gold II, dp tag)', async () => {
      // Given: DP 문제 데이터
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });

      // When: 문제 분석
      const analysis = await analyzer.analyze(11053, false);

      // Then: 반환 구조 검증
      expect(analysis).toHaveProperty('problem');
      expect(analysis).toHaveProperty('difficulty');
      expect(analysis).toHaveProperty('tags');
      expect(analysis).toHaveProperty('similar_problems');
      expect(analysis).toHaveProperty('hint_guide');

      // problem 검증
      expect(analysis.problem.problemId).toBe(11053);
      expect(analysis.problem.titleKo).toBe('가장 긴 증가하는 부분 수열');

      // difficulty 검증
      expect(analysis.difficulty.tier).toBe('Gold II');
      expect(analysis.difficulty.level).toBe(14);
      expect(analysis.difficulty.emoji).toBe('🟡');

      // tags 검증
      expect(analysis.tags).toHaveLength(1);
      expect(analysis.tags[0].key).toBe('dp');
      expect(analysis.tags[0].name_ko).toBe('다이나믹 프로그래밍');
    });

    it('입문 문제 분석 (mockProblem1000, level 1, Bronze V, math+implementation)', async () => {
      // Given: 입문 문제 데이터
      mockApiClient.getProblem.mockResolvedValue(mockProblem1000);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });

      // When: 문제 분석
      const analysis = await analyzer.analyze(1000, false);

      // Then: difficulty 검증
      expect(analysis.difficulty.tier).toBe('Bronze V');
      expect(analysis.difficulty.level).toBe(1);
      expect(analysis.difficulty.emoji).toBe('🟤');
      expect(analysis.difficulty.percentile).toBe('입문');

      // tags 검증 (2개)
      expect(analysis.tags).toHaveLength(2);
      expect(analysis.tags.map(t => t.key)).toContain('math');
      expect(analysis.tags.map(t => t.key)).toContain('implementation');
    });

    it('Silver 문제 분석 (mockProblem1927, level 10, Silver I, data_structures+priority_queue)', async () => {
      // Given: Silver 문제 데이터
      mockApiClient.getProblem.mockResolvedValue(mockProblem1927);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });

      // When: 문제 분석
      const analysis = await analyzer.analyze(1927, false);

      // Then: difficulty 검증
      expect(analysis.difficulty.tier).toBe('Silver I');
      expect(analysis.difficulty.level).toBe(10);
      expect(analysis.difficulty.emoji).toBe('⚪');

      // tags 검증 (2개)
      expect(analysis.tags).toHaveLength(2);
      expect(analysis.tags.map(t => t.key)).toContain('data_structures');
      expect(analysis.tags.map(t => t.key)).toContain('priority_queue');
    });
  });

  describe('2. 힌트 가이드 구조', () => {
    beforeEach(() => {
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });
    });

    it('hint_guide.hint_levels가 3개 레벨 모두 존재', async () => {
      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      expect(analysis.hint_guide.hint_levels).toHaveLength(3);
      expect(analysis.hint_guide.hint_levels.map(h => h.level)).toEqual([1, 2, 3]);
    });

    it('hint_levels[0].level=1, label="패턴 인식"', async () => {
      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      const level1 = analysis.hint_guide.hint_levels[0];
      expect(level1.level).toBe(1);
      expect(level1.label).toBe('패턴 인식');
      expect(level1.prompt).toBeTruthy();
      expect(level1.prompt.length).toBeGreaterThan(0);
    });

    it('hint_levels[1].level=2, label="핵심 통찰"', async () => {
      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      const level2 = analysis.hint_guide.hint_levels[1];
      expect(level2.level).toBe(2);
      expect(level2.label).toBe('핵심 통찰');
      expect(level2.prompt).toBeTruthy();
      expect(level2.prompt.length).toBeGreaterThan(0);
    });

    it('hint_levels[2].level=3, label="풀이 전략"', async () => {
      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      const level3 = analysis.hint_guide.hint_levels[2];
      expect(level3.level).toBe(3);
      expect(level3.label).toBe('풀이 전략');
      expect(level3.prompt).toBeTruthy();
      expect(level3.prompt.length).toBeGreaterThan(0);
    });
  });

  describe('3. 템플릿 변수 치환', () => {
    beforeEach(() => {
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });
    });

    it('Level 1 프롬프트에 problemId, problemTitle 포함', async () => {
      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      const level1Prompt = analysis.hint_guide.hint_levels[0].prompt;
      expect(level1Prompt).toContain('11053');
      expect(level1Prompt).toContain('가장 긴 증가하는 부분 수열');
    });

    it('Level 2 프롬프트에 tags(한글) 포함', async () => {
      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      const level2Prompt = analysis.hint_guide.hint_levels[1].prompt;
      expect(level2Prompt).toContain('다이나믹 프로그래밍');
    });

    it('미치환 변수 없음: /\\{\\w+\\}/ 패턴이 남아있지 않은지 확인', async () => {
      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then: 모든 힌트 레벨 프롬프트 검증
      analysis.hint_guide.hint_levels.forEach(hintLevel => {
        expect(hintLevel.prompt).not.toMatch(/\{\w+\}/);
      });

      // context 검증
      expect(analysis.hint_guide.context).not.toMatch(/\{\w+\}/);

      // review_prompts 검증
      Object.values(analysis.hint_guide.review_prompts).forEach(prompt => {
        expect(prompt).not.toMatch(/\{\w+\}/);
      });
    });
  });

  describe('4. 컨텍스트 요약', () => {
    beforeEach(() => {
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });
    });

    it('hint_guide.context에 문제번호, 제목, 티어 포함', async () => {
      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      const context = analysis.hint_guide.context;
      expect(context).toContain('11053');
      expect(context).toContain('가장 긴 증가하는 부분 수열');
      expect(context).toContain('Gold II');
      expect(context).toContain('🟡');
    });

    it('hint_guide.review_prompts 5개 필드 모두 존재', async () => {
      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      const reviewPrompts = analysis.hint_guide.review_prompts;
      expect(reviewPrompts).toHaveProperty('solution_approach');
      expect(reviewPrompts).toHaveProperty('time_complexity');
      expect(reviewPrompts).toHaveProperty('space_complexity');
      expect(reviewPrompts).toHaveProperty('key_insights');
      expect(reviewPrompts).toHaveProperty('difficulties');

      // 모든 프롬프트가 비어있지 않은지 확인
      Object.values(reviewPrompts).forEach(prompt => {
        expect(prompt).toBeTruthy();
        expect(prompt.length).toBeGreaterThan(0);
      });
    });
  });

  describe('5. 유사 문제', () => {
    it('includeSimilar=true: searchProblems 호출됨', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 3,
        items: [
          { ...mockProblem11053, problemId: 2579, titleKo: '계단 오르기' },
          { ...mockProblem11053, problemId: 1003, titleKo: '피보나치 함수' },
        ],
        page: 1,
      });

      // When
      const analysis = await analyzer.analyze(11053, true);

      // Then
      expect(mockApiClient.searchProblems).toHaveBeenCalled();
      expect(analysis.similar_problems).toHaveLength(2);
      expect(analysis.similar_problems.map(p => p.problemId)).toContain(2579);
      expect(analysis.similar_problems.map(p => p.problemId)).toContain(1003);
    });

    it('includeSimilar=false: searchProblems 호출 안 됨', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });

      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      expect(mockApiClient.searchProblems).not.toHaveBeenCalled();
      expect(analysis.similar_problems).toEqual([]);
    });

    it('API 에러 시 빈 배열 반환', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockRejectedValue(new Error('API Error'));

      // When
      const analysis = await analyzer.analyze(11053, true);

      // Then: 에러가 던져지지 않고 빈 배열 반환
      expect(analysis.similar_problems).toEqual([]);
    });
  });

  describe('6. 난이도 컨텍스트', () => {
    it('Bronze (level 1): percentile="입문"', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem1000);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });

      // When
      const analysis = await analyzer.analyze(1000, false);

      // Then
      expect(analysis.difficulty.level).toBe(1);
      expect(analysis.difficulty.tier).toBe('Bronze V');
      expect(analysis.difficulty.percentile).toBe('입문');
    });

    it('Gold (level 14): percentile="중급 (상위 40-60%)"', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });

      // When
      const analysis = await analyzer.analyze(11053, false);

      // Then
      expect(analysis.difficulty.level).toBe(14);
      expect(analysis.difficulty.tier).toBe('Gold II');
      expect(analysis.difficulty.percentile).toBe('중급 (상위 40-60%)');
    });

    it('Diamond (level 22): percentile="고급 (상위 3-10%)"', async () => {
      // Given: Diamond IV 문제
      const mockDiamondProblem: Problem = {
        ...mockProblem11053,
        problemId: 1017,
        titleKo: '소수 쌍',
        level: 22, // Diamond IV (21-25: V-IV-III-II-I)
        tags: [
          {
            key: 'number_theory',
            displayNames: [{ language: 'ko', name: '정수론' }],
            problemCount: 500,
          },
        ],
        acceptedUserCount: 5000,
        averageTries: 6.5,
      };
      mockApiClient.getProblem.mockResolvedValue(mockDiamondProblem);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });

      // When
      const analysis = await analyzer.analyze(1017, false);

      // Then
      expect(analysis.difficulty.level).toBe(22);
      expect(analysis.difficulty.tier).toBe('Diamond IV');
      expect(analysis.difficulty.percentile).toBe('고급 (상위 3-10%)');
    });
  });

  describe('7. 결정적 출력', () => {
    it('같은 입력 → 같은 hint_guide 출력 (2번 호출 비교)', async () => {
      // Given
      mockApiClient.getProblem.mockResolvedValue(mockProblem11053);
      mockApiClient.searchProblems.mockResolvedValue({
        count: 0,
        items: [],
        page: 1,
      });

      // When: 동일한 문제를 2번 분석
      const analysis1 = await analyzer.analyze(11053, false);
      const analysis2 = await analyzer.analyze(11053, false);

      // Then: hint_guide가 완전히 동일
      expect(analysis1.hint_guide).toEqual(analysis2.hint_guide);
      expect(analysis1.hint_guide.context).toBe(analysis2.hint_guide.context);
      expect(analysis1.hint_guide.hint_levels).toEqual(
        analysis2.hint_guide.hint_levels,
      );
      expect(analysis1.hint_guide.review_prompts).toEqual(
        analysis2.hint_guide.review_prompts,
      );
    });
  });
});
