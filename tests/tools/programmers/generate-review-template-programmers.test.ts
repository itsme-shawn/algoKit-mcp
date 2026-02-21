/**
 * generate_review_template_programmers 도구 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GenerateReviewTemplateProgrammersInputSchema,
  generateReviewTemplateProgrammersTool,
} from '../../../src/tools/programmers/generate-review-template-programmers.js';
import type { ProgrammersReviewTemplateGenerator } from '../../../src/services/programmers-review-template-generator.js';

describe('GenerateReviewTemplateProgrammersInputSchema', () => {
  it('문자열 problem_id 허용', () => {
    const result = GenerateReviewTemplateProgrammersInputSchema.safeParse({
      problem_id: '42748',
    });
    expect(result.success).toBe(true);
  });

  it('user_notes 선택', () => {
    const result = GenerateReviewTemplateProgrammersInputSchema.safeParse({
      problem_id: '42748',
      user_notes: '메모',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user_notes).toBe('메모');
    }
  });

  it('user_notes 없이도 유효', () => {
    const result = GenerateReviewTemplateProgrammersInputSchema.safeParse({
      problem_id: '42748',
    });
    expect(result.success).toBe(true);
  });
});

describe('generateReviewTemplateProgrammersTool 핸들러', () => {
  let mockGenerator: { generate: ReturnType<typeof vi.fn> };
  let tool: ReturnType<typeof generateReviewTemplateProgrammersTool>;

  const mockTemplate = {
    template: '# Review Template',
    problem_data: { id: '42748', title: 'K번째수' },
    related_problems: [],
    hint_guide: { context: '', hint_levels: [], review_prompts: {} },
    guideline_uri: 'algokit://review-guideline',
    guideline_summary: { structure: [], key_rules: [] },
    suggested_filename: 'programmers_42748_REVIEW.md',
  };

  beforeEach(() => {
    mockGenerator = { generate: vi.fn().mockResolvedValue(mockTemplate) };
    tool = generateReviewTemplateProgrammersTool(
      mockGenerator as unknown as ProgrammersReviewTemplateGenerator,
    );
  });

  it('정상 템플릿 생성', async () => {
    const result = await tool.handler({ problem_id: '42748' });

    expect(result.type).toBe('text');
    const parsed = JSON.parse(result.text);
    expect(parsed).toHaveProperty('template');
    expect(parsed).toHaveProperty('problem_data');
    expect(mockGenerator.generate).toHaveBeenCalledWith('42748', undefined);
  });

  it('user_notes 전달', async () => {
    await tool.handler({ problem_id: '42748', user_notes: '메모' });

    expect(mockGenerator.generate).toHaveBeenCalledWith('42748', '메모');
  });

  it('URL 입력', async () => {
    await tool.handler({
      problem_id: 'https://school.programmers.co.kr/learn/courses/30/lessons/42748',
    });

    expect(mockGenerator.generate).toHaveBeenCalledWith('42748', undefined);
  });

  it('유효하지 않은 ID', async () => {
    await expect(
      tool.handler({ problem_id: 'invalid' }),
    ).rejects.toThrow('유효하지 않은 프로그래머스 문제 ID 또는 URL');
  });

  it('에러 전파', async () => {
    mockGenerator.generate.mockRejectedValue(new Error('생성 실패'));

    await expect(
      tool.handler({ problem_id: '42748' }),
    ).rejects.toThrow('생성 실패');
  });
});
