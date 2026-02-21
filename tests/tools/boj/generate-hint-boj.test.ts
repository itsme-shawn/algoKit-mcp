/**
 * generate_hint_boj 도구 테스트 (SRP 리팩토링)
 *
 * 테스트 범위:
 * - Zod 스키마 검증
 * - 입력 검증 (problem_id)
 * - 출력 구조 (problem, difficulty, tags, hint_guide)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateHintBOJInputSchema, generateHintBOJTool } from '../../../src/tools/boj/generate-hint-boj.js';
import type { ProblemAnalyzer } from '../../../src/services/problem-analyzer.js';
import { ProblemNotFoundError } from '../../../src/api/types.js';

describe('generate_hint_boj 도구', () => {
  describe('Zod 스키마 검증', () => {
    it('유효한 problem_id 허용', () => {
      // Given: 유효한 입력
      const validInput = {
        problem_id: 1927,
      };

      // When
      const result = GenerateHintBOJInputSchema.safeParse(validInput);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.problem_id).toBe(1927);
      }
    });

    it('problem_id 0은 거부', () => {
      // Given
      const invalidInput = {
        problem_id: 0,
      };

      // When
      const result = GenerateHintBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('problem_id 음수 거부', () => {
      // Given
      const invalidInput = {
        problem_id: -100,
      };

      // When
      const result = GenerateHintBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('problem_id 타입 검증 (문자열 거부)', () => {
      // Given
      const invalidInput = {
        problem_id: '1927' as unknown as number,
      };

      // When
      const result = GenerateHintBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('problem_id 필수 필드 검증', () => {
      // Given: problem_id 누락
      const invalidInput = {};

      // When
      const result = GenerateHintBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('problem_id가 정수가 아니면 거부', () => {
      // Given
      const invalidInput = {
        problem_id: 1927.5,
      };

      // When
      const result = GenerateHintBOJInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('추가 필드는 무시', () => {
      // Given
      const inputWithExtra = {
        problem_id: 1927,
        extra_field: 'ignored',
      };

      // When
      const result = GenerateHintBOJInputSchema.safeParse(inputWithExtra);

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
describe('generate_hint_boj 도구 핸들러', () => {
  let mockAnalyzer: {
    analyze: ReturnType<typeof vi.fn>;
  };
  let tool: ReturnType<typeof generateHintBOJTool>;

  beforeEach(() => {
    mockAnalyzer = {
      analyze: vi.fn(),
    };
    tool = generateHintBOJTool(mockAnalyzer as unknown as ProblemAnalyzer);
  });

  it('정상 힌트 생성', async () => {
    // Given
    const mockHintResult = {
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
          description: '우선순위 큐 설명',
        },
      ],
      hint_guide: {
        context: '최소 힙을 사용하는 문제입니다.',
        hint_levels: [
          { level: 1, label: '문제 분석', prompt: '입출력을 살펴보세요.' },
          { level: 2, label: '핵심 아이디어', prompt: '힙 자료구조의 특성을 생각해보세요.' },
          { level: 3, label: '상세 풀이', prompt: '우선순위 큐를 사용하세요.' },
        ],
        review_prompts: {
          solution_approach: '어떤 알고리즘을 사용했나요?',
          time_complexity: '시간 복잡도는?',
        },
      },
    };
    mockAnalyzer.analyze.mockResolvedValue(mockHintResult);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    expect(result.type).toBe('text');
    const hintResult = JSON.parse(result.text);
    expect(hintResult).toHaveProperty('problem');
    expect(hintResult).toHaveProperty('difficulty');
    expect(hintResult).toHaveProperty('tags');
    expect(hintResult).toHaveProperty('hint_guide');
    expect(hintResult).not.toHaveProperty('similar_problems');
    expect(mockAnalyzer.analyze).toHaveBeenCalledWith(1927, false);
  });

  it('존재하지 않는 문제 (404)', async () => {
    // Given
    mockAnalyzer.analyze.mockRejectedValue(new ProblemNotFoundError(999999));

    // When & Then
    await expect(tool.handler({ problem_id: 999999 }))
      .rejects.toThrow('문제를 찾을 수 없습니다: 999999번');
  });

  it('Zod 검증 에러', async () => {
    // When & Then
    await expect(tool.handler({ problem_id: 0 }))
      .rejects.toThrow('입력 검증 실패');
  });

  it('일반 에러 전파', async () => {
    // Given
    const genericError = new Error('Unexpected error');
    mockAnalyzer.analyze.mockRejectedValue(genericError);

    // When & Then
    await expect(tool.handler({ problem_id: 1927 }))
      .rejects.toThrow('Unexpected error');
  });

  it('MCP TextContent 형식', async () => {
    // Given
    const mockHintResult = {
      problem: { id: 1927, title: '최소 힙', tier: 'Silver I', tier_emoji: '🟡' },
      difficulty: { tier: 'Silver I', level: 10, percentile: 'Top 25%', tier_emoji: '🟡' },
      tags: [],
      hint_guide: {
        context: '',
        hint_levels: [],
        review_prompts: {},
      },
    };
    mockAnalyzer.analyze.mockResolvedValue(mockHintResult);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    expect(result).toHaveProperty('type');
    expect(result.type).toBe('text');
    expect(result).toHaveProperty('text');
    expect(typeof result.text).toBe('string');
    expect(() => JSON.parse(result.text)).not.toThrow();
  });

  it('HintResult 인터페이스 준수', async () => {
    // Given
    const mockHintResult = {
      problem: { id: 1927, title: '최소 힙', tier: 'Silver I', tier_emoji: '🟡' },
      difficulty: { tier: 'Silver I', level: 10, percentile: 'Top 25%', tier_emoji: '🟡' },
      tags: [
        {
          key: 'priority_queue',
          name_ko: '우선순위 큐',
          name_en: 'Priority Queue',
          description: '설명',
        },
      ],
      hint_guide: {
        context: '문제 컨텍스트',
        hint_levels: [
          { level: 1, label: '문제 분석', prompt: '프롬프트' },
        ],
        review_prompts: {
          solution_approach: '풀이 접근법은?',
        },
      },
    };
    mockAnalyzer.analyze.mockResolvedValue(mockHintResult);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    const hintResult = JSON.parse(result.text);
    expect(hintResult).toHaveProperty('problem');
    expect(hintResult).toHaveProperty('difficulty');
    expect(hintResult).toHaveProperty('tags');
    expect(hintResult).toHaveProperty('hint_guide');
    expect(hintResult).not.toHaveProperty('similar_problems');

    // hint_guide 구조 검증
    expect(hintResult.hint_guide).toHaveProperty('context');
    expect(hintResult.hint_guide).toHaveProperty('hint_levels');
    expect(Array.isArray(hintResult.hint_guide.hint_levels)).toBe(true);
    if (hintResult.hint_guide.hint_levels.length > 0) {
      expect(hintResult.hint_guide.hint_levels[0]).toHaveProperty('level');
      expect(hintResult.hint_guide.hint_levels[0]).toHaveProperty('label');
      expect(hintResult.hint_guide.hint_levels[0]).toHaveProperty('prompt');
    }
  });
});
