import { describe, it, expect } from 'vitest';
import {
  isProblem,
  isTag,
  Problem,
  Tag,
  ProblemNotFoundError,
  SolvedAcAPIError,
  TimeoutError,
  NetworkError,
  RateLimitError,
  InvalidInputError,
} from '../../src/api/types.js';
import { mockProblem1000, mockTagDP } from '../__mocks__/solved-ac-responses.js';

describe('API Types', () => {
  describe('isProblem() 타입 가드', () => {
    describe('유효한 Problem 객체', () => {
      it('should return true for valid Problem object', () => {
        const validProblem: Problem = {
          problemId: 1000,
          titleKo: 'A+B',
          level: 1,
          tags: [
            {
              key: 'math',
              displayNames: [{ language: 'ko', name: '수학' }],
            },
          ],
          acceptedUserCount: 100000,
          averageTries: 1.5,
        };

        expect(isProblem(validProblem)).toBe(true);
      });

      it('should return true for mock problem data', () => {
        expect(isProblem(mockProblem1000)).toBe(true);
      });

      it('should return true with optional fields', () => {
        const problemWithOptional: Problem = {
          problemId: 2000,
          titleKo: 'Test Problem',
          level: 10,
          tags: [],
          acceptedUserCount: 1000,
          averageTries: 2.0,
          isSolvable: true,
          isPartial: false,
        };

        expect(isProblem(problemWithOptional)).toBe(true);
      });
    });

    describe('무효한 Problem 객체', () => {
      it('should return false for null', () => {
        expect(isProblem(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(isProblem(undefined)).toBe(false);
      });

      it('should return false for non-object', () => {
        expect(isProblem(123)).toBe(false);
        expect(isProblem('string')).toBe(false);
        expect(isProblem(true)).toBe(false);
      });

      it('should return false when problemId is wrong type', () => {
        const invalid = {
          problemId: '1000', // string instead of number
          titleKo: 'A+B',
          level: 1,
          tags: [],
          acceptedUserCount: 100000,
          averageTries: 1.5,
        };

        expect(isProblem(invalid)).toBe(false);
      });

      it('should return false when required field is missing', () => {
        const missingTitle = {
          problemId: 1000,
          // titleKo missing
          level: 1,
          tags: [],
          acceptedUserCount: 100000,
          averageTries: 1.5,
        };

        expect(isProblem(missingTitle)).toBe(false);
      });

      it('should return false when tags is not an array', () => {
        const invalidTags = {
          problemId: 1000,
          titleKo: 'A+B',
          level: 1,
          tags: 'not an array',
          acceptedUserCount: 100000,
          averageTries: 1.5,
        };

        expect(isProblem(invalidTags)).toBe(false);
      });
    });
  });

  describe('isTag() 타입 가드', () => {
    describe('유효한 Tag 객체', () => {
      it('should return true for valid Tag object', () => {
        const validTag: Tag = {
          key: 'dp',
          displayNames: [
            { language: 'ko', name: '다이나믹 프로그래밍' },
            { language: 'en', name: 'Dynamic Programming' },
          ],
        };

        expect(isTag(validTag)).toBe(true);
      });

      it('should return true for mock tag data', () => {
        expect(isTag(mockTagDP)).toBe(true);
      });

      it('should return true with problemCount', () => {
        const tagWithCount: Tag = {
          key: 'graphs',
          displayNames: [{ language: 'ko', name: '그래프' }],
          problemCount: 2000,
        };

        expect(isTag(tagWithCount)).toBe(true);
      });
    });

    describe('무효한 Tag 객체', () => {
      it('should return false for null', () => {
        expect(isTag(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(isTag(undefined)).toBe(false);
      });

      it('should return false when key is missing', () => {
        const missingKey = {
          displayNames: [{ language: 'ko', name: '수학' }],
        };

        expect(isTag(missingKey)).toBe(false);
      });

      it('should return false when displayNames is not an array', () => {
        const invalidDisplayNames = {
          key: 'math',
          displayNames: 'not an array',
        };

        expect(isTag(invalidDisplayNames)).toBe(false);
      });

      it('should return false when displayNames contains invalid items', () => {
        const invalidItems = {
          key: 'math',
          displayNames: [{ invalid: 'object' }],
        };

        expect(isTag(invalidItems)).toBe(false);
      });
    });
  });

  describe('에러 클래스', () => {
    describe('SolvedAcAPIError', () => {
      it('should create error with status code and message', () => {
        const error = new SolvedAcAPIError(500, 'Server error');

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('SolvedAcAPIError');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Server error');
      });

      it('should store original error', () => {
        const originalError = new Error('Original');
        const error = new SolvedAcAPIError(500, 'Wrapped error', originalError);

        expect(error.originalError).toBe(originalError);
      });
    });

    describe('ProblemNotFoundError', () => {
      it('should extend SolvedAcAPIError', () => {
        const error = new ProblemNotFoundError(1234);

        expect(error).toBeInstanceOf(SolvedAcAPIError);
        expect(error).toBeInstanceOf(Error);
      });

      it('should have 404 status code', () => {
        const error = new ProblemNotFoundError(1234);

        expect(error.statusCode).toBe(404);
        expect(error.name).toBe('ProblemNotFoundError');
      });

      it('should include problem ID in message', () => {
        const error = new ProblemNotFoundError(1234);

        expect(error.message).toContain('1234');
      });
    });

    describe('TimeoutError', () => {
      it('should create timeout error with default message', () => {
        const error = new TimeoutError();

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('TimeoutError');
        expect(error.message).toBe('Request timed out');
      });

      it('should create timeout error with custom message', () => {
        const error = new TimeoutError('Custom timeout message');

        expect(error.message).toBe('Custom timeout message');
      });
    });

    describe('NetworkError', () => {
      it('should create network error with default message', () => {
        const error = new NetworkError();

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('NetworkError');
        expect(error.message).toBe('Network error occurred');
      });

      it('should store original error', () => {
        const originalError = new TypeError('Fetch failed');
        const error = new NetworkError('Network failed', originalError);

        expect(error.originalError).toBe(originalError);
      });
    });

    describe('RateLimitError', () => {
      it('should extend SolvedAcAPIError', () => {
        const error = new RateLimitError();

        expect(error).toBeInstanceOf(SolvedAcAPIError);
        expect(error.statusCode).toBe(429);
        expect(error.name).toBe('RateLimitError');
      });

      it('should store retryAfter value', () => {
        const error = new RateLimitError(60);

        expect(error.retryAfter).toBe(60);
        expect(error.message).toBe('Rate limit exceeded');
      });

      it('should work without retryAfter', () => {
        const error = new RateLimitError();

        expect(error.retryAfter).toBeUndefined();
      });
    });

    describe('InvalidInputError', () => {
      it('should create error with custom message', () => {
        const error = new InvalidInputError('Invalid parameter');

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('InvalidInputError');
        expect(error.message).toBe('Invalid parameter');
      });
    });
  });

  describe('타입 일관성', () => {
    it('should have consistent Problem type structure', () => {
      const problem: Problem = mockProblem1000;

      expect(typeof problem.problemId).toBe('number');
      expect(typeof problem.titleKo).toBe('string');
      expect(typeof problem.level).toBe('number');
      expect(Array.isArray(problem.tags)).toBe(true);
      expect(typeof problem.acceptedUserCount).toBe('number');
      expect(typeof problem.averageTries).toBe('number');
    });

    it('should have consistent Tag type structure', () => {
      const tag: Tag = mockTagDP;

      expect(typeof tag.key).toBe('string');
      expect(Array.isArray(tag.displayNames)).toBe(true);
      expect(tag.displayNames.length).toBeGreaterThan(0);

      const displayName = tag.displayNames[0];
      expect(typeof displayName.language).toBe('string');
      expect(typeof displayName.name).toBe('string');
    });
  });
});
