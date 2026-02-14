/**
 * generate_review_template 도구 테스트 (Keyless Architecture)
 *
 * 테스트 범위:
 * - Happy Path
 * - Zod 스키마 검증
 * - 에러 처리
 * - 출력 형식
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateReviewTemplateInputSchema, generateReviewTemplateTool } from '../../src/tools/generate-review-template.js';
import type { ReviewTemplateGenerator } from '../../src/services/review-template-generator.js';
import { ProblemNotFoundError } from '../../src/api/types.js';

describe('generate_review_template 도구 (Keyless)', () => {
  describe('TC-KL-4.3~4.4: Zod 스키마 검증', () => {
    it('TC-KL-4.3: problem_id 양수 검증', () => {
      // Given: 유효한 입력
      const validInput = {
        problem_id: 1927,
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(validInput);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.problem_id).toBe(1927);
      }
    });

    it('TC-KL-4.3: problem_id 0은 거부', () => {
      // Given
      const invalidInput = {
        problem_id: 0,
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('TC-KL-4.3: problem_id 음수 거부', () => {
      // Given
      const invalidInput = {
        problem_id: -1927,
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('TC-KL-4.4: user_notes 문자열 검증 (선택)', () => {
      // Given: user_notes 포함
      const validInput = {
        problem_id: 1927,
        user_notes: '우선순위 큐를 사용했습니다',
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(validInput);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user_notes).toBe('우선순위 큐를 사용했습니다');
      }
    });

    it('TC-KL-4.4: user_notes 생략 가능', () => {
      // Given: user_notes 생략
      const validInput = {
        problem_id: 1927,
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(validInput);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user_notes).toBeUndefined();
      }
    });

    it('user_notes가 문자열이 아니면 거부', () => {
      // Given
      const invalidInput = {
        problem_id: 1927,
        user_notes: 12345 as unknown as string,
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });
  });

  describe('스키마 추가 검증', () => {
    it('problem_id 필수 필드 검증', () => {
      // Given: problem_id 누락
      const invalidInput = {
        user_notes: '메모입니다',
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('problem_id가 정수가 아니면 거부', () => {
      // Given
      const invalidInput = {
        problem_id: 1927.5,
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('problem_id 타입 검증 (문자열 거부)', () => {
      // Given
      const invalidInput = {
        problem_id: '1927' as unknown as number,
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(invalidInput);

      // Then
      expect(result.success).toBe(false);
    });

    it('추가 필드는 무시', () => {
      // Given
      const inputWithExtra = {
        problem_id: 1927,
        user_notes: '메모',
        extra_field: 'ignored',
      };

      // When
      const result = GenerateReviewTemplateInputSchema.safeParse(inputWithExtra);

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
describe('generate_review_template 도구 핸들러', () => {
  let mockGenerator: {
    generate: ReturnType<typeof vi.fn>;
  };
  let tool: ReturnType<typeof generateReviewTemplateTool>;

  beforeEach(() => {
    mockGenerator = {
      generate: vi.fn(),
    };
    tool = generateReviewTemplateTool(mockGenerator as unknown as ReviewTemplateGenerator);
  });

  // TC-KL-4.1~4.2: Happy Path
  it('TC-KL-4.1: 기본 템플릿 생성', async () => {
    // Given
    const mockTemplate = {
      template: '# 1927번: 최소 힙\n\n## 문제 분석\n...',
      problem_data: {
        id: 1927,
        title: '최소 힙',
        tier: 'Silver I',
        tier_emoji: '🟡',
        tags: ['자료 구조', '우선순위 큐'],
        stats: {
          accepted_user_count: 50000,
          average_tries: 2.5,
        },
      },
      analysis: {
        tags_explanation: '우선순위 큐를 사용하는 문제입니다.',
        difficulty_context: 'Silver I (Top 25%)',
        common_approaches: ['우선순위 큐 사용'],
        time_complexity_typical: 'O(N log N)',
        space_complexity_typical: 'O(N)',
        common_mistakes: ['힙 연산 실수'],
      },
      related_problems: [
        { id: 11279, title: '최대 힙', tier: 'Silver I' },
      ],
      prompts: {
        solution_approach: '어떤 알고리즘을 사용했나요?',
        time_complexity: '시간 복잡도는?',
        space_complexity: '공간 복잡도는?',
        key_insights: '핵심 인사이트는?',
        difficulties: '어려웠던 점은?',
      },
    };
    mockGenerator.generate.mockResolvedValue(mockTemplate);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    expect(result.type).toBe('text');
    const template = JSON.parse(result.text);
    expect(template).toHaveProperty('template');
    expect(template).toHaveProperty('problem_data');
    expect(template).toHaveProperty('analysis');
    expect(template).toHaveProperty('related_problems');
    expect(template).toHaveProperty('prompts');
    expect(mockGenerator.generate).toHaveBeenCalledWith(1927, undefined);
  });

  it('TC-KL-4.2: user_notes 포함', async () => {
    // Given
    const mockTemplate = {
      template: '# 1927번: 최소 힙\n\n사용자 메모: 우선순위 큐를 사용했습니다\n...',
      problem_data: {
        id: 1927,
        title: '최소 힙',
        tier: 'Silver I',
        tier_emoji: '🟡',
        tags: [],
        stats: { accepted_user_count: 50000, average_tries: 2.5 },
      },
      analysis: {
        tags_explanation: '',
        difficulty_context: '',
        common_approaches: [],
        time_complexity_typical: '',
        space_complexity_typical: '',
        common_mistakes: [],
      },
      related_problems: [],
      prompts: {},
    };
    mockGenerator.generate.mockResolvedValue(mockTemplate);

    // When
    const result = await tool.handler({
      problem_id: 1927,
      user_notes: '우선순위 큐를 사용했습니다',
    });

    // Then
    const template = JSON.parse(result.text);
    expect(template.template).toContain('우선순위 큐');
    expect(mockGenerator.generate).toHaveBeenCalledWith(1927, '우선순위 큐를 사용했습니다');
  });

  // TC-KL-4.5~4.6: 에러 처리
  it('TC-KL-4.5: 존재하지 않는 문제 (404)', async () => {
    // Given
    mockGenerator.generate.mockRejectedValue(new ProblemNotFoundError(999999));

    // When & Then
    await expect(tool.handler({ problem_id: 999999 }))
      .rejects.toThrow('문제를 찾을 수 없습니다: 999999번');
  });

  it('TC-KL-4.6: API 에러 전파', async () => {
    // Given
    const apiError = new Error('API Error');
    mockGenerator.generate.mockRejectedValue(apiError);

    // When & Then
    await expect(tool.handler({ problem_id: 1927 }))
      .rejects.toThrow('API Error');
  });

  it('Zod 검증 에러', async () => {
    // When & Then
    await expect(tool.handler({ problem_id: 0 }))
      .rejects.toThrow('입력 검증 실패');
  });

  // TC-KL-4.7~4.9: 출력 형식
  it('TC-KL-4.7: MCP TextContent 형식', async () => {
    // Given
    const mockTemplate = {
      template: '# 템플릿',
      problem_data: { id: 1927, title: '최소 힙', tier: 'Silver I', tier_emoji: '🟡', tags: [], stats: { accepted_user_count: 50000, average_tries: 2.5 } },
      analysis: { tags_explanation: '', difficulty_context: '', common_approaches: [], time_complexity_typical: '', space_complexity_typical: '', common_mistakes: [] },
      related_problems: [],
      prompts: {},
    };
    mockGenerator.generate.mockResolvedValue(mockTemplate);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    expect(result).toHaveProperty('type');
    expect(result.type).toBe('text');
    expect(result).toHaveProperty('text');
    expect(typeof result.text).toBe('string');
  });

  it('TC-KL-4.8: JSON 구조 검증', async () => {
    // Given
    const mockTemplate = {
      template: '# 템플릿',
      problem_data: { id: 1927, title: '최소 힙', tier: 'Silver I', tier_emoji: '🟡', tags: [], stats: { accepted_user_count: 50000, average_tries: 2.5 } },
      analysis: { tags_explanation: '', difficulty_context: '', common_approaches: [], time_complexity_typical: '', space_complexity_typical: '', common_mistakes: [] },
      related_problems: [],
      prompts: {},
    };
    mockGenerator.generate.mockResolvedValue(mockTemplate);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    expect(() => JSON.parse(result.text)).not.toThrow();
  });

  it('TC-KL-4.9: ReviewTemplate 인터페이스 준수', async () => {
    // Given
    const mockTemplate = {
      template: '# 1927번: 최소 힙\n\n## 문제 분석\n...',
      problem_data: {
        id: 1927,
        title: '최소 힙',
        tier: 'Silver I',
        tier_emoji: '🟡',
        tags: ['자료 구조', '우선순위 큐'],
        stats: {
          accepted_user_count: 50000,
          average_tries: 2.5,
        },
      },
      analysis: {
        tags_explanation: '우선순위 큐를 사용하는 문제입니다.',
        difficulty_context: 'Silver I (Top 25%)',
        common_approaches: ['우선순위 큐 사용'],
        time_complexity_typical: 'O(N log N)',
        space_complexity_typical: 'O(N)',
        common_mistakes: ['힙 연산 실수'],
      },
      related_problems: [
        { id: 11279, title: '최대 힙', tier: 'Silver I' },
      ],
      prompts: {
        solution_approach: '어떤 알고리즘을 사용했나요?',
        time_complexity: '시간 복잡도는?',
        space_complexity: '공간 복잡도는?',
        key_insights: '핵심 인사이트는?',
        difficulties: '어려웠던 점은?',
      },
    };
    mockGenerator.generate.mockResolvedValue(mockTemplate);

    // When
    const result = await tool.handler({ problem_id: 1927 });

    // Then
    const template = JSON.parse(result.text);
    expect(template).toHaveProperty('template');
    expect(template).toHaveProperty('problem_data');
    expect(template).toHaveProperty('analysis');
    expect(template).toHaveProperty('related_problems');
    expect(template).toHaveProperty('prompts');

    // problem_data 구조
    expect(template.problem_data).toHaveProperty('id');
    expect(template.problem_data).toHaveProperty('title');
    expect(template.problem_data).toHaveProperty('tier');
    expect(template.problem_data).toHaveProperty('tags');
    expect(template.problem_data).toHaveProperty('stats');

    // analysis 구조
    expect(template.analysis).toHaveProperty('tags_explanation');
    expect(template.analysis).toHaveProperty('difficulty_context');
    expect(template.analysis).toHaveProperty('common_approaches');
    expect(template.analysis).toHaveProperty('time_complexity_typical');
    expect(template.analysis).toHaveProperty('space_complexity_typical');
    expect(template.analysis).toHaveProperty('common_mistakes');

    // prompts 구조
    expect(template.prompts).toHaveProperty('solution_approach');
    expect(template.prompts).toHaveProperty('time_complexity');
    expect(template.prompts).toHaveProperty('space_complexity');
    expect(template.prompts).toHaveProperty('key_insights');
    expect(template.prompts).toHaveProperty('difficulties');
  });
});
