/**
 * analyze_problem_boj 도구 테스트 (Keyless Architecture)
 *
 * 테스트 범위:
 * - Happy Path
 * - Zod 스키마 검증
 * - 에러 처리
 * - 출력 형식
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyzeProblemBOJInputSchema, analyzeProblemBOJTool } from '../../../src/tools/boj/analyze-problem-boj.js';
import type { ProblemAnalyzer } from '../../../src/services/problem-analyzer.js';
import { ProblemNotFoundError } from '../../../src/api/types.js';

describe('analyze_problem_boj 도구 (Keyless)', () => {
  describe('TC-KL-3.3~3.5: Zod 스키마 검증', () => {
    it('TC-KL-3.3: problem_id 양수 검증', () => {
      // Given: 유효한 입력
      const validInput = {
        problem_id: 1927,
        include_similar: true,
      };

      // When
      const result = AnalyzeProblemBOJInputSchema.safeParse(validInput);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.problem_id).toBe(1927);
        expect(result.data.include_similar).toBe(true);
      }
    });

    it('TC-KL-3.3: problem_id 0은 거부', () => {
      // Given
      const invalidInput = {
        problem_id: 0,
      };

      // When
      const result = AnalyzeProblemBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('TC-KL-3.3: problem_id 음수 거부', () => {
      // Given
      const invalidInput = {
        problem_id: -100,
      };

      // When
      const result = AnalyzeProblemBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('TC-KL-3.4: problem_id 타입 검증 (문자열 거부)', () => {
      // Given
      const invalidInput = {
        problem_id: '1927' as unknown as number,
      };

      // When
      const result = AnalyzeProblemBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('TC-KL-3.5: include_similar boolean 검증', () => {
      // Given: include_similar가 boolean이 아님
      const invalidInput = {
        problem_id: 1927,
        include_similar: 'yes' as unknown as boolean,
      };

      // When
      const result = AnalyzeProblemBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('include_similar 기본값 검증', () => {
      // Given: include_similar 생략
      const input = {
        problem_id: 1927,
      };

      // When
      const result = AnalyzeProblemBOJInputSchema.safeParse(input);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include_similar).toBe(true); // 기본값
      }
    });
  });

  describe('스키마 추가 검증', () => {
    it('problem_id 필수 필드 검증', () => {
      // Given: problem_id 누락
      const invalidInput = {
        include_similar: true,
      };

      // When
      const result = AnalyzeProblemBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('problem_id가 정수가 아니면 거부', () => {
      // Given
      const invalidInput = {
        problem_id: 1927.5,
      };

      // When
      const result = AnalyzeProblemBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('추가 필드는 무시', () => {
      // Given
      const inputWithExtra = {
        problem_id: 1927,
        include_similar: false,
        extra_field: 'ignored',
      };

      // When
      const result = AnalyzeProblemBOJInputSchema.safeParse(inputWithExtra);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('extra_field');
      }
    });
  });
});

/**
 * 통합 테스트
 */
