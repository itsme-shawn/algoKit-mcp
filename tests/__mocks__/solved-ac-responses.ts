/**
 * solved.ac API Mock 응답 데이터
 */

import { Problem, Tag, SearchResult } from '../../src/api/types.js';

/**
 * Mock 문제 데이터: A+B (문제 1000)
 */
export const mockProblem1000: Problem = {
  problemId: 1000,
  titleKo: 'A+B',
  titles: [
    { language: 'ko', title: 'A+B' },
    { language: 'en', title: 'A+B' },
  ],
  level: 1, // Bronze V
  tags: [
    {
      key: 'math',
      displayNames: [
        { language: 'ko', name: '수학' },
        { language: 'en', name: 'Mathematics' },
      ],
      problemCount: 5000,
    },
    {
      key: 'implementation',
      displayNames: [
        { language: 'ko', name: '구현' },
        { language: 'en', name: 'Implementation' },
      ],
      problemCount: 3000,
    },
  ],
  acceptedUserCount: 500000,
  averageTries: 1.2,
  isSolvable: true,
  isPartial: false,
};

/**
 * Mock 문제 데이터: 최소 힙 (문제 1927)
 */
export const mockProblem1927: Problem = {
  problemId: 1927,
  titleKo: '최소 힙',
  titles: [{ language: 'ko', title: '최소 힙' }],
  level: 10, // Silver I
  tags: [
    {
      key: 'data_structures',
      displayNames: [
        { language: 'ko', name: '자료 구조' },
        { language: 'en', name: 'Data Structures' },
      ],
      problemCount: 2000,
    },
    {
      key: 'priority_queue',
      displayNames: [
        { language: 'ko', name: '우선순위 큐' },
        { language: 'en', name: 'Priority Queue' },
      ],
      problemCount: 500,
    },
  ],
  acceptedUserCount: 50000,
  averageTries: 2.5,
  isSolvable: true,
  isPartial: false,
};

/**
 * Mock 문제 데이터: LIS (문제 11053)
 */
export const mockProblem11053: Problem = {
  problemId: 11053,
  titleKo: '가장 긴 증가하는 부분 수열',
  level: 14, // Gold II
  tags: [
    {
      key: 'dp',
      displayNames: [
        { language: 'ko', name: '다이나믹 프로그래밍' },
        { language: 'en', name: 'Dynamic Programming' },
      ],
      problemCount: 1500,
    },
  ],
  acceptedUserCount: 80000,
  averageTries: 3.2,
  isSolvable: true,
  isPartial: false,
};

/**
 * Mock 검색 결과
 */
export const mockSearchResult: SearchResult = {
  count: 100,
  items: [mockProblem1000, mockProblem1927, mockProblem11053],
  page: 1,
};

/**
 * Mock 빈 검색 결과
 */
export const mockEmptySearchResult: SearchResult = {
  count: 0,
  items: [],
  page: 1,
};

/**
 * Mock 태그: DP
 */
export const mockTagDP: Tag = {
  key: 'dp',
  displayNames: [
    { language: 'ko', name: '다이나믹 프로그래밍' },
    { language: 'en', name: 'Dynamic Programming' },
    { language: 'ja', name: '動的計画法' },
  ],
  problemCount: 1500,
};

/**
 * Mock 태그: 그래프
 */
export const mockTagGraphs: Tag = {
  key: 'graphs',
  displayNames: [
    { language: 'ko', name: '그래프 이론' },
    { language: 'en', name: 'Graph Theory' },
  ],
  problemCount: 2000,
};

/**
 * Mock 태그 검색 결과
 */
export const mockTagSearchResult = {
  items: [mockTagDP, mockTagGraphs],
};
