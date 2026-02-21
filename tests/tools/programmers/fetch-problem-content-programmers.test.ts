/**
 * fetch_problem_content_programmers 도구 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FetchProblemContentProgrammersInputSchema,
  fetchProblemContentProgrammersTool,
  handleFetchProblemContentProgrammers,
} from '../../../src/tools/programmers/fetch-problem-content-programmers.js';
import type { ProgrammersScraper } from '../../../src/api/programmers-scraper.js';
import type { ProgrammersProblemDetail } from '../../../src/types/programmers.js';

const mockDetail: ProgrammersProblemDetail = {
  problemId: '42748',
  title: 'K번째수',
  level: 1,
  category: '정렬',
  description: '배열을 자르고 정렬하는 문제',
  constraints: ['array 길이 1~100'],
  examples: [{ input: '[1,5,2]', output: '[5]' }],
  tags: ['정렬'],
};

describe('FetchProblemContentProgrammersInputSchema', () => {
  it('문자열 problem_id', () => {
    const result = FetchProblemContentProgrammersInputSchema.safeParse({ problem_id: '42748' });
    expect(result.success).toBe(true);
  });

  it('숫자 problem_id', () => {
    const result = FetchProblemContentProgrammersInputSchema.safeParse({ problem_id: 42748 });
    expect(result.success).toBe(true);
  });

  it('problem_id 필수', () => {
    const result = FetchProblemContentProgrammersInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('handleFetchProblemContentProgrammers', () => {
  let mockScraper: { getProblem: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockScraper = { getProblem: vi.fn().mockResolvedValue(mockDetail) };
  });

  it('정상 스크래핑', async () => {
    const result = await handleFetchProblemContentProgrammers(
      { problem_id: '42748' },
      mockScraper as unknown as ProgrammersScraper,
    );

    expect(result.type).toBe('text');
    const content = JSON.parse(result.text);
    expect(content.title).toBe('K번째수');
    expect(content).toHaveProperty('description');
    expect(content).toHaveProperty('examples');
    expect(content).toHaveProperty('limits');
    expect(mockScraper.getProblem).toHaveBeenCalledWith('42748');
  });

  it('URL 입력', async () => {
    await handleFetchProblemContentProgrammers(
      { problem_id: 'https://school.programmers.co.kr/learn/courses/30/lessons/42748' },
      mockScraper as unknown as ProgrammersScraper,
    );

    expect(mockScraper.getProblem).toHaveBeenCalledWith('42748');
  });

  it('숫자 입력', async () => {
    await handleFetchProblemContentProgrammers(
      { problem_id: 42748 },
      mockScraper as unknown as ProgrammersScraper,
    );

    expect(mockScraper.getProblem).toHaveBeenCalledWith('42748');
  });

  it('유효하지 않은 ID', async () => {
    await expect(
      handleFetchProblemContentProgrammers(
        { problem_id: 'invalid' },
        mockScraper as unknown as ProgrammersScraper,
      ),
    ).rejects.toThrow('유효하지 않은 프로그래머스 문제 ID 또는 URL');
  });

  it('에러 전파', async () => {
    mockScraper.getProblem.mockRejectedValue(new Error('스크래핑 실패'));

    await expect(
      handleFetchProblemContentProgrammers(
        { problem_id: '42748' },
        mockScraper as unknown as ProgrammersScraper,
      ),
    ).rejects.toThrow('스크래핑 실패');
  });

  it('ProblemContent 형식으로 변환', async () => {
    const result = await handleFetchProblemContentProgrammers(
      { problem_id: '42748' },
      mockScraper as unknown as ProgrammersScraper,
    );

    const content = JSON.parse(result.text);
    expect(content).toHaveProperty('problemId');
    expect(content).toHaveProperty('title');
    expect(content).toHaveProperty('description');
    expect(content).toHaveProperty('inputFormat');
    expect(content).toHaveProperty('outputFormat');
    expect(content).toHaveProperty('examples');
    expect(content).toHaveProperty('limits');
    expect(content).toHaveProperty('metadata');
  });
});

describe('fetchProblemContentProgrammersTool', () => {
  it('도구 정의 구조', () => {
    const mockScraper = { getProblem: vi.fn() };
    const tool = fetchProblemContentProgrammersTool(
      mockScraper as unknown as ProgrammersScraper,
    );

    expect(tool.name).toBe('fetch_problem_content_programmers');
    expect(typeof tool.description).toBe('string');
    expect(tool.inputSchema).toBe(FetchProblemContentProgrammersInputSchema);
    expect(typeof tool.handler).toBe('function');
  });
});