describe('analyze_problem_boj 도구 핸들러', () => {
  let mockAnalyzer: {
    analyze: ReturnType<typeof vi.fn>;
  };
  let tool: ReturnType<typeof analyzeProblemBOJTool>;

  beforeEach(() => {
    mockAnalyzer = {
      analyze: vi.fn(),
    };
    tool = analyzeProblemBOJTool(mockAnalyzer as unknown as ProblemAnalyzer);
  });

  // TC-KL-3.1~3.2: Happy Path
  it('TC-KL-3.1: 정상 분석 (include_similar=true)', async () => {
    // Given
    const mockAnalysis = {
      problem: {
        id: 1927,
        title: '최소 힙',
        tier: 'Silver I',
        tier_emoji: '🟡',
      },
      difficulty: {
        tier: 'Silver I',
        level: 10,
        percentile: 'Top 25%',
        tier_emoji: '🟡',
      },
      tags: [
        {
          key: 'priority_queue',
          name_ko: '우선순위 큐',
          name_en: 'Priority Queue',
          description: '우선순위 큐는 각 요소가 우선순위를 가지는 자료구조입니다.',
        },
      ],
      hint_guide: {
        context: '최소 힙을 사용하여 최솟값을 빠르게 찾는 문제입니다.',
        hint_levels: [
          { level: 1, label: '문제 분석', prompt: '입출력 예시를 살펴보세요.' },
          { level: 2, label: '핵심 아이디어', prompt: '힙 자료구조의 특성을 생각해보세요.' },
          { level: 3, label: '상세 풀이', prompt: '우선순위 큐를 사용하세요.' },
        ],
        review_prompts: {
          solution_approach: '어떤 알고리즘을 사용했나요?',
          time_complexity: '시간 복잡도는 얼마인가요?',
        },
      },
      similar_problems: [
        { id: 11279, title: '최대 힙', tier: 'Silver I' },
      ],
    };
    mockAnalyzer.analyze.mockResolvedValue(mockAnalysis);

    // When
    const result = await tool.handler({ problem_id: 1927, include_similar: true });

    // Then
    expect(result.type).toBe('text');
    const analysis = JSON.parse(result.text);
    expect(analysis).toHaveProperty('problem');
    expect(analysis).toHaveProperty('similar_problems');
    expect(analysis.similar_problems).toHaveLength(1);
    expect(mockAnalyzer.analyze).toHaveBeenCalledWith(1927, true);
  });

  it('TC-KL-3.2: 정상 분석 (include_similar=false)', async () => {
    // Given
    const mockAnalysis = {
      problem: { id: 1927, title: '최소 힙', tier: 'Silver I', tier_emoji: '🟡' },
      difficulty: { tier: 'Silver I', level: 10, percentile: 'Top 25%', tier_emoji: '🟡' },
      tags: [],
      hint_guide: {
        context: '최소 힙 문제',
        hint_levels: [],
        review_prompts: {},
      },
      similar_problems: [],
    };
    mockAnalyzer.analyze.mockResolvedValue(mockAnalysis);

    // When
    const result = await tool.handler({ problem_id: 1927, include_similar: false });

    // Then
    const analysis = JSON.parse(result.text);
    expect(analysis.similar_problems).toEqual([]);
    expect(mockAnalyzer.analyze).toHaveBeenCalledWith(1927, false);
  });

  // TC-KL-3.6~3.7: 에러 처리
  it('TC-KL-3.6: 존재하지 않는 문제 (404)', async () => {
    // Given
    mockAnalyzer.analyze.mockRejectedValue(new ProblemNotFoundError(999999));

    // When & Then
    await expect(tool.handler({ problem_id: 999999 }))
      .rejects.toThrow('문제를 찾을 수 없습니다: 999999번');
  });

  it('TC-KL-3.7: API 에러 전파', async () => {
    // Given
    const apiError = new Error('API Error');
    mockAnalyzer.analyze.mockRejectedValue(apiError);

    // When & Then
    await expect(tool.handler({ problem_id: 1927 }))
      .rejects.toThrow('API Error');
  });

  it('Zod 검증 에러', async () => {
    // When & Then
    await expect(tool.handler({ problem_id: 0 }))
      .rejects.toThrow('입력 검증 실패');
  });

  // TC-KL-3.8~3.10: 출력 형식
  it('TC-KL-3.8: MCP TextContent 형식', async () => {
    // Given
    const mockAnalysis = {
      problem: { id: 1927, title: '최소 힙', tier: 'Silver I', tier_emoji: '🟡' },
      difficulty: { tier: 'Silver I', level: 10, percentile: 'Top 25%', tier_emoji: '🟡' },
      tags: [],
      hint_guide: { context: '', hint_levels: [], review_prompts: {} },
      similar_problems: [],
    };
    mockAnalyzer.analyze.mockResolvedValue(mockAnalysis);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    expect(result).toHaveProperty('type');
    expect(result.type).toBe('text');
    expect(result).toHaveProperty('text');
    expect(typeof result.text).toBe('string');
  });

  it('TC-KL-3.9: JSON 구조 검증', async () => {
    // Given
    const mockAnalysis = {
      problem: { id: 1927, title: '최소 힙', tier: 'Silver I', tier_emoji: '🟡' },
      difficulty: { tier: 'Silver I', level: 10, percentile: 'Top 25%', tier_emoji: '🟡' },
      tags: [],
      hint_guide: { context: '', hint_levels: [], review_prompts: {} },
      similar_problems: [],
    };
    mockAnalyzer.analyze.mockResolvedValue(mockAnalysis);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    expect(() => JSON.parse(result.text)).not.toThrow();
  });

  it('TC-KL-3.10: ProblemAnalysis 인터페이스 준수', async () => {
    // Given
    const mockAnalysis = {
      problem: { id: 1927, title: '최소 힙', tier: 'Silver I', tier_emoji: '🟡' },
      difficulty: { tier: 'Silver I', level: 10, percentile: 'Top 25%', tier_emoji: '🟡' },
      tags: [
        {
          key: 'priority_queue',
          name_ko: '우선순위 큐',
          name_en: 'Priority Queue',
          description: '우선순위 큐 설명',
        },
      ],
      hint_guide: {
        context: '최소 힙 문제',
        hint_levels: [
          { level: 1, label: '문제 분석', prompt: '프롬프트' },
        ],
        review_prompts: {
          solution_approach: '어떤 알고리즘을 사용했나요?',
        },
      },
      similar_problems: [
        { id: 11279, title: '최대 힙', tier: 'Silver I' },
      ],
    };
    mockAnalyzer.analyze.mockResolvedValue(mockAnalysis);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    const analysis = JSON.parse(result.text);
    expect(analysis).toHaveProperty('problem');
    expect(analysis).toHaveProperty('difficulty');
    expect(analysis).toHaveProperty('tags');
    expect(analysis).toHaveProperty('hint_guide');
    expect(analysis).toHaveProperty('similar_problems');

    // problem 구조
    expect(analysis.problem).toHaveProperty('id');
    expect(analysis.problem).toHaveProperty('title');
    expect(analysis.problem).toHaveProperty('tier');
    expect(analysis.problem).toHaveProperty('tier_emoji');

    // difficulty 구조
    expect(analysis.difficulty).toHaveProperty('tier');
    expect(analysis.difficulty).toHaveProperty('level');
    expect(analysis.difficulty).toHaveProperty('percentile');

    // tags 구조
    expect(Array.isArray(analysis.tags)).toBe(true);
    if (analysis.tags.length > 0) {
      expect(analysis.tags[0]).toHaveProperty('key');
      expect(analysis.tags[0]).toHaveProperty('name_ko');
      expect(analysis.tags[0]).toHaveProperty('description');
    }

    // hint_guide 구조
    expect(analysis.hint_guide).toHaveProperty('context');
    expect(analysis.hint_guide).toHaveProperty('hint_levels');
    expect(Array.isArray(analysis.hint_guide.hint_levels)).toBe(true);
    if (analysis.hint_guide.hint_levels.length > 0) {
      expect(analysis.hint_guide.hint_levels[0]).toHaveProperty('level');
      expect(analysis.hint_guide.hint_levels[0]).toHaveProperty('label');
      expect(analysis.hint_guide.hint_levels[0]).toHaveProperty('prompt');
    }

    // similar_problems 구조
    expect(Array.isArray(analysis.similar_problems)).toBe(true);
  });
});
